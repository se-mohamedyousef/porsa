import { NextResponse } from "next/server";

export async function POST(req) {
  const { prompt } = await req.json();

  console.log("🚀 HF_TOKEN:", process.env.HF_TOKEN);

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
    console.error("❌ HF error:", err);
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  console.log("✅ HF response:", data);

  return NextResponse.json({
    text: data.choices?.[0]?.message?.content ?? "No response",
  });
}
