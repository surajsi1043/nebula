    import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { resume_text, jd_text } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using Flash for speed [cite: 48]

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
      
      Contextual Requirements for India[cite: 18, 21, 22]:
      1. Notice Period: Check if they are an "Immediate Joiner"[cite: 21].
      2. Education: Understand CGPA vs Percentage for Tier-1/2 colleges[cite: 22].
      3. Company: Understand Service-based vs Product-based context[cite: 23].
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, "");
    
    return NextResponse.json(JSON.parse(cleanedJson));
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}