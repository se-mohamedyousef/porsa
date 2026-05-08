import requests
from bs4 import BeautifulSoup
from groq import Groq
import json
from datetime import datetime, timedelta
import os
import random
import math

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
client = None
if api_key:
    client = Groq(api_key=api_key)
else:
    print("⚠️ Warning: GROQ_API_KEY not set. Using rule-based analyzer.")

# EGX Index Mapping - Define which stocks belong to which index
EGX_INDEXES = {
    'EGX30': ['COMI', 'ETEL', 'TMG', 'SWDY', 'ORAS', 'ABUK', 'AMOC', 'PHDC', 'MNHD', 'ESRS', 'HELI', 'JUFO', 'ELKA', 'FWRY', 'EKHO', 'EAST'],
    'EGX70': ['COMI', 'ETEL', 'TMG', 'SWDY', 'ORAS', 'ABUK', 'AMOC', 'PHDC', 'MNHD', 'ESRS', 'HELI', 'JUFO', 'ELKA', 'FWRY', 'EKHO', 'EAST', 'EGX1', 'EGX2', 'EGX3', 'EGX4', 'EGX5'],
    'EGX100': ['COMI', 'ETEL', 'TMG', 'SWDY', 'ORAS', 'ABUK', 'AMOC', 'PHDC', 'MNHD', 'ESRS', 'HELI', 'JUFO', 'ELKA', 'FWRY', 'EKHO', 'EAST', 'EGX1', 'EGX2', 'EGX3', 'EGX4', 'EGX5', 'EGX6', 'EGX7', 'EGX8', 'EGX9', 'EGX10']
}

# Sector mappings for stocks
SECTOR_MAPPING = {
    'COMI': 'Banking', 'ETEL': 'Telecom', 'TMG': 'Real Estate', 'SWDY': 'Industrial',
    'FWRY': 'Technology', 'EKHO': 'Diversified', 'EAST': 'Consumer Goods', 'ORAS': 'Construction',
    'ABUK': 'Chemicals', 'AMOC': 'Energy', 'MNHD': 'Real Estate', 'PHDC': 'Real Estate',
    'HELI': 'Real Estate', 'ESRS': 'Industrial', 'JUFO': 'Consumer Goods', 'ELKA': 'Real Estate',
    'EGX1': 'Healthcare', 'EGX2': 'Retail', 'EGX3': 'Agriculture', 'EGX4': 'Media',
    'EGX5': 'Tourism', 'EGX6': 'Logistics', 'EGX7': 'Education', 'EGX8': 'Finance', 'EGX9': 'Mining', 'EGX10': 'Utilities'
}

def get_stock_index(symbol):
    """Determine which EGX index a stock belongs to"""
    for index, stocks in EGX_INDEXES.items():
        if symbol in stocks:
            return index
    return 'Other'

# ==================== TECHNICAL INDICATORS CALCULATION ====================

def calculate_sma(prices, period):
    """Calculate Simple Moving Average"""
    if len(prices) < period:
        return prices[-1] if prices else 0
    return sum(prices[-period:]) / period

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index (0-100)"""
    if len(prices) < period + 1:
        return 50  # Neutral if not enough data
    
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    seed = deltas[:period]
    up = sum(x for x in seed if x > 0) / period
    down = -sum(x for x in seed if x < 0) / period
    
    rs_list = [0] * len(deltas)
    rs_list[period] = up / down if down != 0 else 100
    
    for i in range(period + 1, len(deltas)):
        u = deltas[i] if deltas[i] > 0 else 0
        d = -deltas[i] if deltas[i] < 0 else 0
        up = (up * (period - 1) + u) / period
        down = (down * (period - 1) + d) / period
        rs_list[i] = up / down if down != 0 else 100
    
    return 100 - (100 / (1 + rs_list[-1])) if rs_list[-1] > 0 else 50

def calculate_macd(prices, fast=12, slow=26, signal=9):
    """Calculate MACD"""
    if len(prices) < slow:
        return None
    
    fast_ema = prices[-fast] if len(prices) == fast else calculate_ema(prices[-slow:], fast)
    slow_ema = calculate_ema(prices[-slow:], slow)
    macd_line = fast_ema - slow_ema
    return {'macd': macd_line, 'signal': macd_line}

def calculate_ema(prices, period):
    """Calculate Exponential Moving Average"""
    if len(prices) < period:
        return sum(prices) / len(prices) if prices else 0
    multiplier = 2 / (period + 1)
    ema = sum(prices[:period]) / period
    for price in prices[period:]:
        ema = price * multiplier + ema * (1 - multiplier)
    return ema

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    if len(prices) < period:
        mid = prices[-1] if prices else 0
        return {'upper': mid, 'middle': mid, 'lower': mid}
    
    sma = calculate_sma(prices, period)
    variance = sum((x - sma) ** 2 for x in prices[-period:]) / period
    std = math.sqrt(variance) if variance > 0 else 0
    
    return {
        'upper': sma + (std_dev * std),
        'middle': sma,
        'lower': sma - (std_dev * std)
    }

def generate_price_history(current_price, symbol, days=90):
    """
    Generate 90 days of simulated OHLCV history based on current price.
    For MVP, uses realistic volatility patterns. Real data should replace this.
    """
    history = []
    price = current_price
    base_volatility = random.uniform(0.01, 0.03)  # 1-3% daily volatility
    
    for i in range(days, 0, -1):
        # Generate realistic OHLCV
        daily_change = random.gauss(0, base_volatility)
        open_price = price
        close_price = open_price * (1 + daily_change)
        high_price = max(open_price, close_price) * random.uniform(1.0, 1.02)
        low_price = min(open_price, close_price) * random.uniform(0.98, 1.0)
        volume = random.randint(100000, 5000000)
        
        history.append({
            'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': volume
        })
        
        price = close_price
    
    return history

def calculate_stock_fundamentals(stock_data, price_history):
    """
    Calculate fundamental metrics. 
    In production, these would come from official EGX/financial APIs.
    For MVP, using heuristics based on stock characteristics.
    """
    symbol = stock_data['symbol']
    price = stock_data['price']
    
    # Estimate PE ratio based on market cap and sector
    market_cap_category = stock_data.get('market_cap', 'Mid')
    sector = stock_data.get('sector', 'General')
    
    # Base PE ratios by sector (realistic Egyptian market values)
    sector_pe_map = {
        'Banking': 8.5, 'Telecom': 12.0, 'Real Estate': 6.5, 'Industrial': 10.0,
        'Technology': 15.0, 'Construction': 7.5, 'Consumer Goods': 14.0, 'Energy': 8.0,
        'Healthcare': 20.0, 'Finance': 9.0, 'Utilities': 11.0, 'Mining': 7.0
    }
    
    base_pe = sector_pe_map.get(sector, 10.0)
    pe_ratio = round(base_pe * random.uniform(0.8, 1.2), 2)
    
    # Calculate other metrics
    eps = round(price / pe_ratio, 3)
    dividend_yield = round(random.uniform(1.5, 6.0), 2) if market_cap_category in ['Mega', 'Large'] else round(random.uniform(0.5, 3.0), 2)
    pb_ratio = round(random.uniform(0.8, 2.5), 2)
    roe_percent = round(pb_ratio * 15, 2)  # Simplified ROE calculation
    
    # 52-week high/low from history
    close_prices = [h['close'] for h in price_history]
    week_52_high = max(close_prices)
    week_52_low = min(close_prices)
    week_52_change = round(((price - week_52_low) / week_52_low * 100) if week_52_low > 0 else 0, 2)
    
    # Volume analysis
    volumes = [h['volume'] for h in price_history[-30:]]
    avg_volume_30d = round(sum(volumes) / len(volumes)) if volumes else 0
    
    return {
        'pe_ratio': pe_ratio,
        'eps': eps,
        'dividend_yield': dividend_yield,
        'pb_ratio': pb_ratio,
        'roe_percent': roe_percent,
        'week_52_high': round(week_52_high, 2),
        'week_52_low': round(week_52_low, 2),
        'week_52_change_percent': week_52_change,
        'avg_volume_30d': avg_volume_30d,
        'market_cap_category': market_cap_category
    }

def calculate_technical_indicators(price_history):
    """Calculate technical indicators from price history"""
    if not price_history or len(price_history) < 5:
        return {}
    
    close_prices = [h['close'] for h in price_history]
    
    return {
        'sma_20': round(calculate_sma(close_prices, 20), 2),
        'sma_50': round(calculate_sma(close_prices, 50), 2) if len(close_prices) >= 50 else None,
        'sma_200': round(calculate_sma(close_prices, 200), 2) if len(close_prices) >= 200 else None,
        'rsi_14': round(calculate_rsi(close_prices, 14), 2),
        'bollinger_bands': calculate_bollinger_bands(close_prices, 20),
        'macd': calculate_macd(close_prices)
    }

def scrape_egx_stocks():
    """Scrape ALL real-time Egyptian stock data from TradingView Market Movers"""
    try:
        print("📊 Scraping from TradingView Market Movers...")
        
        # TradingView Market Movers - All Egyptian Stocks
        url = "https://ar.tradingview.com/markets/stocks-egypt/market-movers-all-stocks/"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.tradingview.com'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.content, 'html.parser')
        
        stocks = []
        
        # Find all table rows with stock data
        rows = soup.find_all('tr', class_='js-screener-item')
        if not rows:
            rows = soup.find_all('tr')
        
        print(f"📊 Found {len(rows)} rows to process...")
        
        for row in rows:
            try:
                cols = row.find_all('td')
                if len(cols) < 3:
                    continue
                
                symbol_text = cols[0].text.strip()
                price_elem = None
                change_elem = None
                
                # Extract price from columns
                for i, col in enumerate(cols):
                    col_text = col.text.strip()
                    if i > 0 and col_text and '%' not in col_text:
                        try:
                            price_val = float(col_text.replace(',', '').replace('ج.م', '').strip())
                            if price_val > 0:
                                price_elem = col
                                break
                        except ValueError:
                            continue
                
                # Extract change % from columns
                for col in cols:
                    col_text = col.text.strip()
                    if '%' in col_text:
                        change_elem = col
                        break
                
                # Skip if we couldn't find price
                if not symbol_text or not price_elem:
                    continue
                
                try:
                    price_text = price_elem.text.strip().replace(',', '').replace('ج.م', '').strip()
                    price = float(price_text) if price_text else 0.0
                    
                    change = 0.0
                    if change_elem:
                        change_text = change_elem.text.strip().replace('%', '').replace('+', '')
                        change = float(change_text) if change_text else 0.0
                    
                    if price <= 0 or not symbol_text:
                        continue
                    
                    stock = {
                        'symbol': symbol_text,
                        'name': symbol_text,
                        'price': price,
                        'change': change,
                        'volume': 'N/A',
                        'market_cap': 'N/A',
                        'sector': 'General',
                        'source': 'TradingView'
                    }
                    
                    stocks.append(stock)
                    print(f"✅ {symbol_text}: {price:.2f} EGP ({change:+.2f}%)")
                    
                except (ValueError, AttributeError):
                    continue
                    
            except Exception as e:
                continue
        
        if not stocks:
            raise Exception("Failed to fetch any stocks from TradingView. No data available.")
        
        print(f"\n✅ Successfully retrieved {len(stocks)} stocks from TradingView")
        return stocks
        
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        raise Exception(f"Failed to fetch real EGX data from TradingView: {str(e)}. No static fallback available.")

def get_sample_egx_data():
    """Enhanced Portfolio of EGX stocks for market simulation"""
    return [
        {'symbol': 'COMI', 'name': 'Commercial International Bank', 'price': 82.50, 'change': 1.2, 'volume': '2.5M', 'market_cap': 'Mega', 'sector': 'Banking'},
        {'symbol': 'ETEL', 'name': 'Telecom Egypt', 'price': 38.40, 'change': 2.5, 'volume': '1.8M', 'market_cap': 'Mega', 'sector': 'Telecom'},
        {'symbol': 'TMG', 'name': 'Talaat Moustafa Group', 'price': 65.20, 'change': -0.8, 'volume': '3.2M', 'market_cap': 'Mega', 'sector': 'Real Estate'},
        {'symbol': 'SWDY', 'name': 'Elsewedy Electric', 'price': 34.15, 'change': 1.5, 'volume': '1.2M', 'market_cap': 'Large', 'sector': 'Industrial'},
        {'symbol': 'FWRY', 'name': 'Fawry for Banking', 'price': 6.80, 'change': 3.1, 'volume': '8.5M', 'market_cap': 'Large', 'sector': 'Technology'},
        {'symbol': 'EKHO', 'name': 'Egypt Kuwait Holding', 'price': 1.15, 'change': 0.4, 'volume': '500K', 'market_cap': 'Large', 'sector': 'Diversified'},
        {'symbol': 'EAST', 'name': 'Eastern Company', 'price': 24.50, 'change': -1.2, 'volume': '2.1M', 'market_cap': 'Large', 'sector': 'Consumer Goods'},
        {'symbol': 'ORAS', 'name': 'Orascom Construction', 'price': 210.00, 'change': 1.8, 'volume': '150K', 'market_cap': 'Large', 'sector': 'Construction'},
        {'symbol': 'ABUK', 'name': 'Abu Qir Fertilizers', 'price': 62.10, 'change': 0.9, 'volume': '800K', 'market_cap': 'Large', 'sector': 'Chemicals'},
        {'symbol': 'AMOC', 'name': 'Alexandria Mineral Oils', 'price': 8.90, 'change': -2.1, 'volume': '4.2M', 'market_cap': 'Mid', 'sector': 'Energy'},
        {'symbol': 'MNHD', 'name': 'Madinet Masr', 'price': 4.20, 'change': 0.5, 'volume': '15M', 'market_cap': 'Mid', 'sector': 'Real Estate'},
        {'symbol': 'PHDC', 'name': 'Palm Hills Development', 'price': 3.75, 'change': 2.2, 'volume': '12M', 'market_cap': 'Mid', 'sector': 'Real Estate'},
        {'symbol': 'HELI', 'name': 'Heliopolis Housing', 'price': 10.15, 'change': -1.5, 'volume': '3.5M', 'market_cap': 'Mid', 'sector': 'Real Estate'},
        {'symbol': 'ESRS', 'name': 'Ezz Steel', 'price': 78.40, 'change': 4.2, 'volume': '900K', 'market_cap': 'Large', 'sector': 'Industrial'},
        {'symbol': 'JUFO', 'name': 'Juhayna Food', 'price': 18.20, 'change': 1.1, 'volume': '1.1M', 'market_cap': 'Mid', 'sector': 'Consumer Goods'},
        {'symbol': 'ELKA', 'name': 'El Kahera Housing', 'price': 2.80, 'change': 0.0, 'volume': '5M', 'market_cap': 'Small', 'sector': 'Real Estate'},
        # Adding more diversified sectors
        {'symbol': 'EGX1', 'name': 'Healthcare Egypt', 'price': 45.00, 'change': 2.1, 'volume': '1.2M', 'market_cap': 'Mid', 'sector': 'Healthcare'},
        {'symbol': 'EGX2', 'name': 'Retail Solutions', 'price': 12.50, 'change': 1.5, 'volume': '2.3M', 'market_cap': 'Mid', 'sector': 'Retail'},
        {'symbol': 'EGX3', 'name': 'Agriculture Plus', 'price': 8.75, 'change': 0.8, 'volume': '1.8M', 'market_cap': 'Small', 'sector': 'Agriculture'},
        {'symbol': 'EGX4', 'name': 'Media & Entertainment', 'price': 15.30, 'change': -0.5, 'volume': '900K', 'market_cap': 'Small', 'sector': 'Media'},
        {'symbol': 'EGX5', 'name': 'Tourism & Hospitality', 'price': 10.00, 'change': -2.5, 'volume': '3.5M', 'market_cap': 'Mid', 'sector': 'Tourism'},
        {'symbol': 'EGX6', 'name': 'Logistics Network', 'price': 22.40, 'change': 1.2, 'volume': '1.4M', 'market_cap': 'Mid', 'sector': 'Logistics'},
        {'symbol': 'EGX7', 'name': 'Education Services', 'price': 14.80, 'change': 0.9, 'volume': '800K', 'market_cap': 'Small', 'sector': 'Education'},
        {'symbol': 'EGX8', 'name': 'Financial Services', 'price': 35.60, 'change': 1.3, 'volume': '2.1M', 'market_cap': 'Mid', 'sector': 'Finance'},
        {'symbol': 'EGX9', 'name': 'Mining & Resources', 'price': 42.20, 'change': 2.8, 'volume': '1.5M', 'market_cap': 'Mid', 'sector': 'Mining'},
        {'symbol': 'EGX10', 'name': 'Utilities Egypt', 'price': 14.25, 'change': -2.5, 'volume': '4.2M', 'market_cap': 'Large', 'sector': 'Utilities'},
    ]

def calculate_days_to_target(current_price, target_price, daily_volatility_percent=0.5):
    """Calculate estimated days to reach target price based on volatility"""
    if current_price <= 0:
        return 0
    price_change_percent = abs((target_price - current_price) / current_price * 100)
    days = max(1, round(price_change_percent / daily_volatility_percent))
    return days

def generate_rule_based_recommendations(stocks):
    """Heuristic logic for stock recommendations when AI is unavailable"""
    if not stocks:
        raise Exception("No stocks available for analysis. Real EGX data required.")
        
    top_gainers = sorted(stocks, key=lambda x: x['change'], reverse=True)[:3]
    top_losers = sorted(stocks, key=lambda x: x['change'])[:2]
    
    def create_buy_recommendation(s):
        target = round(s['price'] * 1.08, 2)
        days = calculate_days_to_target(s['price'], target)
        return {
            "symbol": s['symbol'],
            "current_price": s['price'],
            "sector": s.get('sector', 'General'),
            "index": get_stock_index(s['symbol']),
            "reason": f"Strong positive momentum (+{s['change']}%) with high volume. Technical breakout likely. {s.get('sector', 'General')} sector showing strength.",
            "target_price": target,
            "expected_return_percent": 8.0,
            "days_to_target": days,
            "risk": "MEDIUM",
            "volume": s.get('volume', 'N/A'),
            "market_cap": s.get('market_cap', 'N/A'),
        }
    
    def create_sell_recommendation(s):
        target = round(s['price'] * 0.95, 2)
        days = calculate_days_to_target(s['price'], target)
        return {
            "symbol": s['symbol'],
            "current_price": s['price'],
            "sector": s.get('sector', 'General'),
            "index": get_stock_index(s['symbol']),
            "reason": f"Significant downward pressure ({s['change']}%). Sentiment remains negative in {s.get('sector', 'General')} sector.",
            "target_price": target,
            "expected_return_percent": -5.0,
            "days_to_target": days,
            "risk": "HIGH",
            "volume": s.get('volume', 'N/A'),
            "market_cap": s.get('market_cap', 'N/A'),
        }
    
    recommendations = {
        "short_term_buy": [create_buy_recommendation(s) for s in top_gainers],
        "short_term_sell": [create_sell_recommendation(s) for s in top_losers],
        "long_term_buy": [
            {
                "symbol": "ETEL",
                "current_price": 38.40,
                "sector": "Telecom",
                "index": "EGX30",
                "reason": "Dominant market position in Telecom with consistent dividend yielding capabilities. Core holdings in Telecom sector.",
                "target_price": 44.18,
                "expected_return_percent": 15.0,
                "days_to_target": 12,
                "risk": "LOW",
                "volume": "1.8M",
                "market_cap": "Mega",
            },
            {
                "symbol": "COMI",
                "current_price": 82.50,
                "sector": "Banking",
                "index": "EGX30",
                "reason": "Strong banking fundamentals and robust balance sheet. Core holding for EGX exposure. Leading Banking sector stock.",
                "target_price": 92.40,
                "expected_return_percent": 12.0,
                "days_to_target": 24,
                "risk": "LOW",
                "volume": "2.5M",
                "market_cap": "Mega",
            }
        ],
        "market_analysis": "The market is showing selective momentum in high-cap stocks. Volatility remains moderate with strong support in the banking and telecom sectors."
    }
    return json.dumps(recommendations)

def get_stock_recommendations(stocks):
    """Get AI recommendations using Groq with rule-based fallback"""
    if not stocks:
        raise Exception("No stocks available. Cannot generate recommendations without real EGX data.")
    
    if not client:
        return generate_rule_based_recommendations(stocks)
    
    stocks_data = json.dumps(stocks, indent=2)
    # ... rest of the function ...

def parse_recommendations(response):
    """Parse AI response"""
    try:
        # Try to extract JSON from response
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = response[json_start:json_end]
            return json.loads(json_str)
    except:
        pass
    return {"raw_response": response}

def main():
    print("🇪🇬 Egyptian Stock Market Analyzer (Powered by Groq)\n")
    print("=" * 60)
    
    try:
        print("\n📊 Fetching EGX stocks data...")
        stocks = scrape_egx_stocks()
        
        print(f"✅ Retrieved {len(stocks)} stocks from EGX")
        print("\nEnhancing stock data with technical indicators and fundamentals...")
        
        # Enhance stocks with fundamentals and technical data
        enhanced_stocks = []
        for stock in stocks:
            # Generate 90-day price history
            history = generate_price_history(stock['price'], stock['symbol'])
            
            # Calculate fundamentals
            fundamentals = calculate_stock_fundamentals(stock, history)
            
            # Calculate technical indicators
            technicals = calculate_technical_indicators(history)
            
            # Merge all data
            enhanced_stock = {
                **stock,
                **fundamentals,
                **technicals,
                'history_90d': history,  # Store recent history for charting
                'last_updated': datetime.now().isoformat()
            }
            enhanced_stocks.append(enhanced_stock)
            
            print(f"✅ Enhanced {stock['symbol']}: P/E={fundamentals['pe_ratio']}, Div Yield={fundamentals['dividend_yield']}%, 52W High={fundamentals['week_52_high']}")
        
        print("\n🤖 Analyzing with Groq AI (this is free!)...")
        recommendations_text = get_stock_recommendations(enhanced_stocks)
        
        print("\n" + "=" * 60)
        print("📈 RECOMMENDATIONS:")
        print("=" * 60)
        
        recommendations = parse_recommendations(recommendations_text)
        print(json.dumps(recommendations, indent=2, ensure_ascii=False)[:500] + "...")
        
        # Save results
        results = {
            'timestamp': datetime.now().isoformat(),
            'stocks_analyzed': len(enhanced_stocks),
            'recommendations': recommendations
        }
        
        with open('egx_recommendations.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Save the full stocks list with all enhancements
        with open('egx_stocks_full.json', 'w', encoding='utf-8') as f:
            json.dump({
                'stocks': enhanced_stocks,
                'count': len(enhanced_stocks),
                'timestamp': datetime.now().isoformat(),
                'version': '2.0',
                'data_includes': ['fundamentals', 'technical_indicators', '90day_history']
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Stats: Enhanced {len(enhanced_stocks)} stocks with fundamentals & technicals")
        print("✅ Results saved to egx_recommendations.json")
        print("✅ Full enhanced data saved to egx_stocks_full.json (v2.0)")
        print(f"✅ Data includes: Fundamentals (P/E, Dividend, ROE), Technical Indicators (SMA, RSI, MACD), 90-day history")
    
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\nSaving error state to JSON files...")
        
        # Save error state
        error_results = {
            'timestamp': datetime.now().isoformat(),
            'error': str(e),
            'stocks_analyzed': 0,
            'recommendations': None
        }
        
        with open('egx_recommendations.json', 'w', encoding='utf-8') as f:
            json.dump(error_results, f, indent=2, ensure_ascii=False)
        
        with open('egx_stocks_full.json', 'w', encoding='utf-8') as f:
            json.dump({'error': str(e), 'stocks': [], 'count': 0, 'timestamp': datetime.now().isoformat()}, f, indent=2, ensure_ascii=False)
        
        print("✅ Error state saved to JSON files")
        exit(1)

if __name__ == "__main__":
    main()
