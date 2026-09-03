import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DB = {
  auth: { tokens: null, spreadsheetId: null },
  materials: [],
  hardware: [],
  printers: [],
  labor: [
    { id: 'seed-1', task: 'File Prep', rate: 20, notes: '' },
    { id: 'seed-2', task: 'Print Setup', rate: 20, notes: '' },
    { id: 'seed-3', task: 'Support Removal', rate: 25, notes: '' },
    { id: 'seed-4', task: 'Sanding', rate: 25, notes: '' },
    { id: 'seed-5', task: 'Assembly', rate: 25, notes: '' },
    { id: 'seed-6', task: 'Painting (Self)', rate: 30, notes: '' },
    { id: 'seed-7', task: 'Painter (Hired)', rate: 40, notes: 'External painter rate' },
    { id: 'seed-8', task: 'Quality Check', rate: 20, notes: '' },
    { id: 'seed-9', task: 'Packaging', rate: 20, notes: '' },
  ],
  products: [],
  sales: [],
  syncQueue: [],
  catalogSeeded: false,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return structuredClone(DEFAULT_DB);
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_DB), ...parsed };
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

let db = load();

function save() {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export const store = {
  get(collection) {
    return db[collection];
  },
  set(collection, value) {
    db[collection] = value;
    save();
  },
  getAll() {
    return db;
  },
  saveAuth(tokens, spreadsheetId) {
    db.auth.tokens = tokens ?? db.auth.tokens;
    if (spreadsheetId) db.auth.spreadsheetId = spreadsheetId;
    save();
  },
  getAuth() {
    return db.auth;
  },
  isCatalogSeeded() {
    return !!db.catalogSeeded;
  },
  markCatalogSeeded() {
    db.catalogSeeded = true;
    save();
  },
};
