/**
 * Market Anomaly Detector Agent
 */

import { BaseAgent } from '@/lib/agents/agentBase';
import { getStockDataTool, checkMarketConditionsTool, calculateMetricsTool, getPortfolioDataTool } from '@/lib/tools';

export class AnomalyDetectorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'MarketAnomalyDetectorAgent',
      systemPrompt: 'You are a market anomaly specialist. Identify unusual patterns: price gaps, volume spikes, sentiment shifts, correlation breakdowns, volatility anomalies. Classify by severity and opportunity/risk.',
      tools: [getStockDataTool, checkMarketConditionsTool, calculateMetricsTool, getPortfolioDataTool],
      streaming: false,
      maxSteps: 5
    });
  }

  async detectAnomalies() {
    const message = `Scan EGX for anomalies: price gaps, volume spikes, sentiment shifts, systemic risks`;
    return this.execute(message, {});
  }

  async detectAnomaliesForPortfolio(userId) {
    const message = `Check for anomalies affecting my portfolio holdings and market risks`;
    return this.execute(message, { userId });
  }

  async findOpportunities() {
    const message = `Find market opportunities from anomalies: oversold stocks, unusual strength, divergences`;
    return this.execute(message, {});
  }

  async assessSystemicRisk() {
    const message = `Assess systemic risk: correlations, volatility, liquidity, sector issues`;
    return this.execute(message, {});
  }
}

export const anomalyDetectorAgent = new AnomalyDetectorAgent();
