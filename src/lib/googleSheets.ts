import { google } from "googleapis";

/**
 * Server-only helper. Reads one specific tab (GOOGLE_SHEETS_TAB_NAME, "RNP") from one
 * specific spreadsheet (GOOGLE_SHEETS_SPREADSHEET_ID) via a Service Account.
 * The private key never reaches the client — this module must only be imported
 * from route handlers / server components.
 */

function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL yoki GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY .env da topilmadi");
  }

  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Fetches raw cell values from the RNP tab only. Uses a wide, fixed range
 * (A1:AZ100) and lets parseRnpData auto-detect the actual used columns/rows,
 * since the number of weekly blocks grows over time.
 */
export async function fetchRnpSheetValues(): Promise<unknown[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || "RNP";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID .env da topilmadi");
  }

  const auth = getServiceAccountAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const range = `${tabName}!A1:AZ100`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return res.data.values ?? [];
}
