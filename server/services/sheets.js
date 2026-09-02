import { google } from 'googleapis';
import { config } from '../config.js';
import { store } from '../utils/store.js';

const TAB_HEADERS = {
  Sales: ['Date', 'Product', 'Buyer/Platform', 'Sell Price (RM)', 'Total Cost (RM)', 'Profit (RM)', 'Margin %'],
  'Materials Stock': ['Material', 'Color', 'Cost/kg (RM)', 'Cost/g (RM, auto)', 'Stock (g)', 'Min Stock (g)', 'Reorder Needed?'],
  'Hardware Stock': ['Item', 'Cost/Unit (RM)', 'Stock', 'Min Stock', 'Reorder Needed?'],
  Printers: ['Printer Name', 'Purchase Price (RM)', 'Power (W)', 'Lifetime Hours', 'Annual Maintenance (RM)', 'Cost/Hour (RM, auto)'],
  'Labor & Painter Rates': ['Task', 'Hourly Rate (RM)', 'Notes'],
  Products: ['Product Name', 'Materials Used', 'Print Time (h)', 'Printer', 'Failure Rate %', 'Packaging Used', 'Labor Tasks Used', 'Total Cost (RM, auto)'],
  'Monthly Summary': ['Month', 'Revenue (RM)', 'Total Cost (RM)', 'Profit (RM)', 'Margin %'],
};

export function getOAuthClient() {
  return new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
}

export async function exchangeCodeForTokens(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function getAuthorizedClient() {
  const { tokens } = store.getAuth();
  if (!tokens) return null;
  const client = getOAuthClient();
  client.setCredentials(tokens);
  client.on('tokens', (newTokens) => {
    store.saveAuth({ ...tokens, ...newTokens });
  });
  return client;
}

async function findExistingSpreadsheet(auth) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `name = '${config.spreadsheetName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  return res.data.files?.[0]?.id || null;
}

async function createSpreadsheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const tabNames = Object.keys(TAB_HEADERS);
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: config.spreadsheetName },
      sheets: tabNames.map((title) => ({ properties: { title } })),
    },
  });
  const spreadsheetId = res.data.spreadsheetId;

  const data = tabNames.map((tab) => ({
    range: `${tab}!A1`,
    values: [TAB_HEADERS[tab]],
  }));
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data },
  });

  return spreadsheetId;
}

export async function ensureSpreadsheet() {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not authenticated with Google');
  const existingId = store.getAuth().spreadsheetId;
  if (existingId) return existingId;

  const foundId = await findExistingSpreadsheet(auth);
  const spreadsheetId = foundId || (await createSpreadsheet(auth));
  store.saveAuth(null, spreadsheetId);
  return spreadsheetId;
}

export async function readTab(tab) {
  const auth = getAuthorizedClient();
  const spreadsheetId = store.getAuth().spreadsheetId;
  if (!auth || !spreadsheetId) return null;
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A2:Z10000`,
  });
  return res.data.values || [];
}

export async function writeTabRows(tab, rows) {
  const auth = getAuthorizedClient();
  const spreadsheetId = store.getAuth().spreadsheetId;
  if (!auth || !spreadsheetId) throw new Error('Not authenticated or spreadsheet missing');
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${tab}!A2:Z10000` });
  if (rows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });
  }
}

export async function appendRow(tab, row) {
  const auth = getAuthorizedClient();
  const spreadsheetId = store.getAuth().spreadsheetId;
  if (!auth || !spreadsheetId) throw new Error('Not authenticated or spreadsheet missing');
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

export { TAB_HEADERS };
