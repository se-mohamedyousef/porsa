#!/bin/bash

# EGX Scraper Monitor
# Usage: bash scraper_monitor.sh

WORKSPACE="/Users/mohamedyoussef/Desktop/porsa"
LOG_FILE="/tmp/egx_scraper.log"
STOCKS_FILE="$WORKSPACE/egx_stocks_full.json"
RECS_FILE="$WORKSPACE/egx_recommendations.json"

echo "🇪🇬 EGX Scraper Monitoring Dashboard"
echo "===================================================="
echo ""

# Check if cron is running
echo "📅 Cron Job Status:"
if crontab -l | grep -q "egx_stock_analyzer.py"; then
    echo "✅ Cron job is ACTIVE (every 1 minute)"
    crontab -l | grep egx_stock_analyzer.py
else
    echo "❌ Cron job is NOT active"
fi
echo ""

# Last execution time
echo "⏱️  Last Execution:"
if [ -f "$LOG_FILE" ]; then
    tail -1 "$LOG_FILE"
    echo "Log location: $LOG_FILE"
else
    echo "No log file yet (waiting for first run)"
fi
echo ""

# Stocks data status
echo "📊 Stocks Data Status:"
if [ -f "$STOCKS_FILE" ]; then
    count=$(jq '.count // (.stocks | length)' "$STOCKS_FILE" 2>/dev/null)
    timestamp=$(jq -r '.timestamp' "$STOCKS_FILE" 2>/dev/null)
    size=$(du -h "$STOCKS_FILE" | cut -f1)
    echo "✅ File exists: $STOCKS_FILE"
    echo "   Count: $count stocks"
    echo "   Size: $size"
    echo "   Updated: $timestamp"
else
    echo "⏳ File not yet created"
fi
echo ""

# Recommendations data status
echo "🎯 Recommendations Status:"
if [ -f "$RECS_FILE" ]; then
    buy_count=$(jq '.recommendations.short_term_buy | length' "$RECS_FILE" 2>/dev/null)
    sell_count=$(jq '.recommendations.short_term_sell | length' "$RECS_FILE" 2>/dev/null)
    size=$(du -h "$RECS_FILE" | cut -f1)
    echo "✅ File exists: $RECS_FILE"
    echo "   Buy recommendations: $buy_count"
    echo "   Sell recommendations: $sell_count"
    echo "   Size: $size"
else
    echo "⏳ File not yet created"
fi
echo ""

# Recent log entries
echo "📋 Recent Log Entries (last 5):"
echo "---"
if [ -f "$LOG_FILE" ]; then
    tail -5 "$LOG_FILE"
else
    echo "No log entries yet"
fi
echo "---"
echo ""

# Instructions
echo "📌 Commands:"
echo "  View live log:     tail -f $LOG_FILE"
echo "  Run manually:      python $WORKSPACE/egx_stock_analyzer.py"
echo "  Stop cron:         crontab -r"
echo "  Edit cron:         crontab -e"
echo "  View stocks:       cat $STOCKS_FILE | jq '.stocks | length'"
echo ""
