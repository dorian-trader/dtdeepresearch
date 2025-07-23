// post-draft.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the repository root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const site = process.env.SITE || 'https://mysite.com';
const username = process.env.USERNAME || 'me';
const appPassword = process.env.APP_PASSWORD || 'todo';
const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');

const postDraft = async () => {
  const res = await fetch(`${site}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'David\s draft article from the API 2',
      content: 'This is the content of your draft post.',
      status: 'draft',
    }),
  });

  const data = await res.json();
  console.log('Response:', data);
};

postDraft().catch(console.error);
