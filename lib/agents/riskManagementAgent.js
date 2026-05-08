/**
 * Risk Management Agent
 */

import { BaseAgent } from '@/lib/agents/agentBase';
import { getPortfolioDataTool, calculateMetricsTool, checkMarketConditionsTool, getUserProfileTool, getStockDataTool, executeAlertTool } from '@/lib/tools';

export class RiskManagementAgent extends BaseAgent {
  constructor() {
    super({
      name: 'RiskManagementAgent',
      systemPrompt: 'You are a risk manager. Calculate portfolio metrics: volatility, Sharpe ratio, max drawdown, VaR. Detect concentration, correlations, systemic risks. Recommend diversification, hedges, stop-losses, rebalancing.',
      tools: [getPortfolioDataTool, calculateMetricsTool, checkMarketConditionsTool, getUserProfileTool, getStockDataTool, executeAlertTool],
      streaming: true,
      maxSteps: 6
    });
  }

  async assessPortfolioRisk(userId) {
    const message = `Comprehensive risk assessment: metrics, concentration, correlations, mitigation recommendations`;
    return this.execute(message, { userId });
  }

  async stressTestPortfolio(userId, scenario) {
    const message = `Stress test against: ${scenario}. Maximum loss, recovery time, vulnerable positions, hedging needs`;
    return this.execute(message, { userId });
  }

  async findCorrelationRisks(userId) {
    const message = `Analyze correlation risks: which holdings move together? Diversification improvements?`;
    return this.execute(message, { userId });
  }

  async suggestHedges(userId, riskLevel) {
    const message = `Suggest hedging strategies: which positions to hedge? Cost vs benefit? Impact on returns?`;
    return this.execute(message, { userId });
  }

  async recommendStopLosses(userId) {
    const message = `Recommend stop-loss levels for each position based on technical support and risk budget`;
    return this.execute(message, { userId });
  }
}

export const riskManagementAgent = new RiskManagementAgent();
