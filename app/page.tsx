"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegulatorySnapshot } from "@/lib/types";

const EXAMPLES = [
  "Je veux ouvrir une petite boulangerie sur la rue Saint-Denis dans le Plateau-Mont-Royal. Environ 800 pi², avec une petite terrasse et 4 employés.",
  "Je veux ouvrir une clinique médicale à NDG avec 3 salles d'examen et un appareil de radiologie.",
  "Je veux rénover un local commercial à Mile End pour ouvrir un café avec service d'alcool.",
];

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.md";
const MAX_FILE_SIZE_MB = 10;

type AttachedFile = { file: File; id: string };

export default function Home() {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [result, setResult] = useState<RegulatorySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | File[]) {
    setError(null);
    const filesArray = Array.from(newFiles);
    const validFiles: AttachedFile[] = [];

    for (const f of filesArray) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File "${f.name}" is too large (max ${MAX_FILE_SIZE_MB}MB).`);
        continue;
      }
      validFiles.push({ file: f, id: crypto.randomUUID() });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: Response;

      if (files.length > 0) {
        // Multipart upload
        const formData = new FormData();
        formData.append("description", description);
        for (const f of files) {
          formData.append("files", f.file, f.file.name);
        }
        res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        // JSON only (description)
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && (description.length >= 20 || files.length > 0);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-bold text-slate-900">Permit Radar AI</h1>
          <p className="text-slate-600 mt-2">
            Décrivez votre projet ou téléversez vos documents. Recevez tous les
            règlements applicables en quelques secondes.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Décrivez votre projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Je veux ouvrir une boulangerie..."
              className="min-h-32"
            />

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-slate-500">Exemples :</span>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setDescription(ex)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {ex.split(".")[0]}
                </button>
              ))}
            </div>

            {/* File upload zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = ""; // reset
                }}
              />
              <p className="text-sm text-slate-600">
                <span className="font-medium text-blue-600">
                  Cliquez pour téléverser
                </span>{" "}
                ou glissez-déposez
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, DOCX, TXT, MD — max {MAX_FILE_SIZE_MB}MB par fichier
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Idéal pour : contrats, baux, plans d&apos;affaires, devis
              </p>
            </div>

            {/* List of attached files */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between bg-slate-100 rounded p-2 text-sm"
                  >
                    <span className="truncate">
                      📄 {f.file.name}{" "}
                      <span className="text-slate-500">
                        ({(f.file.size / 1024).toFixed(0)} KB)
                      </span>
                    </span>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={analyze} disabled={!canSubmit}>
              {loading ? "Analyse en cours..." : "Analyser le projet"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6 text-red-800">
              <strong>Erreur :</strong> {error}
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>
                {result.totalApplicableRules} règlements applicables — Risque{" "}
                {result.riskOverview}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
