// post-draft.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  // Read content from HTML file
  const htmlFilePath = path.join(__dirname, 'WMT-o3deepresearch-01.md');
  let content = '';
  
  try {
    content = fs.readFileSync(htmlFilePath, 'utf8');
  } catch (error) {
    console.error(`Error reading HTML file: ${error.message}`);
    console.log('Please create a file named "content.html" in the post-article directory');
    return;
  }

  const res = await fetch(`${site}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Walmart (WMT) Deep Research',
      content: content,
      status: 'draft',
    }),
  });

  const data = await res.json();
  console.log('Response:', data);
};

postDraft().catch(console.error);
