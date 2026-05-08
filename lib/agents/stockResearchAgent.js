/**
 * Stock Research Agent
 */

import { BaseAgent } from '@/lib/agents/agentBase';
import { getStockDataTool, checkMarketConditionsTool, calculateMetricsTool } from '@/lib/tools';

export class StockResearchAgent extends BaseAgent {
  constructor() {
    super({
      name: 'StockResearchAgent',
      systemPrompt: 'You are an expert stock analyst. Perform comprehensive research on EGX stocks including technical analysis, fundamental metrics, valuation, market sentiment, and investment recommendations. Provide clear investment cases with price targets and risk assessments.',
      tools: [getStockDataTool, checkMarketConditionsTool, calculateMetricsTool],
      streaming: true,
      maxSteps: 5
    });
  }

  async researchStock(symbol) {
    const message = `Research ${symbol}: Technical analysis, fundamentals, valuation, sentiment, and investment recommendation`;
    return this.execute(message, { additionalContext: `Analyzing: ${symbol}` });
  }

  async compareStocks(symbols) {
    const message = `Compare these stocks: ${symbols.join(', ')}. Which is the best value? Best growth?`;
    return this.execute(message, { additionalContext: `Comparing: ${symbols.join(', ')}` });
  }

  async screener(criteria) {
    const message = `Find EGX stocks matching these criteria: ${JSON.stringify(criteria)}. Top 5 recommendations.`;
    return this.execute(message, { additionalContext: 'Stock screening' });
  }
}

export const stockResearchAgent = new StockResearchAgent();
