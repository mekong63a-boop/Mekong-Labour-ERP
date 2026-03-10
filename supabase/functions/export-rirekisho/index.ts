import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ====== XLSX Generator ======

function escapeXml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colLetter(c: number): string {
  let s = "";
  c++;
  while (c > 0) { c--; s = String.fromCharCode(65 + (c % 26)) + s; c = Math.floor(c / 26); }
  return s;
}

interface CellData { r: number; c: number; v: string | number; s?: number; }
interface MergeRange { s: { r: number; c: number }; e: { r: number; c: number }; }

// Style indices:
// 0 = default (no border)
// 1 = S_DATA: thin border, left-align, wrap, vertical center, font 9
// 2 = S_LABEL: thin border, beige fill, bold, center, wrap, font 9
// 3 = S_CENTER: thin border, center-align, wrap, font 9
// 4 = S_TITLE: no border, bold, large font
// 5 = S_HEADER: thin border, beige fill, bold, center (section headers), font 9
const S_DATA = 1;
const S_LABEL = 2;
const S_CENTER = 3;
const S_TITLE = 4;
const S_HEADER = 5;

// 37 columns - widths tuned to fill A4 portrait width (210mm)
const NUM_COLS = 37;
const COL_WIDTHS: number[] = new Array(37).fill(3.5);

function buildXlsx(
  cells: CellData[], merges: MergeRange[], rowHeights: Map<number, number>, maxRow: number,
  imageData?: Uint8Array | null, imageExt?: string,
  noBorderZone?: (row: number, col: number) => boolean
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

  // Styles: 6 xf entries (0-5)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
<font><sz val="10"/><name val="MS Gothic"/></font>
<font><b/><sz val="10"/><name val="MS Gothic"/></font>
<font><b/><sz val="16"/><name val="MS Gothic"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4D9A0"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/></border>
<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
</cellXfs>
</styleSheet>`;

  // Build cell map
  const cellMap = new Map<string, CellData>();
  for (const cell of cells) cellMap.set(`${cell.r},${cell.c}`, cell);

  let sheetDataXml = "";
  for (let r = 0; r <= maxRow; r++) {
    const ht = rowHeights.get(r) || 20;
    let rowXml = `<row r="${r + 1}" ht="${ht}" customHeight="1">`;
    for (let c = 0; c <= maxCol; c++) {
      const ref = `${colLetter(c)}${r + 1}`;
      const cell = cellMap.get(`${r},${c}`);
      const defaultStyle = (noBorderZone && noBorderZone(r, c)) ? 0 : S_DATA;
      const style = cell?.s ?? defaultStyle;
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
<pageMargins left="0.1" right="0.1" top="0.1" bottom="0.1" header="0.05" footer="0.05"/>
<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1"/>
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

    // Photo anchored at cols 29-36, rows 1-5 (matching merge area)
    const drawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<xdr:twoCellAnchor editAs="oneCell">
  <xdr:from><xdr:col>29</xdr:col><xdr:colOff>20000</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>20000</xdr:rowOff></xdr:from>
  <xdr:to><xdr:col>37</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>6</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
  <xdr:pic>
    <xdr:nvPicPr><xdr:cNvPr id="2" name="Photo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
    <xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
    <xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1440000" cy="1920000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
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

// ====== Helpers ======
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
  const u = removeDiacritics(bp).toUpperCase();
  const north = ["HA NOI","HAI PHONG","QUANG NINH","BAC NINH","HAI DUONG","HUNG YEN","THAI BINH","NAM DINH","NINH BINH","HA NAM","VINH PHUC","BAC GIANG","PHU THO","THAI NGUYEN","BAC KAN","CAO BANG","LANG SON","TUYEN QUANG","HA GIANG","LAO CAI","YEN BAI","SON LA","LAI CHAU","DIEN BIEN","HOA BINH"];
  const central = ["THANH HOA","NGHE AN","HA TINH","QUANG BINH","QUANG TRI","THUA THIEN HUE","DA NANG","QUANG NAM","QUANG NGAI","BINH DINH","PHU YEN","KHANH HOA","NINH THUAN","BINH THUAN","KON TUM","GIA LAI","DAK LAK","DAK NONG","LAM DONG"];
  for (const p of north) if (u.includes(p)) return "北部";
  for (const p of central) if (u.includes(p)) return "中部";
  return "南部";
};

// Strip Vietnamese diacritics
const removeDiacritics = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
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

    // ====== Build cells matching original 37-column template EXACTLY ======
    const cells: CellData[] = [];
    const merges: MergeRange[] = [];
    const rowHeights = new Map<number, number>();
    const separatorRows = new Set<number>(); // rows that should have NO internal borders

    const add = (r: number, c: number, v: any, s: number = S_DATA) => {
      cells.push({ r, c, v: v ?? "", s });
    };
    const label = (r: number, c: number, v: any) => add(r, c, v, S_LABEL);
    const data = (r: number, c: number, v: any) => add(r, c, v, S_DATA);
    const center = (r: number, c: number, v: any) => add(r, c, v, S_CENTER);
    const header = (r: number, c: number, v: any) => add(r, c, v, S_HEADER);
    const merge = (r1: number, c1: number, r2: number, c2: number) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

    // No-border zone: title area left side + separator rows (except first cell)
    const noBorderZone = (row: number, col: number): boolean => {
      if (row === 0 && col < 29) return true;
      if (row === 1 && col < 29) return true;
      if (separatorRows.has(row) && col > 0) return true;
      return false;
    };

    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    const LC = 36; // last column index

    // ============================================================
    // LAYOUT REBUILT FROM ORIGINAL TEMPLATE ANALYSIS (cell-by-cell)
    // Column mapping: 37 columns (0-36)
    // Label area: cols 0-2 (3 cols) for most rows
    // 氏名: col 0 only (span 2 rows)
    // フリガナ/英字表記: cols 1-2
    // Name data: cols 3-28
    // Photo: cols 29-36 rows 1-5
    // Education/Work: 0-2 start date, 3-8 end date, 9-36 content
    // Work detail: 9-22 company, 23-36 position+income
    // ============================================================

    // === Row 0: No + trainee code (top-right only) ===
    rowHeights.set(0, 18);
    label(0, 29, "No"); merge(0, 29, 0, 31);
    data(0, 32, traineeCode); merge(0, 32, 0, LC);

    // === Row 1: 履歴書 title + date ===
    rowHeights.set(1, 28);
    add(1, 0, "履歴書", S_TITLE); merge(1, 0, 1, 5);
    add(1, 14, dateStr, 0); merge(1, 14, 1, 21);
    // Photo frame: rows 1-5, cols 29-36
    data(1, 29, ""); merge(1, 29, 5, LC);

    // === Row 2: 氏名 - フリガナ ===
    rowHeights.set(2, 24);
    label(2, 0, "氏\n名"); merge(2, 0, 3, 0); // col 0 only, span rows 2-3
    label(2, 1, "フリガナ"); merge(2, 1, 2, 2);
    data(2, 3, p.furigana || ""); merge(2, 3, 2, 28);

    // === Row 3: 英字表記 ===
    rowHeights.set(3, 24);
    label(3, 1, "英字表記"); merge(3, 1, 3, 2);
    data(3, 3, removeDiacritics(p.full_name || "").toUpperCase()); merge(3, 3, 3, 28);

    // === Row 4: 生年月日 + 性別 ===
    rowHeights.set(4, 24);
    label(4, 0, "生年月日"); merge(4, 0, 4, 2);
    data(4, 3, toJpDate(p.birth_date)); merge(4, 3, 4, 8);
    center(4, 9, "(年齢　" + calcAge(p.birth_date) + "　歳)"); merge(4, 9, 4, 16);
    label(4, 17, "性別"); merge(4, 17, 4, 20);
    center(4, 21, p.gender === "Nam" ? "男" : p.gender === "Nữ" ? "女" : ""); merge(4, 21, 4, 28);

    // === Row 5: 出生地 + 婚姻 ===
    rowHeights.set(5, 24);
    label(5, 0, "出生地"); merge(5, 0, 5, 2);
    data(5, 3, p.birthplace ? p.birthplace + "省" : ""); merge(5, 3, 5, 8);
    center(5, 9, "（" + (getRegion(p.birthplace) || "") + "）"); merge(5, 9, 5, 16);
    label(5, 17, "婚姻"); merge(5, 17, 5, 20);
    center(5, 21, p.marital_status === "Độc thân" ? "未婚" : p.marital_status === "Đã kết hôn" ? "既婚" : ""); merge(5, 21, 5, 28);

    // === Row 6: 現住所 (full width, photo ends at row 5) ===
    rowHeights.set(6, 24);
    label(6, 0, "現住所"); merge(6, 0, 6, 2);
    data(6, 3, p.current_address || ""); merge(6, 3, 6, LC);

    // === Row 7: Empty separator (outer frame only, no internal borders) ===
    rowHeights.set(7, 5);
    separatorRows.add(7);
    data(7, 0, ""); merge(7, 0, 7, LC);

    // === Row 8: 学歴 header ===
    let r = 8;
    rowHeights.set(r, 20);
    label(r, 0, "入学年月"); merge(r, 0, r, 2);
    label(r, 3, "卒業年月"); merge(r, 3, r, 8);
    header(r, 9, "学歴"); merge(r, 9, r, LC);

    // === Education data ===
    const edu = [...(p.education_history || [])].sort((a: any, b: any) => (a.start_year || 0) - (b.start_year || 0));
    const EDU_ROWS = Math.max(edu.length, 1);
    for (let i = 0; i < EDU_ROWS; i++) {
      r++;
      rowHeights.set(r, 20);
      const e = i < edu.length ? edu[i] : null;
      data(r, 0, e ? toYM(e.start_year, e.start_month) : ""); merge(r, 0, r, 2);
      data(r, 3, e ? toYM(e.end_year, e.end_month) : ""); merge(r, 3, r, 8);
      data(r, 9, e ? ((e.school_name || "") + (e.level === "高校" || !e.level ? "高校" : "")) : ""); merge(r, 9, r, LC);
    }

    // === 職歴 header ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "入社年月"); merge(r, 0, r, 2);
    label(r, 3, "退社年月"); merge(r, 3, r, 8);
    header(r, 9, "職歴"); merge(r, 9, r, LC);

    // === Work data ===
    const work = [...(p.work_history || [])].sort((a: any, b: any) =>
      (a.start_date ? new Date(a.start_date).getTime() : 0) - (b.start_date ? new Date(b.start_date).getTime() : 0)
    );
    const WORK_ROWS = Math.max(work.length, 3);
    for (let i = 0; i < WORK_ROWS; i++) {
      r++;
      rowHeights.set(r, 20);
      const w = i < work.length ? work[i] : null;
      if (w) {
        const sD = w.start_date ? new Date(w.start_date) : null;
        const eD = w.end_date ? new Date(w.end_date) : null;
        data(r, 0, sD ? `${sD.getFullYear()}年${sD.getMonth() + 1}月` : ""); merge(r, 0, r, 2);
        data(r, 3, eD ? `${eD.getFullYear()}年${eD.getMonth() + 1}月` : "現在"); merge(r, 3, r, 8);
        data(r, 9, (w.company_name || "") + "会社"); merge(r, 9, r, 22);
        const posIncome = (w.position || "") + (w.income ? `（月収${w.income}万円）` : "");
        data(r, 23, posIncome); merge(r, 23, r, LC);
      } else {
        data(r, 0, ""); merge(r, 0, r, 2);
        data(r, 3, ""); merge(r, 3, r, 8);
        data(r, 9, ""); merge(r, 9, r, 22);
        data(r, 23, ""); merge(r, 23, r, LC);
      }
    }

    // === 過去の在留許可申請・訪日経験 ===
    r++;
    rowHeights.set(r, 20);
    header(r, 0, "過去の在留許可申請・訪日経験"); merge(r, 0, r, LC);

    // === 無/有 + 目的 ===
    r++;
    rowHeights.set(r, 20);
    center(r, 0, p.prior_residence_status === "Có" ? "有" : "無"); merge(r, 0, r, 8);
    data(r, 9, "目的 (　　　　　　　　　　　　　　　　　　　　　　　　　)"); merge(r, 9, r, LC);

    // === 家族構成 ===
    r++;
    rowHeights.set(r, 20);
    header(r, 0, "家族構成"); merge(r, 0, r, LC);

    // === Family column headers ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "続柄"); merge(r, 0, r, 2);
    label(r, 3, "氏名"); merge(r, 3, r, 11);
    label(r, 12, "年齢"); merge(r, 12, r, 17);
    label(r, 18, "同居"); merge(r, 18, r, 19);
    label(r, 20, "職業"); merge(r, 20, r, 31);
    label(r, 32, "月収"); merge(r, 32, r, LC);

    // === Family data (dynamic rows) ===
    const fam = p.family_members || [];
    const FAM_ROWS = Math.max(fam.length, 4);
    for (let i = 0; i < FAM_ROWS; i++) {
      r++;
      rowHeights.set(r, 20);
      const fm = i < fam.length ? fam[i] : null;
      if (fm) {
        center(r, 0, relationMap[fm.relationship] || fm.relationship || ""); merge(r, 0, r, 2);
        data(r, 3, fm.full_name || ""); merge(r, 3, r, 11);
        center(r, 12, fm.birth_year ? today.getFullYear() - fm.birth_year : ""); merge(r, 12, r, 17);
        center(r, 18, fm.living_together ? "O" : "X"); merge(r, 18, r, 19);
        data(r, 20, fm.occupation || ""); merge(r, 20, r, 31);
        data(r, 32, fm.income ? `${fm.income} 万円` : ""); merge(r, 32, r, LC);
      } else {
        center(r, 0, ""); merge(r, 0, r, 2);
        data(r, 3, ""); merge(r, 3, r, 11);
        center(r, 12, ""); merge(r, 12, r, 17);
        center(r, 18, ""); merge(r, 18, r, 19);
        data(r, 20, ""); merge(r, 20, r, 31);
        data(r, 32, ""); merge(r, 32, r, LC);
      }
    }

    // === 在日親戚 header + column headers ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "在日親戚"); merge(r, 0, r, 2);
    label(r, 3, "氏名"); merge(r, 3, r, 11);
    label(r, 12, "年齢"); merge(r, 12, r, 17);
    label(r, 18, "性別"); merge(r, 18, r, 19);
    label(r, 20, "関係"); merge(r, 20, r, 23);
    label(r, 24, "在留資格"); merge(r, 24, r, 32);
    label(r, 33, "居住地"); merge(r, 33, r, LC);

    // === Japan relatives data ===
    const jr = p.japan_relatives || [];
    const JR_ROWS = Math.max(jr.length, 1);
    for (let i = 0; i < JR_ROWS; i++) {
      r++;
      rowHeights.set(r, 20);
      const rel = i < jr.length ? jr[i] : null;
      if (rel) {
        center(r, 0, ""); merge(r, 0, r, 2);
        data(r, 3, rel.full_name || ""); merge(r, 3, r, 11);
        center(r, 12, rel.age || ""); merge(r, 12, r, 17);
        center(r, 18, rel.gender === "Nam" ? "男" : rel.gender === "Nữ" ? "女" : ""); merge(r, 18, r, 19);
        center(r, 20, relationMap[rel.relationship] || rel.relationship || ""); merge(r, 20, r, 23);
        data(r, 24, rel.residence_status || ""); merge(r, 24, r, 32);
        data(r, 33, rel.address_japan || ""); merge(r, 33, r, LC);
      } else {
        center(r, 0, jr.length === 0 ? "無" : ""); merge(r, 0, r, 2);
        data(r, 3, ""); merge(r, 3, r, 11);
        center(r, 12, ""); merge(r, 12, r, 17);
        center(r, 18, ""); merge(r, 18, r, 19);
        center(r, 20, ""); merge(r, 20, r, 23);
        data(r, 24, ""); merge(r, 24, r, 32);
        data(r, 33, ""); merge(r, 33, r, LC);
      }
    }

    // === 健康状態 + 視力 header ===
    r++;
    rowHeights.set(r, 20);
    header(r, 0, "健康状態"); merge(r, 0, r, 20);
    header(r, 21, "視力"); merge(r, 21, r, LC);

    // === Health row 1: 身長, 血液型, メガネ, 視力左右 ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "身長"); merge(r, 0, r, 2);
    data(r, 3, p.height ? `${p.height}cm` : ""); merge(r, 3, r, 7);
    label(r, 8, "血液型"); merge(r, 8, r, 14);
    center(r, 15, p.blood_group || ""); merge(r, 15, r, 20);
    label(r, 21, "メガネ" + (p.glasses === "有" ? "有" : "無")); merge(r, 21, r, 24);
    label(r, 25, "左："); merge(r, 25, r, 29);
    data(r, 30, p.vision_left != null ? `${p.vision_left}/10` : ""); merge(r, 30, r, 32);
    label(r, 33, "右：");
    data(r, 34, p.vision_right != null ? `${p.vision_right}/10` : ""); merge(r, 34, r, LC);

    // === Health row 2: 体重, 聴力, 健康診断 ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "体重"); merge(r, 0, r, 2);
    data(r, 3, p.weight ? `${p.weight}kg` : ""); merge(r, 3, r, 7);
    label(r, 8, "聴力"); merge(r, 8, r, 14);
    center(r, 15, p.hearing || "正常"); merge(r, 15, r, 20);
    label(r, 21, "健康診断"); merge(r, 21, r, 24);
    data(r, 25, p.health_status || "異常なし"); merge(r, 25, r, LC);

    // === Health row 3: 利き手, 刺青, B型肝炎 ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "利き手"); merge(r, 0, r, 2);
    const hand = (p.dominant_hand || "").toLowerCase();
    center(r, 3, hand.includes("phải") || hand.includes("right") ? "右" : hand.includes("trái") || hand.includes("left") ? "左" : (p.dominant_hand || "")); merge(r, 3, r, 7);
    label(r, 8, "刺青"); merge(r, 8, r, 14);
    center(r, 15, p.tattoo ? "有" : "無"); merge(r, 15, r, 20);
    label(r, 21, "Ｂ型肝炎"); merge(r, 21, r, 24);
    center(r, 25, p.hepatitis_b === "Có" ? "有" : "無"); merge(r, 25, r, LC);

    // === 資格・免許 + 趣味・特技 header ===
    r++;
    rowHeights.set(r, 20);
    label(r, 0, "資格・免許"); merge(r, 0, r, 28);
    label(r, 29, "趣味・特技"); merge(r, 29, r, LC);

    // === 資格 + 趣味 data ===
    r++;
    rowHeights.set(r, 20);
    data(r, 0, p.japanese_certificate || ""); merge(r, 0, r, 28);
    data(r, 29, p.hobbies || ""); merge(r, 29, r, LC);

    // === Empty separator (outer frame only, no internal borders) ===
    r++;
    rowHeights.set(r, 5);
    separatorRows.add(r);
    data(r, 0, ""); merge(r, 0, r, LC);

    // === 生活態度 header ===
    r++;
    rowHeights.set(r, 20);
    header(r, 0, "生活態度・学習態度・その他　[ 自己評価の場合は（　）で記載 ]"); merge(r, 0, r, LC);

    // === Attitude row 1: 飲酒, 喫煙, 性自認, 性格 ===
    r++;
    rowHeights.set(r, 45);
    center(r, 0, p.drinking === "Không" ? "無" : p.drinking || "無"); merge(r, 0, r, 1);
    label(r, 2, "飲酒\n[ 多・少・無 ]"); merge(r, 2, r, 4);
    center(r, 5, p.smoking === "Không" ? "無" : p.smoking || "無"); merge(r, 5, r, 6);
    label(r, 7, "喫煙\n[ 多・少・無 ]"); merge(r, 7, r, 12);
    center(r, 13, p.gender_identity === "Không" ? "無" : p.gender_identity || "無"); merge(r, 13, r, 14);
    label(r, 15, "性自認・指向の有無\n[ 有・無・－(無回答) ]"); merge(r, 15, r, 22);
    center(r, 23, p.personality || "普"); merge(r, 23, r, 25);
    label(r, 26, "性格\n[ 活(発)・普(通)・控(え目) ]"); merge(r, 26, r, LC);

    // === Attitude row 2: あいさつ, 整理整頓, 規則, 授業 ===
    r++;
    rowHeights.set(r, 45);
    center(r, 0, p.greeting_attitude || ""); merge(r, 0, r, 1);
    label(r, 2, "あいさつ・受け答え\n[優・良・可 ]"); merge(r, 2, r, 4);
    center(r, 5, p.tidiness || ""); merge(r, 5, r, 6);
    label(r, 7, "整理・整頓\n[ 優・良・可 ]"); merge(r, 7, r, 12);
    center(r, 13, p.discipline || ""); merge(r, 13, r, 14);
    label(r, 15, "規則の順守\n[ 優・良・可 ・未]"); merge(r, 15, r, 22);
    center(r, 23, p.class_attitude || ""); merge(r, 23, r, 25);
    label(r, 26, "授業態度\n[ 優・良・可・未 ]"); merge(r, 26, r, LC);

    // === 備考 (removed per user request) ===

    const maxRow = r;

    // === Dynamic A4 page fill: scale row heights to fill portrait A4 ===
    const TARGET_HEIGHT = 1100;
    let totalHeight = 0;
    for (let i = 0; i <= maxRow; i++) totalHeight += rowHeights.get(i) || 20;

    if (totalHeight < TARGET_HEIGHT) {
      const deficit = TARGET_HEIGHT - totalHeight;
      const scalableRows: number[] = [];
      for (let i = 2; i <= maxRow; i++) {
        const h = rowHeights.get(i) || 20;
        if (h >= 15) scalableRows.push(i); // skip tiny separator rows
      }
      if (scalableRows.length > 0) {
        const extraPerRow = Math.floor(deficit / scalableRows.length);
        const remainder = deficit - extraPerRow * scalableRows.length;
        for (let idx = 0; idx < scalableRows.length; idx++) {
          const rowIdx = scalableRows[idx];
          const current = rowHeights.get(rowIdx) || 20;
          rowHeights.set(rowIdx, current + extraPerRow + (idx < remainder ? 1 : 0));
        }
      }
    }

    const { data: photoData, ext: photoExt } = await photoPromise;
    const xlsxBuf = buildXlsx(cells, merges, rowHeights, maxRow, photoData, photoExt, noBorderZone);

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
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
