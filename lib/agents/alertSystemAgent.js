/**
 * Smart Alert System Agent
 */

import { BaseAgent } from '@/lib/agents/agentBase';
import { getPortfolioDataTool, getStockDataTool, executeAlertTool, checkMarketConditionsTool, calculateMetricsTool, getUserProfileTool } from '@/lib/tools';

export class AlertSystemAgent extends BaseAgent {
  constructor() {
    super({
      name: 'SmartAlertSystemAgent',
      systemPrompt: 'You are an autonomous alert monitoring system. Detect price alerts, portfolio alerts, risk alerts, and opportunities. Execute alerts with appropriate severity. Provide structured summaries.',
      tools: [getPortfolioDataTool, getStockDataTool, executeAlertTool, checkMarketConditionsTool, calculateMetricsTool, getUserProfileTool],
      streaming: false,
      maxSteps: 5
    });
  }

  async monitorAlerts(userId) {
    const message = `Monitor portfolio for alerts: price targets, volatility, drawdown, concentration, drift`;
    return this.execute(message, { userId });
  }

  async checkPriceAlerts(userId, stocks) {
    const message = `Check price alert triggers for: ${stocks.join(', ')}`;
    return this.execute(message, { userId });
  }

  async checkPortfolioAlerts(userId) {
    const message = `Check portfolio for: drawdown, volatility spike, allocation drift, concentration risks`;
    return this.execute(message, { userId });
  }

  async emergencyMarketAlert(userId, condition) {
    const message = `URGENT market condition: ${condition}. Assess impact and recommend actions.`;
    return this.execute(message, { userId });
  }
}

export const alertSystemAgent = new AlertSystemAgent();
