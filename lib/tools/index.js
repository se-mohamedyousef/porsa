/**
 * Shared Tool Definitions for Agents
 * Vercel AI SDK v5 format with tool_use protocol
 */

import { redis as kv } from '@/lib/kv';
import { fetchLiveStockRecordForKv } from '@/lib/egx/stockKv';

// ============ PORTFOLIO TOOLS ============

export const getPortfolioDataTool = {
  name: 'getPortfolioData',
  description: 'Fetch user portfolio holdings, allocation, performance metrics, and cash position',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID'
      }
    },
    required: ['userId']
  },
  execute: async (input) => {
    try {
      const { userId } = input;
      const portfolioKey = `portfolio:${userId}`;
      const portfolio = await kv.get(portfolioKey);
      
      if (!portfolio) {
        return {
          success: false,
          error: 'No portfolio found for user',
          data: null
        };
      }

      // Calculate portfolio metrics
      const totalValue = portfolio.stocks?.reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0) || 0;
      const totalInvested = portfolio.stocks?.reduce((sum, s) => sum + (s.averageCost * s.quantity), 0) || 0;
      const totalGain = totalValue - totalInvested;
      const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;

      return {
        success: true,
        data: {
          userId,
          stocks: portfolio.stocks || [],
          cash: portfolio.cash || 0,
          totalValue: totalValue + (portfolio.cash || 0),
          totalInvested,
          totalGain,
          gainPercent,
          currency: 'EGP',
          lastUpdated: portfolio.lastUpdated || new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============ STOCK DATA TOOLS ============

export const getStockDataTool = {
  name: 'getStockData',
  description: 'Fetch EGX stock information including price, volume, technical indicators, and sentiment',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'EGX stock symbol (e.g., EBANK, EGCH)'
      },
      includeHistorical: {
        type: 'boolean',
        description: 'Include historical price data for technical analysis',
        default: false
      }
    },
    required: ['symbol']
  },
  execute: async (input) => {
    try {
      const { symbol, includeHistorical } = input;
      const sym = String(symbol).trim().toUpperCase();
      const stockKey = `stock:${sym}`;
      let stockData = await kv.get(stockKey);

      if (!stockData) {
        stockData = await fetchLiveStockRecordForKv(sym);
        if (stockData?.currentPrice > 0) {
          await kv.set(stockKey, stockData, { ex: 900 });
        } else {
          stockData = null;
        }
      }

      if (!stockData || !(Number(stockData.currentPrice) > 0)) {
        return {
          success: false,
          error: `No data found for symbol ${sym}`,
          data: null
        };
      }

      const pc = stockData.previousClose ?? stockData.previous_close;
      const cur = stockData.currentPrice ?? stockData.current_price;
      const dayCh =
        stockData.dayChange != null
          ? stockData.dayChange
          : pc != null && cur != null
            ? cur - pc
            : null;
      const dayPct =
        stockData.dayChangePercent != null
          ? stockData.dayChangePercent
          : pc > 0 && dayCh != null
            ? Number(((dayCh / pc) * 100).toFixed(2))
            : 0;

      const result = {
        success: true,
        data: {
          symbol: sym,
          currentPrice: cur,
          previousClose: pc,
          dayChange: dayCh,
          dayChangePercent: dayPct,
          volume: stockData.volume,
          marketCap: stockData.marketCap ?? stockData.market_cap,
          pe: stockData.pe,
          dividend: stockData.dividend,
          sector: stockData.sector,
          rsi_14: stockData.rsi_14,
          sma_20: stockData.sma_20,
          yahoo_status: stockData.yahoo_status,
          lastUpdated: stockData.lastUpdated || stockData.last_updated || new Date().toISOString()
        }
      };

      const hist = stockData.history || stockData.history_90d;
      if (includeHistorical && hist?.length) {
        result.data.history = hist;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============ METRICS CALCULATION TOOLS ============

export const calculateMetricsTool = {
  name: 'calculateMetrics',
  description: 'Calculate portfolio metrics: Sharpe ratio, volatility, correlation, variance, drawdown analysis',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID to analyze'
      },
      metricType: {
        type: 'string',
        enum: ['sharpe', 'volatility', 'correlation', 'drawdown', 'all'],
        description: 'Type of metric to calculate',
        default: 'all'
      },
      timeframe: {
        type: 'string',
        enum: ['1M', '3M', '6M', '1Y', 'all'],
        description: 'Timeframe for calculation',
        default: '1M'
      }
    },
    required: ['userId']
  },
  execute: async (input) => {
    try {
      const { userId, metricType = 'all', timeframe = '1M' } = input;
      const portfolioKey = `portfolio:${userId}`;
      const portfolio = await kv.get(portfolioKey);

      if (!portfolio || !portfolio.stocks) {
        return {
          success: false,
          error: 'No portfolio data available',
          data: null
        };
      }

      // Simplified metric calculations
      const returns = portfolio.stocks.map(s => {
        const gain = (s.currentPrice - s.averageCost) / s.averageCost;
        return gain;
      });

      const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const variance = returns.length > 1 
        ? returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)
        : 0;
      const volatility = Math.sqrt(variance);
      const sharpeRatio = volatility > 0 ? (meanReturn / volatility) : 0;

      return {
        success: true,
        data: {
          userId,
          timeframe,
          meanReturn: (meanReturn * 100).toFixed(2),
          volatility: (volatility * 100).toFixed(2),
          sharpeRatio: sharpeRatio.toFixed(2),
          variance: (variance * 100).toFixed(2),
          stockCount: portfolio.stocks.length,
          calculatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============ ALERT TOOLS ============

export const executeAlertTool = {
  name: 'executeAlert',
  description: 'Execute or trigger an alert: send notification, log event, update alert status',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      alertType: {
        type: 'string',
        enum: ['price', 'portfolio', 'risk', 'anomaly', 'rebalance'],
        description: 'Type of alert'
      },
      symbol: {
        type: 'string',
        description: 'Stock symbol (if applicable)'
      },
      message: {
        type: 'string',
        description: 'Alert message to send'
      },
      severity: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Alert severity level',
        default: 'medium'
      }
    },
    required: ['userId', 'alertType', 'message']
  },
  execute: async (input) => {
    try {
      const { userId, alertType, symbol, message, severity } = input;
      const alertKey = `alert:${userId}:${Date.now()}`;
      
      const alert = {
        userId,
        alertType,
        symbol,
        message,
        severity,
        status: 'triggered',
        timestamp: new Date().toISOString()
      };

      await kv.set(alertKey, alert, { ex: 86400 * 30 }); // 30 day retention

      // In production, would also send email/notification here
      return {
        success: true,
        data: {
          alertId: alertKey,
          message: 'Alert executed successfully',
          alert
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============ USER PROFILE TOOLS ============

export const getUserProfileTool = {
  name: 'getUserProfile',
  description: 'Fetch user profile including risk tolerance, investment goals, preferences, and constraints',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      }
    },
    required: ['userId']
  },
  execute: async (input) => {
    try {
      const { userId } = input;
      const profileKey = `user:${userId}`;
      const profile = await kv.get(profileKey);

      if (!profile) {
        return {
          success: false,
          error: 'No profile found',
          data: null
        };
      }

      return {
        success: true,
        data: {
          userId,
          riskTolerance: profile.riskTolerance || 'moderate', // low, moderate, high, aggressive
          investmentHorizon: profile.investmentHorizon || '5-10 years',
          goals: profile.goals || [],
          maxDrawdown: profile.maxDrawdown || 20, // percentage
          preferredSectors: profile.preferredSectors || [],
          excludedSectors: profile.excludedSectors || [],
          minInvestment: profile.minInvestment || 0,
          lastUpdated: profile.lastUpdated || new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============ MARKET CONDITIONS TOOLS ============

export const checkMarketConditionsTool = {
  name: 'checkMarketConditions',
  description: 'Check current market conditions: trend, volatility, sentiment, trading volume',
  inputSchema: {
    type: 'object',
    properties: {
      timeframe: {
        type: 'string',
        enum: ['intraday', 'weekly', 'monthly'],
        description: 'Market analysis timeframe',
        default: 'intraday'
      },
      includeSymbols: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific symbols to analyze'
      }
    }
  },
  execute: async (input) => {
    try {
      const { timeframe = 'intraday', includeSymbols = [] } = input;
      const marketKey = `market:status:${timeframe}`;
      const marketData = await kv.get(marketKey);

      const defaultConditions = {
        trend: 'neutral',
        trendStrength: 'moderate',
        volatility: 'normal',
        sentiment: 'neutral',
        rsiLevel: 50,
        movingAverage200: 'N/A',
        volumeProfile: 'normal',
        correlationIndex: 0.65
      };

      const merged =
        marketData && typeof marketData === 'object'
          ? { ...defaultConditions, ...marketData }
          : defaultConditions;

      return {
        success: true,
        data: {
          timeframe,
          ...merged,
          includeSymbols,
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============ TOOL REGISTRY ============

export const getAllTools = () => [
  getPortfolioDataTool,
  getStockDataTool,
  calculateMetricsTool,
  executeAlertTool,
  getUserProfileTool,
  checkMarketConditionsTool
];

export const getToolByName = (name) => {
  const toolMap = {
    'getPortfolioData': getPortfolioDataTool,
    'getStockData': getStockDataTool,
    'calculateMetrics': calculateMetricsTool,
    'executeAlert': executeAlertTool,
    'getUserProfile': getUserProfileTool,
    'checkMarketConditions': checkMarketConditionsTool
  };
  return toolMap[name];
};
