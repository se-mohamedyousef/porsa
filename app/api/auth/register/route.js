import { NextResponse } from "next/server";
import { createUser, getUserByPhone, getUserByEmail } from "../../../../lib/kv";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { phone, password, name, email } = await request.json();

    // Validate input
    if (!phone || !password || !email) {
      return NextResponse.json(
        { error: "Phone, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists with this phone
    const existingUserByPhone = await getUserByPhone(phone);
    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "User already exists with this phone" },
        { status: 409 }
      );
    }

    // Check if user already exists with this email
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      phone,
      email,
      password: hashedPassword,
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
