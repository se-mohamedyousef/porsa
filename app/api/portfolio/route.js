import { NextResponse } from "next/server";
import { getUserPortfolio, saveUserPortfolio } from "../../../lib/kv";

// GET - Retrieve user's portfolio data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const portfolio = await getUserPortfolio(userId);
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Error reading portfolio data:", error);
    return NextResponse.json(
      { error: "Failed to read portfolio data" },
      { status: 500 }
    );
  }
}

// POST - Save user's portfolio data or handle portfolio actions
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, portfolio, stock } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Handle adding to watchlist
    if (action === 'add_to_watchlist' && stock) {
      try {
        const currentPortfolio = await getUserPortfolio(userId);
        const watchlist = currentPortfolio.watchlist || [];
        
        // Check if already in watchlist
        if (!watchlist.find(s => s.symbol === stock.symbol)) {
          watchlist.push({
            symbol: stock.symbol,
            addedAt: new Date().toISOString(),
            currentPrice: stock.currentPrice,
            sector: stock.sector,
            recommendation: stock.recommendation
          });
          
          // Save updated portfolio with watchlist
          await saveUserPortfolio(userId, {
            ...currentPortfolio,
            watchlist
          });

          return NextResponse.json({ 
            success: true, 
            message: `${stock.symbol} added to watchlist`,
            watchlist 
          });
        } else {
          return NextResponse.json({ 
            success: true, 
            message: `${stock.symbol} already in watchlist`,
            watchlist 
          });
        }
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        return NextResponse.json(
          { error: 'Failed to add to watchlist' },
          { status: 500 }
        );
      }
    }

    // Default behavior - save portfolio
    const result = await saveUserPortfolio(userId, portfolio);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to save portfolio data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving portfolio data:", error);
    return NextResponse.json(
      { error: "Failed to save portfolio data" },
      { status: 500 }
    );
  }
}
