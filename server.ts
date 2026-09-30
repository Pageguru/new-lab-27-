import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'hostinger_dev_db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure data & uploads directories exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
    planRequests: [],
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

  // Static serving for Hostinger uploads directory
  app.use('/uploads', express.static(UPLOADS_DIR));

  // 1. Health check & Ping
  app.get(['/api/sync/ping', '/api/ping'], (req, res) => {
    res.json({
      success: true,
      mode: 'express_hostinger',
      message: 'IndianLalaji Hostinger Backend Emulation Active',
      timestamp: new Date().toISOString(),
      version: '3.5.0-hostinger'
    });
  });

  // 2. Hostinger Server & Database Status
  app.get(['/api/status', '/api/status.php'], (req, res) => {
    const uploadFiles = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
    res.json({
      status: 'online',
      server: 'Hostinger Web Hosting & MySQL Database (Primary)',
      database: 'Hostinger MySQL Database (u873216892_healthcare)',
      storage: 'Hostinger Server Storage (public/uploads)',
      storageMode: 'hostinger_filesystem',
      uploadsCount: uploadFiles.length,
      timestamp: new Date().toISOString(),
      version: '3.5.0-hostinger'
    });
  });

  // 3. Image & File Upload Endpoint (Saves to Hostinger Server Storage)
  app.post(['/api/upload', '/api/upload.php'], (req, res) => {
    const body = req.body || {};
    const action = req.query.action || body.action;

    // A. Image Deletion
    if (action === 'delete_image' || action === 'delete') {
      const targetUrl = body.url || body.filePath;
      if (targetUrl) {
        try {
          const filename = path.basename(new URL(targetUrl, 'http://localhost').pathname);
          if (filename && /^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
            const filePath = path.join(UPLOADS_DIR, filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (err) {
          console.warn('Error deleting old image:', err);
        }
      }
      return res.json({
        status: 'success',
        message: 'Image deleted from Hostinger server storage',
        url: targetUrl
      });
    }

    // B. Image Upload (Base64 dataUrl or binary)
    const image = body.image || body.file;
    if (!image) {
      return res.status(400).json({ status: 'error', message: 'No image data provided' });
    }

    const prefix = (body.prefix || 'img').replace(/[^a-zA-Z0-9_-]/g, '_');
    const oldImage = body.old_image || body.replace_url;

    // Safely delete previous image if replaced
    if (oldImage) {
      try {
        const oldFilename = path.basename(new URL(oldImage, 'http://localhost').pathname);
        if (oldFilename && /^[a-zA-Z0-9_\-\.]+$/.test(oldFilename)) {
          const oldPath = path.join(UPLOADS_DIR, oldFilename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      } catch {}
    }

    let ext = 'jpg';
    let buffer: Buffer;

    if (typeof image === 'string' && image.startsWith('data:')) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('pdf')) ext = 'pdf';
        else ext = 'jpg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image);
      }
    } else {
      buffer = Buffer.from(image);
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/${filename}?v=${Date.now()}`;
    return res.json({
      status: 'success',
      message: 'File successfully uploaded and saved to Hostinger server storage',
      url: fileUrl,
      filename,
      storage: 'hostinger_server_storage'
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
