import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Paper } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPapers(): Promise<Paper[]> {
  const filePath = join(__dirname, '..', '..', 'papers.json');
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data) as Paper[];
}
