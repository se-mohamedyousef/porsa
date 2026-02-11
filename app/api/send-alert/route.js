import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, symbol, price, condition, currentPrice } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Porsa Alerts <alerts@resend.dev>", // Or your verified domain
      to: [email],
      subject: `Price Alert: ${symbol} has reached your target!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${condition === 'above' ? '#16a34a' : '#dc2626'}">
            ${symbol} Price Alert 🔔
          </h1>
          <p style="font-size: 16px;">
            Your target price of <strong>${price} EGP</strong> has been reached.
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">
              Current Price: <strong>${currentPrice} EGP</strong>
            </p>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
              Original Target: ${condition === 'above' ? 'Above' : 'Below'} ${price} EGP
            </p>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
            You received this email because you set a price alert on Porsa.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Alert API error:", error);
    return NextResponse.json(
      { error: "Failed to send alert" },
      { status: 500 }
    );
  }
}
