/**
 * Centralized Logging System for Porsa
 * Handles structured logging with multiple levels and contexts
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

class Logger {
  constructor(name = 'Porsa') {
    this.name = name;
    this.minLevel = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO : LOG_LEVELS.INFO;
    this.isDev = process.env.NODE_ENV === 'development';
    this.isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, context, message, data) {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level} ${this.name} ${contextStr}: ${message}${dataStr}`;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  log(level, message, context = '', data = null) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, context, message, data);

    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Send to external service if in production
    if (!this.isDev && (level === 'ERROR' || level === 'CRITICAL')) {
      this.sendToMonitoring(level, message, context, data);
    }
  }

  debug(message, context = '', data = null) {
    this.log('DEBUG', message, context, data);
  }

  info(message, context = '', data = null) {
    this.log('INFO', message, context, data);
  }

  warn(message, context = '', data = null) {
    this.log('WARN', message, context, data);
  }

  error(message, context = '', data = null) {
    this.log('ERROR', message, context, data);
  }

  critical(message, context = '', data = null) {
    this.log('CRITICAL', message, context, data);
  }

  // Send critical errors to monitoring service
  async sendToMonitoring(level, message, context, data) {
    try {
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            timestamp: this.formatTimestamp(),
            service: this.name,
            context,
            message,
            data,
            environment: process.env.VERCEL_ENV || 'local',
          }),
        }).catch(() => {}); // Silently fail to avoid cascading errors
      }
    } catch (err) {
      // Prevent logging errors from breaking the app
    }
  }

  createChild(childName) {
    const child = new Logger(`${this.name}/${childName}`);
    child.minLevel = this.minLevel;
    return child;
  }
}

export const mainLogger = new Logger('Porsa');
export const scraperLogger = mainLogger.createChild('Scraper');
export const agentLogger = mainLogger.createChild('Agents');
export const apiLogger = mainLogger.createChild('API');
export const kvLogger = mainLogger.createChild('KV');

export default Logger;
