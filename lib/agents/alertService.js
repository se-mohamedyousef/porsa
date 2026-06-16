/**
 * AlertService
 * Checks portfolio stocks against their stop-loss and target prices.
 * Called during price refresh cycle (every 5 minutes).
 */
export class AlertService {
  /**
   * Check all stocks for triggered alerts
   * @param {Array} stocks - Portfolio stocks with currentPrice, stopLoss, targetPrice
   * @returns {Array} Triggered alerts
   */
  static checkAlerts(stocks) {
    if (!stocks || !Array.isArray(stocks)) return [];

    const triggered = [];

    for (const stock of stocks) {
      const price = stock.currentPrice || 0;
      if (price <= 0) continue;

      // Stop-loss check
      if (stock.stopLoss && stock.stopLoss > 0 && price <= stock.stopLoss) {
        triggered.push({
          id: `alert-sl-${stock.symbol}-${Date.now()}`,
          type: 'stop-loss',
          severity: 'critical',
          symbol: stock.symbol,
          stockId: stock.id,
          message: `${stock.symbol} hit stop-loss at ${price.toFixed(2)} EGP (stop: ${stock.stopLoss.toFixed(2)})`,
          currentPrice: price,
          threshold: stock.stopLoss,
          triggeredAt: new Date().toISOString(),
          action: 'Consider selling to limit losses'
        });
      }

      // Target price check
      if (stock.targetPrice && stock.targetPrice > 0 && price >= stock.targetPrice) {
        triggered.push({
          id: `alert-tp-${stock.symbol}-${Date.now()}`,
          type: 'target-reached',
          severity: 'success',
          symbol: stock.symbol,
          stockId: stock.id,
          message: `${stock.symbol} reached target at ${price.toFixed(2)} EGP (target: ${stock.targetPrice.toFixed(2)})`,
          currentPrice: price,
          threshold: stock.targetPrice,
          triggeredAt: new Date().toISOString(),
          action: 'Consider taking profits'
        });
      }

      // Big daily loss alert (> 5% drop from buy price unrealized)
      const profitPct = stock.buyPrice > 0 ? ((price - stock.buyPrice) / stock.buyPrice) * 100 : 0;
      if (profitPct < -15) {
        triggered.push({
          id: `alert-loss-${stock.symbol}-${Date.now()}`,
          type: 'large-loss',
          severity: 'warning',
          symbol: stock.symbol,
          stockId: stock.id,
          message: `${stock.symbol} down ${Math.abs(profitPct).toFixed(1)}% from buy price`,
          currentPrice: price,
          threshold: stock.buyPrice,
          triggeredAt: new Date().toISOString(),
          action: 'Review position — consider setting stop-loss'
        });
      }

      // Big gain alert (> 30%)
      if (profitPct > 30 && (!stock.targetPrice || stock.targetPrice <= 0)) {
        triggered.push({
          id: `alert-gain-${stock.symbol}-${Date.now()}`,
          type: 'large-gain',
          severity: 'info',
          symbol: stock.symbol,
          stockId: stock.id,
          message: `${stock.symbol} up ${profitPct.toFixed(1)}% — no target price set`,
          currentPrice: price,
          threshold: stock.buyPrice,
          triggeredAt: new Date().toISOString(),
          action: 'Consider setting a target price to protect gains'
        });
      }
    }

    return triggered;
  }

  /**
   * Deduplicate alerts (prevent re-triggering same alert within cooldown)
   * @param {Array} newAlerts - Newly triggered alerts
   * @param {Array} existingAlerts - Previously triggered alerts
   * @param {number} cooldownMs - Minimum time between same alert (default 1hr)
   */
  static deduplicateAlerts(newAlerts, existingAlerts = [], cooldownMs = 3600000) {
    const now = Date.now();

    return newAlerts.filter(newAlert => {
      const existing = existingAlerts.find(ea =>
        ea.symbol === newAlert.symbol &&
        ea.type === newAlert.type &&
        (now - new Date(ea.triggeredAt).getTime()) < cooldownMs
      );
      return !existing;
    });
  }
}

export default AlertService;
