import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupLog {
  timestamp: string;
  success: boolean;
  csvFileLink?: string;
  error?: string;
  rowCount?: number;
}

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
      // Escape quotes and wrap in quotes if contains comma or newline
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
  content: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const boundary = '-------314159265358979323846';
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);

  const multipartBody = new Uint8Array([
    ...encoder.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    ),
    ...contentBytes,
    ...encoder.encode(`\r\n--${boundary}--`),
  ]);

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const backupLog: BackupLog = {
    timestamp: new Date().toISOString(),
    success: false,
  };

  try {
    console.log('Starting weekly backup...');

    // Get credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all trainees
    console.log('Fetching trainees data...');
    const { data: trainees, error: fetchError } = await supabase
      .from('trainees')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch trainees: ${fetchError.message}`);
    }

    backupLog.rowCount = trainees?.length || 0;
    console.log(`Fetched ${backupLog.rowCount} trainees`);

    // Convert to CSV
    const csvContent = convertToCSV(trainees || []);
    
    // Generate file name with date and week number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const weekNum = getWeekNumber(now);
    const fileName = `${year}-${month}-Week${String(weekNum).padStart(2, '0')}_trainees.csv`;

    // Get Google Drive access
    console.log('Getting Google Drive access...');
    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Create folder path: Mekong-Labour-Hub/backups/weekly/
    console.log('Creating folder structure...');
    const folderId = await createFolderPath(accessToken, 'Mekong-Labour-Hub/backups/weekly');

    // Upload CSV
    console.log(`Uploading ${fileName}...`);
    const uploadResult = await uploadToGoogleDrive(
      accessToken,
      folderId,
      fileName,
      csvContent,
      'text/csv'
    );

    backupLog.success = true;
    backupLog.csvFileLink = uploadResult.webViewLink;

    console.log('Backup completed successfully!');
    console.log('Backup Log:', JSON.stringify(backupLog, null, 2));

    return new Response(
      JSON.stringify(backupLog),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backup error:', error);
    backupLog.error = errorMessage;
    
    console.log('Backup Log (FAILED):', JSON.stringify(backupLog, null, 2));

    return new Response(
      JSON.stringify(backupLog),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
