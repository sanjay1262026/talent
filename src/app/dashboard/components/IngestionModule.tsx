"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  Files,
  ScanSearch,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import type { ScreeningResult, Weights } from "../DashboardClient";
import { JOB_TEMPLATES, SKILL_TAXONOMY } from "@/lib/skills-taxonomy";

interface IngestionModuleProps {
  weights: Weights;
  onScreeningComplete: (result: ScreeningResult) => void;
}

export function IngestionModule({ weights, onScreeningComplete }: IngestionModuleProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [useSample, setUseSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractedSkills = (() => {
    if (!jobDescription) return [];
    const allSkills = Object.values(SKILL_TAXONOMY).flat();
    return allSkills.filter(skill => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      return new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, "i").test(jobDescription);
    }).slice(0, 18);
  })();

  const years = jobDescription.match(/(\d+)\+?\s*years?/i)?.[1];
  const degree = /ph\.?d|doctorate/i.test(jobDescription)
    ? "Doctorate"
    : /master|m\.?s\.?|mba/i.test(jobDescription)
      ? "Master's"
      : /bachelor|b\.?s\.?/i.test(jobDescription)
        ? "Bachelor's"
        : "Not specified";

  const loadTemplate = (key: string) => {
    const template = JOB_TEMPLATES[key as keyof typeof JOB_TEMPLATES];
    if (!template) return;
    setJobTitle(template.title);
    setJobDescription(template.description);
    setSessionName(`${template.title} pipeline`);
    setError("");
  };

  const addFiles = useCallback((incoming: File[]) => {
    const supported = incoming.filter(file => /\.(pdf|docx|txt)$/i.test(file.name));
    setFiles(previous => {
      const existing = new Set(previous.map(file => file.name));
      return [...previous, ...supported.filter(file => !existing.has(file.name))];
    });
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    addFiles(Array.from(event.dataTransfer.files));
  }, [addFiles]);

  const runScreening = async () => {
    if (!jobDescription.trim()) return setError("Add a job description before running the screen.");
    if (!useSample && files.length === 0) return setError("Add at least one resume or enable the demonstration dataset.");

    setLoading(true);
    setError("");
    setProgress("Reading requirements");
    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("jobTitle", jobTitle);
      formData.append("sessionName", sessionName || `${jobTitle || "Untitled role"} — ${new Date().toLocaleDateString()}`);
      formData.append("weights", JSON.stringify(weights));
      formData.append("useSampleData", String(useSample));
      if (!useSample) files.forEach(file => formData.append("resumes", file));

      const timer = window.setTimeout(() => setProgress("Computing candidate evidence"), 500);
      const response = await fetch("/api/screen", { method: "POST", body: formData });
      window.clearTimeout(timer);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The screening run could not be completed.");
      setProgress("Building the ranking");
      await new Promise(resolve => setTimeout(resolve, 250));
      onScreeningComplete(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The screening run could not be completed.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="workspace-narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Screening workspace</div>
          <h1 className="page-title">Turn a resume pile into an evidence-based shortlist.</h1>
          <p className="page-description">Define the role, add candidate documents, and generate a transparent ranking with skill, semantic, experience, and education evidence.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-[#dfe3ea] bg-white p-2 lg:flex">
          {["Define role", "Add resumes", "Review ranking"].map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-[#375dfb] text-white" : "bg-[#f0f2f5] text-[#8b8f98]"}`}>{index + 1}</span>
              <span className={`text-[10px] font-semibold ${index === 0 ? "text-[#30333a]" : "text-[#9a9ea8]"}`}>{label}</span>
              {index < 2 && <ArrowRight size={12} className="mx-1 text-[#c2c5cc]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <div>
              <h2 className="panel-title"><BriefcaseBusiness size={16} /> Role specification</h2>
              <p className="panel-subtitle">The description becomes the source of truth for scoring.</p>
            </div>
            <span className="rounded-full bg-[#edf1ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#3152d5]">Step 01</span>
          </div>
          <div className="panel-body space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="session-name">Screening name</label>
                <input id="session-name" className="input-field" value={sessionName} onChange={event => setSessionName(event.target.value)} placeholder="Q3 engineering pipeline" />
              </div>
              <div>
                <label className="form-label" htmlFor="job-title">Role title</label>
                <input id="job-title" className="input-field" value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="Senior platform engineer" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="form-label !mb-0" htmlFor="template">Start from a role template</label>
                <span className="text-[10px] text-[#9a9ea8]">Optional</span>
              </div>
              <div className="relative">
                <select id="template" className="input-field pr-10" defaultValue="" onChange={event => event.target.value && loadTemplate(event.target.value)}>
                  <option value="" disabled>Select a validated template</option>
                  {Object.keys(JOB_TEMPLATES).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 text-[#8c9099]" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="form-label !mb-0" htmlFor="job-description">Job description</label>
                <span className="text-[10px] tabular-nums text-[#9a9ea8]">{jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0} words</span>
              </div>
              <textarea
                id="job-description"
                className="input-field min-h-[330px]"
                value={jobDescription}
                onChange={event => setJobDescription(event.target.value)}
                placeholder="Paste the complete role brief, including responsibilities, required skills, experience, and education..."
              />
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="panel overflow-hidden">
            <div className="panel-header">
              <div>
                <h2 className="panel-title"><UploadCloud size={16} /> Candidate documents</h2>
                <p className="panel-subtitle">PDF, DOCX, and TXT up to 10 MB. PDFs must contain selectable text.</p>
              </div>
              <span className="rounded-full bg-[#f1f2f4] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#70747d]">Step 02</span>
            </div>
            <div className="panel-body">
              <div className="mb-4 flex items-center justify-between rounded-[10px] border border-[#e3e6eb] bg-[#f8f9fb] p-3">
                <div>
                  <div className="text-[11px] font-semibold text-[#30333a]">Use demonstration dataset</div>
                  <div className="mt-0.5 text-[10px] text-[#858993]">Eight varied candidate profiles</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useSample}
                  onClick={() => setUseSample(value => !value)}
                  className={`relative h-6 w-11 rounded-full transition ${useSample ? "bg-[#375dfb]" : "bg-[#ccd0d7]"}`}
                >
                  <span className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${useSample ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {useSample ? (
                <div className="flex min-h-[166px] flex-col items-center justify-center rounded-xl border border-[#d7dfff] bg-[#f5f7ff] p-6 text-center">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-[#375dfb] shadow-sm"><Files size={19} /></div>
                  <div className="text-[12px] font-semibold text-[#25366f]">Dataset ready for analysis</div>
                  <div className="mt-1 max-w-[250px] text-[10px] leading-4 text-[#68739a]">Includes engineering, data, research, and operations backgrounds across seniority levels.</div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={event => { event.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex min-h-[166px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${dragOver ? "border-[#375dfb] bg-[#f4f6ff]" : "border-[#cfd3db] bg-[#fafbfc] hover:border-[#879dfd] hover:bg-[#f8f9ff]"}`}
                  >
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-[#e0e3e9] bg-white text-[#375dfb] shadow-sm"><UploadCloud size={19} /></div>
                    <span className="text-[12px] font-semibold text-[#30333a]">Drop resumes or choose files</span>
                    <span className="mt-1 text-[10px] text-[#8a8e97]">Multiple documents supported</span>
                  </button>
                  <input ref={fileInputRef} className="hidden" type="file" multiple accept=".pdf,.docx,.txt" onChange={event => addFiles(Array.from(event.target.files || []))} />
                </>
              )}

              {!useSample && files.length > 0 && (
                <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                  {files.map(file => (
                    <div key={file.name} className="flex items-center gap-3 rounded-[9px] border border-[#e5e7eb] bg-white p-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f4ff] text-[#375dfb]"><FileText size={15} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-semibold text-[#30333a]">{file.name}</div>
                        <div className="mt-0.5 text-[9px] text-[#9a9ea8]">{(file.size / 1024).toFixed(1)} KB · Ready</div>
                      </div>
                      <Check size={13} className="text-[#16865c]" />
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(previous => previous.filter(item => item.name !== file.name))} className="grid h-7 w-7 place-items-center rounded-md text-[#9a9ea8] transition hover:bg-[#fff0f2] hover:text-[#c63d4d]"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {jobDescription && (
            <section className="panel overflow-hidden fade-up">
              <div className="panel-header !py-3.5">
                <h2 className="panel-title"><ScanSearch size={15} /> Requirement signals</h2>
                <span className="text-[10px] font-semibold text-[#16865c]">Live extraction</span>
              </div>
              <div className="panel-body !py-4">
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#f7f8fa] p-3">
                    <div className="text-[9px] uppercase tracking-[.08em] text-[#8a8e97]">Experience</div>
                    <div className="mt-1 text-[12px] font-semibold text-[#30333a]">{years ? `${years}+ years` : "Not specified"}</div>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fa] p-3">
                    <div className="text-[9px] uppercase tracking-[.08em] text-[#8a8e97]">Education</div>
                    <div className="mt-1 text-[12px] font-semibold text-[#30333a]">{degree}</div>
                  </div>
                </div>
                <div className="tag-row">
                  {extractedSkills.length > 0 ? extractedSkills.map(skill => <span className="skill-tag-blue" key={skill}>{skill}</span>) : <span className="text-[10px] text-[#8a8e97]">Add explicit skills to improve extraction quality.</span>}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[14px] bg-[#111318] p-5 text-white shadow-[0_18px_40px_rgba(17,19,24,.14)]">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#375dfb]"><Sparkles size={17} /></div>
              <div>
                <div className="text-[12px] font-semibold">Ready to build your shortlist</div>
                <div className="mt-1 text-[10px] leading-4 text-[#8f949e]">Each score remains traceable to extracted evidence and your current weight configuration.</div>
              </div>
            </div>
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#60343a] bg-[#2b1c20] p-3 text-[10px] leading-4 text-[#f2a4ad]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
              </div>
            )}
            <button type="button" disabled={loading} onClick={runScreening} className="btn btn-primary btn-lg w-full !border-[#5272fc] !bg-[#375dfb]">
              {loading ? <><span className="loading-spinner" />{progress}</> : <><ScanSearch size={16} />Run screening<ArrowRight size={15} /></>}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
