"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Check, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { COCKTAILS } from "@/app/(dashboard)/cocktails/data";

interface ScannedLine {
  name: string;
  quantity: number;
  matchedNom: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (sales: Record<string, number>) => void;
}

function findBestMatch(name: string): string {
  const lower = name.toLowerCase();
  const exact = COCKTAILS.find((c) => c.nom.toLowerCase() === lower);
  if (exact) return exact.nom;
  const contains = COCKTAILS.find(
    (c) => c.nom.toLowerCase().includes(lower) || lower.includes(c.nom.toLowerCase())
  );
  if (contains) return contains.nom;
  return "";
}

export function ScanTicketVentesModal({ open, onClose, onImport }: Props) {
  const [step, setStep] = useState<"capture" | "review">("capture");
  const [scanning, setScanning] = useState(false);
  const [lines, setLines] = useState<ScannedLine[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("capture");
    setLines([]);
    setError("");
    setScanning(false);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  async function processImage(file: File) {
    setScanning(true);
    setError("");

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || "image/jpeg";
      const cocktailNames = COCKTAILS.map((c) => c.nom);

      const res = await fetch("/api/scan-ticket-ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, cocktailNames }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      const scanned: ScannedLine[] = (data.items ?? []).map(
        (i: { name: string; quantity: number }) => ({
          name: i.name,
          quantity: Math.max(0, Math.round(i.quantity)),
          matchedNom: findBestMatch(i.name),
        })
      );

      if (scanned.length === 0) {
        setError("Aucune vente détectée. Essayez avec une photo plus nette.");
        setScanning(false);
        return;
      }

      setLines(scanned);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setScanning(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  }

  function updateLine(idx: number, field: keyof ScannedLine, value: string | number) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleConfirm() {
    const result: Record<string, number> = {};
    for (const line of lines) {
      if (line.matchedNom && line.quantity > 0) {
        result[line.matchedNom] = (result[line.matchedNom] ?? 0) + line.quantity;
      }
    }
    if (Object.keys(result).length === 0) return;
    onImport(result);
    handleClose();
  }

  if (!open) return null;

  const validCount = lines.filter((l) => l.matchedNom && l.quantity > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900 text-lg">
            {step === "capture" && "Scanner un ticket de caisse"}
            {step === "review" && `Vérifier les ventes (${lines.length})`}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === "capture" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Prenez en photo votre ticket de caisse ou rapport de ventes. L&apos;IA extraira automatiquement les cocktails et quantités.
              </p>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {scanning ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500">Analyse en cours…</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Camera size={28} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Prendre une photo</span>
                  </button>
                  <button
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.removeAttribute("capture");
                        fileRef.current.click();
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    <Upload size={28} className="text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Importer un fichier</span>
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Vérifiez les cocktails détectés. Associez chaque ligne au nom exact dans BarStock.
              </p>
              {lines.map((line, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Détecté : {line.name}
                    </span>
                    <button onClick={() => removeLine(idx)} className="p-1 rounded hover:bg-red-50 text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <select
                        value={line.matchedNom}
                        onChange={(e) => updateLine(idx, "matchedNom", e.target.value)}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                      >
                        <option value="">— Choisir un cocktail —</option>
                        {COCKTAILS.map((c) => (
                          <option key={c.nom} value={c.nom}>{c.nom}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 0)}
                      className="w-20 text-center border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="1"
                    />
                  </div>
                  {!line.matchedNom && (
                    <p className="text-xs text-amber-600">Aucune correspondance — sélectionnez manuellement</p>
                  )}
                </div>
              ))}

              <button
                onClick={reset}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Rescanner une autre photo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "review" && (
          <div className="px-5 py-4 border-t flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={validCount === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Importer {validCount} cocktail{validCount > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
