import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!process.env.HF_TOKEN) {
      console.error("HF_TOKEN environment variable is not set");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:fireworks-ai",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("HF API error:", res.status, err.substring(0, 200));
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      text: data.choices?.[0]?.message?.content ?? "No response",
      json: data.choices?.[0]?.message?.content,
    });
  } catch (error) {
    console.error("AI API error:", error.message);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
