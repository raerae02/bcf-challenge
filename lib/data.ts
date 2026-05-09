import fs from "fs/promises";
import path from "path";
import type { Regulation, Alert } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export async function getRegulations(): Promise<Regulation[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "regulations.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getRegulationById(id: string): Promise<Regulation | null> {
  const all = await getRegulations();
  return all.find((r) => r.id === id) ?? null;
}

export async function getAlerts(): Promise<Alert[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "alerts.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getDocument(filename: string): Promise<string> {
  return fs.readFile(path.join(DATA_DIR, "documents", filename), "utf-8");
}

export async function getAllDocuments(): Promise<{ filename: string; content: string }[]> {
  const dir = path.join(DATA_DIR, "documents");
  try {
    const files = await fs.readdir(dir);
    const txtFiles = files.filter((f) => f.endsWith(".txt"));
    return Promise.all(
      txtFiles.map(async (filename) => ({
        filename,
        content: await fs.readFile(path.join(dir, filename), "utf-8"),
      }))
    );
  } catch {
    return [];
  }
}
