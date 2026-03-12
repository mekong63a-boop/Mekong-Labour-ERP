import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface BackupLog {
  timestamp: string;
  success: boolean;
  csvFileLinks?: Record<string, string>;
  fullDumpLink?: string;
  fullDumpSize?: string;
  error?: string;
  tables?: Record<string, number>;
}

// Tables to backup with their display names
const BACKUP_TABLES = [
  { name: 'trainees', display: 'Học viên' },
  { name: 'orders', display: 'Đơn hàng' },
  { name: 'companies', display: 'Công ty' },
  { name: 'unions', display: 'Nghiệp đoàn' },
  { name: 'classes', display: 'Lớp học' },
  { name: 'teachers', display: 'Giáo viên' },
  { name: 'attendance', display: 'Điểm danh' },
  { name: 'test_scores', display: 'Điểm thi' },
  { name: 'user_roles', display: 'Phân quyền' },
  { name: 'profiles', display: 'Hồ sơ' },
  { name: 'family_members', display: 'Gia đình' },
  { name: 'education_history', display: 'Học vấn' },
  { name: 'work_history', display: 'Kinh nghiệm' },
  { name: 'audit_logs', display: 'Nhật ký' },
];

// All public tables for full dump (superset of BACKUP_TABLES)
const FULL_DUMP_TABLES = [
  'trainees', 'orders', 'companies', 'unions', 'classes', 'teachers',
  'attendance', 'test_scores', 'user_roles', 'profiles', 'family_members',
  'education_history', 'work_history', 'audit_logs', 'job_categories',
  'class_teachers', 'dormitories', 'dormitory_residents', 'enrollment_history',
  'handbook_entries', 'interview_history', 'japan_relatives', 'katakana_names',
  'login_attempts', 'menus', 'pending_registrations', 'trainee_reviews',
  'union_members', 'union_transactions', 'user_menu_permissions',
  'user_sessions', 'department_members', 'department_menu_permissions',
  'departments', 'cccd_places', 'passport_places', 'hobbies', 'religions',
  'referral_sources', 'policy_categories', 'vocabulary',
  'user_access_versions', 'ai_chat_messages',
];

async function getAccessToken(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${claimB64}`;

  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function findOrCreateFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchResponse.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  const createData = await createResponse.json();
  return createData.id;
}

async function createFolderPath(accessToken: string, folderPath: string): Promise<string> {
  const folders = folderPath.split('/').filter(f => f.length > 0);
  let parentId: string | undefined;

  for (const folder of folders) {
    parentId = await findOrCreateFolder(accessToken, folder, parentId);
  }

  return parentId!;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

async function uploadToGoogleDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: Uint8Array | string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const boundary = '-------314159265358979323846';
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const encoder = new TextEncoder();
  const contentBytes = typeof content === 'string' ? encoder.encode(content) : content;

  const headerPart = encoder.encode(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  const footerPart = encoder.encode(`\r\n--${boundary}--`);

  // Combine parts
  const multipartBody = new Uint8Array(headerPart.length + contentBytes.length + footerPart.length);
  multipartBody.set(headerPart, 0);
  multipartBody.set(contentBytes, headerPart.length);
  multipartBody.set(footerPart, headerPart.length + contentBytes.length);

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  const uploadData = await uploadResponse.json();
  if (uploadData.error) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData.error)}`);
  }
  
  return { id: uploadData.id, webViewLink: uploadData.webViewLink };
}

/**
 * Compress string content to gzip using Web Streams API
 */
async function gzipCompress(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(text);
  
  const stream = new Blob([inputBytes]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const reader = compressedStream.getReader();
  
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  let callerEmail = 'scheduled-cron';
  let isScheduled = false;

  // Check for cron secret (scheduled runs)
  const cronSecret = Deno.env.get('BACKUP_CRON_SECRET');
  const authHeader = req.headers.get('Authorization');
  const cronHeader = req.headers.get('x-cron-secret');

  if (cronHeader && cronSecret && cronHeader === cronSecret) {
    // Authenticated via cron secret
    isScheduled = true;
    console.log('Backup triggered by scheduled cron job');
  } else {
    // SECURITY: Validate JWT - only authenticated admins can run backups
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await authClient.from('user_roles').select('role').eq('user_id', claimsData.user.id).single();
    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    callerEmail = claimsData.user.email || 'admin';
  }

  const backupLog: BackupLog = {
    timestamp: new Date().toISOString(),
    success: false,
    tables: {},
    csvFileLinks: {},
  };

  try {
    console.log(`Backup initiated by: ${callerEmail} (scheduled: ${isScheduled})`);

    // Get credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Google Drive access
    console.log('Getting Google Drive access...');
    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Generate date-based folder path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekNum = getWeekNumber(now);
    const dateStr = `${year}${month}${day}`;
    
    // ============================================================
    // PHASE 1: CSV Backup (giữ nguyên logic cũ)
    // ============================================================
    const weekFolder = `Mekong-Labour-Hub/backups/weekly/${year}/Week-${String(weekNum).padStart(2, '0')}`;
    console.log(`[CSV] Creating folder: ${weekFolder}`);
    const csvFolderId = await createFolderPath(accessToken, weekFolder);

    for (const table of BACKUP_TABLES) {
      try {
        console.log(`[CSV] Backing up ${table.name}...`);
        
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`[CSV] Error fetching ${table.name}:`, error);
          backupLog.tables![table.name] = -1;
          continue;
        }

        const rowCount = data?.length || 0;
        backupLog.tables![table.name] = rowCount;

        if (rowCount === 0) {
          console.log(`[CSV] ${table.name}: No data`);
          continue;
        }

        const csvContent = convertToCSV(data);
        const fileName = `${year}-${month}-${day}_${table.name}.csv`;

        const uploadResult = await uploadToGoogleDrive(
          accessToken,
          csvFolderId,
          fileName,
          csvContent,
          'text/csv'
        );

        backupLog.csvFileLinks![table.name] = uploadResult.webViewLink;
        console.log(`[CSV] ✓ ${table.name}: ${rowCount} rows`);
      } catch (tableError) {
        console.error(`[CSV] Error backing up ${table.name}:`, tableError);
        backupLog.tables![table.name] = -1;
      }
    }

    // CSV summary file
    await uploadToGoogleDrive(
      accessToken,
      csvFolderId,
      `${year}-${month}-${day}_backup_summary.json`,
      JSON.stringify({
        backup_date: now.toISOString(),
        week_number: weekNum,
        tables: backupLog.tables,
        total_rows: Object.values(backupLog.tables!).reduce((a, b) => a + (b > 0 ? b : 0), 0),
      }, null, 2),
      'application/json'
    );

    // ============================================================
    // PHASE 2: Full Database Dump (Schema + Data → .sql.gz)
    // ============================================================
    console.log('[DUMP] Starting Full Database Dump...');

    // 2a. Get schema dump via RPC
    console.log('[DUMP] Extracting schema (DDL, Views, Functions, Triggers, RLS)...');
    const { data: schemaDump, error: schemaError } = await supabase.rpc('generate_schema_dump');
    
    if (schemaError) {
      console.error('[DUMP] Schema dump error:', schemaError);
      throw new Error(`Schema dump failed: ${schemaError.message}`);
    }

    let fullSql = schemaDump || '';
    fullSql += '\n-- ========================\n';
    fullSql += '-- DATA (INSERT STATEMENTS)\n';
    fullSql += '-- ========================\n\n';
    fullSql += 'BEGIN;\n\n';

    // 2b. Generate INSERT statements for each table via RPC
    let totalDataRows = 0;
    for (const tableName of FULL_DUMP_TABLES) {
      try {
        console.log(`[DUMP] Generating INSERTs for ${tableName}...`);
        const { data: insertsSql, error: insertError } = await supabase.rpc('generate_table_inserts', {
          _table_name: tableName,
        });

        if (insertError) {
          console.warn(`[DUMP] Skip ${tableName}: ${insertError.message}`);
          fullSql += `-- SKIPPED: ${tableName} (error: ${insertError.message})\n\n`;
          continue;
        }

        if (insertsSql && insertsSql.trim().length > 0) {
          fullSql += insertsSql;
          // Count INSERT lines
          const insertCount = (insertsSql.match(/^INSERT INTO/gm) || []).length;
          totalDataRows += insertCount;
          console.log(`[DUMP] ✓ ${tableName}: ${insertCount} rows`);
        } else {
          fullSql += `-- ${tableName}: empty table\n\n`;
        }
      } catch (err) {
        console.warn(`[DUMP] Error on ${tableName}:`, err);
        fullSql += `-- SKIPPED: ${tableName} (runtime error)\n\n`;
      }
    }

    fullSql += 'COMMIT;\n\n';
    fullSql += `-- ============================================\n`;
    fullSql += `-- End of Full Dump\n`;
    fullSql += `-- Total data rows: ${totalDataRows}\n`;
    fullSql += `-- To restore: psql -f Mekong_Full_Backup_${dateStr}.sql\n`;
    fullSql += `-- Or: gunzip -c Mekong_Full_Backup_${dateStr}.sql.gz | psql\n`;
    fullSql += `-- ============================================\n`;

    // 2c. Gzip compress
    console.log(`[DUMP] Compressing... (raw size: ${formatBytes(new TextEncoder().encode(fullSql).length)})`);
    const gzippedData = await gzipCompress(fullSql);
    console.log(`[DUMP] Compressed size: ${formatBytes(gzippedData.length)}`);

    // 2d. Upload to full_dumps folder
    const dumpFolder = `Mekong-Labour-Hub/backups/full_dumps`;
    console.log(`[DUMP] Uploading to ${dumpFolder}...`);
    const dumpFolderId = await createFolderPath(accessToken, dumpFolder);

    const dumpFileName = `Mekong_Full_Backup_${dateStr}.sql.gz`;
    const dumpUploadResult = await uploadToGoogleDrive(
      accessToken,
      dumpFolderId,
      dumpFileName,
      gzippedData,
      'application/gzip'
    );

    backupLog.fullDumpLink = dumpUploadResult.webViewLink;
    backupLog.fullDumpSize = formatBytes(gzippedData.length);
    console.log(`[DUMP] ✓ Full dump uploaded: ${dumpFileName} (${formatBytes(gzippedData.length)})`);
    console.log(`[DUMP] ✓ Link: ${dumpUploadResult.webViewLink}`);

    // ============================================================
    // DONE
    // ============================================================
    backupLog.success = true;
    console.log('========================================');
    console.log('BACKUP COMPLETED SUCCESSFULLY!');
    console.log(`CSV tables: ${Object.keys(backupLog.tables!).length}`);
    console.log(`Full dump: ${dumpFileName} (${formatBytes(gzippedData.length)})`);
    console.log(`Total data rows in dump: ${totalDataRows}`);
    console.log('========================================');

    return new Response(
      JSON.stringify(backupLog),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backup error:', error);
    backupLog.error = errorMessage;

    return new Response(
      JSON.stringify(backupLog),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
