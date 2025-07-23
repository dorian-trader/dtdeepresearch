// test.ts
import { loadPapers } from './loader.js';
import { pickRandomStockWithCategoryVariety } from './selector.js';
(async () => {
    const papers = await loadPapers();
    const stock = pickRandomStockWithCategoryVariety(papers);
    console.log('Selected stock:', stock);
})();
