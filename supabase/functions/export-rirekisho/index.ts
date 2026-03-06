import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ====== Minimal XLSX generator with styling ======

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colLetter(c: number): string {
  let s = "";
  c++;
  while (c > 0) {
    c--;
    s = String.fromCharCode(65 + (c % 26)) + s;
    c = Math.floor(c / 26);
  }
  return s;
}

interface CellData {
  r: number;
  c: number;
  v: string | number;
  s?: number; // style index: 1=data(border), 2=label(blue+border+bold)
}

interface MergeRange {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

function buildXlsx(cells: CellData[], merges: MergeRange[], maxRow: number, maxCol: number): Uint8Array {
  // Build shared strings
  const strings: string[] = [];
  const stringMap = new Map<string, number>();

  for (const cell of cells) {
    if (typeof cell.v === "string" && cell.v !== "") {
      if (!stringMap.has(cell.v)) {
        stringMap.set(cell.v, strings.length);
        strings.push(cell.v);
      }
    }
  }

  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${strings.map(s => `<si><t>${escapeXml(s)}</t></si>`).join("\n")}
</sst>`;

  // ====== Styles XML ======
  // Style 0: default (no border, no fill) - Excel requires this
  // Style 1: data cell (thin borders, no fill, normal font)
  // Style 2: label cell (thin borders, light blue fill, bold font)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="10"/><name val="MS Gothic"/></font>
<font><b/><sz val="10"/><name val="MS Gothic"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDAEEF3"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/></border>
<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom></border>
</borders>
<cellStyleXfs count="1">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
</cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
</cellXfs>
</styleSheet>`;

  // Build sheet data
  const rowMap = new Map<number, CellData[]>();
  for (const cell of cells) {
    if (!rowMap.has(cell.r)) rowMap.set(cell.r, []);
    rowMap.get(cell.r)!.push(cell);
  }

  let sheetDataXml = "";
  const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);
  for (const r of sortedRows) {
    const rowCells = rowMap.get(r)!.sort((a, b) => a.c - b.c);
    let rowXml = `<row r="${r + 1}">`;
    for (const cell of rowCells) {
      const ref = `${colLetter(cell.c)}${cell.r + 1}`;
      const styleAttr = cell.s ? ` s="${cell.s}"` : "";
      if (typeof cell.v === "number") {
        rowXml += `<c r="${ref}"${styleAttr}><v>${cell.v}</v></c>`;
      } else if (typeof cell.v === "string" && cell.v !== "") {
        const idx = stringMap.get(cell.v);
        if (idx !== undefined) {
          rowXml += `<c r="${ref}" t="s"${styleAttr}><v>${idx}</v></c>`;
        }
      } else {
        // Empty cell with style (for borders/fill)
        if (cell.s) {
          rowXml += `<c r="${ref}"${styleAttr}/>`;
        }
      }
    }
    rowXml += "</row>";
    sheetDataXml += rowXml;
  }

  // Merges
  let mergesXml = "";
  if (merges.length > 0) {
    mergesXml = `<mergeCells count="${merges.length}">`;
    for (const m of merges) {
      mergesXml += `<mergeCell ref="${colLetter(m.s.c)}${m.s.r + 1}:${colLetter(m.e.c)}${m.e.r + 1}"/>`;
    }
    mergesXml += "</mergeCells>";
  }

  // Column widths - 38 columns (A-AL), each 4.5 width
  let colsXml = "<cols>";
  for (let i = 0; i <= maxCol; i++) {
    colsXml += `<col min="${i + 1}" max="${i + 1}" width="4.5" customWidth="1"/>`;
  }
  colsXml += "</cols>";

  // Page setup for A4 (paperSize=9), fit to 1 page width
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${colLetter(maxCol)}${maxRow + 1}"/>
${colsXml}
<sheetData>${sheetDataXml}</sheetData>
${mergesXml}
<pageMargins left="0.4" right="0.4" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>
<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="履歴書" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const files: { name: string; data: Uint8Array }[] = [
    { name: "[Content_Types].xml", data: new TextEncoder().encode(contentTypesXml) },
    { name: "_rels/.rels", data: new TextEncoder().encode(relsXml) },
    { name: "xl/workbook.xml", data: new TextEncoder().encode(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", data: new TextEncoder().encode(workbookRelsXml) },
    { name: "xl/worksheets/sheet1.xml", data: new TextEncoder().encode(sheetXml) },
    { name: "xl/sharedStrings.xml", data: new TextEncoder().encode(sharedStringsXml) },
    { name: "xl/styles.xml", data: new TextEncoder().encode(stylesXml) },
  ];

  return createZip(files);
}

function createZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const crc = crc32(file.data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, file.data.length, true);
    lv.setUint32(22, file.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const cdEntry = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdEntry.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cdEntry.set(nameBytes, 46);

    parts.push(localHeader, file.data);
    centralDir.push(cdEntry);
    offset += localHeader.length + file.data.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDir) {
    parts.push(cd);
    cdSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);
  ev.setUint16(20, 0, true);
  parts.push(eocd);

  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }
  return result;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Style constants
const S_DATA = 1;  // data cell: thin borders, no fill
const S_LABEL = 2; // label cell: thin borders, light blue fill, bold

// ====== Main handler ======

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const traineeCode = url.searchParams.get("trainee_code");
    if (!traineeCode) {
      return new Response(JSON.stringify({ error: "trainee_code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { error } = await supabase.auth.getClaims(token);
      if (error) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: profile, error: rpcError } = await supabase.rpc(
      "get_trainee_full_profile",
      { p_trainee_code: traineeCode }
    );

    if (rpcError || !profile || profile.error) {
      return new Response(
        JSON.stringify({ error: rpcError?.message || profile?.error || "Not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== Build cells ======
    const cells: CellData[] = [];
    const merges: MergeRange[] = [];

    const addCell = (r: number, c: number, v: any, style?: number) => {
      if (v === null || v === undefined) v = "";
      cells.push({ r, c, v, s: style });
    };

    // Helper: add label cell (blue fill)
    const addLabel = (r: number, c: number, v: any) => addCell(r, c, v, S_LABEL);
    // Helper: add data cell (border only)
    const addData = (r: number, c: number, v: any) => addCell(r, c, v, S_DATA);

    const calcAge = (birthDate: string | null): number | string => {
      if (!birthDate) return "";
      const bd = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - bd.getFullYear();
      if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
      return age;
    };

    const toJpDate = (dateStr: string | null): string => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    };

    const toYM = (y: number | null, m: number | null): string => {
      if (!y) return "";
      return m ? `${y}年${m}月` : `${y}年`;
    };

    const getRegion = (bp: string | null): string => {
      if (!bp) return "";
      const u = bp.toUpperCase();
      const north = ["HA NOI","HAI PHONG","QUANG NINH","BAC NINH","HAI DUONG","HUNG YEN","THAI BINH","NAM DINH","NINH BINH","HA NAM","VINH PHUC","BAC GIANG","PHU THO","THAI NGUYEN","BAC KAN","CAO BANG","LANG SON","TUYEN QUANG","HA GIANG","LAO CAI","YEN BAI","SON LA","LAI CHAU","DIEN BIEN","HOA BINH"];
      const central = ["THANH HOA","NGHE AN","HA TINH","QUANG BINH","QUANG TRI","THUA THIEN HUE","DA NANG","QUANG NAM","QUANG NGAI","BINH DINH","PHU YEN","KHANH HOA","NINH THUAN","BINH THUAN","KON TUM","GIA LAI","DAK LAK","DAK NONG","LAM DONG"];
      for (const p of north) if (u.includes(p)) return "北部";
      for (const p of central) if (u.includes(p)) return "中部";
      return "南部";
    };

    const relationMap: Record<string, string> = {
      "Cha": "父", "Mẹ": "母", "Anh": "兄", "Chị": "姉", "Em trai": "弟", "Em gái": "妹",
      "Vợ": "妻", "Chồng": "夫", "Con trai": "息子", "Con gái": "娘", "Ông": "祖父", "Bà": "祖母"
    };

    const today = new Date();

    // Row 0: No label + trainee code
    addLabel(0, 28, "No");
    addData(0, 30, traineeCode);

    // Row 1: 履歴書 + date
    addLabel(1, 0, "履歴書");
    addData(1, 14, `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`);
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 13 } });

    // Row 2-3: 氏名
    addLabel(2, 0, "氏\n名");
    addLabel(2, 1, "フリガナ");
    addData(2, 3, profile.furigana || "");
    merges.push({ s: { r: 2, c: 3 }, e: { r: 2, c: 37 } });
    addLabel(3, 1, "英字表記");
    addData(3, 3, (profile.full_name || "").toUpperCase());
    merges.push({ s: { r: 3, c: 3 }, e: { r: 3, c: 37 } });
    merges.push({ s: { r: 2, c: 0 }, e: { r: 3, c: 0 } });

    // Row 4: 生年月日
    addLabel(4, 0, "生年月日");
    addData(4, 3, toJpDate(profile.birth_date));
    addLabel(4, 9, "(年齢");
    addData(4, 11, calcAge(profile.birth_date));
    addLabel(4, 13, "歳)");
    addLabel(4, 15, "性別");
    addData(4, 19, profile.gender === "Nam" ? "男" : profile.gender === "Nữ" ? "女" : "");

    // Row 5: 出生地 / 婚姻
    addLabel(5, 0, "出生地");
    addData(5, 3, (profile.birthplace || "") + "省");
    addLabel(5, 9, "(" + getRegion(profile.birthplace));
    addData(5, 14, ")");
    addLabel(5, 15, "婚姻");
    addData(5, 19, profile.marital_status === "Độc thân" ? "未婚" : profile.marital_status === "Đã kết hôn" ? "既婚" : "");

    // Row 6: 現住所
    addLabel(6, 0, "現住所");
    addData(6, 3, profile.current_address || "");
    merges.push({ s: { r: 6, c: 3 }, e: { r: 6, c: 37 } });

    // Row 7: empty separator
    // Row 8: 学歴 header
    addLabel(8, 0, "入学年月");
    addLabel(8, 3, "卒業年月");
    addLabel(8, 8, "学歴");
    merges.push({ s: { r: 8, c: 8 }, e: { r: 8, c: 37 } });

    const eduHistory = [...(profile.education_history || [])].sort((a: any, b: any) => (a.start_year || 0) - (b.start_year || 0));
    for (let i = 0; i < Math.min(eduHistory.length, 3); i++) {
      const edu = eduHistory[i];
      addData(9 + i, 0, toYM(edu.start_year, edu.start_month));
      addData(9 + i, 3, toYM(edu.end_year, edu.end_month));
      addData(9 + i, 8, (edu.school_name || "") + "高校");
      merges.push({ s: { r: 9 + i, c: 8 }, e: { r: 9 + i, c: 37 } });
    }

    // 職歴 header
    let row = 9 + Math.max(eduHistory.length, 1);
    addLabel(row, 0, "入社年月");
    addLabel(row, 3, "退社年月");
    addLabel(row, 8, "職歴");
    merges.push({ s: { r: row, c: 8 }, e: { r: row, c: 23 } });

    const workHistory = [...(profile.work_history || [])].sort((a: any, b: any) => {
      const aD = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bD = b.start_date ? new Date(b.start_date).getTime() : 0;
      return aD - bD;
    });

    const workStart = row + 1;
    for (let i = 0; i < Math.min(workHistory.length, 4); i++) {
      const r = workStart + i;
      const w = workHistory[i];
      const sD = w.start_date ? new Date(w.start_date) : null;
      const eD = w.end_date ? new Date(w.end_date) : null;
      addData(r, 0, sD ? `${sD.getFullYear()}年${sD.getMonth() + 1}月` : "");
      addData(r, 3, eD ? `${eD.getFullYear()}年${eD.getMonth() + 1}月` : "現在");
      addData(r, 8, (w.company_name || "") + "会社");
      merges.push({ s: { r, c: 8 }, e: { r, c: 23 } });
      const incomeStr = w.income ? `（月収${w.income}万円）` : "";
      addData(r, 24, (w.position || "") + incomeStr);
      merges.push({ s: { r, c: 24 }, e: { r, c: 37 } });
    }

    // 過去の在留許可
    let cr = workStart + Math.max(workHistory.length, 1) + 1;
    addLabel(cr, 0, "過去の在留許可申請・訪日経験");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 37 } });
    cr++;
    addData(cr, 0, profile.prior_residence_status === "Có" ? "有" : "無");
    addLabel(cr, 8, "目的 (");
    addData(cr, 14, ")");

    // 家族構成
    cr += 2;
    addLabel(cr, 0, "家族構成");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 37 } });
    cr++;
    addLabel(cr, 0, "続柄");
    addLabel(cr, 3, "氏名");
    merges.push({ s: { r: cr, c: 3 }, e: { r: cr, c: 10 } });
    addLabel(cr, 11, "年齢");
    addLabel(cr, 17, "同居");
    addLabel(cr, 19, "職業");
    merges.push({ s: { r: cr, c: 19 }, e: { r: cr, c: 30 } });
    addLabel(cr, 31, "月収");

    const fam = profile.family_members || [];
    for (let i = 0; i < Math.min(fam.length, 6); i++) {
      cr++;
      const fm = fam[i];
      addData(cr, 0, relationMap[fm.relationship] || fm.relationship || "");
      addData(cr, 3, fm.full_name || "");
      merges.push({ s: { r: cr, c: 3 }, e: { r: cr, c: 10 } });
      const age = fm.birth_year ? today.getFullYear() - fm.birth_year : "";
      addData(cr, 11, age);
      addData(cr, 17, fm.living_together ? "X" : "O");
      addData(cr, 19, fm.occupation || "");
      merges.push({ s: { r: cr, c: 19 }, e: { r: cr, c: 30 } });
      addData(cr, 31, fm.income ? `${fm.income} 万円` : "");
    }

    // 在日親戚
    cr += 2;
    addLabel(cr, 0, "在日親戚");
    addLabel(cr, 3, "氏名");
    merges.push({ s: { r: cr, c: 3 }, e: { r: cr, c: 10 } });
    addLabel(cr, 11, "年齢");
    addLabel(cr, 17, "性別");
    addLabel(cr, 19, "関係");
    addLabel(cr, 23, "在留資格");
    merges.push({ s: { r: cr, c: 23 }, e: { r: cr, c: 30 } });
    addLabel(cr, 31, "居住地");

    const jr = profile.japan_relatives || [];
    if (jr.length === 0) {
      cr++;
      addData(cr, 0, "無");
    } else {
      for (let i = 0; i < Math.min(jr.length, 3); i++) {
        cr++;
        const rel = jr[i];
        addData(cr, 3, rel.full_name || "");
        addData(cr, 11, rel.age || "");
        addData(cr, 17, rel.gender === "Nam" ? "男" : rel.gender === "Nữ" ? "女" : "");
        addData(cr, 19, relationMap[rel.relationship] || rel.relationship || "");
        addData(cr, 23, rel.residence_status || "");
        addData(cr, 31, rel.address_japan || "");
      }
    }

    // 健康状態
    cr += 2;
    addLabel(cr, 0, "健康状態");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 19 } });
    addLabel(cr, 20, "視力");
    merges.push({ s: { r: cr, c: 20 }, e: { r: cr, c: 37 } });

    cr++;
    addLabel(cr, 0, "身長");
    addData(cr, 3, profile.height ? `${profile.height}cm` : "");
    addLabel(cr, 8, "血液型");
    addData(cr, 15, profile.blood_group || "");
    addLabel(cr, 20, "メガネ" + (profile.glasses === "有" ? "有" : "無"));
    addLabel(cr, 26, "左：");
    addData(cr, 29, profile.vision_left != null ? `${profile.vision_left}/10` : "");
    addLabel(cr, 33, "右：");
    addData(cr, 35, profile.vision_right != null ? `${profile.vision_right}/10` : "");

    cr++;
    addLabel(cr, 0, "体重");
    addData(cr, 3, profile.weight ? `${profile.weight}kg` : "");
    addLabel(cr, 8, "聴力");
    addData(cr, 15, profile.hearing || "正常");
    addLabel(cr, 20, "健康診断");
    addData(cr, 26, profile.health_status || "異常なし");

    cr++;
    addLabel(cr, 0, "利き手");
    addData(cr, 3, profile.dominant_hand === "Phải" ? "右" : profile.dominant_hand === "Trái" ? "左" : (profile.dominant_hand || ""));
    addLabel(cr, 8, "刺青");
    addData(cr, 15, profile.tattoo ? "有" : "無");
    addLabel(cr, 20, "Ｂ型肝炎");
    addData(cr, 26, profile.hepatitis_b === "Có" ? "有" : "無");

    // 資格・免許 / 趣味・特技
    cr++;
    addLabel(cr, 0, "資格・免許");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 27 } });
    addLabel(cr, 28, "趣味・特技");
    merges.push({ s: { r: cr, c: 28 }, e: { r: cr, c: 37 } });
    cr++;
    addData(cr, 0, profile.japanese_certificate || "");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 27 } });
    addData(cr, 28, profile.hobbies || "");
    merges.push({ s: { r: cr, c: 28 }, e: { r: cr, c: 37 } });

    // 生活態度
    cr += 2;
    addLabel(cr, 0, "生活態度・学習態度・その他　[ 自己評価の場合は（　）で記載 ]");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 37 } });

    cr++;
    addData(cr, 0, profile.drinking || "無");
    addLabel(cr, 1, "飲酒\n[ 多・少・無 ]");
    addData(cr, 5, profile.smoking || "無");
    addLabel(cr, 6, "喫煙\n[ 多・少・無 ]");
    addData(cr, 15, profile.gender_identity || "無");
    addLabel(cr, 17, "性自認・指向の有無\n[ 有・無・－(無回答) ]");
    addData(cr, 25, profile.personality || "");
    addLabel(cr, 27, "性格\n[ 活(発)・普(通)・控(え目) ]");

    cr++;
    addData(cr, 0, profile.greeting_attitude || "");
    addLabel(cr, 1, "あいさつ・受け答え\n[優・良・可 ]");
    addData(cr, 5, profile.tidiness || "");
    addLabel(cr, 6, "整理・整頓\n[ 優・良・可 ]");
    addData(cr, 15, profile.discipline || "");
    addLabel(cr, 17, "規則の順守\n[ 優・良・可 ・未]");
    addData(cr, 25, profile.class_attitude || "");
    addLabel(cr, 27, "授業態度\n[ 優・良・可・未 ]");

    // 備考
    cr++;
    addLabel(cr, 0, "備考");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 37 } });
    cr++;
    addData(cr, 0, profile.rirekisho_remarks || "");
    merges.push({ s: { r: cr, c: 0 }, e: { r: cr, c: 37 } });

    const maxRow = cr + 1;
    const maxCol = 37;

    const xlsxBuf = buildXlsx(cells, merges, maxRow, maxCol);

    const filename = `${traineeCode} - 履歴書.xlsx`;

    return new Response(xlsxBuf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("Export rirekisho error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
