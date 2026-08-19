import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log(process.env.OPENAI_API_KEY?.slice(0, 12));

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in root .env');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
  fetch: async (url, init) => {
    console.log('FULL REQUEST URL:', String(url));
    return fetch(url, init);
  },
});

console.log(openai.baseURL);

const INTERESTING = [
  'o3-deep-research',
  'o4-mini-deep-research',
  'deep-research',
  'o3',
  'o4',
  'gpt-5',
  'gpt-4.1',
  'gpt-4o',
];

async function main() {
  console.log('GET /v1/models ...\n');

  try {
    const page = await openai.models.list();
    const models = [];
    for await (const model of page) {
      models.push(model);
    }

    models.sort((a, b) => a.id.localeCompare(b.id));

    console.log(`Total models visible to this key: ${models.length}\n`);

    const hits = models.filter((m) =>
      INTERESTING.some((needle) => m.id.toLowerCase().includes(needle.toLowerCase()))
    );

    console.log('=== Deep research / related matches ===');
    if (hits.length === 0) {
      console.log('(none)');
    } else {
      for (const m of hits) {
        console.log(`- ${m.id}`);
      }
    }

    const exactDeep = [
      'o3-deep-research',
      'o4-mini-deep-research',
      'o3-deep-research-2025-06-26',
      'o4-mini-deep-research-2025-06-26',
    ];
    console.log('\n=== Exact deep-research id checks ===');
    for (const id of exactDeep) {
      const found = models.some((m) => m.id === id);
      console.log(`${found ? '✅' : '❌'} ${id}`);
    }

    console.log('\n=== Full model list ===');
    for (const m of models) {
      console.log(m.id);
    }
  } catch (error) {
    console.error('❌ Failed to list models:');
    console.error(error.message);
    if (error.status) console.error('status:', error.status);
    if (error.error) console.error('error:', JSON.stringify(error.error, null, 2));
    if (error.code) console.error('code:', error.code);
    process.exit(1);
  }
}

main();
