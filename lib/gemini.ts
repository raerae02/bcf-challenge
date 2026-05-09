import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });

const MODEL = "gemini-2.5-flash";

export type FileInput = {
  data: Buffer;
  mimeType: string;
  filename: string;
};

type Part =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

export async function callGemini(
  prompt: string,
  options?: {
    systemPrompt?: string;
    json?: boolean;
    files?: FileInput[];
  },
): Promise<string> {
  const parts: Part[] = [{ text: prompt }];

  if (options?.files) {
    for (const file of options.files) {
      parts.push({
        inlineData: {
          data: file.data.toString("base64"),
          mimeType: file.mimeType,
        },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: options?.systemPrompt,
      responseMimeType: options?.json ? "application/json" : "text/plain",
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return response.text;
}

export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt: string,
  files?: FileInput[],
): Promise<T> {
  const text = await callGemini(prompt, { systemPrompt, json: true, files });
  try {
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse Gemini JSON response: ${text.substring(0, 200)}`,
    );
  }
}
