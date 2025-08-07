export function pickRandomStockWithCategoryVariety(papers) {
    const stockToPapers = {};
    for (const paper of papers) {
        for (const stock of paper.stocks) {
            if (!stockToPapers[stock])
                stockToPapers[stock] = [];
            stockToPapers[stock].push(paper);
        }
    }
    const eligible = Object.entries(stockToPapers)
        .filter(([_, paperList]) => {
        const uniquePaperIds = new Set(paperList.map(p => p.id));
        if (uniquePaperIds.size < 2)
            return false;
        
        // Check if we can find 2 different papers from different categories
        const categories = new Set();
        const papersByCategory = {};
        
        // Group papers by their categories
        for (const paper of paperList) {
            for (const category of paper.categories) {
                if (!papersByCategory[category]) {
                    papersByCategory[category] = [];
                }
                papersByCategory[category].push(paper);
            }
        }
        
        // Check if we have at least 2 different categories with different papers
        const categoryKeys = Object.keys(papersByCategory);
        if (categoryKeys.length < 2) return false;
        
        // Find if we can select 2 papers from different categories
        for (let i = 0; i < categoryKeys.length; i++) {
            for (let j = i + 1; j < categoryKeys.length; j++) {
                const cat1 = categoryKeys[i];
                const cat2 = categoryKeys[j];
                
                // Check if we can find different papers in these categories
                const papers1 = papersByCategory[cat1];
                const papers2 = papersByCategory[cat2];
                
                // Find papers that are different (different IDs)
                for (const paper1 of papers1) {
                    for (const paper2 of papers2) {
                        if (paper1.id !== paper2.id) {
                            return true; // Found 2 different papers from different categories
                        }
                    }
                }
            }
        }
        
        return false; // No 2 different papers from different categories found
    })
        .map(([stock, paperList]) => ({ stock, papers: paperList }));
    if (eligible.length === 0)
        return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
}

export function selectPapersFromDifferentCategories(papers) {
    if (papers.length < 2) {
        throw new Error(`Need at least 2 papers, but only found ${papers.length}`);
    }
    
    // Group papers by their categories
    const categoryToPapers = {};
    for (const paper of papers) {
        for (const category of paper.categories) {
            if (!categoryToPapers[category]) {
                categoryToPapers[category] = [];
            }
            categoryToPapers[category].push(paper);
        }
    }
    
    // Get all categories that have papers
    const categories = Object.keys(categoryToPapers);
    if (categories.length < 2) {
        throw new Error(`Need papers from at least 2 different categories, but only found: ${categories.join(', ')}`);
    }
    
    // Randomly select two different categories
    const shuffledCategories = categories.sort(() => Math.random() - 0.5);
    const category1 = shuffledCategories[0];
    const category2 = shuffledCategories[1];
    
    // Get all papers from these categories
    const papers1 = categoryToPapers[category1];
    const papers2 = categoryToPapers[category2];
    
    // Find all valid paper pairs (different papers from different categories)
    const validPairs = [];
    for (const p1 of papers1) {
        for (const p2 of papers2) {
            if (p1.id !== p2.id) {
                validPairs.push([p1, p2]);
            }
        }
    }
    
    if (validPairs.length === 0) {
        throw new Error(`Could not find 2 different papers from categories: ${category1}, ${category2}`);
    }
    
    // Randomly select one of the valid pairs
    const randomIndex = Math.floor(Math.random() * validPairs.length);
    return validPairs[randomIndex];
}
