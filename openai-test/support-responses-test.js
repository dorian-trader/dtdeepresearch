import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

console.log('baseURL:', openai.baseURL);
console.log(process.env.OPENAI_API_KEY?.slice(0, 12));

const r = await openai.responses.create({
  model: 'gpt-5.6',
  input: 'Say hello',
});

console.log(r.output_text);
