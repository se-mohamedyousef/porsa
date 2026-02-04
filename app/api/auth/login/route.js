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
    const user = await getUserByPhone(phone);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    // Check password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
