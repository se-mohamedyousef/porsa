import { NextResponse } from "next/server";
import { deleteSession } from "../../../../lib/kv";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // If userId is provided, delete the session
    if (userId) {
      try {
        const result = await deleteSession(userId);
        if (!result.success) {
          console.warn("Warning: Failed to delete session in database", result.error);
          // Don't fail logout even if session deletion fails
        }
      } catch (sessionError) {
        console.error("Session deletion error:", sessionError);
        // Don't fail logout even if session deletion fails
      }
    }

    // Always return success for logout - client-side localStorage is primary
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Still return success since logout is primarily client-side
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  }
}
