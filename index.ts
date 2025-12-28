import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Disable caching middleware
const noCache = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

app.use(noCache);

// Apply JSON parser only to non-upload routes
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip body parsing for upload endpoint - we handle it as a raw stream
  if (req.path === '/api/upload') {
    return next();
  }
  // Apply JSON parser for other routes
  express.json({ limit: '100mb' })(req, res, next);
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Ping endpoint - responds immediately with timestamp
app.get('/api/ping', noCache, (_req: Request, res: Response): void => {
  const serverTime = Date.now();
  res.json({ 
    timestamp: serverTime,
    serverTime 
  });
});

// Download endpoint - streams random binary data
app.get('/api/download', noCache, (_req: Request, res: Response): void => {
  try {
    const sizeParam = _req.query.size as string | undefined;
    const sizeBytes = sizeParam ? parseInt(sizeParam, 10) : 100 * 1024 * 1024; // Default 100MB
    
    // Validate size (50MB to 200MB)
    const minSize = 50 * 1024 * 1024;
    const maxSize = 200 * 1024 * 1024;
    const finalSize = Math.max(minSize, Math.min(maxSize, sizeBytes));

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', finalSize.toString());
    res.setHeader('Content-Disposition', 'attachment; filename="speedtest.dat"');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const chunkSize = 64 * 1024; // 64KB chunks
    let sent = 0;
    let isDraining = false;

    const sendChunk = (): void => {
      if (sent >= finalSize) {
        res.end();
        return;
      }

      const remaining = finalSize - sent;
      const currentChunkSize = Math.min(chunkSize, remaining);
      
      // Generate random binary data - use crypto for better randomness
      const buffer = Buffer.allocUnsafe(currentChunkSize);
      // Fill with random data to prevent compression/caching
      for (let i = 0; i < currentChunkSize; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }

      sent += currentChunkSize;
      
      // Respect backpressure - only send when the stream can handle it
      const canContinue = res.write(buffer);
      
      if (!canContinue) {
        // Stream is full, wait for drain event
        isDraining = true;
        res.once('drain', () => {
          isDraining = false;
          sendChunk();
        });
      } else {
        // Stream can handle more, but add a small delay to prevent overwhelming
        // This ensures we measure actual network speed, not just memory speed
        if (sent < finalSize) {
          // Use process.nextTick instead of setImmediate for better backpressure handling
          process.nextTick(sendChunk);
        } else {
          res.end();
        }
      }
    };

    // Start sending chunks
    sendChunk();
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

// Upload endpoint - receives data and measures upload speed
app.post('/api/upload', noCache, (req: Request, res: Response): void => {
  try {
    const startTime = Date.now();
    const contentLength = req.headers['content-length'];
    
    if (!contentLength) {
      res.status(400).json({ error: 'Content-Length header required' });
      return;
    }

    const sizeBytes = parseInt(contentLength, 10);
    
    if (isNaN(sizeBytes) || sizeBytes <= 0) {
      res.status(400).json({ error: 'Invalid Content-Length' });
      return;
    }

    let receivedBytes = 0;

    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;
    });

    req.on('end', () => {
      try {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const actualSize = receivedBytes;

        res.json({
          received: actualSize,
          expected: sizeBytes,
          duration,
          timestamp: endTime
        });
      } catch (error) {
        console.error('Upload processing error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Upload processing failed' });
        }
      }
    });

    req.on('error', (error: Error) => {
      console.error('Upload stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Upload stream failed' });
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      if (!res.headersSent && receivedBytes === 0) {
        // Client disconnected before sending data
        console.log('Client disconnected during upload');
      }
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Upload endpoint error' });
    }
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Speed Test Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

