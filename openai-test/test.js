import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory (two levels up from openai-test folder)
const envPath = path.join(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);

// Load environment variables from the root .env file
dotenv.config({ path: envPath });

// Check if API key is loaded
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  console.log('Please make sure you have a .env file in the root directory with:');
  console.log('OPENAI_API_KEY=your_api_key_here');
  process.exit(1);
}

console.log('✅ OPENAI_API_KEY loaded successfully');
console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

async function testOpenAI() {
  try {
    console.log('\n🚀 Making test API call to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Hello! Please respond with just 'API test successful' to confirm this is working."
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    console.log('✅ API call successful!');
    console.log('Response:', response.choices[0].message.content);
    console.log('\n🎉 OpenAI API key is working correctly!');
    
  } catch (error) {
    console.error('❌ API call failed:');
    console.error(error.message);
    
    if (error.status === 401) {
      console.error('\nThis usually means your API key is invalid or expired.');
    } else if (error.status === 429) {
      console.error('\nThis usually means you have exceeded your API rate limits.');
    }
    
    process.exit(1);
  }
}

// Run the test
testOpenAI(); 