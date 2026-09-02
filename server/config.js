import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
  },
  spreadsheetName: 'PrintProfit — Eshan Creations',
  electricityRatePerKwh: 0.571, // MYR, Malaysia domestic tariff default (editable in Printers screen calc if needed)
};
