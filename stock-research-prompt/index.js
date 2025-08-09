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
import { pickRandomStockWithCategoryVariety, selectPapersFromDifferentCategories } from '../data/paper-utils/dist/selector.js';
import { loadPapers } from '../data/paper-utils/dist/loader.js';

// Initialize OpenAI client
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 3600 * 1000 
});



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
function generateResearchPrompt(stock, paper1, paper2) {
    // Load the template and replace tokens
    const template = loadPromptTemplate();
    return replaceTokens(template, stock, paper1, paper2);
}

// Send the prompt to ChatGPT Deep Research
async function sendToDeepResearch(prompt, metadata) {
    try {
        console.log('\nSending to ChatGPT Deep Research...');
        
        const response = await openai.responses.create({
            model: "o3-deep-research",
            //model: "o4-mini-deep-research",
            input: prompt,
            background: true,
            metadata,
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
    // Show usage if help is requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        console.log('Usage: node index.js [STOCK_SYMBOL] [--dry-run]');
        console.log('');
        console.log('Examples:');
        console.log('  node index.js                    # Random stock selection');
        console.log('  node index.js UBER              # Use UBER stock');
        console.log('  node index.js AVGO              # Use AVGO stock');
        console.log('  node index.js --dry-run         # Random stock, dry run only');
        console.log('  node index.js UBER --dry-run    # UBER stock, dry run only');
        console.log('');
        console.log('Flags:');
        console.log('  --dry-run    Show selection without running deep research');
        console.log('  --help, -h   Show this help message');
        console.log('');
        console.log('Note: If a stock symbol is provided, it must have papers from at least 2 different categories.');
        process.exit(0);
    }
    
    // Check for dry run flag
    const isDryRun = process.argv.includes('--dry-run');
    
    console.log('Loading papers database...');
    const papers = await loadPapers();
    console.log(`Loaded ${papers.length} research papers`);
    
    // Check for command line argument for hardcoded stock
    const hardcodedStock = process.argv[2];
    
    let stockSelection;
    if (hardcodedStock && hardcodedStock !== '--dry-run') {
        console.log(`\nUsing hardcoded stock: ${hardcodedStock}`);
        
        // Find papers for the hardcoded stock
        const stockPapers = papers.filter(paper => 
            paper.stocks.includes(hardcodedStock)
        );
        
        if (stockPapers.length === 0) {
            console.error(`❌ No papers found for stock: ${hardcodedStock}`);
            process.exit(1);
        }
        
        // Check if stock has papers from multiple categories
        const categories = new Set(stockPapers.flatMap(p => p.categories));
        if (categories.size < 2) {
            console.error(`❌ Stock ${hardcodedStock} only has papers from ${categories.size} category(ies): ${Array.from(categories).join(', ')}`);
            console.error('Need papers from at least 2 different categories.');
            process.exit(1);
        }
        
        // Additional check: ensure we have 2 different papers from different categories
        const papersByCategory = {};
        for (const paper of stockPapers) {
            for (const category of paper.categories) {
                if (!papersByCategory[category]) {
                    papersByCategory[category] = [];
                }
                papersByCategory[category].push(paper);
            }
        }
        
        const categoryKeys = Object.keys(papersByCategory);
        let hasDifferentPapersFromDifferentCategories = false;
        
        // Check if we can find 2 different papers from different categories
        for (let i = 0; i < categoryKeys.length; i++) {
            for (let j = i + 1; j < categoryKeys.length; j++) {
                const cat1 = categoryKeys[i];
                const cat2 = categoryKeys[j];
                
                const papers1 = papersByCategory[cat1];
                const papers2 = papersByCategory[cat2];
                
                for (const paper1 of papers1) {
                    for (const paper2 of papers2) {
                        if (paper1.id !== paper2.id) {
                            hasDifferentPapersFromDifferentCategories = true;
                            break;
                        }
                    }
                    if (hasDifferentPapersFromDifferentCategories) break;
                }
                if (hasDifferentPapersFromDifferentCategories) break;
            }
            if (hasDifferentPapersFromDifferentCategories) break;
        }
        
        if (!hasDifferentPapersFromDifferentCategories) {
            console.error(`❌ Stock ${hardcodedStock} does not have 2 different papers from different categories.`);
            console.error('All papers may be from the same category or the same paper may have multiple categories.');
            process.exit(1);
        }
        
        stockSelection = {
            stock: hardcodedStock,
            papers: stockPapers
        };
    } else {
        // Select a stock with category variety
        stockSelection = pickRandomStockWithCategoryVariety(papers);
        if (!stockSelection) {
            console.error('No stocks found with papers from multiple categories');
            process.exit(1);
        }
    }
    
    const selectedStock = stockSelection.stock;
    const relatedPapers = stockSelection.papers;
    
    console.log(`\nSelected stock: ${selectedStock}`);
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
    
    // Select papers from different categories
    const [paper1, paper2] = selectPapersFromDifferentCategories(relatedPapers);
    
    console.log('\n' + '='.repeat(80));
    console.log('SELECTED PAPERS FOR RESEARCH:');
    console.log('='.repeat(80));
    console.log(`Paper 1: ${paper1.title}`);
    console.log(`  Categories: ${paper1.categories.join(', ')}`);
    console.log(`  URL: ${paper1.url}`);
    console.log(`  Published: ${paper1.published_date}`);
    console.log('');
    console.log(`Paper 2: ${paper2.title}`);
    console.log(`  Categories: ${paper2.categories.join(', ')}`);
    console.log(`  URL: ${paper2.url}`);
    console.log(`  Published: ${paper2.published_date}`);
    console.log('='.repeat(80));
    
    if (isDryRun) {
        console.log('\n✅ DRY RUN COMPLETE - No research request sent');
        console.log('To run the actual research, remove the --dry-run flag');
        return;
    }
    
    console.log('\n' + '='.repeat(80));
    const prompt = generateResearchPrompt(selectedStock, paper1, paper2);
    console.log('Generated Prompt:');
    console.log(prompt);
    console.log('='.repeat(80));
    
    // Send to ChatGPT Deep Research
    await sendToDeepResearch(prompt, { "stock": selectedStock });
}

// Run the program
main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
}); 