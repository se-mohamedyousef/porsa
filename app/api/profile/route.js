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

    // Fetch the actual user data (not a separate profile)
    const user = await getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { name: "", phoneNumber: "", email: "" }
      );
    }

    // Return user data with consistent field names
    return NextResponse.json({
      name: user.name || "",
      phoneNumber: user.phone || "",
      email: user.email || "",
      phone: user.phone || "", // Include both for backward compatibility
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 }
    );
  }
}

// POST - Save user profile or handle profile actions
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, profile, name, phoneNumber, phone, email, action, alert } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Handle adding price alert
    if (action === 'add_alert' && alert) {
      try {
        const currentUser = await getUser(userId);
        if (!currentUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const alerts = currentUser.alerts || [];
        
        // Add the new alert
        alerts.push(alert);
        
        // Update user with new alerts
        const updatedUser = await updateUser(userId, {
          ...currentUser,
          alerts
        });

        if (updatedUser.success) {
          return NextResponse.json({ 
            success: true, 
            message: `Price alert set for ${alert.symbol}`,
            alert,
            alerts
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to save alert' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Error adding alert:', error);
        return NextResponse.json(
          { error: 'Failed to add alert' },
          { status: 500 }
        );
      }
    }

    // Normalize field names (accept both phoneNumber and phone)
    const profileData = profile || { 
      name, 
      phoneNumber: phoneNumber || phone,
      phone: phoneNumber || phone,
      email 
    };

    // Get current user
    const currentUser = await getUser(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If email is being updated, validate and check for duplicates
    if (profileData.email && profileData.email !== currentUser.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email is already used by another user
      const existingUserWithEmail = await getUserByEmail(profileData.email);
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        return NextResponse.json(
          { error: "Email already in use by another account" },
          { status: 409 }
        );
      }
    }

    // Update user record with new profile data
    const updatedUser = await updateUser(userId, {
      ...currentUser,
      name: profileData.name || currentUser.name,
      phone: profileData.phoneNumber || profileData.phone || currentUser.phone,
      email: profileData.email || currentUser.email,
    });

    if (updatedUser.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: updatedUser.error || "Failed to save user profile" },
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
