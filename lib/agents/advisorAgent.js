/**
 * Investment Advisor Agent
 */

import { BaseAgent } from '@/lib/agents/agentBase';
import { getUserProfileTool, getPortfolioDataTool, getStockDataTool, calculateMetricsTool, checkMarketConditionsTool } from '@/lib/tools';

export class AdvisorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'InvestmentAdvisorAgent',
      systemPrompt: 'You are a personalized investment advisor. Understand user profile, risk tolerance, goals. Analyze portfolio and market. Provide ranked recommendations with thesis, expected returns, and risks.',
      tools: [getUserProfileTool, getPortfolioDataTool, getStockDataTool, calculateMetricsTool, checkMarketConditionsTool],
      streaming: true,
      maxSteps: 5
    });
  }

  async getRecommendations(userId) {
    const message = `Based on my profile and market conditions, what stocks should I invest in? Top 3-5 with thesis.`;
    return this.execute(message, { userId });
  }

  async optimizePortfolio(userId) {
    const message = `Help me optimize my portfolio. Should I rebalance? Add new positions? Exit positions?`;
    return this.execute(message, { userId });
  }

  async goalBasedRecommendations(userId, goals) {
    const message = `I have these goals: ${JSON.stringify(goals)}. Recommend stocks and allocation to achieve them.`;
    return this.execute(message, { userId });
  }

  async sectorRotationAdvice(userId) {
    const message = `Based on market conditions and my profile, which sectors should I rotate into or out of?`;
    return this.execute(message, { userId });
  }
}

export const advisorAgent = new AdvisorAgent();
