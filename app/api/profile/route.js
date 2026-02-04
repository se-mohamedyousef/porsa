import { NextResponse } from "next/server";
import { getUserProfile, saveUserProfile, getUser, updateUser, getUserByEmail } from "../../../lib/kv";

// GET - Retrieve user profile
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

    const profile = await getUserProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error getting user profile:", error);
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 }
    );
  }
}

// POST - Save user profile
export async function POST(request) {
  try {
    const { userId, profile } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // If email is being updated, validate and check for duplicates
    if (profile.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Get current user
      const currentUser = await getUser(userId);
      
      // Check if email is different from current one
      if (currentUser && currentUser.email !== profile.email) {
        // Check if email is already used by another user
        const existingUserWithEmail = await getUserByEmail(profile.email);
        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
          return NextResponse.json(
            { error: "Email already in use by another account" },
            { status: 409 }
          );
        }

        // Update user record with new email
        await updateUser(userId, {
          ...currentUser,
          email: profile.email,
        });
      }
    }

    const result = await saveUserProfile(userId, profile);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to save user profile" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving user profile:", error);
    return NextResponse.json(
      { error: "Failed to save user profile" },
      { status: 500 }
    );
  }
}
