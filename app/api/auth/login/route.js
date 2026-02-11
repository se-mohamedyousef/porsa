import { NextResponse } from "next/server";
import { getUserByPhone, createSession } from "../../../../lib/kv";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { phone, password } = await request.json();

    // Validate input
    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone and password are required" },
        { status: 400 }
      );
    }

    // Find user by phone
    let user;
    try {
      user = await getUserByPhone(phone);
    } catch (kvError) {
      console.error("KV getUserByPhone error:", kvError);
      return NextResponse.json(
        { error: "Database connection error. Please check KV configuration." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    // Check password using bcrypt
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Bcrypt compare error:", bcryptError);
      return NextResponse.json(
        { error: "Password verification failed" },
        { status: 500 }
      );
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    // Create session
    const sessionData = {
      userId: user.id,
      phone: user.phone,
      name: user.name,
      createdAt: new Date().toISOString(),
    };

    try {
      const sessionResult = await createSession(user.id, sessionData);

      if (sessionResult.success) {
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({
          success: true,
          user: userWithoutPassword,
          session: sessionData,
        });
      } else {
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        );
      }
    } catch (sessionError) {
      console.error("Create session error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: `Login failed: ${error.message}` },
      { status: 500 }
    );
  }
}
