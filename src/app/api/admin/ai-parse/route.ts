export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

const SYSTEM_PROMPT = `You are a question parser for a government exam mock test platform.
Extract all MCQ questions from the text below and return ONLY a JSON array.
Each object must have these exact fields:
 question: string (the full question text)
 optionA: string
 optionB: string
 optionC: string
 optionD: string
 correctOption: "A" | "B" | "C" | "D"
 explanation: string (brief explanation of why answer is correct)
 topic: string (subject/chapter name)
 difficulty: "easy" | "medium" | "hard"
If explanation is not in the text, write a short one yourself.
Return ONLY the JSON array. No markdown, no preamble.`;

interface LocalParsedQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

function parseLocalText(text: string, category: string, subject: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const questions: LocalParsedQuestion[] = [];
  let currentQ: LocalParsedQuestion | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line starts a question (e.g., "1. What is..." or "Q1. ...")
    const qMatch = line.match(/^(?:Q)?(\d+)\s*[\.\:\-\)]\s*(.*)$/i);
    if (qMatch) {
      if (currentQ) {
        questions.push(currentQ);
      }
      currentQ = {
        question: qMatch[2],
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
        explanation: "",
        topic: "General",
        difficulty: "medium",
      };
      continue;
    }

    if (!currentQ) continue;

    // Check for option A
    const optAMatch = line.match(/^(?:A\)|[A]\.|\(A\))\s*(.*)$/i);
    if (optAMatch) {
      currentQ.optionA = optAMatch[1];
      continue;
    }

    // Check for option B
    const optBMatch = line.match(/^(?:B\)|[B]\.|\(B\))\s*(.*)$/i);
    if (optBMatch) {
      currentQ.optionB = optBMatch[1];
      continue;
    }

    // Check for option C
    const optCMatch = line.match(/^(?:C\)|[C]\.|\(C\))\s*(.*)$/i);
    if (optCMatch) {
      currentQ.optionC = optCMatch[1];
      continue;
    }

    // Check for option D
    const optDMatch = line.match(/^(?:D\)|[D]\.|\(D\))\s*(.*)$/i);
    if (optDMatch) {
      currentQ.optionD = optDMatch[1];
      continue;
    }

    // Check for correct answer
    const ansMatch = line.match(/^(?:Answer|Correct|Ans)[\s\:\.]*\s*([A-D])/i);
    if (ansMatch) {
      currentQ.correctOption = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
      continue;
    }

    // Check for explanation
    const expMatch = line.match(/^(?:Explanation|Exp)[\s\:\.]*\s*(.*)$/i);
    if (expMatch) {
      currentQ.explanation = expMatch[1];
      // Collect succeeding lines
      while (
        i + 1 < lines.length &&
        !lines[i + 1].match(/^(?:Q)?\d+\s*[\.\:\-\)]/i) &&
        !lines[i + 1].match(/^(?:[A-D]\)|[A-D]\.|\([A-D]\))/i) &&
        !lines[i + 1].match(/^(?:Answer|Correct|Ans|Explanation|Exp)/i)
      ) {
        i++;
        currentQ.explanation += "\n" + lines[i];
      }
      continue;
    }

    // Append to question text if options are not set
    if (!currentQ.optionA && !currentQ.optionB) {
      currentQ.question += " " + line;
    }
  }

  if (currentQ) {
    questions.push(currentQ);
  }

  // If regex found nothing, fallback to sample templates
  if (questions.length === 0) {
    questions.push(
      {
        question: `Sample Question 1 for ${category} (${subject}): Which component of Next.js provides server-side rendering support?`,
        optionA: "Server Components",
        optionB: "Client Components",
        optionC: "Webpack Loader",
        optionD: "CSS Modules",
        correctOption: "A",
        explanation: "Next.js App Router defaults to Server Components, which render on the server to improve load times.",
        topic: "Next.js Core",
        difficulty: "easy",
      },
      {
        question: `Sample Question 2 for ${category} (${subject}): What is the primary purpose of Mongoose in a Node.js application?`,
        optionA: "It acts as an Object Data Modeling (ODM) library for MongoDB",
        optionB: "It is a routing framework for Express",
        optionC: "It parses query parameters from HTTP requests",
        optionD: "It handles user authentication and session tokens",
        correctOption: "A",
        explanation: "Mongoose provides a schema-based solution to model application data, connecting Mongoose to MongoDB.",
        topic: "Database Integration",
        difficulty: "medium",
      }
    );
  }

  return questions;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const body = await req.json();
    const { text, category, subject } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Pasted text is required" }, { status: 400 });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. OpenRouter — FREE tier (highest priority, no cost)
    //    Model: openai/gpt-oss-120b:free
    //    Set OPENROUTER_API_KEY in your .env to enable this.
    // ──────────────────────────────────────────────────────────────────────────
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            // Recommended headers for OpenRouter ranking / abuse prevention
            "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
            "X-Title": "MockTestPro AI Import",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:free",
            messages: [
              {
                role: "user",
                content: `${SYSTEM_PROMPT}\n\nTEXT TO PARSE:\n${text}`,
              },
            ],
            temperature: 0.1,
          }),
        });

        if (openRouterRes.ok) {
          const data = await openRouterRes.json();
          let content = data.choices?.[0]?.message?.content || "";
          // Strip markdown code fences if model wraps JSON
          if (content.includes("```")) {
            content = content.replace(/^```json\s*/i, "").replace(/```[\s\S]*$/, "");
          }
          try {
            const parsed = JSON.parse(content.trim());
            if (Array.isArray(parsed)) {
              return NextResponse.json({ questions: parsed, source: "openrouter" });
            }
          } catch (e) {
            console.error("Failed to parse OpenRouter JSON response, trying next provider", e);
          }
        } else {
          const errBody = await openRouterRes.text();
          console.error("OpenRouter API error:", openRouterRes.status, errBody);
        }
      } catch (e) {
        console.error("OpenRouter fetch failed, trying next provider:", e);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. OpenAI (paid) — fallback if OPENAI_API_KEY is set
    // ──────────────────────────────────────────────────────────────────────────
    if (process.env.OPENAI_API_KEY) {
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: `${SYSTEM_PROMPT}\n\nTEXT TO PARSE:\n${text}`,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (openAiRes.ok) {
        const data = await openAiRes.json();
        let content = data.choices[0]?.message?.content || "";
        // Clean markdown code blocks if any
        if (content.startsWith("```")) {
          content = content.replace(/^```json\s*/i, "").replace(/```$/, "");
        }
        try {
          const parsed = JSON.parse(content.trim());
          if (Array.isArray(parsed)) {
            return NextResponse.json({ questions: parsed, source: "openai" });
          }
        } catch (e) {
          console.error("Failed to parse OpenAI JSON response, using fallback", e);
        }
      }
    }

    // Check for Gemini API Key
    if (process.env.GEMINI_API_KEY) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nTEXT TO PARSE:\n${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        try {
          const parsed = JSON.parse(textResponse.trim());
          if (Array.isArray(parsed)) {
            return NextResponse.json({ questions: parsed, source: "gemini" });
          }
        } catch (e) {
          console.error("Failed to parse Gemini JSON response, using fallback", e);
        }
      }
    }

    // Local fallback parsing
    const parsedQuestions = parseLocalText(text, category || "SSC", subject || "General");
    return NextResponse.json({ questions: parsedQuestions, source: "fallback" });
  } catch (error) {
    console.error("AI parse API error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
