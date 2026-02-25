// @ts-ignore
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const jd_text = formData.get("jd_text") as string;

    if (!file || !jd_text) {
      return NextResponse.json({ error: "Missing resume or JD" }, { status: 400 });
    }

    // 1. Use dynamic import which handles Turbopack/ESM interop better
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    
    // 2. Access the function (usually sits on the 'default' or is the module itself)
    const pdf = pdfParseModule.default || pdfParseModule;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 3. Extract text
    const pdfData = await pdf(buffer);
    const resume_text = pdfData.text;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert Indian Technical Recruiter. Analyze this resume against the Job Description (JD).
      
      JD: ${jd_text}
      Resume: ${resume_text}

      Provide the response strictly in JSON format:
      {
        "score": (0-100),
        "missing_keywords": ["tech skill", "soft skill"],
        "indian_market_tips": ["specific advice for Indian market like notice period, CGPA, etc."],
        "verdict": "Strong Match" | "Moderate Match" | "Weak Match"
      }
      
      Contextual Requirements for India:
      1. Notice Period: Check if they are an "Immediate Joiner".
      2. Education: Understand CGPA vs Percentage for Tier-1/2 colleges.
      3. Company: Understand Service-based vs Product-based context.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, "");
    
    return NextResponse.json(JSON.parse(cleanedJson));
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}