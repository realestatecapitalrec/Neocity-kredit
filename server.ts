import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser for large apartment payloads
  app.use(express.json({ limit: '50mb' }));

  const dataDir = path.join(process.cwd(), 'data');
  const dataFilePath = path.join(dataDir, 'apartments.json');

  // Ensure persistent data directory and file exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // In-memory cache to guarantee immediate consistency across requests
  interface ApartmentsPayload {
    version: number;
    updatedAt: number;
    count: number;
    apartments: unknown[];
  }

  let cachedPayload: ApartmentsPayload | null = null;

  // Real-time SSE active subscribers (both admin and guests)
  const sseClients = new Set<express.Response>();

  const broadcastApartments = (payload: ApartmentsPayload) => {
    const data = JSON.stringify(payload);
    for (const client of sseClients) {
      try {
        client.write(`event: apartments\ndata: ${data}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  // Keep-alive heartbeat every 20 seconds to prevent connection drops across proxies
  const keepAliveInterval = setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': keepalive\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

  const initializeDataFile = () => {
    try {
      if (fs.existsSync(dataFilePath)) {
        const raw = fs.readFileSync(dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        let list: unknown[] = [];
        let ts = 0;

        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.apartments)) {
          list = parsed.apartments;
          ts = Number(parsed.updatedAt) || 0;
        }

        // If the database still has the old 54 sample apartments from previous demo seeds, wipe it clean
        if (list.length === 54 && ts === 0) {
          list = [];
        }

        cachedPayload = {
          version: 2,
          updatedAt: ts,
          count: list.length,
          apartments: list,
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(cachedPayload, null, 2), 'utf-8');
      } else {
        cachedPayload = {
          version: 2,
          updatedAt: 0,
          count: 0,
          apartments: [],
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(cachedPayload, null, 2), 'utf-8');
        console.log('Initialized data/apartments.json storage.');
      }
    } catch (err) {
      console.error('Failed to initialize apartments.json:', err);
    }
  };
  initializeDataFile();

  // --- API Routes FIRST ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get all apartments - Returns structured payload with updatedAt metadata
  app.get('/api/apartments', (req, res) => {
    try {
      if (cachedPayload) {
        return res.json(cachedPayload);
      }

      if (fs.existsSync(dataFilePath)) {
        const raw = fs.readFileSync(dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.apartments)) {
          cachedPayload = {
            version: parsed.version || 2,
            updatedAt: parsed.updatedAt || 0,
            count: parsed.apartments.length,
            apartments: parsed.apartments,
          };
          return res.json(cachedPayload);
        }
      }

      return res.json({
        version: 2,
        updatedAt: 0,
        count: 0,
        apartments: [],
      });
    } catch (err) {
      console.error('Error reading apartments.json:', err);
      return res.status(500).json({ error: 'Məlumat bazasını oxumaq mümkün olmadı' });
    }
  });

  // Real-time SSE stream - Allows every visitor (admin and guest) to receive instant updates
  app.get('/api/apartments/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');

    // Immediately push current state to the connecting client
    if (cachedPayload) {
      res.write(`event: apartments\ndata: ${JSON.stringify(cachedPayload)}\n\n`);
    }

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Update apartments - Saves newly added, edited, deleted, or imported Excel apartments
  app.put('/api/apartments', (req, res) => {
    try {
      const { apartments, updatedAt } = req.body;
      if (!Array.isArray(apartments)) {
        return res.status(400).json({ error: 'Məlumat massiv formatında olmalıdır' });
      }

      const timestamp = typeof updatedAt === 'number' && updatedAt > 0 ? updatedAt : Date.now();

      const payload: ApartmentsPayload = {
        version: 2,
        updatedAt: timestamp,
        count: apartments.length,
        apartments,
      };

      cachedPayload = payload;
      fs.writeFileSync(dataFilePath, JSON.stringify(payload, null, 2), 'utf-8');

      // Instantly broadcast to all connected browsers (admin & guests)
      broadcastApartments(payload);

      return res.json({ success: true, count: apartments.length, updatedAt: timestamp });
    } catch (err) {
      console.error('Error writing apartments.json:', err);
      return res.status(500).json({ error: 'Məlumatı bazaya yazmaq mümkün olmadı' });
    }
  });

  // Dedicated sync endpoint for initial admin bootstrap or recovery
  app.post('/api/apartments/sync', (req, res) => {
    try {
      const { apartments, updatedAt, force } = req.body;
      if (!Array.isArray(apartments)) {
        return res.status(400).json({ error: 'Məlumat massiv formatında olmalıdır' });
      }

      // If server already has data and force is not set, don't overwrite if client is older
      if (!force && cachedPayload && cachedPayload.count > 0 && cachedPayload.updatedAt >= (updatedAt || 0)) {
        return res.json({ success: true, message: 'Server has newer data', payload: cachedPayload });
      }

      const timestamp = typeof updatedAt === 'number' && updatedAt > 0 ? updatedAt : Date.now();
      const payload: ApartmentsPayload = {
        version: 2,
        updatedAt: timestamp,
        count: apartments.length,
        apartments,
      };

      cachedPayload = payload;
      fs.writeFileSync(dataFilePath, JSON.stringify(payload, null, 2), 'utf-8');
      broadcastApartments(payload);

      return res.json({ success: true, count: apartments.length, updatedAt: timestamp });
    } catch (err) {
      console.error('Error in /api/apartments/sync:', err);
      return res.status(500).json({ error: 'Sinxronizasiya xətası' });
    }
  });

  // --- Vite Dev Middleware or Static Production Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
