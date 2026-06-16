/**
 * Agent Finding Schema - Normalized output from all specialist agents
 */
export const AgentFindingSchema = {
  agentId: String,
  displayName: String,
  status: 'queued' | 'running' | 'success' | 'partial' | 'failed',
  recommendation: 'bullish' | 'neutral' | 'bearish',
  confidence: Number, // 0-100
  summary: String,
  keySignals: Array,
  risks: Array,
  opportunities: Array,
  evidence: Object,
  assumptions: Array,
  latencyMs: Number,
  errors: Array
};

/**
 * ActionCard Schema - Clear, actionable recommendation for a single stock
 * This is the primary output format for user-facing recommendations
 */
export const ActionCardSchema = {
  action: 'BUY' | 'SELL' | 'HOLD',
  confidence: Number, // 0-100
  ticker: String,
  stockName: String,
  currentPrice: Number,
  entryPrice: Number,
  targetPrice: Number,
  stopLoss: Number,
  expectedReturn: Number, // percentage
  maxRisk: Number, // percentage (negative)
  positionSizeAdvice: String, // e.g. "5-10% of portfolio"
  timeframe: String, // e.g. "2-4 weeks", "3-6 months"
  topReason: String, // 1 sentence
  bullPoints: Array, // max 3 strings
  bearPoints: Array, // max 3 strings
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  consensusScore: Number // 0-100
};

/**
 * Holdings Analysis Schema - Per-stock recommendation for existing portfolio
 */
export const HoldingsAnalysisSchema = {
  action: 'KEEP' | 'SELL' | 'ADD',
  ticker: String,
  currentPrice: Number,
  buyPrice: Number,
  profitPercent: Number,
  confidence: Number,
  reason: String,
  targetPrice: Number,
  stopLoss: Number
};

/**
 * Final Investment Decision from Master Agent
 */
export const DecisionArtifactSchema = {
  finalDecision: 'BUY' | 'HOLD' | 'SELL',
  decisionConfidence: Number, // 0-100
  consensusScore: Number, // agreement level 0-100
  executiveSummary: String,
  bullCase: String,
  bearCase: String,
  actionCard: ActionCardSchema, // NEW: structured action card
  targets: {
    entry: Number,
    target: Number,
    stop: Number,
    horizon: String
  },
  shortTermOutlook: String,
  longTermOutlook: String,
  investmentThesis: String,
  keyRisks: Array,
  agentBreakdown: Array,
  portfolioWarnings: Array, // NEW: portfolio-aware warnings
  timestamp: Date
};

export const RECOMMENDATION_TYPES = {
  BULLISH: 'bullish',
  NEUTRAL: 'neutral',
  BEARISH: 'bearish'
};

export const DECISION_TYPES = {
  BUY: 'BUY',
  HOLD: 'HOLD',
  SELL: 'SELL'
};

export const AGENT_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed'
};
