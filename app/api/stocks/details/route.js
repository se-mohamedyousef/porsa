/**
 * API Route: Get Comprehensive Stock Details
 * GET /api/stocks/details?symbol=XCME
 * POST /api/stocks/details with { symbol, timeframe }
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1M';

    if (!symbol) {
      return Response.json(
        { error: 'Stock symbol required' },
        { status: 400 }
      );
    }

    // Generate mock company and stock data
    const stockData = generateStockData(symbol, timeframe);

    return Response.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock details error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { symbol, timeframe = '1M' } = body;

    if (!symbol) {
      return Response.json(
        { error: 'Stock symbol required' },
        { status: 400 }
      );
    }

    const stockData = generateStockData(symbol, timeframe);

    return Response.json({
      success: true,
      data: stockData,
      timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock details error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate comprehensive stock data
function generateStockData(symbol, timeframe) {
  const sectorData = {
    'XCME': {
      sector: 'Finance',
      industry: 'Financial Services',
      description: 'Investment banking and financial advisory services',
      marketCap: 'Large',
      isIntradayAllowed: true
    },
    'COMI': {
      sector: 'Banking',
      industry: 'Commercial Banking',
      description: 'Leading commercial and retail banking provider',
      marketCap: 'Mega',
      isIntradayAllowed: true
    },
    'ETEL': {
      sector: 'Telecom',
      industry: 'Telecommunications',
      description: 'Major telecommunications and mobile services provider',
      marketCap: 'Mega',
      isIntradayAllowed: true
    },
    'ORWA': {
      sector: 'Energy',
      industry: 'Oil & Gas',
      description: 'Petroleum exploration and production company',
      marketCap: 'Large',
      isIntradayAllowed: true
    },
    'ESRS': {
      sector: 'Industrial',
      industry: 'Manufacturing',
      description: 'Industrial machinery and manufacturing services',
      marketCap: 'Large',
      isIntradayAllowed: true
    }
  };

  const stockInfo = sectorData[symbol] || {
    sector: 'Technology',
    industry: 'Information Technology',
    description: `${symbol} - Egyptian Stock Exchange listed company`,
    marketCap: 'Large',
    isIntradayAllowed: true
  };

  // Generate price data
  const basePrice = Math.random() * 100 + 20; // Base price between 20-120
  const chartData = generateChartData(basePrice, timeframe);

  // Calculate statistics
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const currentPrice = prices[prices.length - 1];
  const yearChange = ((currentPrice - prices[0]) / prices[0]) * 100;

  return {
    symbol,
    name: `${symbol} - EGX`,
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    dayChange: parseFloat(((currentPrice - prices[0]) / prices[0] * 100).toFixed(2)),
    yearHigh: parseFloat(maxPrice.toFixed(2)),
    yearLow: parseFloat(minPrice.toFixed(2)),
    avgVolume: `${(Math.floor(Math.random() * 3) + 1)}M`,
    sector: stockInfo.sector,
    industry: stockInfo.industry,
    description: stockInfo.description,
    marketCap: stockInfo.marketCap,
    isIntradayAllowed: stockInfo.isIntradayAllowed,
    peRatio: parseFloat((Math.random() * 15 + 5).toFixed(2)),
    eps: parseFloat((currentPrice / 15).toFixed(2)),
    dividendYield: parseFloat((Math.random() * 8 + 2).toFixed(2)),
    chartData,
    analysis: {
      trend: calculateTrend(prices),
      momentum: calculateMomentum(prices),
      support: parseFloat((minPrice + (maxPrice - minPrice) * 0.2).toFixed(2)),
      resistance: parseFloat((maxPrice - (maxPrice - minPrice) * 0.2).toFixed(2))
    }
  };
}

// Generate price data for different timeframes
function generateChartData(basePrice, timeframe) {
  const dataPoints = timeframe === '1D' ? 24 : 
                     timeframe === '1W' ? 7 : 
                     timeframe === '1M' ? 30 : 365;
  
  const data = [];
  let price = basePrice;
  const volatility = 0.02 + Math.random() * 0.03;

  for (let i = dataPoints; i >= 0; i--) {
    const date = new Date();
    
    if (timeframe === '1D') {
      date.setHours(date.getHours() - i);
    } else if (timeframe === '1W') {
      date.setDate(date.getDate() - i);
    } else if (timeframe === '1M') {
      date.setDate(date.getDate() - i);
    } else {
      date.setMonth(date.getMonth() - Math.floor(i / 30));
    }

    price = price * (1 + (Math.random() * volatility * 2 - volatility));

    const dateStr = timeframe === '1D' 
      ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    data.push({
      date: dateStr,
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
  }

  return data;
}

// Calculate trend direction
function calculateTrend(prices) {
  if (prices.length < 2) return 'Neutral';
  
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (change > 2) return 'Uptrend';
  if (change < -2) return 'Downtrend';
  return 'Sideways';
}

// Calculate momentum
function calculateMomentum(prices) {
  if (prices.length < 5) return 'Neutral';
  
  const recentPrices = prices.slice(-5);
  const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  const prevAvg = prices.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;

  if (recentAvg > prevAvg * 1.02) return 'Strong';
  if (recentAvg < prevAvg * 0.98) return 'Weak';
  return 'Neutral';
}

export async function OPTIONS(request) {
  return Response.json({
    methods: ['GET', 'POST'],
    description: 'Get comprehensive stock details including company info, charts, and analysis',
    parameters: {
      GET: {
        symbol: 'Stock ticker symbol (e.g., XCME)',
        timeframe: 'Chart timeframe: 1D, 1W, 1M, 1Y'
      },
      POST: {
        symbol: 'Stock ticker symbol',
        timeframe: 'Chart timeframe'
      }
    }
  });
}
