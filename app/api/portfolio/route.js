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

// POST - Save user's portfolio data
export async function POST(request) {
  try {
    const { userId, portfolio } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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
