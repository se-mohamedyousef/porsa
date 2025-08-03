import { NextResponse } from "next/server";
import { createUser, getUserByPhone } from "../../../../lib/kv";

export async function POST(request) {
  try {
    const { phone, password, name } = await request.json();

    // Validate input
    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByPhone(phone);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this phone" },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      phone,
      password, // In production, this should be hashed
      name: name || "",
      createdAt: new Date().toISOString(),
    };

    const result = await createUser(newUser);

    if (result.success) {
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      return NextResponse.json({
        success: true,
        user: userWithoutPassword,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to create user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
