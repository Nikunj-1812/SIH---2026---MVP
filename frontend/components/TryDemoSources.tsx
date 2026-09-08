"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_SOURCES, DemoSource } from '@/lib/demo-sources';
import { uploadFileApi, fetchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { ArrowRight, Sparkles, Loader2, FileText } from 'lucide-react';

interface TryDemoSourcesProps {
  currentProjectId?: string;
  className?: string;
}

export default function TryDemoSources({ currentProjectId, className = "" }: TryDemoSourcesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUseDemoSource = async (demo: DemoSource) => {
    if (loadingId) return; // Prevent duplicate ingestion
    setLoadingId(demo.id);
    try {
      // 1. Fetch static demo PDF file bytes from public folder
      toast("Loading demo document...", "info", `Fetching ${demo.filename}...`);
      const response = await fetch(demo.path);
      if (!response.ok) {
        throw new Error(`Failed to load static demo PDF (${response.status})`);
      }
      const blob = await response.blob();
      const file = new File([blob], demo.filename, { type: 'application/pdf' });

      // 2. Ensure target project workspace exists
      let targetProjectId = currentProjectId;
      if (!targetProjectId || targetProjectId === "new") {
        try {
          const newProj: any = await fetchApi('/api/projects', {
            method: 'POST',
            body: JSON.stringify({
              name: `${demo.title.slice(0, 45)} Workspace`,
              description: `Automated transformation workspace created for ${demo.filename}.`
            })
          });
          targetProjectId = newProj.id;
        } catch (e) {
          targetProjectId = "demo-proj-1";
        }
      }

      // 3. Upload file through real server-side security, extraction & canonical pipeline
      const safeProjectId = targetProjectId || "demo-proj-1";
      const formData = new FormData();
      formData.append('project_id', safeProjectId);
      formData.append('file', file);

      toast("⏳ Security scanning demo source...", "info", `Ingesting ${demo.filename}...`);
      const sourceData = await uploadFileApi('/api/sources/upload', formData);

      toast("✓ Demo source loaded. Transformation ready.", "success", `Uploaded ${demo.filename} (Security Score: ${sourceData.security_score}/100)`);

      // 4. Navigate directly into transformation workflow at Step 01 Source
      router.push(`/projects/${safeProjectId}?source_id=${sourceData.id}&step=source`);

    } catch (err: any) {
      console.error("Demo PDF launch error:", err);
      toast("Unable to load this demo document. Please try again.", "error", err.message || "Ingestion failed");
    } finally {
      setLoadingId(null);
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'PII & Privacy Audit':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Threat Defense Test':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Fact Integrity Test':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-blue-700" />
            <span>TRY DEMO SOURCES</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Experience the platform with curated sample documents
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select a bundled sample PDF to execute full security scanning, canonical context extraction, multi-output generation, and Hyperledger Fabric integrity proof.
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold bg-slate-100/90 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
          4 Demo Documents
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {DEMO_SOURCES.map((demo) => {
          const isLoading = loadingId === demo.id;
          return (
            <div
              key={demo.id}
              className="bg-slate-50/60 border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between hover:border-blue-300 hover:bg-white transition-all shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getCategoryBadgeStyle(demo.category)}`}>
                    {demo.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <FileText className="h-3 w-3 text-slate-400" />
                    {demo.pageCount} Pages
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 mt-2.5 line-clamp-2 leading-snug group-hover:text-blue-900">
                  {demo.title}
                </h3>

                <p className="text-[11px] text-slate-600 mt-2 line-clamp-3 font-normal leading-relaxed">
                  {demo.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <button
                  onClick={() => handleUseDemoSource(demo)}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer min-h-[36px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Ingesting PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>Use this PDF</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
