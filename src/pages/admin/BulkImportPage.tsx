import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface ParsedRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
  isDuplicate: boolean;
}

const REQUIRED_FIELDS = ["trainee_code", "full_name"];
const ALLOWED_FIELDS = [
  "trainee_code", "full_name", "furigana", "birth_date", "gender", "phone", "email",
  "birthplace", "ethnicity", "religion", "marital_status", "education_level",
  "current_address", "permanent_address", "household_address",
  "cccd_number", "cccd_date", "cccd_place",
  "passport_number", "passport_date", "passport_place",
  "height", "weight", "blood_group", "vision_left", "vision_right",
  "dominant_hand", "smoking", "drinking", "tattoo",
  "hobbies", "notes", "source", "policy_category",
  "trainee_type", "progression_stage", "simple_status",
];

type ImportStep = "upload" | "preview" | "importing" | "done";

export default function BulkImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const validRows = parsedRows.filter(r => r.errors.length === 0 && !r.isDuplicate);
  const errorRows = parsedRows.filter(r => r.errors.length > 0 || r.isDuplicate);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isCSV = file.name.endsWith(".csv");
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (!isCSV && !isExcel) {
      toast.error("Chỉ hỗ trợ file .csv, .xlsx, .xls");
      return;
    }

    // File size validation (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File quá lớn. Giới hạn tối đa 10MB.");
      return;
    }

    // File size sanity check (reject empty files)
    if (file.size === 0) {
      toast.error("File rỗng, vui lòng chọn file khác.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rawData.length === 0) {
        toast.error("File không có dữ liệu");
        return;
      }

      // Validate headers
      const headers = Object.keys(rawData[0]);
      const missingRequired = REQUIRED_FIELDS.filter(f => !headers.includes(f));
      if (missingRequired.length > 0) {
        toast.error(`Thiếu cột bắt buộc: ${missingRequired.join(", ")}`);
        return;
      }

      // Check duplicates within file
      const codeMap = new Map<string, number[]>();
      const cccdMap = new Map<string, number[]>();
      rawData.forEach((row, i) => {
        const code = String(row.trainee_code || "").trim();
        const cccd = String(row.cccd_number || "").trim();
        if (code) {
          if (!codeMap.has(code)) codeMap.set(code, []);
          codeMap.get(code)!.push(i + 2);
        }
        if (cccd) {
          if (!cccdMap.has(cccd)) cccdMap.set(cccd, []);
          cccdMap.get(cccd)!.push(i + 2);
        }
      });

      // Check duplicates against database
      const codes = rawData.map(r => String(r.trainee_code || "").trim()).filter(Boolean);
      const cccds = rawData.map(r => String(r.cccd_number || "").trim()).filter(Boolean);

      const [{ data: existingCodes }, { data: existingCccds }] = await Promise.all([
        supabase.from("trainees").select("trainee_code").in("trainee_code", codes.slice(0, 500)),
        cccds.length > 0
          ? supabase.from("trainees").select("cccd_number").in("cccd_number", cccds.slice(0, 500))
          : Promise.resolve({ data: [] }),
      ]);

      const existingCodeSet = new Set((existingCodes || []).map(r => r.trainee_code));
      const existingCccdSet = new Set((existingCccds || []).map(r => r.cccd_number).filter(Boolean));

      const parsed: ParsedRow[] = rawData.map((row, i) => {
        const errors: string[] = [];
        let isDuplicate = false;
        const code = String(row.trainee_code || "").trim();
        const cccd = String(row.cccd_number || "").trim();
        const fullName = String(row.full_name || "").trim();

        if (!code) errors.push("Thiếu mã học viên");
        if (!fullName) errors.push("Thiếu họ tên");
        if (existingCodeSet.has(code)) {
          errors.push("Mã học viên đã tồn tại trong DB");
          isDuplicate = true;
        }
        if (cccd && existingCccdSet.has(cccd)) {
          errors.push("CCCD đã tồn tại trong DB");
          isDuplicate = true;
        }
        if (code && (codeMap.get(code)?.length || 0) > 1) {
          errors.push(`Trùng mã trong file (dòng ${codeMap.get(code)!.join(",")})`);
          isDuplicate = true;
        }

        // Filter only allowed fields
        const cleanData: Record<string, any> = {};
        for (const key of ALLOWED_FIELDS) {
          if (row[key] !== undefined && row[key] !== "") {
            let value = row[key];
            // Convert dates
            if (["birth_date", "cccd_date", "passport_date"].includes(key) && value instanceof Date) {
              value = value.toISOString().split("T")[0];
            }
            // Convert numbers
            if (["height", "weight", "vision_left", "vision_right"].includes(key)) {
              value = Number(value) || null;
            }
            // Convert boolean
            if (key === "tattoo") {
              value = value === true || value === "true" || value === "1" || value === "Có";
            }
            cleanData[key] = value;
          }
        }

        return { rowIndex: i + 2, data: cleanData, errors, isDuplicate };
      });

      setParsedRows(parsed);
      setStep("preview");
      toast.success(`Đã phân tích ${parsed.length} dòng dữ liệu`);
    } catch (err) {
      console.error("Parse error:", err);
      toast.error("Lỗi đọc file. Vui lòng kiểm tra định dạng.");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) {
      toast.error("Không có dòng hợp lệ để nhập");
      return;
    }

    setStep("importing");
    setImportProgress(0);
    let success = 0;
    let failed = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE).map(r => r.data as any);
      const { error } = await supabase.from("trainees").insert(batch);

      if (error) {
        console.error("Batch insert error:", error);
        failed += batch.length;
      } else {
        success += batch.length;
      }

      setImportProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    setImportResult({ success, failed });
    setStep("done");
    if (failed === 0) {
      toast.success(`Đã nhập thành công ${success} học viên!`);
    } else {
      toast.warning(`Nhập ${success} thành công, ${failed} thất bại`);
    }
  }, [validRows]);

  const reset = () => {
    setStep("upload");
    setParsedRows([]);
    setImportProgress(0);
    setImportResult(null);
    setFileName("");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nhập liệu hàng loạt</h1>
          <p className="text-sm text-muted-foreground">
            Import dữ liệu học viên từ file Excel/CSV
          </p>
        </div>
      </header>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Tải lên file dữ liệu
            </CardTitle>
            <CardDescription>
              Hỗ trợ định dạng .xlsx, .xls, .csv. File phải có cột bắt buộc: <strong>trainee_code</strong>, <strong>full_name</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">Kéo thả hoặc nhấn để chọn file</p>
              <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx, .xls) hoặc CSV (.csv)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Các cột được hỗ trợ:</strong> trainee_code, full_name, furigana, birth_date, gender, phone, email, birthplace, cccd_number, passport_number, height, weight, source, notes...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{fileName}</Badge>
              <Badge variant="secondary">{validRows.length} hợp lệ</Badge>
              {errorRows.length > 0 && (
                <Badge variant="destructive">{errorRows.length} lỗi/trùng</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                <X className="h-4 w-4 mr-1" /> Hủy
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Lưu {validRows.length} học viên vào hệ thống
              </Button>
            </div>
          </div>

          {/* Error rows */}
          {errorRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Dòng lỗi / trùng lặp ({errorRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Dòng</TableHead>
                        <TableHead>Mã HV</TableHead>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Lỗi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorRows.slice(0, 100).map(row => (
                        <TableRow key={row.rowIndex}>
                          <TableCell>{row.rowIndex}</TableCell>
                          <TableCell>{row.data.trainee_code || "—"}</TableCell>
                          <TableCell>{row.data.full_name || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {row.errors.map((e, i) => (
                                <Badge key={i} variant="destructive" className="text-xs">{e}</Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valid rows preview */}
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Dữ liệu hợp lệ ({validRows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Dòng</TableHead>
                      <TableHead>Mã HV</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Ngày sinh</TableHead>
                      <TableHead>Giới tính</TableHead>
                      <TableHead>CCCD</TableHead>
                      <TableHead>Quê quán</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validRows.slice(0, 100).map(row => (
                      <TableRow key={row.rowIndex}>
                        <TableCell>{row.rowIndex}</TableCell>
                        <TableCell className="font-mono text-sm">{row.data.trainee_code}</TableCell>
                        <TableCell className="font-medium">{row.data.full_name}</TableCell>
                        <TableCell>{row.data.birth_date || "—"}</TableCell>
                        <TableCell>{row.data.gender || "—"}</TableCell>
                        <TableCell>{row.data.cccd_number || "—"}</TableCell>
                        <TableCell>{row.data.birthplace || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {validRows.length > 100 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    ... và {validRows.length - 100} dòng khác
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg font-medium">Đang nhập dữ liệu...</p>
            <p className="text-sm text-muted-foreground mb-4">{importProgress}% hoàn thành</p>
            <Progress value={importProgress} className="max-w-md mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-lg font-medium">Hoàn tất nhập liệu!</p>
            <div className="flex justify-center gap-4 mt-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {importResult.success} thành công
              </Badge>
              {importResult.failed > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {importResult.failed} thất bại
                </Badge>
              )}
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={reset}>Nhập thêm</Button>
              <Button onClick={() => navigate("/trainees")}>Xem danh sách học viên</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}