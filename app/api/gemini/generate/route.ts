import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 400 }
      );
    }

    const { prompt, model } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
