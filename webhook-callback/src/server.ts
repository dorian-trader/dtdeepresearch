import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize OpenAI client with webhook secret
const client = new OpenAI({ 
  webhookSecret: process.env.OPENAI_WEBHOOK_SECRET 
});

// Don't use express.json() because signature verification needs the raw text body
app.use(express.text({ type: "application/json", limit: '50mb' }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Webhook endpoint to receive data from OpenAI
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `webhook-data-${timestamp}.json`;
    const filepath = path.join(logsDir, filename);

    // Log the incoming request
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('========================');

    // Verify the webhook signature using OpenAI
    const event = await client.webhooks.unwrap(req.body, req.headers);

    // Write the complete request data to file
    const webhookData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      verifiedEvent: event,
      query: req.query,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    fs.writeFileSync(filepath, JSON.stringify(webhookData, null, 2));
    
    console.log(`Webhook data saved to: ${filepath}`);
    console.log('Verified event type:', event.type);

    // Handle specific event types
    if (event.type === "response.completed") {
      const response_id = event.data.id;
      console.log('Response completed for ID:', response_id);
      
      try {
        const response = await client.responses.retrieve(response_id);
        const output_text = response.output
          .filter((item) => item.type === "message")
          .flatMap((item) => item.content)
          .filter((contentItem) => contentItem.type === "output_text")
          .map((contentItem) => contentItem.text)
          .join("");

        console.log("Response output:", output_text);
        
        // Save the response data separately
        const responseFilename = `response-${response_id}-${timestamp}.json`;
        const responseFilepath = path.join(logsDir, responseFilename);
        fs.writeFileSync(responseFilepath, JSON.stringify({
          response_id,
          output_text,
          full_response: response,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`Response data saved to: ${responseFilepath}`);
      } catch (responseError) {
        console.error('Error retrieving response:', responseError);
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Webhook received and verified',
      filename: filename,
      event_type: event.type,
      timestamp: webhookData.timestamp
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    if (error instanceof OpenAI.InvalidWebhookSignatureError) {
      console.error("Invalid signature", error);
      res.status(400).json({
        success: false,
        error: 'Invalid signature',
        message: 'Webhook signature verification failed'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
    message: 'OpenAI Webhook Callback Server',
    endpoints: {
      'POST /webhook': 'Receive verified webhook data from OpenAI',
      'GET /health': 'Health check endpoint',
      'GET /logs': 'List saved webhook data files'
    },
    instructions: [
      'Webhook endpoint verifies signatures using OPENAI_WEBHOOK_SECRET',
      'All received data will be saved to the logs directory',
      'Response.completed events will retrieve and save full response data',
      'Check the console for real-time logs of incoming requests'
    ],
    environment: {
      webhook_secret_configured: !!process.env.OPENAI_WEBHOOK_SECRET
    }
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
  console.log(`🚀 OpenAI webhook callback server running on port ${PORT}`);
  console.log(`📝 POST requests to: http://localhost:${PORT}/webhook`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Logs endpoint: http://localhost:${PORT}/logs`);
  console.log(`📂 Logs directory: ${logsDir}`);
  console.log(`🔐 Webhook secret configured: ${!!process.env.OPENAI_WEBHOOK_SECRET}`);
  console.log('');
  console.log('Ready to receive verified webhook data from OpenAI!');
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