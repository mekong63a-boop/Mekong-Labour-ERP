import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ====== XLSX Generator with styles, alignment, image support ======

function escapeXml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colLetter(c: number): string {
  let s = "";
  c++;
  while (c > 0) { c--; s = String.fromCharCode(65 + (c % 26)) + s; c = Math.floor(c / 26); }
  return s;
}

interface CellData {
  r: number;
  c: number;
  v: string | number;
  s?: number;
}

interface MergeRange {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

// Style indices:
// 0 = default (no border)
// 1 = data cell: border, left-align, wrap
// 2 = label cell: border, fill, bold, center, wrap
// 3 = data cell: border, center-align
// 4 = title: no border, bold, large font, left-align
const S_DATA = 1;
const S_LABEL = 2;
const S_CENTER = 3;
const S_TITLE = 4;

// Column config: 10 columns scaled to fill A4 portrait width
// Total width ≈ 118 chars → fills A4 with narrow margins
const COL_WIDTHS = [12, 16, 12, 10, 8, 10, 8, 12, 11, 12];
const NUM_COLS = COL_WIDTHS.length;

function buildXlsx(
  cells: CellData[], merges: MergeRange[], maxRow: number,
  imageData?: Uint8Array | null, imageExt?: string
): Uint8Array {
  const hasImage = imageData && imageData.length > 0;
  const maxCol = NUM_COLS - 1;

  // Shared strings
  const strings: string[] = [];
  const stringMap = new Map<string, number>();
  for (const cell of cells) {
    if (typeof cell.v === "string" && cell.v !== "") {
      if (!stringMap.has(cell.v)) { stringMap.set(cell.v, strings.length); strings.push(cell.v); }
    }
  }

  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${strings.map(s => `<si><t>${escapeXml(s)}</t></si>`).join("\n")}
</sst>`;

  // Styles: 5 xf entries
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
<font><sz val="11"/><name val="MS Gothic"/></font>
<font><b/><sz val="11"/><name val="MS Gothic"/></font>
<font><b/><sz val="16"/><name val="MS Gothic"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDDD9C4"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/></border>
<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
</styleSheet>`;

  // Build cell map
  const cellMap = new Map<string, CellData>();
  for (const cell of cells) cellMap.set(`${cell.r},${cell.c}`, cell);

  const contentRows = new Set<number>();
  for (const cell of cells) contentRows.add(cell.r);

  let sheetDataXml = "";
  for (let r = 0; r <= maxRow; r++) {
    if (!contentRows.has(r)) {
      sheetDataXml += `<row r="${r + 1}" ht="5" customHeight="1"/>`;
      continue;
    }
    let rowXml = `<row r="${r + 1}" ht="22" customHeight="1">`;
    for (let c = 0; c <= maxCol; c++) {
      const ref = `${colLetter(c)}${r + 1}`;
      const cell = cellMap.get(`${r},${c}`);
      const style = cell?.s ?? S_DATA;
      if (cell && typeof cell.v === "number") {
        rowXml += `<c r="${ref}" s="${style}"><v>${cell.v}</v></c>`;
      } else if (cell && typeof cell.v === "string" && cell.v !== "") {
        const idx = stringMap.get(cell.v);
        if (idx !== undefined) rowXml += `<c r="${ref}" t="s" s="${style}"><v>${idx}</v></c>`;
        else rowXml += `<c r="${ref}" s="${style}"/>`;
      } else {
        rowXml += `<c r="${ref}" s="${style}"/>`;
      }
    }
    rowXml += "</row>";
    sheetDataXml += rowXml;
  }

  // Merges
  let mergesXml = "";
  if (merges.length > 0) {
    mergesXml = `<mergeCells count="${merges.length}">`;
    for (const m of merges) mergesXml += `<mergeCell ref="${colLetter(m.s.c)}${m.s.r + 1}:${colLetter(m.e.c)}${m.e.r + 1}"/>`;
    mergesXml += "</mergeCells>";
  }

  let colsXml = "<cols>";
  for (let i = 0; i < NUM_COLS; i++) colsXml += `<col min="${i + 1}" max="${i + 1}" width="${COL_WIDTHS[i]}" customWidth="1"/>`;
  colsXml += "</cols>";

  const drawingRef = hasImage ? `<drawing r:id="rId1"/>` : "";

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${colLetter(maxCol)}${maxRow + 1}"/>
${colsXml}
<sheetData>${sheetDataXml}</sheetData>
${mergesXml}
<pageMargins left="0.3" right="0.3" top="0.3" bottom="0.3" header="0.1" footer="0.1"/>
<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1" scale="100"/>
${drawingRef}
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="履歴書" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const ext = imageExt || "jpeg";
  const imgCT = ext === "png" ? "image/png" : "image/jpeg";
  let ctXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>`;
  if (hasImage) ctXml += `<Default Extension="${ext}" ContentType="${imgCT}"/>`;
  ctXml += `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;
  if (hasImage) ctXml += `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
  ctXml += `</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const files: { name: string; data: Uint8Array }[] = [
    { name: "[Content_Types].xml", data: new TextEncoder().encode(ctXml) },
    { name: "_rels/.rels", data: new TextEncoder().encode(relsXml) },
    { name: "xl/workbook.xml", data: new TextEncoder().encode(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", data: new TextEncoder().encode(wbRelsXml) },
    { name: "xl/worksheets/sheet1.xml", data: new TextEncoder().encode(sheetXml) },
    { name: "xl/sharedStrings.xml", data: new TextEncoder().encode(sharedStringsXml) },
    { name: "xl/styles.xml", data: new TextEncoder().encode(stylesXml) },
  ];

  if (hasImage) {
    const sheetRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`;
    files.push({ name: "xl/worksheets/_rels/sheet1.xml.rels", data: new TextEncoder().encode(sheetRels) });

    const drawRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.${ext}"/>
</Relationships>`;
    files.push({ name: "xl/drawings/_rels/drawing1.xml.rels", data: new TextEncoder().encode(drawRels) });

    // Photo at top-right: cols 8-9, rows 2-6 (passport 3x4cm)
    const drawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<xdr:twoCellAnchor editAs="oneCell">
  <xdr:from><xdr:col>8</xdr:col><xdr:colOff>50000</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
  <xdr:to><xdr:col>9</xdr:col><xdr:colOff>550000</xdr:colOff><xdr:row>6</xdr:row><xdr:rowOff>150000</xdr:rowOff></xdr:to>
  <xdr:pic>
    <xdr:nvPicPr><xdr:cNvPr id="2" name="Photo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
    <xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
    <xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1080000" cy="1440000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
  </xdr:pic>
  <xdr:clientData/>
</xdr:twoCellAnchor>
</xdr:wsDr>`;
    files.push({ name: "xl/drawings/drawing1.xml", data: new TextEncoder().encode(drawXml) });
    files.push({ name: `xl/media/image1.${ext}`, data: imageData! });
  }

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
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, file.data.length, true);
    lv.setUint32(22, file.data.length, true); lv.setUint16(26, nameBytes.length, true);
    lh.set(nameBytes, 30);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true); cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);

    parts.push(lh, file.data);
    centralDir.push(cd);
    offset += lh.length + file.data.length;
  }

  const cdOff = offset;
  let cdSz = 0;
  for (const c of centralDir) { parts.push(c); cdSz += c.length; }

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSz, true); ev.setUint32(16, cdOff, true);
  parts.push(eocd);

  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { result.set(p, pos); pos += p.length; }
  return result;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function fetchPhoto(url: string | null): Promise<{ data: Uint8Array | null; ext: string }> {
  if (!url) return { data: null, ext: "jpeg" };
  try {
    const r = await fetch(url);
    if (!r.ok) return { data: null, ext: "jpeg" };
    const buf = await r.arrayBuffer();
    return { data: new Uint8Array(buf), ext: url.toLowerCase().includes(".png") ? "png" : "jpeg" };
  } catch { return { data: null, ext: "jpeg" }; }
}

// ====== Helper functions ======

const calcAge = (bd: string | null): number | string => {
  if (!bd) return "";
  const d = new Date(bd), t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age--;
  return age;
};

const toJpDate = (s: string | null): string => {
  if (!s) return "";
  const d = new Date(s);
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
  "Anh trai": "兄", "Chị gái": "姉",
  "Vợ": "妻", "Chồng": "夫", "Con trai": "息子", "Con gái": "娘", "Ông": "祖父", "Bà": "祖母"
};

// ====== Main handler ======

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const traineeCode = url.searchParams.get("trainee_code");
    if (!traineeCode) return new Response(JSON.stringify({ error: "trainee_code is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader || "" } } });

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { error } = await supabase.auth.getUser(token);
      if (error) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: p, error: rpcErr } = await supabase.rpc("get_trainee_full_profile", { p_trainee_code: traineeCode });
    if (rpcErr || !p || p.error) return new Response(JSON.stringify({ error: rpcErr?.message || p?.error || "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const photoPromise = fetchPhoto(p.photo_url);

    // ====== Build cells with 10-column layout ======
    // Columns: 0-9 (see COL_WIDTHS)
    const cells: CellData[] = [];
    const merges: MergeRange[] = [];

    const add = (r: number, c: number, v: any, s: number = S_DATA) => {
      cells.push({ r, c, v: v ?? "", s });
    };
    const label = (r: number, c: number, v: any) => add(r, c, v, S_LABEL);
    const data = (r: number, c: number, v: any) => add(r, c, v, S_DATA);
    const center = (r: number, c: number, v: any) => add(r, c, v, S_CENTER);
    const merge = (r1: number, c1: number, r2: number, c2: number) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    // === Row 0: No + code ===
    label(0, 8, "No");
    data(0, 9, traineeCode);

    // === Row 1: Title 履歴書 + date ===
    add(1, 0, "履歴書", S_TITLE);
    merge(1, 0, 1, 3);
    data(1, 4, dateStr);
    merge(1, 4, 1, 7);

    // === Row 2: フリガナ ===
    label(2, 0, "氏\n名");
    merge(2, 0, 3, 0);
    label(2, 1, "フリガナ");
    data(2, 2, p.furigana || "");
    merge(2, 2, 2, 7); // Leave cols 8-9 for photo

    // === Row 3: 英字表記 ===
    label(3, 1, "英字表記");
    data(3, 2, (p.full_name || "").toUpperCase());
    merge(3, 2, 3, 7);

    // === Row 4: 生年月日 + 性別 ===
    label(4, 0, "生年月日");
    data(4, 1, toJpDate(p.birth_date));
    label(4, 2, `(年齢`);
    center(4, 3, calcAge(p.birth_date));
    label(4, 4, "歳)");
    label(4, 5, "性別");
    center(4, 6, p.gender === "Nam" ? "男" : p.gender === "Nữ" ? "女" : "");

    // === Row 5: 出生地 + 婚姻 ===
    label(5, 0, "出生地");
    data(5, 1, (p.birthplace || "") + "省");
    label(5, 2, "(");
    center(5, 3, getRegion(p.birthplace));
    label(5, 4, ")");
    label(5, 5, "婚姻");
    center(5, 6, p.marital_status === "Độc thân" ? "未婚" : p.marital_status === "Đã kết hôn" ? "既婚" : "");

    // === Row 6: 現住所 ===
    label(6, 0, "現住所");
    data(6, 1, p.current_address || "");
    merge(6, 1, 6, 9);

    // === Row 7: empty separator ===

    // === Row 8: 学歴 header ===
    label(8, 0, "入学年月");
    label(8, 1, "卒業年月");
    label(8, 2, "学歴");
    merge(8, 2, 8, 9);

    // Education rows
    const edu = [...(p.education_history || [])].sort((a: any, b: any) => (a.start_year || 0) - (b.start_year || 0));
    for (let i = 0; i < Math.min(edu.length, 3); i++) {
      const e = edu[i];
      data(9 + i, 0, toYM(e.start_year, e.start_month));
      data(9 + i, 1, toYM(e.end_year, e.end_month));
      data(9 + i, 2, (e.school_name || "") + "高校");
      merge(9 + i, 2, 9 + i, 9);
    }

    // === 職歴 header ===
    let row = 9 + Math.max(edu.length, 1);
    label(row, 0, "入社年月");
    label(row, 1, "退社年月");
    label(row, 2, "職歴");
    merge(row, 2, row, 5);

    // Work rows
    const work = [...(p.work_history || [])].sort((a: any, b: any) => {
      return (a.start_date ? new Date(a.start_date).getTime() : 0) - (b.start_date ? new Date(b.start_date).getTime() : 0);
    });
    const ws = row + 1;
    for (let i = 0; i < Math.min(work.length, 4); i++) {
      const r = ws + i, w = work[i];
      const sD = w.start_date ? new Date(w.start_date) : null;
      const eD = w.end_date ? new Date(w.end_date) : null;
      data(r, 0, sD ? `${sD.getFullYear()}年${sD.getMonth() + 1}月` : "");
      data(r, 1, eD ? `${eD.getFullYear()}年${eD.getMonth() + 1}月` : "現在");
      data(r, 2, (w.company_name || "") + "会社");
      merge(r, 2, r, 5);
      const inc = w.income ? `（月収${w.income}万円）` : "";
      data(r, 6, (w.position || "") + inc);
      merge(r, 6, r, 9);
    }

    // === 過去の在留許可 ===
    let cr = ws + Math.max(work.length, 1) + 1;
    label(cr, 0, "過去の在留許可申請・訪日経験");
    merge(cr, 0, cr, 9);
    cr++;
    center(cr, 0, p.prior_residence_status === "Có" ? "有" : "無");
    merge(cr, 0, cr, 1);
    label(cr, 2, "目的 (");
    merge(cr, 2, cr, 3);
    data(cr, 4, "");
    merge(cr, 4, cr, 8);
    data(cr, 9, ")");

    // === 家族構成 ===
    cr += 2;
    label(cr, 0, "家族構成");
    merge(cr, 0, cr, 9);
    cr++;
    label(cr, 0, "続柄");
    label(cr, 1, "氏名");
    merge(cr, 1, cr, 2);
    label(cr, 3, "年齢");
    label(cr, 4, "同居");
    label(cr, 5, "職業");
    merge(cr, 5, cr, 7);
    label(cr, 8, "月収");
    merge(cr, 8, cr, 9);

    const fam = p.family_members || [];
    for (let i = 0; i < Math.min(fam.length, 6); i++) {
      cr++;
      const fm = fam[i];
      center(cr, 0, relationMap[fm.relationship] || fm.relationship || "");
      data(cr, 1, fm.full_name || "");
      merge(cr, 1, cr, 2);
      const age = fm.birth_year ? today.getFullYear() - fm.birth_year : "";
      center(cr, 3, age);
      center(cr, 4, fm.living_together ? "O" : "X");
      data(cr, 5, fm.occupation || "");
      merge(cr, 5, cr, 7);
      data(cr, 8, fm.income ? `${fm.income} 万円` : "");
      merge(cr, 8, cr, 9);
    }

    // === 在日親戚 ===
    cr += 2;
    label(cr, 0, "在日親戚");
    label(cr, 1, "氏名");
    merge(cr, 1, cr, 2);
    label(cr, 3, "年齢");
    label(cr, 4, "性別");
    label(cr, 5, "関係");
    label(cr, 6, "在留資格");
    merge(cr, 6, cr, 7);
    label(cr, 8, "居住地");
    merge(cr, 8, cr, 9);

    const jr = p.japan_relatives || [];
    if (jr.length === 0) {
      cr++;
      center(cr, 0, "無");
    } else {
      for (let i = 0; i < Math.min(jr.length, 3); i++) {
        cr++;
        const rel = jr[i];
        data(cr, 1, rel.full_name || "");
        merge(cr, 1, cr, 2);
        center(cr, 3, rel.age || "");
        center(cr, 4, rel.gender === "Nam" ? "男" : rel.gender === "Nữ" ? "女" : "");
        center(cr, 5, relationMap[rel.relationship] || rel.relationship || "");
        data(cr, 6, rel.residence_status || "");
        merge(cr, 6, cr, 7);
        data(cr, 8, rel.address_japan || "");
        merge(cr, 8, cr, 9);
      }
    }

    // === 健康状態 ===
    cr += 2;
    label(cr, 0, "健康状態");
    merge(cr, 0, cr, 5);
    label(cr, 6, "視力");
    merge(cr, 6, cr, 9);

    cr++;
    label(cr, 0, "身長");
    data(cr, 1, p.height ? `${p.height}cm` : "");
    label(cr, 2, "血液型");
    center(cr, 3, p.blood_group || "");
    label(cr, 4, "メガネ" + (p.glasses === "有" ? "有" : "無"));
    label(cr, 6, "左：");
    data(cr, 7, p.vision_left != null ? `${p.vision_left}/10` : "");
    label(cr, 8, "右：");
    data(cr, 9, p.vision_right != null ? `${p.vision_right}/10` : "");

    cr++;
    label(cr, 0, "体重");
    data(cr, 1, p.weight ? `${p.weight}kg` : "");
    label(cr, 2, "聴力");
    center(cr, 3, p.hearing || "正常");
    label(cr, 4, "健康診断");
    data(cr, 5, p.health_status || "異常なし");
    merge(cr, 5, cr, 9);

    cr++;
    label(cr, 0, "利き手");
    const hand = (p.dominant_hand || "").toLowerCase();
    center(cr, 1, hand.includes("phải") || hand.includes("right") ? "右" : hand.includes("trái") || hand.includes("left") ? "左" : (p.dominant_hand || ""));
    label(cr, 2, "刺青");
    center(cr, 3, p.tattoo ? "有" : "無");
    label(cr, 4, "Ｂ型肝炎");
    center(cr, 5, p.hepatitis_b === "Có" ? "有" : "無");
    merge(cr, 5, cr, 9);

    // === 資格・免許 / 趣味・特技 ===
    cr++;
    label(cr, 0, "資格・免許");
    merge(cr, 0, cr, 6);
    label(cr, 7, "趣味・特技");
    merge(cr, 7, cr, 9);
    cr++;
    data(cr, 0, p.japanese_certificate || "");
    merge(cr, 0, cr, 6);
    data(cr, 7, p.hobbies || "");
    merge(cr, 7, cr, 9);

    // === 生活態度 ===
    cr += 2;
    label(cr, 0, "生活態度・学習態度・その他　[ 自己評価の場合は（　）で記載 ]");
    merge(cr, 0, cr, 9);

    cr++;
    center(cr, 0, p.drinking || "無");
    label(cr, 1, "飲酒\n[ 多・少・無 ]");
    center(cr, 2, p.smoking || "無");
    label(cr, 3, "喫煙\n[ 多・少・無 ]");
    center(cr, 4, p.gender_identity || "無");
    label(cr, 5, "性自認・指向の有無\n[ 有・無・－(無回答) ]");
    merge(cr, 5, cr, 7);
    center(cr, 8, p.personality || "");
    label(cr, 9, "性格\n[ 活(発)・普(通)・控(え目) ]");

    cr++;
    center(cr, 0, p.greeting_attitude || "");
    label(cr, 1, "あいさつ・受け答え\n[優・良・可 ]");
    center(cr, 2, p.tidiness || "");
    label(cr, 3, "整理・整頓\n[ 優・良・可 ]");
    center(cr, 4, p.discipline || "");
    label(cr, 5, "規則の順守\n[ 優・良・可 ・未]");
    merge(cr, 5, cr, 7);
    center(cr, 8, p.class_attitude || "");
    label(cr, 9, "授業態度\n[ 優・良・可・未 ]");

    // === 備考 ===
    cr++;
    label(cr, 0, "備考");
    merge(cr, 0, cr, 9);
    cr++;
    data(cr, 0, p.rirekisho_remarks || "");
    merge(cr, 0, cr, 9);

    const maxRow = cr + 1;

    const { data: photoData, ext: photoExt } = await photoPromise;
    const xlsxBuf = buildXlsx(cells, merges, maxRow, photoData, photoExt);

    const traineeName = (p.full_name || "").toUpperCase();
    const filename = `${traineeCode} - 履歴書 - ${traineeName}.xlsx`;

    return new Response(xlsxBuf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("Export rirekisho error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
