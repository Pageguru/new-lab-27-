import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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

  // 2. Fetch all sync data or collection
  app.get(['/api/sync', '/api/sync.php'], (req, res) => {
    const action = req.query.action;
    if (action === 'ping') {
      res.json({
        status: 'success',
        success: true,
        mode: 'express_dev',
        message: 'IndianLalaji Hostinger Backend Emulation Active',
        timestamp: new Date().toISOString(),
        version: '3.5.0-dev'
      });
      return;
    }

    const store = readDevDb();
    const lastUpdatedTime = new Date(store._lastUpdated || Date.now()).getTime();

    if (action === 'check_updates') {
      const since = parseFloat(req.query.since as string) || 0;
      const hasUpdates = lastUpdatedTime > since;
      res.json({
        status: 'success',
        success: true,
        serverTime: Date.now(),
        lastUpdated: lastUpdatedTime,
        hasUpdates,
        updatedCollections: hasUpdates ? Object.keys(store).filter((k) => !k.startsWith('_')) : [],
        storageMode: 'file'
      });
      return;
    }

    // Build unified canonical data with both snake_case and camelCase keys
    const canonicalData: Record<string, any> = {
      reception_entries: store.reception_entries || store.receptionEntries || [],
      lab_reports: store.lab_reports || store.reports || [],
      vendor_bookings: store.vendor_bookings || store.bookings || [],
      lab_staff: store.lab_staff || store.staff || [],
      lab_settings: store.lab_settings || store.labSettingsMap || {},
      lab_tests: store.lab_tests || store.tests || [],
      lab_packages: store.lab_packages || store.packages || [],
      lab_doctors: store.lab_doctors || store.doctors || [],
      vendor_branches: store.vendor_branches || store.branches || [],
      vendor_labs: store.vendor_labs || store.vendorLabs || [],
      company_settings: store.company_settings || store.companySettings || null,
      portal_sections: store.portal_sections || store.portalSections || null,
      domain_requests: store.domain_requests || store.domainRequests || [],
      contact_submissions: store.contact_submissions || store.contactSubmissions || [],
      pricing_plans: store.pricing_plans || store.pricingPlans || [],
      plan_requests: store.plan_requests || store.planRequests || [],
      // Also provide camelCase aliases
      receptionEntries: store.reception_entries || store.receptionEntries || [],
      reports: store.lab_reports || store.reports || [],
      bookings: store.vendor_bookings || store.bookings || [],
      staff: store.lab_staff || store.staff || [],
      labSettingsMap: store.lab_settings || store.labSettingsMap || {},
      tests: store.lab_tests || store.tests || [],
      packages: store.lab_packages || store.packages || [],
      doctors: store.lab_doctors || store.doctors || [],
      branches: store.vendor_branches || store.branches || [],
      vendorLabs: store.vendor_labs || store.vendorLabs || [],
      companySettings: store.company_settings || store.companySettings || null,
      portalSections: store.portal_sections || store.portalSections || null,
    };

    function normalizeTenantIdServer(id: any): string {
      if (!id || typeof id !== 'string') return '';
      const clean = id.trim().toLowerCase();
      if (clean === 'lab-apex' || clean === 'apexdiagnostics' || clean === 'apex' || clean === 'lsp-7087' || clean === 'lsp_7087') {
        return 'apexdiagnostics';
      }
      return clean;
    }

    function isTenantMatchServer(itemLabId: any, targetLabId: any): boolean {
      if (!targetLabId || targetLabId === 'all') return true;
      const normTarget = normalizeTenantIdServer(targetLabId);
      const normItem = normalizeTenantIdServer(itemLabId);
      if (!normItem) return normTarget === 'apexdiagnostics';
      return normItem === normTarget;
    }

    if (action === 'get_collection') {
      const collection = req.query.collection as string;
      const targetLabId = (req.query.labId || req.query.tenantId) as string;
      let data = canonicalData[collection] || store[collection] || [];
      if (targetLabId && targetLabId !== 'all' && Array.isArray(data)) {
        data = data.filter((item: any) => {
          const itemLabId = item.labId || item.tenantId;
          return isTenantMatchServer(itemLabId, targetLabId);
        });
      }
      res.json({
        status: 'success',
        success: true,
        collection,
        data,
        serverTime: Date.now()
      });
      return;
    }

    res.json({
      status: 'success',
      success: true,
      data: canonicalData,
      serverTime: Date.now(),
      lastUpdated: lastUpdatedTime,
      storageMode: 'file',
      timestamp: new Date().toISOString()
    });
  });

  // 3. Save / Update / Delete entity
  app.post(['/api/sync', '/api/sync.php'], (req, res) => {
    const body = req.body;
    if (!body || !body.collection) {
      res.status(400).json({ status: 'error', success: false, error: 'collection is required' });
      return;
    }

    const { collection, data, action = 'save', id } = body;
    const store = readDevDb();

    // Map alias to primary keys
    const isLabSettings = collection === 'lab_settings' || collection === 'labSettingsMap';
    const isCompanySettings = collection === 'company_settings' || collection === 'companySettings';
    const isPortalSections = collection === 'portal_sections' || collection === 'portalSections';

    if (isLabSettings) {
      if (!store.lab_settings) store.lab_settings = {};
      if (!store.labSettingsMap) store.labSettingsMap = {};
      if (typeof data === 'object' && data !== null) {
        const labId = id || data.labId || data.id;
        if (labId) {
          store.lab_settings[labId] = { ...(store.lab_settings[labId] || {}), ...data };
          store.labSettingsMap[labId] = { ...(store.labSettingsMap[labId] || {}), ...data };
        } else {
          Object.assign(store.lab_settings, data);
          Object.assign(store.labSettingsMap, data);
        }
      }
    } else if (isCompanySettings) {
      store.company_settings = data;
      store.companySettings = data;
    } else if (isPortalSections) {
      store.portal_sections = data;
      store.portalSections = data;
    } else {
      const key = collection;
      if (!Array.isArray(store[key])) {
        store[key] = [];
      }

      if (action === 'delete') {
        const targetId = id || data?.id || data?.reportId;
        if (targetId) {
          store[key] = store[key].filter((item: any) => (item.id || item.reportId || item.labId) !== targetId);
        }
      } else {
        const targetId = id || data?.id || data?.reportId;
        if (data && targetId) {
          const idx = store[key].findIndex((item: any) => (item.id || item.reportId || item.labId) === targetId);
          if (idx >= 0) {
            store[key][idx] = { ...store[key][idx], ...data, _updatedAt: new Date().toISOString() };
          } else {
            store[key].unshift({ ...data, _updatedAt: new Date().toISOString() });
          }
        } else if (Array.isArray(data)) {
          store[key] = data;
        } else if (data) {
          store[key].unshift(data);
        }
      }

      if (collection === 'lab_staff' || collection === 'staff') {
        store.lab_staff = store[key];
        store.staff = store[key];
      }
    }

    const saved = writeDevDb(store);
    res.json({
      status: saved ? 'success' : 'error',
      success: saved,
      action,
      collection,
      id,
      serverTime: Date.now(),
      message: saved ? 'Saved to central Hostinger storage' : 'Failed to write data',
      timestamp: new Date().toISOString()
    });
  });

  // 5. Vendor AI Voice Assistant endpoint
  app.post(['/api/ai/voice-chat', '/api/ai/voice-chat.php'], async (req, res) => {
    try {
      const { vendorName, message, vendorContext } = req.body || {};
      if (process.env.GEMINI_API_KEY && message) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const vLabName = vendorContext?.vendorName || vendorName || 'Diagnostic Lab';
          const systemInstruction = `You are the official, helpful AI Voice Assistant for "${vLabName}".
CRITICAL SECURITY & SCOPE CONSTRAINTS:
1. You represent ONLY "${vLabName}".
2. You must ONLY answer using the provided vendor data below. Do NOT mention, recommend, or access data of any other laboratory or vendor. If asked about other vendors or outside labs, politely state that you only assist with "${vLabName}".
3. Keep responses conversational, clear, friendly, and concise (under 75 words), so they are easy to speak aloud.
4. Support Hindi, English, and Hinglish. Reply in the same language or tone (Hindi/Hinglish/English) as the user asked.
5. Highlight test prices in INR (₹), fasting requirements, turnaround time, home collection details, and lab timings.

VENDOR DATA:
Lab Name: ${vLabName}
Address: ${vendorContext?.address || 'City Centre'}
Phone / Contact: ${vendorContext?.phone || 'Available on website'}
Timings: ${vendorContext?.timings || '07:00 AM - 09:00 PM'}
Home Collection Fee: ${vendorContext?.homeCollectionFee !== undefined ? `₹${vendorContext.homeCollectionFee}` : 'Available'}
Available Tests: ${JSON.stringify(vendorContext?.tests || [])}
Available Health Packages: ${JSON.stringify(vendorContext?.packages || [])}
Consultant Doctors: ${JSON.stringify(vendorContext?.doctors || [])}
`;

          let aiText = '';
          const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
          for (const targetModel of modelsToTry) {
            try {
              const response = await ai.models.generateContent({
                model: targetModel,
                contents: message,
                config: {
                  systemInstruction,
                  temperature: 0.3,
                },
              });
              if (response && response.text) {
                aiText = response.text;
                break;
              }
            } catch (mErr) {
              console.warn(`[Gemini Server API] Model ${targetModel} attempt failed:`, mErr);
            }
          }

          if (aiText) {
            return res.json({
              status: 'success',
              reply: aiText,
              speechText: aiText.replace(/[*#_~]/g, ''),
            });
          }
        } catch (genAiErr) {
          console.warn('[Gemini Server API Warning]:', genAiErr);
        }
      }

      return res.json({
        status: 'success',
        useFallback: true,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        message: err?.message || 'Voice chat processing error',
        useFallback: true,
      });
    }
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
