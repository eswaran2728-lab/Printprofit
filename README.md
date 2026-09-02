# PrintProfit — Eshan Creations

A personal business-tracking web app for a 3D printing business. Single user
(Google OAuth), all data synced live to a Google Sheet, currency in MYR.

## Structure

- `server/` — Node.js + Express API, Google OAuth, Sheets sync, local JSON cache
- `client/` — React + Tailwind CSS single-page app (mobile-first)

## How it works

1. Sign in with Google (OAuth). The backend requests `spreadsheets` and
   `drive.file` scopes.
2. On first sign-in, the backend searches your Drive for a spreadsheet named
   **"PrintProfit — Eshan Creations"**. If it doesn't exist, it creates one
   with these tabs: Sales, Materials Stock, Hardware Stock, Printers,
   Labor & Painter Rates, Products, Monthly Summary.
3. All CRUD operations sync to their tab. Sales are appended live. A
   "Sync Summary Now" button (Sales page) recalculates the Monthly Summary
   tab; it also recalculates automatically after every sale.
4. Writes to Sheets go through a retry queue with exponential backoff so the
   UI stays instant even if the network hiccups.

## One-time Google Cloud setup (you must do this manually)

Claude Code cannot create a Google Cloud project for you — do this once:

1. Go to https://console.cloud.google.com/ and create a new project (e.g.
   "PrintProfit").
2. Enable **Google Sheets API** and **Google Drive API** for the project
   (APIs & Services → Library).
3. Configure the **OAuth consent screen** (APIs & Services → OAuth consent
   screen): choose "External" (or "Internal" if using Workspace), fill in
   the required fields, and add your own Google account as a test user.
4. Create OAuth credentials (APIs & Services → Credentials → Create
   Credentials → OAuth client ID → Web application):
   - Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
     for local dev, and your deployed URL + `/api/auth/google/callback` for
     production (e.g. `https://printprofit.up.railway.app/api/auth/google/callback`).
5. Copy the generated **Client ID** and **Client Secret**.

## Environment variables

Copy `server/.env.example` to `server/.env` and fill in:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
SESSION_SECRET=some-random-string
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

For the client, copy `client/.env.example` to `client/.env` if you need to
point at a non-default API URL.

## Local development

```bash
# terminal 1
cd server
npm install
npm run dev

# terminal 2
cd client
npm install
npm run dev
```

Visit http://localhost:5173, sign in with Google, and the app will
auto-create your spreadsheet.

## Production build & deploy

The Express server can serve the built client directly:

```bash
cd client && npm install && npm run build
cd ../server && npm install
NODE_ENV=production npm start
```

Set `GOOGLE_REDIRECT_URI` and `CLIENT_ORIGIN` to your deployed domain, and
add that same redirect URI to the OAuth client in Google Cloud Console.

### Railway

1. Push this repo to GitHub.
2. Create a Railway project and connect the repo.
3. Railway will use the root `package.json`: `npm run build` (builds the
   client and installs server deps) and `npm start` (runs the server in
   production mode, which also serves the built client).
4. Set environment variables on the Railway service (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SESSION_SECRET`,
   `CLIENT_ORIGIN`, `NODE_ENV=production`).
5. Generate a public domain, update `GOOGLE_REDIRECT_URI` to match it, and
   add that redirect URI in the Google Cloud OAuth client.

## Cost formulas

- **Cost/gram** = Cost/kg ÷ 1000
- **Printer Cost/Hour** = (Purchase Price ÷ Lifetime Hours) + (Power in kW ×
  electricity rate) + (Annual Maintenance ÷ Annual Usage Hours)
- **Total Product Cost** = (Material Cost + Printer Cost×Time + Labor Cost +
  Packaging Cost) × (1 + Failure Rate %)
- **Pricing by margin**: Sell Price = Total Cost ÷ (1 − Margin%)
- **Pricing by price**: Profit = Sell Price − Total Cost, Margin% = Profit ÷
  Sell Price × 100
