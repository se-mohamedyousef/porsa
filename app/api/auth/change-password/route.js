import { NextResponse } from "next/server";
import { getUser, updateUser } from "@/lib/kv";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "User ID, current password, and new password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    let user;
    try {
      user = await getUser(userId);
    } catch (error) {
      console.error("KV getUser error:", error);
      return NextResponse.json(
        { error: "Database error while fetching user" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } catch (error) {
      console.error("Bcrypt compare error:", error);
      return NextResponse.json(
        { error: "Error verifying current password" },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (error) {
      console.error("Bcrypt hash error:", error);
      return NextResponse.json(
        { error: "Error hashing new password" },
        { status: 500 }
      );
    }

    // Update user with new password
    const updatedUserData = {
      ...user,
      password: hashedPassword,
    };

    try {
      await updateUser(userId, updatedUserData);
    } catch (error) {
      console.error("KV updateUser error:", error);
      return NextResponse.json(
        { error: "Database error while updating password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
