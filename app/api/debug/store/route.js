import { NextResponse } from "next/server";
import { kvDev } from "../../../../lib/kv-dev.js";

export async function GET(request) {
  try {
    // Get all keys from kvDev
    const keys = await kvDev.keys("*");
    const storeContents = {};
    
    for (const key of keys) {
      const value = await kvDev.get(key);
      if (key.includes('password')) {
        // Don't expose passwords in debug output
        storeContents[key] = "***REDACTED***";
      } else {
        storeContents[key] = value;
      }
    }
    
    return NextResponse.json({
      totalKeys: keys.length,
      keys: keys,
      contents: storeContents
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
