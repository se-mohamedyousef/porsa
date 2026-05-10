/**
 * Enhanced Base Agent Framework with HuggingFace/Groq
 * Handles tool invocation, error handling, and comprehensive logging
 */

import { getToolByName, getAllTools } from '@/lib/tools';
import { agentLogger } from '@/lib/logger';
import { CircuitBreaker, retryWithBackoff, sleep } from '@/lib/scraper/resilience';

// Circuit breaker for LLM API
const llmCircuitBreaker = new CircuitBreaker('HuggingFaceAPI', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 300000, // 5 minutes
});

/**
 * Enhanced Base Agent Class
 * Provides common functionality for all specialized agents with error handling and logging
 */
export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'UnnamedAgent';
    this.systemPrompt = config.systemPrompt || '';
    this.tools = config.tools || getAllTools();
    this.maxSteps = config.maxSteps || 10;
    this.streaming = config.streaming !== false; // default true
    this.timeout = config.timeout || 30000; // 30s default timeout
    this.logger = agentLogger.createChild(this.name);
  }

  /**
   * Format tools for prompt-based tool calling
   */
  formatToolsForPrompt() {
    let toolDescriptions = "Available tools:\n";
    this.tools.forEach(tool => {
      toolDescriptions += `\n- ${tool.name}: ${tool.description}\n`;
      const props = tool.inputSchema?.properties || {};
      toolDescriptions += `  Parameters: ${JSON.stringify(props)}\n`;
    });
    return toolDescriptions;
  }

  /**
   * Call HuggingFace Groq API with circuit breaker and retry logic
   */
  async callHuggingFace(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      if (!process.env.HF_TOKEN) {
        throw new Error("HF_TOKEN not configured in environment");
      }

      return await llmCircuitBreaker.execute(
        async () => {
          return await retryWithBackoff(
            async () => {
              const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.HF_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "openai/gpt-oss-20b:fireworks-ai",
                  messages: [{ role: "user", content: prompt.substring(0, 4000) }], // limit prompt
                  stream: false,
                  max_tokens: 1024,
                  temperature: 0.7,
                }),
                signal: controller.signal,
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
              }

              const data = await response.json();
              const content = data.choices?.[0]?.message?.content || "";

              if (!content) {
                throw new Error("Empty response from API");
              }

              return content;
            },
            {
              maxRetries: 2,
              initialDelayMs: 500,
              maxDelayMs: 3000,
              context: `${this.name}-LLMCall`,
            }
          );
        },
        async () => {
          // Fallback: Return a safe error message
          throw new Error("LLM API circuit breaker open");
        }
      );
    } catch (error) {
      this.logger.error("LLM API call failed", "callHuggingFace", {
        error: error.message,
        circuitBreakerStatus: llmCircuitBreaker.getStatus(),
      });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse tool calls from LLM response - more robust parsing
   */
  parseToolCalls(text) {
    const toolCalls = [];
    if (!text || typeof text !== 'string') return toolCalls;

    // Multiple patterns to match tool calls
    const patterns = [
      /TOOL:\s*(\w+)\s*[\s\S]*?PARAMS:\s*(\{[\s\S]*?\})/g, // Standard pattern
      /tool:\s*(\w+)\s*[\s\S]*?params:\s*(\{[\s\S]*?\})/gi, // Case-insensitive
      /```json[\s\S]*?"tool":\s*"(\w+)"[\s\S]*?"params":\s*(\{[\s\S]*?\})[\s\S]*?```/g, // JSON block
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          const toolName = match[1].trim();
          let jsonStr = match[2];

          // Find matching closing brace
          let braceCount = 0;
          let endIndex = 0;
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++;
            if (jsonStr[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }

          jsonStr = jsonStr.substring(0, endIndex);
          const params = JSON.parse(jsonStr);

          if (!toolCalls.find(tc => tc.toolName === toolName && JSON.stringify(tc.args) === JSON.stringify(params))) {
            toolCalls.push({ toolName, args: params });
          }
        } catch (e) {
          this.logger.debug("Failed to parse tool call", "parseToolCalls", {
            error: e.message,
            snippet: match[0].substring(0, 100),
          });
        }
      }
    }

    return toolCalls;
  }

  /**
   * Execute a tool with error handling
   */
  async executeTool(toolName, args) {
    try {
      const tool = getToolByName(toolName);

      if (!tool) {
        return {
          success: false,
          error: `Tool not found: ${toolName}`,
          toolName,
        };
      }

      this.logger.debug(`Executing tool: ${toolName}`, "executeTool", { args });

      const result = await Promise.race([
        tool.execute(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool timeout: ${toolName}`)), 15000)
        ),
      ]);

      this.logger.debug(`Tool executed successfully: ${toolName}`, "executeTool");
      return {
        success: true,
        toolName,
        result,
      };
    } catch (error) {
      this.logger.warn(`Tool execution failed: ${toolName}`, "executeTool", {
        error: error.message,
        args,
      });

      return {
        success: false,
        error: error.message,
        toolName,
      };
    }
  }

  /**
   * Non-streaming agent loop - execute and return final result
   */
  async run(userMessage, context = {}) {
    const startTime = Date.now();
    let step = 0;

    try {
      this.logger.info("Agent execution started", "run", { userId: context.userId });

      const toolDescriptions = this.formatToolsForPrompt();
      const systemWithTools =
        this.systemPrompt +
        "\n\n" +
        toolDescriptions +
        "\n\nWhen you need to use a tool, respond with: TOOL: tool_name with PARAMS: {param1: value1, param2: value2}\n" +
        "After getting tool results, continue your analysis." +
        (context.userId ? `\n\nUser ID: ${context.userId}` : "") +
        (context.additionalContext ? `\n\n${context.additionalContext}` : "");

      const conversationHistory = [{ role: "user", content: userMessage.substring(0, 2000) }];
      let finalResponse = "";

      while (step < this.maxSteps) {
        const conversationText = conversationHistory
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n\n");

        const fullPrompt = `${systemWithTools}\n\n${conversationText}\n\nAssistant:`;

        try {
          const response = await this.callHuggingFace(fullPrompt);
          finalResponse = response;

          const toolCalls = this.parseToolCalls(response);

          if (toolCalls.length > 0) {
            conversationHistory.push({ role: "assistant", content: response });
            let toolResults = "Tool Results:\n";

            for (const toolCall of toolCalls) {
              const toolResult = await this.executeTool(toolCall.toolName, toolCall.args);
              if (toolResult.success) {
                toolResults += `- ${toolCall.toolName}: ${JSON.stringify(toolResult.result).substring(0, 500)}\n`;
              } else {
                toolResults += `- ${toolCall.toolName}: Error - ${toolResult.error}\n`;
              }
            }

            conversationHistory.push({ role: "user", content: toolResults });
            step++;
          } else {
            // No tool calls, we're done
            conversationHistory.push({ role: "assistant", content: response });
            break;
          }
        } catch (error) {
          this.logger.warn("Step failed, attempting recovery", "run", {
            step,
            error: error.message,
          });

          if (step >= this.maxSteps - 1) {
            throw error;
          }
          await sleep(1000); // Backoff before next attempt
        }
      }

      const executionTime = Date.now() - startTime;
      this.logger.info("Agent execution completed", "run", {
        userId: context.userId,
        success: true,
        steps: step,
        executionTime,
      });

      return {
        success: true,
        message: finalResponse,
        toolCallCount: step,
        finishReason: step >= this.maxSteps ? "maxStepsReached" : "stop",
        usage: { totalTokens: 0 },
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error("Agent execution failed", "run", {
        error: error.message,
        userId: context.userId,
        step,
        executionTime,
      });

      return {
        success: false,
        error: error.message,
        message: `Failed to process request: ${error.message}. Please try again.`,
        toolCallCount: step,
        executionTime,
      };
    }
  }
}

/**
 * Agent Factory - creates specialized agent instances
 */
export class AgentFactory {
  static createPortfolioAgent() {
    return new BaseAgent({
      name: 'PortfolioAnalysisAgent',
      systemPrompt: `You are an expert portfolio analyst. Analyze portfolios to:
- Detect drift from target allocation
- Identify concentration risks
- Calculate correlation issues
- Suggest rebalancing actions

Always provide structured recommendations with reasoning.`,
      streaming: true
    });
  }

  static createStockResearchAgent() {
    return new BaseAgent({
      name: 'StockResearchAgent',
      systemPrompt: `You are a fundamental and technical stock analyst for Egyptian (EGX) listings. For any stock query:
- Call getStockData with symbol in UPPERCASE (e.g. COMI, EBANK) and includeHistorical: true when the user asks for charts, trends, or technicals.
- Use checkMarketConditions for broader EGX context when relevant.
- Combine tool data with clear reasoning; if data is missing, say so.

Be thorough; do not invent prices.`,
      streaming: true
    });
  }

  static createAlertSystemAgent() {
    return new BaseAgent({
      name: 'SmartAlertSystemAgent',
      systemPrompt: `You are an autonomous alert monitoring system. Your job:
- Monitor portfolio and market conditions
- Detect alert triggers (price, portfolio, risk events)
- Execute appropriate alerts
- Suggest follow-up actions

Be precise about thresholds and severity levels.`,
      streaming: false
    });
  }

  static createAdvisorAgent() {
    return new BaseAgent({
      name: 'InvestmentAdvisorAgent',
      systemPrompt: `You are a personalized investment advisor. Your role:
- Understand user risk profile, goals, constraints
- Analyze portfolio and market conditions
- Provide ranked investment recommendations
- Explain rationale for each recommendation

Consider user preferences, constraints, and market outlook.`,
      streaming: true
    });
  }

  static createAnomalyDetectorAgent() {
    return new BaseAgent({
      name: 'MarketAnomalyDetectorAgent',
      systemPrompt: `You are a market anomaly detection specialist. Your role:
- Monitor stock prices, volumes, and sentiment
- Detect unusual patterns: gaps, volume spikes, sentiment shifts
- Flag opportunities and risks
- Assess anomaly severity and impact

Be data-driven and quantitative in your analysis.`,
      streaming: false
    });
  }

  static createRiskManagementAgent() {
    return new BaseAgent({
      name: 'RiskManagementAgent',
      systemPrompt: `You are a quantitative risk manager. Your responsibilities:
- Calculate portfolio risk metrics (volatility, Sharpe, VaR)
- Detect correlation clustering and systemic risk
- Stress test portfolio against scenarios
- Recommend hedges, stop-losses, and diversification

Prioritize risk-aware recommendations.`,
      streaming: true
    });
  }
}
