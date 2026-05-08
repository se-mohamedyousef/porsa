/**
 * Base Agent Framework with HuggingFace/Groq
 * Handles tool invocation and response formatting
 */

import { getToolByName, getAllTools } from '@/lib/tools';

/**
 * Base Agent Class
 * Provides common functionality for all specialized agents
 */
export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'UnnamedAgent';
    this.systemPrompt = config.systemPrompt || '';
    this.tools = config.tools || getAllTools();
    this.maxSteps = config.maxSteps || 10;
    this.streaming = config.streaming !== false; // default true
  }

  /**
   * Format tools for prompt-based tool calling
   */
  formatToolsForPrompt() {
    let toolDescriptions = "Available tools:\n";
    this.tools.forEach(tool => {
      toolDescriptions += `\n- ${tool.name}: ${tool.description}\n`;
      toolDescriptions += `  Parameters: ${JSON.stringify(tool.inputSchema?.properties || {})}\n`;
    });
    return toolDescriptions;
  }

  /**
   * Call HuggingFace Groq API directly
   */
  async callHuggingFace(prompt) {
    try {
      if (!process.env.HF_TOKEN) {
        throw new Error("HF_TOKEN not configured");
      }

      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:fireworks-ai",
          messages: [{ role: "user", content: prompt }],
          stream: false,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error.substring(0, 100)}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("HuggingFace API error:", error);
      throw error;
    }
  }

  /**
   * Parse tool calls from LLM response
   */
  parseToolCalls(text) {
    const toolCalls = [];
    // Match pattern: TOOL: tool_name ... PARAMS: {...}
    // Allow for newlines and whitespace between TOOL and PARAMS
    const pattern = /TOOL:\s*(\w+)\s*[\s\S]*?PARAMS:\s*(\{[\s\S]*?\})/g;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      try {
        const toolName = match[1];
        // Find the matching closing brace for the JSON object
        let jsonStr = match[2];
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
        toolCalls.push({ toolName, args: params });
      } catch (e) {
        console.error("Failed to parse tool call:", match[0].substring(0, 50));
      }
    }
    return toolCalls;
  }

  /**
   * Non-streaming agent loop - execute and return final result
   */
  async run(userMessage, context = {}) {
    try {
      const toolDescriptions = this.formatToolsForPrompt();
      const systemWithTools = this.systemPrompt + "\n\n" + toolDescriptions + 
        "\n\nWhen you need to use a tool, respond with: TOOL: tool_name with PARAMS: {param1: value1, param2: value2}\n" +
        "After getting tool results, continue your analysis." +
        (context.userId ? `\n\nUser ID: ${context.userId}` : '') +
        (context.additionalContext ? `\n\n${context.additionalContext}` : '');

      let conversationHistory = [];
      let step = 0;
      let finalResponse = '';

      // Agentic loop
      while (step < this.maxSteps) {
        // Build conversation prompt
        let conversationText = conversationHistory
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n\n');

        if (step === 0) {
          conversationText = `User: ${userMessage}`;
        }

        const fullPrompt = `${systemWithTools}\n\n${conversationText}\n\nAssistant:`;

        // Call HuggingFace
        const response = await this.callHuggingFace(fullPrompt);
        finalResponse = response;

        conversationHistory.push({ role: 'user', content: step === 0 ? userMessage : conversationHistory[conversationHistory.length - 1].content });
        conversationHistory.push({ role: 'assistant', content: response });

        // Check for tool calls
        const toolCalls = this.parseToolCalls(response);

        if (toolCalls.length > 0) {
          let toolResults = 'Tool Results:\n';
          
          for (const toolCall of toolCalls) {
            const tool = getToolByName(toolCall.toolName);
            if (tool) {
              try {
                const result = await tool.execute(toolCall.args);
                toolResults += `- ${toolCall.toolName}: ${JSON.stringify(result)}\n`;
              } catch (e) {
                toolResults += `- ${toolCall.toolName}: Error - ${e.message}\n`;
              }
            }
          }

          // Add tool results to conversation
          conversationHistory.push({
            role: 'user',
            content: toolResults
          });

          step++;
        } else {
          // No tool calls, exit loop
          break;
        }
      }

      return {
        success: true,
        message: finalResponse,
        toolCallCount: step,
        finishReason: 'stop',
        usage: { totalTokens: 0 }
      };
    } catch (error) {
      console.error("Agent error:", error);
      return {
        success: false,
        error: error.message,
        message: null
      };
    }
  }

  /**
   * Streaming agent loop - stream results in real-time
   */
  async runStream(userMessage, context = {}) {
    try {
      const toolDescriptions = this.formatToolsForPrompt();
      const systemWithTools = this.systemPrompt + "\n\n" + toolDescriptions + 
        "\n\nWhen you need to use a tool, respond with: TOOL: tool_name with PARAMS: {param1: value1, param2: value2}\n" +
        "After getting tool results, continue your analysis." +
        (context.userId ? `\n\nUser ID: ${context.userId}` : '') +
        (context.additionalContext ? `\n\n${context.additionalContext}` : '');

      let conversationHistory = [];
      let step = 0;
      let finalText = '';

      // Agentic loop with streaming
      while (step < this.maxSteps) {
        let conversationText = conversationHistory
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n\n');

        if (step === 0) {
          conversationText = `User: ${userMessage}`;
        }

        const fullPrompt = `${systemWithTools}\n\n${conversationText}\n\nAssistant:`;
        const response = await this.callHuggingFace(fullPrompt);
        finalText += response;

        conversationHistory.push({ role: 'user', content: step === 0 ? userMessage : conversationHistory[conversationHistory.length - 1].content });
        conversationHistory.push({ role: 'assistant', content: response });

        // Check for tool calls
        const toolCalls = this.parseToolCalls(response);

        if (toolCalls.length > 0) {
          let toolResults = 'Tool Results:\n';
          
          for (const toolCall of toolCalls) {
            const tool = getToolByName(toolCall.toolName);
            if (tool) {
              try {
                const result = await tool.execute(toolCall.args);
                toolResults += `- ${toolCall.toolName}: ${JSON.stringify(result)}\n`;
              } catch (e) {
                toolResults += `- ${toolCall.toolName}: Error - ${e.message}\n`;
              }
            }
          }

          conversationHistory.push({
            role: 'user',
            content: toolResults
          });

          step++;
        } else {
          break;
        }
      }

      return {
        success: true,
        message: finalText,
        toolCallCount: step
      };
    } catch (error) {
      console.error("Agent error:", error);
      return {
        success: false,
        error: error.message,
        message: null
      };
    }
  }

  /**
   * Execute agent with automatic streaming/non-streaming selection
   */
  async execute(userMessage, context = {}) {
    if (this.streaming) {
      return this.runStream(userMessage, context);
    } else {
      return this.run(userMessage, context);
    }
  }

  /**
   * Parse structured output from agent response
   */
  parseStructuredOutput(responseText, format = 'json') {
    try {
      if (format === 'json') {
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to parse structured output:', error);
      return null;
    }
  }

  /**
   * Validate response quality
   */
  validateResponse(response) {
    return response && response.success && response.message && response.message.length > 10;
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
      systemPrompt: `You are a fundamental and technical stock analyst. For any stock query:
- Retrieve current price, fundamentals (P/E, dividend)
- Check market conditions and sentiment
- Perform technical analysis
- Provide investment case with pros/cons

Be thorough and cite data sources.`,
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
