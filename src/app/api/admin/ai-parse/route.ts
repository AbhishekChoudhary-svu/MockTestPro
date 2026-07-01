export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

// ─── Enhanced System Prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a highly advanced question parser for a government exam mock-test platform (SSC, Banking, Railway, PSC exams in India).

TASK: Extract ALL MCQ questions from the pasted text and return ONLY a valid JSON array.

CRITICAL RULES FOR PASSAGE-BASED QUESTIONS:
1. **Reading Comprehension (RC):** If a passage is given followed by multiple questions about that passage, include the FULL passage text in the "passage" field of EVERY question that references it. Prefix the passage with the section heading (e.g., "Reading Comprehension (Q.1–Q.5)\\n\\nPassage:\\n...").
2. **Cloze Test:** If a paragraph with numbered blanks is given (e.g., "(6)", "(7)"), include the FULL cloze paragraph in the "passage" field of every related question. Include the section heading.
3. **Direction-Based Questions:** For question types like "Error Spotting", "Sentence Improvement", "Active & Passive Voice", "Direct & Indirect Speech", "Fill in the Blanks", "Para Jumble", include the full sentence/direction in the "question" field itself.

EACH JSON OBJECT MUST HAVE THESE EXACT FIELDS:
- "question": string — The question text. For fill-in-the-blanks, include the blank (___). For error spotting, include the labelled parts. For sentence improvement, include the original sentence. Always preserve formatting, newlines, and special characters.
- "passage": string — The shared passage/paragraph text for RC and Cloze test questions. Empty string "" if not passage-based.
- "optionA": string
- "optionB": string
- "optionC": string
- "optionD": string
- "correctOption": "A" | "B" | "C" | "D"
- "explanation": string — Brief reasoning. If not in text, write one yourself.
- "topic": string — The specific topic/type. Use these standardized names:
    - "Reading Comprehension" for RC
    - "Cloze Test" for cloze
    - "Fill in the Blanks" for fill-in
    - "Error Spotting" for error detection
    - "Sentence Improvement" for sentence correction
    - "Active & Passive Voice" for voice conversion
    - "Direct & Indirect Speech" for speech conversion
    - "Synonym" for synonym questions
    - "Antonym" for antonym questions
    - "Idioms & Phrases" for idioms
    - "One Word Substitution" for one-word
    - "Spelling Correction" for spelling
    - "Para Jumble" for rearrangement
    - "Grammar" for grammar questions
    - "Vocabulary" for vocabulary
    - For quantitative: "Arithmetic", "Algebra", "Geometry", "Trigonometry", "Data Interpretation", "Number System", "Percentage", "Profit & Loss", "Time & Work", "Time & Distance", etc.
    - For reasoning: "Coding-Decoding", "Analogy", "Series", "Blood Relations", "Direction Sense", "Syllogism", "Seating Arrangement", "Puzzle", etc.
    - For GK: "History", "Geography", "Polity", "Economics", "Science", "Current Affairs", etc.
- "difficulty": "easy" | "medium" | "hard"

ANSWER KEY HANDLING:
- If an answer key table is provided at the end, extract correct answers and explanations from it.
- Match answers to questions by question number.

IMPORTANT:
- Preserve all formatting, line breaks (use \\n), blanks (___), and special characters.
- Do NOT skip any question. Parse ALL questions in the input.
- Return ONLY the JSON array. No markdown fences, no preamble, no commentary.`;

interface LocalParsedQuestion {
  question: string;
  passage: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface TempParsedQuestion {
  question?: string;
  passage?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  explanation?: string;
  topic?: string;
  difficulty?: string;
}

// ─── Answer Key Parser ───────────────────────────────────────────────────────
interface AnswerKeyEntry {
  answer: string;
  explanation: string;
}

function parseAnswerKey(text: string): Map<number, AnswerKeyEntry> {
  const map = new Map<number, AnswerKeyEntry>();
  const lines = text.split("\n");

  // Detect the answer key section
  let inAnswerKey = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^answer\s*key/i.test(trimmed) || /^(Q\s*Answer|Q\t)/i.test(trimmed)) {
      inAnswerKey = true;
      continue;
    }
    if (!inAnswerKey) continue;

    // Parse table-style: "1	B	The passage emphasizes..."
    const tableMatch = trimmed.match(/^(\d+)\s+([A-D])\s+(.*)/i);
    if (tableMatch) {
      map.set(parseInt(tableMatch[1]), {
        answer: tableMatch[2].toUpperCase(),
        explanation: tableMatch[3].trim(),
      });
    }
  }
  return map;
}

// ─── Passage/Section Detector ────────────────────────────────────────────────
interface PassageSection {
  heading: string;
  passage: string;
  startQ: number;
  endQ: number;
}

function detectPassageSections(text: string): PassageSection[] {
  const sections: PassageSection[] = [];
  const lines = text.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect section headers like "Reading Comprehension (Q.1–Q.5)" or "Cloze Test (Q.6–Q.10)"
    const sectionMatch = line.match(
      /^(Reading\s+Comprehension|Cloze\s+Test|Passage(?:\s+\d+)?|Directions|Fill\s+in\s+the\s+Blanks|Error\s+Spotting)\s*(?:\(?\s*Q?\.?\s*(\d+)\s*(?:[–\-—]|to)\s*Q?\.?\s*(\d+)\s*\)?)?/i
    );
    if (sectionMatch) {
      const heading = line;
      const startQ = sectionMatch[2] ? parseInt(sectionMatch[2]) : 0;
      const endQ = sectionMatch[3] ? parseInt(sectionMatch[3]) : 0;
      i++;

      // Collect passage lines until the first question
      const passageLines: string[] = [];
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        // Stop when we hit the first question of this section
        if (nextLine.match(/^(?:Q)?\s*\d+\s*[.:\-)]/i)) break;
        // Also stop at another section header
        if (nextLine.match(/^(Reading\s+Comprehension|Cloze\s+Test|Fill\s+in|Error\s+Spot|Sentence\s+Improv|Active|Direct|Synonym|Antonym|Idioms|One\s+Word|Spelling|Para\s+Jumble|Grammar|Vocabulary)/i)) break;
        passageLines.push(lines[i]); // preserve original lines/spaces
        i++;
      }

      sections.push({
        heading,
        passage: passageLines.join("\n").trim(),
        startQ,
        endQ,
      });
      continue;
    }
    i++;
  }

  return sections;
}

// ─── Topic detector from section headings ────────────────────────────────────
function detectTopicFromContext(line: string, precedingText: string): string {
  const combined = (precedingText + " " + line).toLowerCase();

  if (/reading\s+comprehension|passage/i.test(combined)) return "Reading Comprehension";
  if (/cloze\s+test/i.test(combined)) return "Cloze Test";
  if (/fill\s+in\s+the?\s+blank/i.test(combined)) return "Fill in the Blanks";
  if (/error\s+spot/i.test(combined)) return "Error Spotting";
  if (/sentence\s+improv/i.test(combined)) return "Sentence Improvement";
  if (/active\s*[&\s]*passive\s+voice/i.test(combined)) return "Active & Passive Voice";
  if (/direct\s*[&\s]*indirect\s+speech/i.test(combined)) return "Direct & Indirect Speech";
  if (/synonym/i.test(combined)) return "Synonym";
  if (/antonym/i.test(combined)) return "Antonym";
  if (/idiom/i.test(combined)) return "Idioms & Phrases";
  if (/one\s+word\s+substitut/i.test(combined)) return "One Word Substitution";
  if (/spelling/i.test(combined)) return "Spelling Correction";
  if (/para\s*jumble|arrange/i.test(combined)) return "Para Jumble";
  if (/grammar/i.test(combined)) return "Grammar";
  if (/vocabulary/i.test(combined)) return "Vocabulary";
  return "General";
}

// ─── Enhanced Local Parser ───────────────────────────────────────────────────
function parseLocalText(text: string): LocalParsedQuestion[] {
  // Parse answer key first
  const answerKey = parseAnswerKey(text);

  // Detect passage sections (RC, Cloze)
  const passageSections = detectPassageSections(text);

  const lines = text.split("\n");
  const questions: LocalParsedQuestion[] = [];
  let currentQ: LocalParsedQuestion | null = null;
  let currentQNumber = 0;
  let currentSectionTopic = "General";
  let precedingText = ""; // Track text before questions for topic detection

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Stop at answer key section
    if (/^answer\s*key/i.test(line)) break;

    // Detect section headings (non-question lines that define topic context)
    const sectionHeadingMatch = line.match(
      /^(Reading\s+Comprehension|Cloze\s+Test|Fill\s+in\s+the?\s+Blank|Error\s+Spot|Sentence\s+Improv|Active\s*[&\s]*Passive\s+Voice|Direct\s*[&\s]*Indirect\s+Speech|Synonym|Antonym|Idiom|One\s+Word\s+Substitut|Spelling|Para\s*Jumble|Grammar|Vocabulary)/i
    );
    if (sectionHeadingMatch) {
      currentSectionTopic = detectTopicFromContext(line, "");
      precedingText = line;
      continue;
    }

    // Skip "Passage:", "Read the passage", "Choose the" etc direction lines
    if (/^(Passage\s*:|Read\s+the|Choose\s+the\s+most|Arrange\s+the)/i.test(line)) {
      precedingText += "\n" + line;
      continue;
    }

    // Check if line starts a question (e.g., "1. What is..." or "Q1. ..." or "Q 1.")
    const qMatch = line.match(/^(?:Q)\s*(\d+)\s*[.:\-)]\s*(.*)$/i) || line.match(/^(\d+)\s*[.:\-)]\s*(.*)$/i);
    if (qMatch) {
      // Save previous question
      if (currentQ) {
        questions.push(currentQ);
      }

      currentQNumber = parseInt(qMatch[1]);
      const questionText = qMatch[2].trim();

      // Determine topic from section context
      let topic = currentSectionTopic;
      if (topic === "General") {
        topic = detectTopicFromContext(questionText, precedingText);
      }

      // Find passage for this question number
      let passage = "";
      for (const section of passageSections) {
        if (currentQNumber >= section.startQ && currentQNumber <= section.endQ) {
          passage = section.heading + "\n\n" + section.passage;
          break;
        }
      }

      currentQ = {
        question: questionText,
        passage,
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
        explanation: "",
        topic,
        difficulty: "medium",
      };

      // Apply answer key if available
      const ak = answerKey.get(currentQNumber);
      if (ak) {
        currentQ.correctOption = ak.answer as "A" | "B" | "C" | "D";
        currentQ.explanation = ak.explanation;
      }

      continue;
    }

    if (!currentQ) {
      precedingText += "\n" + line;
      continue;
    }

    // Check for option A
    const optAMatch = line.match(/^(?:A\)|A\.|A\s*\)|\(A\))\s*(.*)$/i);
    if (optAMatch) {
      currentQ.optionA = optAMatch[1].trim();
      continue;
    }

    // Check for option B
    const optBMatch = line.match(/^(?:B\)|B\.|B\s*\)|\(B\))\s*(.*)$/i);
    if (optBMatch) {
      currentQ.optionB = optBMatch[1].trim();
      continue;
    }

    // Check for option C
    const optCMatch = line.match(/^(?:C\)|C\.|C\s*\)|\(C\))\s*(.*)$/i);
    if (optCMatch) {
      currentQ.optionC = optCMatch[1].trim();
      continue;
    }

    // Check for option D
    const optDMatch = line.match(/^(?:D\)|D\.|D\s*\)|\(D\))\s*(.*)$/i);
    if (optDMatch) {
      currentQ.optionD = optDMatch[1].trim();
      continue;
    }

    // Check for correct answer
    const ansMatch = line.match(/^(?:Answer|Correct|Ans)\s*[:\.\-]?\s*([A-D])/i);
    if (ansMatch) {
      currentQ.correctOption = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
      continue;
    }

    // Check for explanation
    const expMatch = line.match(/^(?:Explanation|Exp)\s*[:\.\-]?\s*(.*)$/i);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      // Collect succeeding explanation lines
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() &&
        !lines[i + 1].trim().match(/^(?:Q)?\s*\d+\s*[.:\-)]/i) &&
        !lines[i + 1].trim().match(/^(?:[A-D]\)|[A-D]\.|\([A-D]\))/i) &&
        !lines[i + 1].trim().match(/^(?:Answer|Correct|Ans|Explanation|Exp)/i)
      ) {
        i++;
        currentQ.explanation += " " + lines[i].trim();
      }
      continue;
    }

    // Append to question text if we haven't started options yet
    if (!currentQ.optionA && !currentQ.optionB) {
      currentQ.question += "\n" + line;
    }
  }

  // Push last question
  if (currentQ) {
    questions.push(currentQ);
  }

  return questions;
}

// ─── Post-Processor for Passage Propagation ──────────────────────────────────
function postProcessPassages(questions: LocalParsedQuestion[], text: string) {
  const sections = detectPassageSections(text);
  
  // Resolve ranges for sections without explicit numbers
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (sec.startQ === 0) {
      const nextSec = sections[i + 1];
      sec.startQ = (i === 0) ? 1 : (sections[i - 1].endQ + 1);
      sec.endQ = nextSec && nextSec.startQ > 0 ? (nextSec.startQ - 1) : (sec.startQ + 4);
    }
  }

  // Map matched passages to questions
  const mapped = questions.map((q, idx) => {
    const qNum = idx + 1;
    const matched = sections.find(s => qNum >= s.startQ && qNum <= s.endQ);
    if (matched && matched.passage && (!q.passage || !q.passage.trim())) {
      q.passage = matched.heading + "\n\n" + matched.passage;
    }
    return q;
  });

  // Secondary propagation fallback
  let activePassage = "";
  let activeTopic = "";
  return mapped.map((q) => {
    if (q.passage && q.passage.trim()) {
      activePassage = q.passage;
      activeTopic = q.topic;
    } else if (activePassage && q.topic === activeTopic) {
      q.passage = activePassage;
    }
    return q;
  });
}

// ─── Main Handler ────────────────────────────────────────────────────────────
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
    const { text, category, subject, groqApiKey } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Pasted text is required" }, { status: 400 });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Groq Cloud (highest priority if custom key in request or environment key is present)
    // ──────────────────────────────────────────────────────────────────────────
    const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;
    if (activeGroqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeGroqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "user",
                content: `${SYSTEM_PROMPT}\n\nSUBJECT CONTEXT: ${subject || "General"}\nCATEGORY: ${category || "SSC"}\n\nTEXT TO PARSE:\n${text}`,
              },
            ],
            temperature: 0.1,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          let content = data.choices?.[0]?.message?.content || "";
          if (content.includes("```")) {
            content = content.replace(/^```json\s*/i, "").replace(/```[\s\S]*$/, "");
          }
          try {
            const parsed = JSON.parse(content.trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((q: TempParsedQuestion) => ({
                ...q,
                passage: q.passage || "",
              })) as LocalParsedQuestion[];
              const processed = postProcessPassages(normalized, text);
              return NextResponse.json({ questions: processed, source: "groq" });
            }
          } catch (e) {
            console.error("Failed to parse Groq JSON response, trying next provider", e);
          }
        } else {
          const errBody = await groqRes.text();
          console.error("Groq API error:", groqRes.status, errBody);
        }
      } catch (e) {
        console.error("Groq fetch failed, trying next provider:", e);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. OpenRouter — FREE tier
    // ──────────────────────────────────────────────────────────────────────────
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
            "X-Title": "MockTestPro AI Import",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:free",
            messages: [
              {
                role: "user",
                content: `${SYSTEM_PROMPT}\n\nSUBJECT CONTEXT: ${subject || "General"}\nCATEGORY: ${category || "SSC"}\n\nTEXT TO PARSE:\n${text}`,
              },
            ],
            temperature: 0.1,
          }),
        });

        if (openRouterRes.ok) {
          const data = await openRouterRes.json();
          let content = data.choices?.[0]?.message?.content || "";
          if (content.includes("```")) {
            content = content.replace(/^```json\s*/i, "").replace(/```[\s\S]*$/, "");
          }
          try {
            const parsed = JSON.parse(content.trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Ensure passage field exists on all items
              const normalized = parsed.map((q: TempParsedQuestion) => ({
                ...q,
                passage: q.passage || "",
              })) as LocalParsedQuestion[];
              const processed = postProcessPassages(normalized, text);
              return NextResponse.json({ questions: processed, source: "openrouter" });
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
    // 2. OpenAI (paid) — fallback
    // ──────────────────────────────────────────────────────────────────────────
    if (process.env.OPENAI_API_KEY) {
      try {
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
                content: `${SYSTEM_PROMPT}\n\nSUBJECT CONTEXT: ${subject || "General"}\nCATEGORY: ${category || "SSC"}\n\nTEXT TO PARSE:\n${text}`,
              },
            ],
            temperature: 0.1,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          let content = data.choices[0]?.message?.content || "";
          if (content.startsWith("```")) {
            content = content.replace(/^```json\s*/i, "").replace(/```$/, "");
          }
          try {
            const parsed = JSON.parse(content.trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((q: TempParsedQuestion) => ({
                ...q,
                passage: q.passage || "",
              })) as LocalParsedQuestion[];
              const processed = postProcessPassages(normalized, text);
              return NextResponse.json({ questions: processed, source: "openai" });
            }
          } catch (e) {
            console.error("Failed to parse OpenAI JSON response, using fallback", e);
          }
        }
      } catch (e) {
        console.error("OpenAI fetch failed, trying next provider:", e);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Gemini — fallback
    // ──────────────────────────────────────────────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
      try {
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
                      text: `${SYSTEM_PROMPT}\n\nSUBJECT CONTEXT: ${subject || "General"}\nCATEGORY: ${category || "SSC"}\n\nTEXT TO PARSE:\n${text}`,
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
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((q: TempParsedQuestion) => ({
                ...q,
                passage: q.passage || "",
              })) as LocalParsedQuestion[];
              const processed = postProcessPassages(normalized, text);
              return NextResponse.json({ questions: processed, source: "gemini" });
            }
          } catch (e) {
            console.error("Failed to parse Gemini JSON response, using fallback", e);
          }
        }
      } catch (e) {
        console.error("Gemini fetch failed, using local fallback:", e);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Local fallback parsing (no API keys)
    // ──────────────────────────────────────────────────────────────────────────
    const parsedQuestions = parseLocalText(text);

    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Could not parse any questions from the provided text. Please check the format." },
        { status: 400 }
      );
    }

    const processedQuestions = postProcessPassages(parsedQuestions, text);
    return NextResponse.json({ questions: processedQuestions, source: "fallback" });
  } catch (error) {
    console.error("AI parse API error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
