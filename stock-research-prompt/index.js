import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root level .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import the existing functions
import { pickRandomStockWithCategoryVariety } from '../data/paper-utils/dist/selector.js';
import { loadPapers } from '../data/paper-utils/dist/loader.js';

// Initialize OpenAI client
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 3600 * 1000 
});

// Get papers related to a specific stock
function getPapersForStock(papers, stock) {
    return papers.filter(paper => paper.stocks.includes(stock));
}

// Load and process the prompt template
function loadPromptTemplate() {
    try {
        const templatePath = path.join(__dirname, 'prompt-template.txt');
        return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
        console.error('Error loading prompt template:', error.message);
        process.exit(1);
    }
}

// Replace tokens in the template with actual values
function replaceTokens(template, stock, paper1, paper2) {
    return template
        .replace(/{{STOCK_SYMBOL}}/g, stock)
        .replace(/{{PAPER1_TITLE}}/g, paper1.title)
        .replace(/{{PAPER1_CATEGORIES}}/g, paper1.categories.join(', '))
        .replace(/{{PAPER1_URL}}/g, paper1.url)
        .replace(/{{PAPER2_TITLE}}/g, paper2.title)
        .replace(/{{PAPER2_CATEGORIES}}/g, paper2.categories.join(', '))
        .replace(/{{PAPER2_URL}}/g, paper2.url);
}

// Generate a research prompt for a stock using the template
function generateResearchPrompt(stock, relatedPapers) {
    if (relatedPapers.length < 2) {
        throw new Error(`Need at least 2 papers for ${stock}, but only found ${relatedPapers.length}`);
    }
    
    // Get the first two papers for the template
    const paper1 = relatedPapers[0];
    const paper2 = relatedPapers[1];
    
    // Load the template and replace tokens
    const template = loadPromptTemplate();
    return replaceTokens(template, stock, paper1, paper2);
}

// Send the prompt to ChatGPT Deep Research
async function sendToDeepResearch(prompt) {
    try {
        console.log('\nSending to ChatGPT Deep Research...');
        
        const response = await openai.responses.create({
            model: "o3-deep-research",
            //model: "o4-mini-deep-research",
            input: prompt,
            background: true,
            tools: [
                { type: "web_search_preview" },
            ],
        });
        
        console.log('✅ Research request sent successfully!');
        console.log(`Response ID: ${response.id}`);
        console.log('The research will be processed in the background.');
        
        return response;
    } catch (error) {
        console.error('❌ Error sending to Deep Research:', error.message);
        throw error;
    }
}

// Main execution
async function main() {
    console.log('Loading papers database...');
    const papers = await loadPapers();
    console.log(`Loaded ${papers.length} research papers`);
    
    // TEMPORARY: Hardcode UNH for testing
    const selectedStock = 'UNH';
    console.log(`\nSelected stock: ${selectedStock} (hardcoded for testing)`);
    
    const relatedPapers = getPapersForStock(papers, selectedStock);
    console.log(`Found ${relatedPapers.length} papers related to ${selectedStock}`);
    
    if (relatedPapers.length > 0) {
        console.log('\nRelated papers:');
        relatedPapers.forEach(paper => {
            console.log(`- ${paper.title} (${paper.published_date})`);
        });
    }
    
    // Show categories for verification
    const categories = new Set();
    relatedPapers.forEach(paper => {
        paper.categories.forEach(category => categories.add(category));
    });
    console.log(`\nCategories: ${Array.from(categories).join(', ')}`);
    
    console.log('\n' + '='.repeat(80));
    const prompt = generateResearchPrompt(selectedStock, relatedPapers);
    console.log('Generated Prompt:');
    console.log(prompt);
    console.log('='.repeat(80));
    
    // Send to ChatGPT Deep Research
    await sendToDeepResearch(prompt);
}

// Run the program
main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
}); 