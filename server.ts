import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'hostinger_dev_db.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Helper to read data
function readDevDb(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Dev Server DB Read Error]:', err);
  }
  return {
    labSettingsMap: {},
    tests: [],
    packages: [],
    doctors: [],
    branches: [],
    receptionEntries: [],
    reports: [],
    bookings: [],
    staff: [],
    vendorLabs: [],
    companySettings: null,
    portalSections: null,
    domainRequests: [],
    contactSubmissions: [],
    pricingPlans: [],
    _lastUpdated: new Date().toISOString(),
  };
}

// Helper to write data
function writeDevDb(data: Record<string, any>): boolean {
  try {
    data._lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Dev Server DB Write Error]:', err);
    return false;
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS for dev/preview testing across different ports/origins
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // 1. Health check & Ping
  app.get(['/api/sync/ping', '/api/ping'], (req, res) => {
    res.json({
      success: true,
      mode: 'express_dev',
      message: 'IndianLalaji Hostinger Backend Emulation Active',
      timestamp: new Date().toISOString(),
      version: '3.5.0-dev'
    });
  });

  // 2. Fetch all sync data
  app.get(['/api/sync', '/api/sync.php'], (req, res) => {
    const action = req.query.action;
    if (action === 'ping') {
      res.json({
        success: true,
        mode: 'express_dev',
        message: 'IndianLalaji Hostinger Backend Emulation Active',
        timestamp: new Date().toISOString(),
        version: '3.5.0-dev'
      });
      return;
    }

    const data = readDevDb();
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  // 3. Save / Update / Delete entity
  app.post(['/api/sync', '/api/sync.php'], (req, res) => {
    const body = req.body;
    if (!body || !body.collection) {
      res.status(400).json({ success: false, error: 'collection is required' });
      return;
    }

    const { collection, data, action = 'save', id } = body;
    const store = readDevDb();

    if (collection === 'labSettingsMap') {
      if (!store.labSettingsMap) store.labSettingsMap = {};
      if (typeof data === 'object' && data !== null) {
        Object.assign(store.labSettingsMap, data);
      }
    } else if (collection === 'companySettings' || collection === 'portalSections') {
      store[collection] = data;
    } else {
      if (!Array.isArray(store[collection])) {
        store[collection] = [];
      }

      if (action === 'delete') {
        const targetId = id || data?.id;
        if (targetId) {
          store[collection] = store[collection].filter((item: any) => item.id !== targetId);
        }
      } else {
        if (data && data.id) {
          const idx = store[collection].findIndex((item: any) => item.id === data.id);
          if (idx >= 0) {
            store[collection][idx] = { ...store[collection][idx], ...data };
          } else {
            store[collection].unshift(data);
          }
        } else if (Array.isArray(data)) {
          store[collection] = data;
        }
      }
    }

    const saved = writeDevDb(store);
    res.json({
      success: saved,
      message: saved ? 'Saved to central Hostinger storage' : 'Failed to write data',
      collection,
      timestamp: new Date().toISOString()
    });
  });

  // Mount Vite development middlewares
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hostinger Backend & Frontend Server] Ready at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]:', err);
});
