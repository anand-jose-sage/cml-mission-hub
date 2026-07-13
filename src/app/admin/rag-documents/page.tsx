"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileSearch, UploadCloud, Trash2, RotateCcw, CheckCircle2,
  AlertCircle, Loader2, ChevronDown, FileText,
} from "lucide-react";
import {
  uploadRagDocument, listRagDocuments, reprocessRagDocument, deleteRagDocument,
  type RagDocumentRow,
} from "@/actions/rag";

// ─── Option lists ───────────────────────────────────────────────────────────

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "annual_plan", label: "Annual Plan" },
  { value: "state_circular", label: "State Circular" },
  { value: "diocese_circular", label: "Diocese Circular" },
  { value: "meghala_circular", label: "Meghala Circular" },
  { value: "shakha_guideline", label: "Shakha Guideline" },
  { value: "competition_rules", label: "Competition Rules" },
  { value: "quiz_rules", label: "Quiz Rules" },
  { value: "notification", label: "Notification" },
  { value: "training_manual", label: "Training Manual" },
  { value: "formation_guide", label: "Formation Guide" },
];

const ORG_LEVELS = ["State", "Diocese", "Meghala", "Shakha"];
const LANGUAGES = ["Malayalam", "English", "Mixed"];
const COMPETITIONS = [
  "Speech", "Quiz", "Bible Quiz", "Essay", "Poem", "Group Song",
  "Margamkali", "Pencil Drawing", "Mono Act", "Other",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.value, d.label])
);

// ─── Main page ──────────────────────────────────────────────────────────────

export default function RagDocumentsPage() {
  const [docs, setDocs] = useState<RagDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [year, setYear] = useState(new Date().getFullYear());
  const [organizationLevel, setOrganizationLevel] = useState(ORG_LEVELS[0]);
  const [language, setLanguage] = useState(LANGUAGES[1]);
  const [competition, setCompetition] = useState("");
  const [month, setMonth] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listRagDocuments();
    if (res.data) setDocs(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleUpload = async () => {
    if (!file) { showMsg("err", "Choose a PDF file first."); return; }
    if (!title.trim()) { showMsg("err", "Enter a title."); return; }

    setUploading(true);
    const res = await uploadRagDocument(file, {
      title: title.trim(),
      documentType,
      year,
      organizationLevel,
      language,
      competition: competition || null,
      month: month || null,
    });
    setUploading(false);

    if (res.error) {
      showMsg("err", res.error);
      return;
    }
    showMsg("ok", "Document processed and ready.");
    setFile(null);
    setTitle("");
    setCompetition("");
    setMonth("");
    await load();
  };

  const handleReprocess = async (id: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    const res = await reprocessRagDocument(id);
    setBusy((b) => { const c = { ...b }; delete c[id]; return c; });
    if (res.error) showMsg("err", res.error);
    else showMsg("ok", "Reprocessed.");
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document and its indexed chunks? This cannot be undone.")) return;
    setBusy((b) => ({ ...b, [id]: true }));
    const res = await deleteRagDocument(id);
    setBusy((b) => { const c = { ...b }; delete c[id]; return c; });
    if (res.error) { showMsg("err", res.error); return; }
    setDocs((rows) => rows.filter((r) => r.id !== id));
  };

  const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-purple-200 bg-white w-full";
  const selectCls = `${inputCls} pr-8 appearance-none`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0EA5A4] to-[#22D3EE] flex items-center justify-center shrink-0">
          <FileSearch size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Documents</h1>
          <p className="text-xs text-gray-500">Upload circulars, rules, and guides for the CML Document Assistant</p>
        </div>
      </div>

      {/* Message banner */}
      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {/* Upload form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Upload a document</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. State Circular — July 2026" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Document Type</label>
            <div className="relative">
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className={selectCls}>
                {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || year)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Organization Level</label>
            <div className="relative">
              <select value={organizationLevel} onChange={(e) => setOrganizationLevel(e.target.value)} className={selectCls}>
                {ORG_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
            <div className="relative">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Competition (optional)</label>
            <div className="relative">
              <select value={competition} onChange={(e) => setCompetition(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {COMPETITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month (optional)</label>
            <div className="relative">
              <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50 transition-colors"
          style={{ background: "linear-gradient(135deg,#0EA5A4,#22D3EE)" }}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {uploading ? "Processing…" : "Upload & Process"}
        </button>
      </div>

      {/* Listing */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-2 text-gray-400">
          <FileText size={24} />
          <p className="text-sm font-medium">No documents uploaded yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl overflow-hidden border border-[#1e1b4b] shadow-md mb-4">
            <table className="w-full text-sm min-w-[720px]">
              <thead style={{ background: "linear-gradient(90deg,#cffafe,#ecfeff)" }}>
                <tr className="border-b-2" style={{ borderColor: "#67e8f9" }}>
                  {["Title", "Type", "Year", "Level", "Language", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider whitespace-nowrap" style={{ color: "#0e7490" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr key={d.id} className="border-b" style={{ borderColor: "#e5e7eb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td className="px-3 py-3">
                      <p className="font-bold text-[14px] leading-tight" style={{ color: "#1e1b4b" }}>{d.title}</p>
                      {d.competition && <span className="text-[11px] font-semibold text-gray-500">{d.competition}</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[13px] font-semibold text-gray-700">{DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type}</td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-gray-700">{d.year}</td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-gray-700">{d.organization_level}</td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-gray-700">{d.language}</td>
                    <td className="px-3 py-3"><StatusPill status={d.status} error={d.error_message} /></td>
                    <td className="px-3 py-3">
                      <RowActions doc={d} busy={!!busy[d.id]} onReprocess={handleReprocess} onDelete={handleDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2.5 mb-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-white rounded-xl overflow-hidden p-3.5" style={{ border: "1.5px solid #e5e7eb", boxShadow: "0 2px 8px rgba(14,165,164,0.06)" }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-[15px] font-black leading-tight" style={{ color: "#1e1b4b" }}>{d.title}</p>
                  <StatusPill status={d.status} error={d.error_message} />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  <Tag>{DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type}</Tag>
                  <Tag>{d.year}</Tag>
                  <Tag>{d.organization_level}</Tag>
                  <Tag>{d.language}</Tag>
                  {d.competition && <Tag>{d.competition}</Tag>}
                  {d.month && <Tag>{d.month}</Tag>}
                </div>
                <RowActions doc={d} busy={!!busy[d.id]} onReprocess={handleReprocess} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Small pieces ───────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: "#ecfeff", color: "#0e7490" }}>
      {children}
    </span>
  );
}

function StatusPill({ status, error }: { status: RagDocumentRow["status"]; error: string | null }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-green-50 text-green-700">
        <CheckCircle2 size={12} /> Ready
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span title={error ?? undefined} className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-red-50 text-red-600">
        <AlertCircle size={12} /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
      <Loader2 size={12} className="animate-spin" /> Processing
    </span>
  );
}

function RowActions({
  doc, busy, onReprocess, onDelete,
}: {
  doc: RagDocumentRow;
  busy: boolean;
  onReprocess: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {doc.status === "failed" && (
        <button
          onClick={() => onReprocess(doc.id)}
          disabled={busy}
          className="flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border-none cursor-pointer disabled:opacity-50"
          style={{ background: "#ecfeff", color: "#0e7490" }}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
          Reprocess
        </button>
      )}
      <button
        onClick={() => onDelete(doc.id)}
        disabled={busy}
        className="flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border-none cursor-pointer disabled:opacity-50 bg-red-50 text-red-600"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
}
