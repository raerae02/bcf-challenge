import { callAI } from "@/lib/ai";
import { getAlerts, getAllDocuments, getRegulations } from "@/lib/data";
import { listLaws } from "@/lib/db";
import { findRelevantChunksForLaw } from "@/lib/rag/sources";
import type { ScoredDocumentChunk } from "@/lib/rag/types";
import type { ProjectProfile } from "@/lib/types";
import demoLegalExcerpts from "@/data/demo-legal-excerpts.json";

const DISCLAIMER =
  "This is legal and permitting information, not legal advice. A qualified legal, municipal, or permitting professional should review high-impact issues.";
const CLEAN_RESPONSE_INSTRUCTIONS = `Format the answer exactly like this:
Short answer:
One clear sentence.

Top risks:
1. Risk name - why it matters. Action: concrete next step.
2. Risk name - why it matters. Action: concrete next step.
3. Risk name - why it matters. Action: concrete next step.

Next steps:
- First practical step.
- Second practical step.

Keep it under 180 words. Use short lines. Do not use markdown bold, tables, or long paragraphs.`;

type LocalSource = {
  id: string;
  title: string;
  source: string;
  content: string;
};

type DemoLegalExcerpt = {
  seedId: string;
  title: string;
  source: string;
  jurisdiction: string;
  category: string;
  urgency: string;
  newText: string;
  summary?: string;
  risk?: string;
};

export type ChatCitation = {
  id: string;
  title: string;
  source: string;
};

export type ChatMatchedExcerpt = ChatCitation & {
  excerpt: string;
  score?: number;
};

export type ChatAnswer = {
  answer: string;
  citations: ChatCitation[];
  matchedExcerpts: ChatMatchedExcerpt[];
  disclaimer: string;
};

function tokenize(text: string) {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9À-ÿ]+/g)
      ?.filter((token) => token.length > 2) || []
  );
}

function scoreText(query: string, content: string) {
  const queryTerms = new Set(tokenize(query));
  const sourceTerms = tokenize(content);

  if (!queryTerms.size || !sourceTerms.length) return 0;

  const sourceTermSet = new Set(sourceTerms);
  let score = 0;

  for (const term of queryTerms) {
    if (sourceTermSet.has(term)) score += 2;
  }

  return score / Math.max(queryTerms.size, 1);
}

function excerpt(content: string, query: string, maxLength = 420) {
  const terms = tokenize(query);
  const lower = content.toLowerCase();
  const firstHit = terms
    .map((term) => lower.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  const start = Math.max(0, (firstHit ?? 0) - 120);
  const snippet = content.slice(start, start + maxLength).replace(/\s+/g, " ").trim();

  return `${start > 0 ? "... " : ""}${snippet}${start + maxLength < content.length ? " ..." : ""}`;
}

function profileText(profile?: ProjectProfile) {
  if (!profile) return "";

  return [
    profile.businessType,
    profile.location.city,
    profile.location.borough,
    ...profile.activities,
    ...profile.considerations,
  ]
    .filter(Boolean)
    .join(" ");
}

async function getLocalRegulatorySources(): Promise<LocalSource[]> {
  const [regulations, alerts, documents, laws] = await Promise.all([
    getRegulations().catch(() => []),
    getAlerts().catch(() => []),
    getAllDocuments().catch(() => []),
    listLaws().catch(() => []),
  ]);

  return [
    ...regulations.map((regulation) => ({
      id: regulation.id,
      title: regulation.title.en,
      source: regulation.authority,
      content: [
        regulation.title.en,
        regulation.category,
        regulation.jurisdiction,
        regulation.authority,
        regulation.summary.en,
        regulation.riskLevel,
        regulation.appliesWhen.join(" "),
      ].join("\n"),
    })),
    ...alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      source: alert.source,
      content: [
        alert.title,
        alert.category,
        alert.jurisdiction,
        alert.urgency,
        alert.oldText,
        alert.newText,
        alert.affectsActivities.join(" "),
        alert.affectsJurisdictions.join(" "),
      ].join("\n"),
    })),
    ...documents.map((document) => ({
      id: document.filename,
      title: document.filename,
      source: "Local regulatory document",
      content: document.content,
    })),
    ...(demoLegalExcerpts as DemoLegalExcerpt[]).map((law) => ({
      id: law.seedId,
      title: law.title,
      source: law.source,
      content: [
        law.title,
        law.category,
        law.jurisdiction,
        law.urgency,
        law.summary,
        law.risk,
        law.newText,
      ]
        .filter(Boolean)
        .join("\n"),
    })),
    ...laws.map((law) => ({
      id: law.id,
      title: law.title,
      source: law.source,
      content: [
        law.title,
        law.category,
        law.jurisdiction,
        law.urgency,
        law.summary,
        law.risk,
        law.oldText,
        law.newText,
        law.structured?.effectiveChange,
        law.structured?.obligations?.join(" "),
        law.structured?.legalRiskThemes?.join(" "),
      ]
        .filter(Boolean)
        .join("\n"),
    })),
  ];
}

async function getProjectSubclauseMatches({
  projectId,
  question,
}: {
  projectId?: string;
  question: string;
}): Promise<ChatMatchedExcerpt[]> {
  if (!projectId) return [];

  try {
    const chunks = await findRelevantChunksForLaw({
      projectId,
      lawText: question,
      topK: 5,
    });

    return chunks.map((chunk: ScoredDocumentChunk) => ({
      id: chunk.id,
      title: [chunk.fileName, chunk.clauseId, chunk.clauseTitle]
        .filter(Boolean)
        .join(" - "),
      source: "Uploaded project document",
      excerpt: excerpt(chunk.text, question),
      score: chunk.score,
    }));
  } catch (error) {
    console.warn("Project chat retrieval failed, using local regulatory sources only.", error);
    return [];
  }
}

async function getLocalMatches({
  question,
  profile,
  limit = 5,
}: {
  question: string;
  profile?: ProjectProfile;
  limit?: number;
}): Promise<ChatMatchedExcerpt[]> {
  const sources = await getLocalRegulatorySources();
  const enrichedQuery = `${question}\n${profileText(profile)}`;

  return sources
    .map((source) => ({
      ...source,
      score: scoreText(enrichedQuery, source.content),
    }))
    .filter((source) => source.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((source) => ({
      id: source.id,
      title: source.title,
      source: source.source,
      excerpt: excerpt(source.content, question),
      score: source.score,
    }));
}

function buildFallbackAnswer({
  profile,
  matches,
}: {
  profile?: ProjectProfile;
  matches: ChatMatchedExcerpt[];
}) {
  const projectContext = profile
    ? `For the ${profile.businessType} project in ${
        profile.location.borough ?? profile.location.city
      }, `
    : "";

  if (!matches.length) {
    return [
      "Short answer:",
      `${projectContext}I do not have enough matching regulatory context to answer confidently.`,
      "",
      "Next steps:",
      "- Upload project documents with clauses or seed regulatory laws.",
      "- Ask again once the system has searchable context.",
      "",
      DISCLAIMER,
    ].join("\n");
  }

  const top = matches.slice(0, 3);
  const bullets = top
    .map((match, index) => {
      const cleanExcerpt = match.excerpt.replace(/\s+/g, " ").slice(0, 180);
      return `${index + 1}. ${match.title} - ${cleanExcerpt}. Action: review this source against the project facts.`;
    })
    .join("\n");

  return [
    "Short answer:",
    `${projectContext}the retrieved sources point to a few issues that should be reviewed before proceeding.`,
    "",
    "Top risks:",
    bullets,
    "",
    "Next steps:",
    "- Confirm which cited requirements apply to the project location and use.",
    "- Prioritize high-urgency permit, zoning, construction, heritage, parks, fire-safety, or payment issues.",
    "",
    DISCLAIMER,
  ].join("\n");
}

async function generateAIAnswer({
  question,
  profile,
  matches,
}: {
  question: string;
  profile?: ProjectProfile;
  matches: ChatMatchedExcerpt[];
}) {
  const context = matches
    .map(
      (match, index) =>
        `[${index + 1}] ${match.title}\nSource: ${match.source}\nExcerpt: ${match.excerpt}`,
    )
    .join("\n\n");

  const prompt = `You are Permit Radar AI, a regulatory and construction compliance assistant.

Answer the user's question using only the supplied context. Be concise, practical, and cite source numbers like [1] when relying on context.

${CLEAN_RESPONSE_INSTRUCTIONS}

Project profile:
${JSON.stringify(profile ?? null, null, 2)}

User question:
${question}

Retrieved context:
${context || "No retrieved context."}

Rules:
- Do not invent legal obligations beyond the supplied context.
- If the context is insufficient, say what is missing.
- Focus on urgency, affected permits/documents/subclauses, and recommended next actions.
- End with this exact disclaimer: ${DISCLAIMER}`;

  try {
    return await callAI(prompt, {
      systemPrompt:
        "Return a clean, scannable natural-language answer. Do not return JSON. Do not use markdown bold markers.",
    });
  } catch {
    return buildFallbackAnswer({ profile, matches });
  }
}

export async function answerRegulatoryChat({
  question,
  projectId,
  profile,
}: {
  question: string;
  projectId?: string;
  profile?: ProjectProfile;
}): Promise<ChatAnswer> {
  const [projectMatches, localMatches] = await Promise.all([
    getProjectSubclauseMatches({ projectId, question }),
    getLocalMatches({ question, profile }),
  ]);

  const seen = new Set<string>();
  const matchedExcerpts = [...projectMatches, ...localMatches]
    .filter((match) => {
      const key = `${match.source}:${match.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);

  const answer = await generateAIAnswer({
    question,
    profile,
    matches: matchedExcerpts,
  });

  return {
    answer,
    citations: matchedExcerpts.map(({ id, title, source }) => ({
      id,
      title,
      source,
    })),
    matchedExcerpts,
    disclaimer: DISCLAIMER,
  };
}
