/**
 * Portfolio Analysis Agent
 * Analyzes portfolio holdings, detects drift, identifies risks, suggests rebalancing
 */

import { BaseAgent } from '@/lib/agents/agentBase';
import {
  getPortfolioDataTool,
  getStockDataTool,
  calculateMetricsTool,
  checkMarketConditionsTool
} from '@/lib/tools';

export class PortfolioAgent extends BaseAgent {
  constructor() {
    super({
      name: 'PortfolioAnalysisAgent',
      systemPrompt: `You are an expert portfolio analyst specializing in EGX stocks. Your mission is to:

1. **Analyze Current Portfolio**: Review holdings, allocation percentages, and performance metrics
2. **Detect Drift**: Compare actual allocation to target allocation (if available)
3. **Identify Risks**:
   - Concentration risk (over-allocation to single stocks/sectors)
   - Correlation issues (holdings move together, reducing diversification)
   - Liquidity concerns (if holdings are illiquid)
4. **Suggest Rebalancing**: Provide specific buy/sell recommendations to optimize the portfolio

**Key Metrics to Calculate**:
- Portfolio Sharpe Ratio
- Overall volatility
- Sector allocation
- Stock correlation matrix

**Output Format**:
Provide a comprehensive portfolio analysis with:
- Current allocation breakdown
- Performance metrics (Sharpe, volatility, gains)
- Risk assessment (concentration, correlation, liquidity)
- Rebalancing recommendations (specific stocks to buy/sell with percentages)
- Expected impact of recommendations

Be data-driven and quantitative. Always use the provided tools to fetch current data.`,
      tools: [
        getPortfolioDataTool,
        getStockDataTool,
        calculateMetricsTool,
        checkMarketConditionsTool
      ],
      streaming: true,
      maxSteps: 5
    });
  }

  async analyzePortfolio(userId) {
    const message = `Please analyze my portfolio completely. I need to understand:
1. Current allocation and performance
2. Risk metrics (Sharpe ratio, volatility, drawdown risk)
3. Any concentration or correlation issues
4. Specific rebalancing recommendations`;

    return this.execute(message, { userId });
  }

  async detectDrift(userId, targetAllocation) {
    const message = `My portfolio should be allocated as: ${JSON.stringify(targetAllocation)}.
Please check if there's drift from this target and suggest corrective rebalancing trades.`;

    return this.execute(message, { userId });
  }

  async assessConcentrationRisk(userId) {
    const message = `Assess my portfolio for concentration risk. Are there any sectors or stocks I'm over-exposed to?
Suggest diversification improvements.`;

    return this.execute(message, { userId });
  }
}

// Export singleton instance
export const portfolioAgent = new PortfolioAgent();
