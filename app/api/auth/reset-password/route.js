import { NextResponse } from "next/server";
import { getUser, updateUser } from "../../../../lib/kv";
import { kv } from "@vercel/kv";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Hash the token to match stored version
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Get reset data from KV
    const resetData = await kv.get(`reset:token:${hashedToken}`);

    if (!resetData) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUser(resetData.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const updateResult = await updateUser(resetData.userId, {
      ...user,
      password: hashedPassword,
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Delete the reset token (one-time use)
    await kv.del(`reset:token:${hashedToken}`);

    // Optionally: Invalidate all existing sessions for this user
    // await kv.del(`session:${resetData.userId}`);

    return NextResponse.json({
      success: true,
      message: "Password successfully reset",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
