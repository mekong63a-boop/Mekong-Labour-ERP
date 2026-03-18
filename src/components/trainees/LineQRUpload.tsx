import { useState, useRef, useEffect } from "react";
import { Upload, X, ZoomIn, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { uploadToStorage } from "@/lib/storage-utils";

interface LineQRUploadProps {
  currentQRUrl?: string;
  onQRChange: (url: string | null, file?: File | null) => void;
  traineeCode: string;
  /** If true, only preview the QR locally without uploading to Supabase */
  previewOnly?: boolean;
}

export function LineQRUpload({ currentQRUrl, onQRChange, traineeCode, previewOnly = false }: LineQRUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentQRUrl || null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resolvedUrl = useSignedUrl(currentQRUrl);

  useEffect(() => {
    if (resolvedUrl && !pendingFile) {
      setPreviewUrl(resolvedUrl);
    }
  }, [resolvedUrl, pendingFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Chỉ chấp nhận file ảnh",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB for QR)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File quá lớn (tối đa 2MB)",
        variant: "destructive",
      });
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);

    if (previewOnly) {
      // Just pass the file back without uploading
      onQRChange(null, file);
      return;
    }

    setIsUploading(true);
    try {
      const storagePath = await uploadToStorage(file, "line-qr", `line_qr_${traineeCode || "new"}`);

      onQRChange(storagePath);
      setPendingFile(null);
      toast({ title: "Tải ảnh QR thành công" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Lỗi khi tải ảnh QR",
        description: error.message,
        variant: "destructive",
      });
      setPreviewUrl(resolvedUrl || null);
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveQR = () => {
    // Revoke object URL to free memory
    if (pendingFile && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingFile(null);
    onQRChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        {previewUrl ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden group border border-border">
            <img
              src={previewUrl}
              alt="Line QR Code"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowFullImage(true)}
            />
            {pendingFile && previewOnly && (
              <div className="absolute top-0.5 right-0.5">
                <span className="bg-yellow-500 text-white text-[8px] px-0.5 rounded">Chưa lưu</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => setShowFullImage(true)}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={handleRemoveQR}
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <QrCode className="h-6 w-6 mb-0.5" />
                <span className="text-[10px]">Line QR</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Full Image Dialog */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <img
            src={previewUrl || ""}
            alt="Line QR Code"
            className="w-full h-auto max-h-[60vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to upload a pending Line QR file
export async function uploadLineQR(file: File, traineeCode: string): Promise<string> {
  const fileName = `line_qr_${traineeCode}_${Date.now()}.${file.name.split(".").pop()}`;
  const filePath = `line-qr/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("trainee-photos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("trainee-photos")
    .getPublicUrl(filePath);

  return publicUrl;
}
