import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export type FileInput = {
  data: Buffer;
  mimeType: string;
  filename: string;
};

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

export async function callAI(
  prompt: string,
  options?: {
    systemPrompt?: string;
    json?: boolean;
    files?: FileInput[];
  },
): Promise<string> {
  if (!client) {
    throw new Error("OPENAI_API_KEY is required for OpenAI text analysis.");
  }

  const fileText = options?.files?.length
    ? [
        "",
        "Attached native file metadata:",
        ...options.files.map(
          (file, index) =>
            `${index + 1}. ${file.filename} (${file.mimeType}, ${file.data.length} bytes)`,
        ),
      ].join("\n")
    : "";

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      ...(options?.systemPrompt
        ? [{ role: "system" as const, content: options.systemPrompt }]
        : []),
      { role: "user" as const, content: `${prompt}${fileText}` },
    ],
    response_format: options?.json ? { type: "json_object" } : undefined,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("No response from OpenAI");
  return text;
}

export async function callAIJSON<T>(
  prompt: string,
  systemPrompt: string,
  files?: FileInput[],
): Promise<T> {
  const text = await callAI(prompt, { systemPrompt, json: true, files });
  try {
    return JSON.parse(cleanJson(text)) as T;
  } catch {
    throw new Error(
      `Failed to parse OpenAI JSON response: ${text.substring(0, 200)}`,
    );
  }
}
