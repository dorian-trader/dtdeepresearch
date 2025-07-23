import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Webhook endpoint to receive data from ChatGPT Deep Research
app.post('/webhook', (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `webhook-data-${timestamp}.json`;
    const filepath = path.join(logsDir, filename);

    // Log the incoming request
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('========================');

    // Write the complete request data to file
    const webhookData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      query: req.query,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    fs.writeFileSync(filepath, JSON.stringify(webhookData, null, 2));
    
    console.log(`Webhook data saved to: ${filepath}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Webhook received and data saved',
      filename: filename,
      timestamp: webhookData.timestamp
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint with instructions
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ChatGPT Deep Research Webhook Callback Server',
    endpoints: {
      'POST /webhook': 'Receive webhook data from ChatGPT Deep Research',
      'GET /health': 'Health check endpoint',
      'GET /logs': 'List saved webhook data files'
    },
    instructions: [
      'Send POST requests to /webhook to test webhook functionality',
      'All received data will be saved to the logs directory',
      'Check the console for real-time logs of incoming requests'
    ]
  });
});

// Endpoint to list saved webhook data files
app.get('/logs', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(logsDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    res.json({
      logsDir: logsDir,
      files: files,
      totalFiles: files.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to read logs directory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Webhook callback server running on port ${PORT}`);
  console.log(`📝 POST requests to: http://localhost:${PORT}/webhook`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Logs endpoint: http://localhost:${PORT}/logs`);
  console.log(`📂 Logs directory: ${logsDir}`);
  console.log('');
  console.log('Ready to receive webhook data from ChatGPT Deep Research!');
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app; 