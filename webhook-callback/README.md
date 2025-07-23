# Webhook Callback Server

A simple webhook callback server for testing what ChatGPT Deep Research sends after task completion.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Or build and run production:**
   ```bash
   npm run build
   npm start
   ```

The server will start on port 3002 (or the PORT environment variable if set).

## Endpoints

- `GET /` - Server information and instructions
- `POST /webhook` - Main webhook endpoint (receives data from ChatGPT Deep Research)
- `GET /health` - Health check endpoint
- `GET /logs` - List all saved webhook data files

## Usage

### Testing the Webhook

You can test the webhook locally using curl:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "test-123",
    "status": "completed",
    "data": {
      "research_results": "Sample research data"
    }
  }'
```

### Viewing Logs

- **Console logs:** Real-time logs appear in the terminal when running the server
- **Saved files:** All webhook data is saved to the `logs/` directory
- **Web interface:** Visit `http://localhost:3000/logs` to see a list of saved files

### File Structure

```
webhook-callback/
├── src/
│   └── server.ts          # Main server file
├── logs/                  # Saved webhook data (created automatically)
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

- **Port:** Set the `PORT` environment variable to change the default port (3000)
- **File size limit:** JSON body size limit is set to 50MB
- **Logs directory:** Webhook data is saved to `logs/` directory
