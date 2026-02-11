import { NextResponse } from "next/server";
import { getUserByEmail } from "../../../../lib/kv";
import { kv } from "@vercel/kv";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Store reset token in KV with 1 hour expiry
    const resetData = {
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`reset:token:${hashedToken}`, resetData, {
      ex: 60 * 60, // 1 hour
    });

    // Create reset URL
    const resetUrl = `${
      process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email using Resend
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: email,
        subject: "Reset Your Porsa Password",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <div style="width: 60px; height: 60px; background: white; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                  <span style="color: #667eea; font-weight: bold; font-size: 30px;">P</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi ${
                  user.name || "there"
                },</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Someone requested a password reset for your Porsa account. If this was you, click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                  <strong>This link will expire in 1 hour.</strong>
                </p>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                
                <p style="font-size: 13px; color: #667eea; word-break: break-all; background: white; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                  ${resetUrl}
                </p>
                
                <div style="border-top: 2px solid #ddd; margin-top: 30px; padding-top: 20px;">
                  <p style="font-size: 14px; color: #999; margin-bottom: 10px;">
                    <strong>Didn't request this?</strong> You can safely ignore this email. Your password won't change until you create a new one using the link above.
                  </p>
                  
                  <p style="font-size: 13px; color: #999; margin-top: 20px;">
                    Questions? Contact us at support@porsa.com
                  </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    Thanks,<br>
                    <strong>The Porsa Team</strong>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
Hi ${user.name || "there"},

Someone requested a password reset for your Porsa account. If this was you, click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email. Your password won't change until you create a new one.

Questions? Contact support@porsa.com

Thanks,
The Porsa Team
        `,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
