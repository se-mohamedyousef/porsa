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
    try {
      const existingUserByPhone = await getUserByPhone(phone);
      if (existingUserByPhone) {
        return NextResponse.json(
          { error: "User already exists with this phone" },
          { status: 409 }
        );
      }
    } catch (kvError) {
      console.error("KV getUserByPhone error:", kvError);
      return NextResponse.json(
        { error: "Database connection error. Please check KV configuration." },
        { status: 500 }
      );
    }

    // Check if user already exists with this email
    try {
      const existingUserByEmail = await getUserByEmail(email);
      if (existingUserByEmail) {
        return NextResponse.json(
          { error: "User already exists with this email" },
          { status: 409 }
        );
      }
    } catch (kvError) {
      console.error("KV getUserByEmail error:", kvError);
      return NextResponse.json(
        { error: "Database connection error. Please check KV configuration." },
        { status: 500 }
      );
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return NextResponse.json(
        { error: "Password hashing failed" },
        { status: 500 }
      );
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      phone,
      email,
      password: hashedPassword,
      name: name || "",
      createdAt: new Date().toISOString(),
    };

    try {
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
    } catch (createError) {
      console.error("Create user error:", createError);
      return NextResponse.json(
        { error: "Failed to create user in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}
