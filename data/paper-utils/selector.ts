import { Paper } from './types.js';

export function pickRandomStockWithCategoryVariety(papers: Paper[]): string | null {
  const stockToPapers: Record<string, Paper[]> = {};

  for (const paper of papers) {
    for (const stock of paper.stocks) {
      if (!stockToPapers[stock]) stockToPapers[stock] = [];
      stockToPapers[stock].push(paper);
    }
  }

  const eligible = Object.entries(stockToPapers)
    .filter(([_, paperList]) => {
      const uniquePaperIds = new Set(paperList.map(p => p.id));
      if (uniquePaperIds.size < 2) return false;

      const categorySet = new Set(paperList.flatMap(p => p.categories));
      return categorySet.size >= 2;
    })
    .map(([stock]) => stock);

  if (eligible.length === 0) return null;

  return eligible[Math.floor(Math.random() * eligible.length)];
}
