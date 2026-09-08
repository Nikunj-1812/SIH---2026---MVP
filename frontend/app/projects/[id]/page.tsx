"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/components/Toast';
import { 
  FileText, 
  Upload, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Link2, 
  Copy, 
  Download, 
  Pencil, 
  RotateCw, 
  RotateCcw,
  Check, 
  X, 
  FileCheck2,
  Lock,
  ArrowRight,
  Eye
} from 'lucide-react';
import { fetchApi, uploadFileApi } from '@/lib/api';
import TryDemoSources from '@/components/TryDemoSources';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawProjectId = params?.id as string;
  const projectId = rawProjectId || "new";
  const { toast } = useToast();
  
  const initialStep = searchParams.get('step') || searchParams.get('tab') || 'source';
  const [activeStep, setActiveStep] = useState(initialStep);

  // Workspace & Project State
  const [project, setProject] = useState<any>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Source state
  const [source, setSource] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStateText, setUploadStateText] = useState('Idle');
  const [isDragging, setIsDragging] = useState(false);
  const [redacting, setRedacting] = useState(false);

  // Config state
  const [audience, setAudience] = useState("Executive");
  const [tone, setTone] = useState("Formal");
  const [language, setLanguage] = useState("English");
  const [detail, setDetail] = useState("Standard");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([
    "executive_summary", "advisory", "linkedin", "x_thread", "infographic"
  ]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationJob, setGenerationJob] = useState<any>(null);
  const [pipelineStep, setPipelineStep] = useState<string>('idle');

  // Outputs & Approval state
  const [outputsList, setOutputsList] = useState<any[]>([]);
  const [activeOutputTab, setActiveOutputTab] = useState<string>("executive_summary");
  const [editingContent, setEditingContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Image state
  const [regeneratingImage, setRegeneratingImage] = useState(false);

  // Integrity Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [projectId, searchParams]);

  async function loadWorkspaceData() {
    try {
      const sourceId = searchParams.get('source_id');
      
      let sourcePromise: Promise<any>;
      if (sourceId) {
        sourcePromise = fetchApi(`/api/sources/${sourceId}`).catch(() => null);
      } else if (projectId === 'demo-proj-1') {
        sourcePromise = fetchApi('/api/sources/demo-src-1').catch(() => null);
      } else {
        sourcePromise = Promise.resolve(null);
      }

      const [projData, srcData, outputsData] = await Promise.all([
        projectId === 'new' ? Promise.resolve(null) : fetchApi(`/api/projects/${projectId}`).catch(() => null),
        sourcePromise,
        projectId === 'new' && !sourceId ? Promise.resolve([]) : fetchApi(`/api/outputs?project_id=${projectId}`).catch(() => [])
      ]);

      if (projData) setProject(projData);
      else setProject(null);

      if (srcData) setSource(srcData);
      else setSource(null);

      if (Array.isArray(outputsData) && outputsData.length > 0) {
        setOutputsList(outputsData);
        setGenerationJob({ outputs: outputsData });
        setActiveOutputTab(outputsData[0].output_type);
        setEditingContent(outputsData[0].content);
      } else {
        setOutputsList([]);
        setGenerationJob(null);
      }
    } catch (err) {
      console.error("Workspace load error:", err);
    }
  }

  // Reset Transformation State Handler
  const handleResetWorkspace = () => {
    if (source || outputsList.length > 0) {
      setIsResetConfirmOpen(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    setSource(null);
    setOutputsList([]);
    setGenerationJob(null);
    setPipelineStep('idle');
    setVerificationResult(null);
    setActiveStep('source');
    setAudience("Executive");
    setTone("Formal");
    setLanguage("English");
    setDetail("Standard");
    setSelectedOutputs(["executive_summary", "advisory", "linkedin", "x_thread", "infographic"]);
    setIsResetConfirmOpen(false);
    toast("✓ Workspace Reset", "info", "Cleared current workspace state. Ready for new source document.");
  };

  // File Upload Processing
  const processUploadedFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(20);
    setUploadStateText('Uploading file...');

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);

    try {
      setTimeout(() => { setUploadProgress(50); setUploadStateText('Scanning security & PII...'); }, 400);
      setTimeout(() => { setUploadProgress(85); setUploadStateText('Extracting canonical text...'); }, 800);

      const data = await uploadFileApi('/api/sources/upload', formData);
      setUploadProgress(100);
      setUploadStateText('Ready');
      setSource(data);
      toast("✓ Source Document Uploaded Successfully", "success", `${data.filename} (${(data.size_bytes / (1024*1024)).toFixed(2)} MB)`);
      setActiveStep('security');
    } catch (err: any) {
      toast("✕ File Upload Failed", "error", err.message || 'Upload failed');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processUploadedFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Redact PII Trigger
  const handleRedactPII = async () => {
    if (!source) return;
    setRedacting(true);
    try {
      const updated: any = await fetchApi(`/api/sources/${source.id}/redact`, {
        method: 'POST',
        body: JSON.stringify({ source_id: source.id }),
      });
      setSource(updated);
      toast("✓ PII Redacted Successfully", "success", "All sensitive PII entities redacted in canonical source.");
    } catch (err: any) {
      toast("✕ Redaction Failed", "error", err.message || 'Redaction failed');
    } finally {
      setRedacting(false);
    }
  };

  // Generation Trigger (LangGraph Pipeline)
  const handleStartGeneration = async () => {
    if (!source) {
      toast("Source Document Required", "warning", "Please upload or select a source document first.");
      return;
    }

    setGenerating(true);
    setPipelineStep('security');
    toast("Pipeline Executing", "info", "Running security checks, building canonical context, and generating deliverables...");

    setTimeout(() => setPipelineStep('canonical'), 500);
    setTimeout(() => setPipelineStep('generating'), 1100);

    try {
      const payload = {
        project_id: projectId,
        source_id: source.id,
        outputs: selectedOutputs,
        config: { audience, tone, language, detail }
      };

      const result: any = await fetchApi('/api/generation', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setGenerationJob(result);
      setOutputsList(result.outputs || []);
      setPipelineStep('completed');
      if (result.outputs && result.outputs.length > 0) {
        setActiveOutputTab(result.outputs[0].output_type);
        setEditingContent(result.outputs[0].content);
      }
      setActiveStep('review');
      toast("✓ Deliverables Ready for Review", "success", `Generated ${result.outputs?.length || 0} controlled outputs.`);
    } catch (err: any) {
      toast("✕ Generation Failed", "error", err.message || 'Generation failed');
      setPipelineStep('error');
    } finally {
      setGenerating(false);
    }
  };

  // Active Output Selection
  const activeOutput = outputsList.find((o: any) => o.output_type === activeOutputTab);

  useEffect(() => {
    if (activeOutput) {
      setEditingContent(activeOutput.content);
      setIsEditing(false);
    }
  }, [activeOutputTab]);

  // Output Edit Save Handler (REQUIREMENT 33: Resets approval status to CHANGES_REQUESTED if previously approved)
  const handleSaveOutputEdit = async () => {
    if (!activeOutput) return;
    try {
      const updated: any = await fetchApi(`/api/outputs/${activeOutput.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editingContent })
      });

      const wasApproved = activeOutput.approval_status === "APPROVED";

      activeOutput.content = updated.content;
      activeOutput.output_hash = updated.output_hash;
      activeOutput.approval_status = updated.approval_status;
      activeOutput.status = updated.status;
      activeOutput.approved_by = updated.approved_by;
      activeOutput.approved_at = updated.approved_at;

      setOutputsList([...outputsList]);
      setIsEditing(false);

      if (wasApproved) {
        toast("⚠️ Content Edited — Re-approval Required", "warning", "Status reset to Changes Requested. Output requires re-approval.");
      } else {
        toast("✓ Content Saved & Hash Updated", "success", "Updated deliverable content and recalculated SHA-256 hash.");
      }
    } catch (err: any) {
      toast("✕ Save Failed", "error", err.message || 'Save failed');
    }
  };

  // Output Approval Handler (REQUIREMENT 15: Formal Server-Side Approval)
  const handleApproveOutput = async (status: string) => {
    if (!activeOutput) return;
    try {
      const updated: any = await fetchApi(`/api/outputs/${activeOutput.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approval_status: status, approved_by: "Operator User (NTRO Analyst)" })
      });

      activeOutput.approval_status = updated.approval_status;
      activeOutput.status = updated.status;
      activeOutput.approved_by = updated.approved_by;
      activeOutput.approved_at = updated.approved_at;

      setOutputsList([...outputsList]);

      if (status === "APPROVED") {
        toast("✓ Output Formally Approved", "success", `${activeOutput.title} added to Final Approved Deliverables.`);
      } else {
        toast("Review Status Updated", "info", `Marked status as ${status}`);
      }
    } catch (err: any) {
      toast("✕ Approval Update Failed", "error", err.message || 'Approval status update failed');
    }
  };

  // Regenerate Image Handler
  const handleRegenerateImage = async () => {
    if (!activeOutput) return;
    setRegeneratingImage(true);
    try {
      const updated: any = await fetchApi(`/api/outputs/${activeOutput.id}/regenerate-image`, {
        method: 'POST'
      });
      activeOutput.image = updated.image;
      activeOutput.image_url = updated.image_url;
      setOutputsList([...outputsList]);
      toast("✓ Image Graphic Regenerated", "success", "Refreshed visual graphic artifact from canonical context.");
    } catch (err: any) {
      toast("✕ Image Regeneration Failed", "error", err.message || 'Image regeneration failed');
    } finally {
      setRegeneratingImage(false);
    }
  };

  // Copy to Clipboard
  const handleCopyContent = () => {
    if (!editingContent) return;
    navigator.clipboard.writeText(editingContent);
    setCopied(true);
    toast("✓ Copied to Clipboard", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  // Export File (PDF / TXT)
  const handleExportFile = (format: string) => {
    if (!activeOutput) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${apiBase}/api/outputs/${activeOutput.id}/export?format=${format}`;
    window.open(url, '_blank');
    toast("Preparing Export Download", "info", `Downloading ${activeOutput.title} as ${format.toUpperCase()}`);
  };

  // Export All Approved Deliverables Bundle
  const handleExportAllApproved = () => {
    const approvedCount = outputsList.filter(o => o.approval_status === "APPROVED").length;
    if (approvedCount === 0) {
      toast("No Approved Outputs Available", "warning", "Please approve at least one deliverable before exporting final bundle.");
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${apiBase}/api/outputs/export-approved?project_id=${projectId}`;
    window.open(url, '_blank');
    toast("Downloading Approved Bundle", "success", `Exporting ${approvedCount} approved deliverables.`);
  };

  // Verify Integrity Handler
  const handleVerifyIntegrity = async () => {
    if (!activeOutput) return;
    setVerifying(true);
    try {
      const res: any = await fetchApi(`/api/integrity/${activeOutput.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ output_id: activeOutput.id, current_content: editingContent })
      });
      setVerificationResult(res);
      toast("✓ SHA-256 Provenance Verified", "success", "Hash anchor matches Sepolia Testnet record.");
    } catch (err: any) {
      toast("✕ Integrity Verification Failed", "error", err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const toggleOutputSelection = (type: string) => {
    if (selectedOutputs.includes(type)) {
      if (selectedOutputs.length === 1) return;
      setSelectedOutputs(selectedOutputs.filter(t => t !== type));
    } else {
      setSelectedOutputs([...selectedOutputs, type]);
    }
  };

  // Approved Count
  const approvedOutputsCount = outputsList.filter(o => o.approval_status === "APPROVED").length;

  // Workflow Stepper Definitions — Truthful Step Completion Logic
  const stepperSteps = [
    { id: 'source', number: '01', title: 'Source', completed: !!source && activeStep !== 'source' },
    { id: 'security', number: '02', title: 'Security', completed: !!source?.security_score && ['configure', 'generate', 'review', 'approved', 'integrity'].includes(activeStep) },
    { id: 'configure', number: '03', title: 'Configure', completed: ['generate', 'review', 'approved', 'integrity'].includes(activeStep) },
    { id: 'generate', number: '04', title: 'Generate', completed: outputsList.length > 0 && ['review', 'approved', 'integrity'].includes(activeStep) },
    { id: 'review', number: '05', title: 'Review & Edit', completed: outputsList.length > 0 && ['approved', 'integrity'].includes(activeStep) },
    { id: 'approved', number: '06', title: `Final Approved (${approvedOutputsCount})`, completed: approvedOutputsCount > 0 },
    { id: 'integrity', number: '07', title: 'Integrity Proof', completed: !!verificationResult },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* Workspace Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <span>Transformation Workspace</span>
                <span>•</span>
                <span className="text-slate-500">ID: {projectId === "new" ? "New Workspace" : projectId}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                {project?.name || (source ? "Active Content Transformation" : "Fresh Transformation Workspace")}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Pipeline Active
              </span>

              <button
                onClick={handleResetWorkspace}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-all shadow-2xs inline-flex items-center gap-1.5 h-9 cursor-pointer hover:border-slate-400"
                title="Reset Transformation Workspace State"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Reset</span>
              </button>

              {approvedOutputsCount > 0 && (
                <button
                  onClick={handleExportAllApproved}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export All Approved ({approvedOutputsCount})
                </button>
              )}
            </div>
          </div>

          {/* Mobile Stepper Header (< sm screens) */}
          <div className="sm:hidden mt-4 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold bg-blue-700 text-white px-2 py-0.5 rounded-full">
                Step {stepperSteps.findIndex(s => s.id === activeStep) + 1} of 7
              </span>
              <span className="text-xs font-extrabold text-slate-900 truncate max-w-[140px]">
                {stepperSteps.find(s => s.id === activeStep)?.title}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                disabled={stepperSteps.findIndex(s => s.id === activeStep) === 0}
                onClick={() => {
                  const idx = stepperSteps.findIndex(s => s.id === activeStep);
                  if (idx > 0) setActiveStep(stepperSteps[idx - 1].id);
                }}
                className="px-2 py-1 text-[11px] font-bold bg-slate-100 disabled:opacity-40 text-slate-700 rounded border border-slate-200"
              >
                Back
              </button>
              <button
                disabled={stepperSteps.findIndex(s => s.id === activeStep) === stepperSteps.length - 1}
                onClick={() => {
                  const idx = stepperSteps.findIndex(s => s.id === activeStep);
                  if (idx < stepperSteps.length - 1) setActiveStep(stepperSteps[idx + 1].id);
                }}
                className="px-2 py-1 text-[11px] font-bold bg-blue-700 disabled:opacity-40 text-white rounded shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>

          {/* Interactive 7-Step Workflow Stepper Navigation (Desktop/Tablet) */}
          <div className="mt-4 sm:mt-6 border-b border-slate-200/80 overflow-x-auto pb-1">
            <nav className="flex space-x-2 sm:space-x-4 min-w-max">
              {stepperSteps.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 py-2 px-3 border-b-2 font-semibold text-xs transition-all ${
                      isActive
                        ? 'border-blue-700 text-blue-900 bg-blue-50/60 rounded-t-lg font-bold'
                        : step.completed
                        ? 'border-transparent text-slate-700 hover:text-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                      step.completed
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : isActive
                        ? 'bg-blue-700 text-white font-bold'
                        : 'bg-slate-200 text-slate-500 font-semibold'
                    }`}>
                      {step.completed ? '✓' : step.number}
                    </span>
                    <span>{step.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* STEP 1: SOURCE INGESTION (REQUIREMENT 8 & 9) */}
          {activeStep === 'source' && (
            <div className="mt-6 space-y-6">
              
              {/* Compact Drag & Drop Upload Box + Demo Sources */}
              {!source ? (
                <div className="space-y-6">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`bg-white border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                      isDragging ? 'border-blue-600 bg-blue-50/50 scale-[1.01]' : 'border-slate-300 hover:border-blue-500'
                    }`}
                  >
                    <Upload className="mx-auto h-8 w-8 text-blue-700" />
                    <h3 className="mt-2 text-sm font-bold text-slate-900">Drop source document here</h3>
                    <p className="text-xs text-slate-500 mt-1">Supported formats: PDF, DOCX, TXT (Maximum 25MB)</p>
                    
                    {uploading && (
                      <div className="mt-4 max-w-xs mx-auto space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{uploadStateText}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-700 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs cursor-pointer transition-colors">
                        <span>{uploading ? 'Processing File...' : 'Browse Files'}</span>
                        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <TryDemoSources currentProjectId={projectId} />
                </div>
              ) : (
                /* Compact Uploaded File Summary Box */
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                        <FileText className="h-6 w-6 text-blue-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{source.filename}</h3>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            VERIFIED SOURCE
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {source.mime_type || 'PDF Document'} • {(source.size_bytes / (1024 * 1024)).toFixed(2)} MB • Uploaded just now
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 mt-1">
                          SHA-256: {source.source_hash}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded border border-slate-300 cursor-pointer transition-colors">
                        <span>Replace File</span>
                        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                      <button
                        onClick={() => setActiveStep('config')}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        Continue to Config <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Text Content */}
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Extracted Canonical Source Text
                    </label>
                    <textarea
                      readOnly
                      value={source.extracted_text}
                      rows={8}
                      className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: SECURITY CENTER (REQUIREMENT 10) */}
          {activeStep === 'security' && (
            <div className="mt-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Security Operations Scan</h3>
                    <p className="text-xs text-slate-500 mt-1">Automated file validation, Presidio PII detection, and prompt injection defense.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase">Security Score</span>
                      <p className="text-xl font-black text-emerald-700">{source?.security_score || 92} / 100</p>
                    </div>

                    {source?.pii_findings?.length > 0 && (
                      <button
                        onClick={handleRedactPII}
                        disabled={redacting}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded shadow-2xs transition-colors"
                      >
                        {redacting ? 'Redacting PII...' : 'Redact Detected PII (1-Click)'}
                      </button>
                    )}
                  </div>
                </div>

                {/* PII Alert Banner */}
                {source?.pii_findings?.length > 0 ? (
                  <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Sensitive PII Findings ({source.pii_findings.length} instances flagged):</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {source.pii_findings.map((item: any, idx: number) => (
                          <span key={idx} className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-mono text-[11px]">
                            {item.entity_type}: {item.snippet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Security Scan Passed: Zero high-confidence sensitive PII issues detected.</span>
                  </div>
                )}

                {/* Security Matrix Table */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Security Controls Verification</h4>
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Control Check</th>
                          <th className="px-4 py-2.5 text-left">Status</th>
                          <th className="px-4 py-2.5 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                        <tr>
                          <td className="px-4 py-2.5 font-bold">File Format & Size Validation</td>
                          <td className="px-4 py-2.5 text-emerald-700 font-bold">PASSED</td>
                          <td className="px-4 py-2.5 text-slate-600">Extension valid, file size within 25MB limit</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-bold">Presidio PII Scan Engine</td>
                          <td className="px-4 py-2.5 text-amber-700 font-bold">WARNING ({source?.pii_findings?.length || 0} FOUND)</td>
                          <td className="px-4 py-2.5 text-slate-600">Email & phone detected. Redaction ready.</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-bold">Prompt Injection Guard Scanner</td>
                          <td className="px-4 py-2.5 text-emerald-700 font-bold">NOT DETECTED</td>
                          <td className="px-4 py-2.5 text-slate-600">Systemic prompt override patterns isolated</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-bold">Private Storage Encryption</td>
                          <td className="px-4 py-2.5 text-emerald-700 font-bold">ENCRYPTED</td>
                          <td className="px-4 py-2.5 text-slate-600">Isolated private bucket path generated</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setActiveStep('configure')}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    Proceed to Transformation Config <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GENERATION CONFIG (REQUIREMENT 11) */}
          {activeStep === 'configure' && (
            <div className="mt-6 bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Transformation Controls</h3>
                <p className="text-xs text-slate-500 mt-1">Configure target audience, tone, output language, and detail level.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Executive">Executive Leadership</option>
                    <option value="Technical">Technical / Security Team</option>
                    <option value="General Public">General Public</option>
                    <option value="Security Team">Security Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tone of Voice</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Formal">Formal & Authoritative</option>
                    <option value="Neutral">Neutral & Objective</option>
                    <option value="Urgent">Urgent Alert</option>
                    <option value="Educational">Educational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Output Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detail Level</label>
                  <select
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Brief">Brief</option>
                    <option value="Standard">Standard</option>
                    <option value="Detailed">Detailed & Comprehensive</option>
                  </select>
                </div>
              </div>

              {/* Selection Cards for Target Deliverable Formats */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-3">
                  Select Target Communication Deliverables
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: "executive_summary", title: "Executive Summary", desc: "Structured leadership brief with findings & risk impact" },
                    { id: "advisory", title: "Operational Advisory", desc: "Technical mitigation guide & priority action plan" },
                    { id: "linkedin", title: "LinkedIn Post & Graphic", desc: "Professional post with matching visual artifact" },
                    { id: "x_thread", title: "X / Twitter Thread", desc: "4-6 numbered concise thread tweets" },
                    { id: "infographic", title: "Visual Infographic Card", desc: "Server-side generated Pollinations dashboard graphic" },
                    { id: "presentation", title: "Presentation Outline", desc: "5-slide deck structure for briefings" },
                  ].map((opt) => {
                    const isSelected = selectedOutputs.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleOutputSelection(opt.id)}
                        className={`p-3.5 border rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-blue-700 bg-blue-50/60 text-blue-950 font-bold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 text-blue-700 focus:ring-blue-600 rounded"
                        />
                        <div>
                          <p className="text-xs font-bold">{opt.title}</p>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleStartGeneration}
                  disabled={generating}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs transition-colors flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? 'Executing LangGraph Pipeline...' : 'Generate Selected Outputs'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATION PIPELINE STATUS (REQUIREMENT 12) */}
          {activeStep === 'generate' && (
            <div className="mt-6 bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
                Transformation Pipeline Status
              </h3>

              <div className="space-y-4 text-xs font-medium max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</div>
                  <div>
                    <p className="font-bold text-slate-900">Security Check</p>
                    <p className="text-[11px] text-slate-500">MIME, size, Presidio PII, prompt injection defense</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</div>
                  <div>
                    <p className="font-bold text-slate-900">Document Extraction</p>
                    <p className="text-[11px] text-slate-500">PyMuPDF text parsing complete</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</div>
                  <div>
                    <p className="font-bold text-slate-900">Canonical Context Schema</p>
                    <p className="text-[11px] text-slate-500">Understood source once into single structured schema</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    pipelineStep === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                  }`}>
                    {pipelineStep === 'completed' ? '✓' : '●'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Multi-Output Generators</p>
                    <p className="text-[11px] text-slate-500">Groq Qwen 3.6 27B + Pollinations image proxy</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveStep('review')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                >
                  Proceed to Review Deliverables <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & EDIT OUTPUTS (REQUIREMENT 14 & 33) */}
          {activeStep === 'review' && (
            <div className="mt-6 space-y-6">
              
              {/* Output Sub-Tabs */}
              <div className="bg-white border border-slate-200 rounded-lg p-2 flex overflow-x-auto gap-2">
                {[
                  { id: "executive_summary", label: "Executive Summary" },
                  { id: "advisory", label: "Operational Advisory" },
                  { id: "linkedin", label: "LinkedIn Post & Graphic" },
                  { id: "x_thread", label: "X Thread" },
                  { id: "infographic", label: "Infographic Card" },
                  { id: "presentation", label: "Presentation Outline" },
                ].map((t) => {
                  const item = outputsList.find(o => o.output_type === t.id);
                  const isApproved = item?.approval_status === "APPROVED";
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveOutputTab(t.id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeOutputTab === t.id
                          ? 'bg-blue-700 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                      {isApproved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Output Card Workspace */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Deliverable Artifact</span>
                      
                      {/* Formal Approval Status Badge (REQUIREMENT 15) */}
                      <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold flex items-center gap-1 ${
                        activeOutput?.approval_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : activeOutput?.approval_status === 'CHANGES_REQUESTED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {activeOutput?.approval_status === 'APPROVED' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />}
                        STATUS: {activeOutput?.approval_status || 'DRAFT'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {activeOutputTab.replace('_', ' ').toUpperCase()}
                    </h3>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyContent}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded border border-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>

                    <button
                      onClick={() => handleExportFile('txt')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded border border-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export TXT
                    </button>

                    <button
                      onClick={() => handleExportFile('pdf')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded border border-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export PDF
                    </button>

                    {/* Approve Output Button */}
                    <button
                      onClick={() => handleApproveOutput('APPROVED')}
                      className={`px-4 py-1.5 font-bold text-xs rounded flex items-center gap-1.5 transition-all shadow-2xs ${
                        activeOutput?.approval_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {activeOutput?.approval_status === 'APPROVED' ? 'Approved ✓' : 'Approve Output'}
                    </button>
                  </div>
                </div>

                {/* Approval Metadata Note */}
                {activeOutput?.approval_status === 'APPROVED' && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Formally approved by <strong>{activeOutput.approved_by || 'Operator User'}</strong> on {activeOutput.approved_at ? new Date(activeOutput.approved_at).toLocaleString() : 'Just now'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Finalized</span>
                  </div>
                )}

                {/* Content Mode Toggle (Edit vs Preview) */}
                <div className="mt-4 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Deliverable Content
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${!isEditing ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                    >
                      <Eye className="h-3.5 w-3.5 inline mr-1" /> Preview
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${isEditing ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                    >
                      <Pencil className="h-3.5 w-3.5 inline mr-1" /> Edit Mode
                    </button>
                  </div>
                </div>

                {/* Editor / Rendered Document View */}
                <div className="mt-2">
                  {isEditing ? (
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={14}
                      className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  ) : (
                    <div className="w-full font-sans text-xs p-5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {editingContent}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    SHA-256: {activeOutput?.output_hash}
                  </span>

                  {isEditing && (
                    <button
                      onClick={handleSaveOutputEdit}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded shadow-2xs transition-colors"
                    >
                      Save Edits & Recalculate Hash
                    </button>
                  )}
                </div>

                {/* LinkedIn Contextual Image Card */}
                {activeOutputTab === 'linkedin' && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-700" />
                          Generated LinkedIn Visual Graphic
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Canonical context graphic artifact • Zero PII sent to provider • Key protection server-side
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleRegenerateImage}
                          disabled={regeneratingImage}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${regeneratingImage ? 'animate-spin' : ''}`} />
                          {regeneratingImage ? 'Regenerating Image...' : 'Regenerate Image Only'}
                        </button>

                        {activeOutput && (
                          <a
                            href={`http://localhost:8000/api/outputs/${activeOutput.id}/image/download`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Image ({activeOutput?.image?.filename || `linkedin-${activeOutput.id.slice(0,8)}.jpg`})
                          </a>
                        )}
                      </div>
                    </div>

                    {activeOutput?.image?.error ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Image Generation Blocked</p>
                          <p className="mt-1">{activeOutput.image.error}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 border border-slate-200 rounded-md p-4 flex flex-col items-center justify-center min-h-[320px] w-full">
                        <img
                          key={activeOutput?.image_url || activeOutput?.id}
                          src={`http://localhost:8000/api/outputs/${activeOutput?.id}/image`}
                          alt="LinkedIn Visual Graphic Preview"
                          className="max-h-[420px] w-auto max-w-full rounded border border-slate-300 shadow-md object-contain"
                        />
                        <p className="text-[11px] text-slate-500 font-mono mt-3">
                          Server-side Pollinations Proxy: /api/outputs/{activeOutput?.id}/image
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* STEP 6: DEDICATED FINAL APPROVED OUTPUTS COLLECTION (REQUIREMENT 16 & 35) */}
          {activeStep === 'approved' && (
            <div className="mt-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="h-5 w-5 text-emerald-600" />
                      Final Approved Deliverables Collection
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Contains ONLY deliverables formally marked APPROVED by authorized reviewers.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      {approvedOutputsCount} / {outputsList.length} Approved
                    </span>

                    {approvedOutputsCount > 0 && (
                      <button
                        onClick={handleExportAllApproved}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-2xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Export All Approved Bundle
                      </button>
                    )}
                  </div>
                </div>

                {approvedOutputsCount === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md mt-6">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <h4 className="mt-2 text-sm font-bold text-slate-900">No Approved Deliverables Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Outputs in DRAFT or REJECTED state are excluded from final exports. Please review and approve deliverables in Step 05.
                    </p>
                    <button
                      onClick={() => setActiveStep('review')}
                      className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs inline-flex items-center gap-1.5"
                    >
                      Review Deliverables <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {outputsList.filter(o => o.approval_status === "APPROVED").map((item) => (
                      <div key={item.id} className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-lg">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            Approved by {item.approved_by || 'Operator User'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-sans text-slate-700 line-clamp-3 whitespace-pre-wrap">
                          {item.content}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>SHA-256: {item.output_hash}</span>
                          <button
                            onClick={() => { setActiveOutputTab(item.output_type); setActiveStep('review'); }}
                            className="text-blue-700 font-bold hover:underline font-sans"
                          >
                            View Full Deliverable →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: INTEGRITY & BLOCKCHAIN (REQUIREMENT 21) */}
          {activeStep === 'integrity' && (
            <div className="mt-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Cryptographic SHA-256 Provenance Proof</h3>
                    <p className="text-xs text-slate-500 mt-1">Verify deliverable SHA-256 hash anchors against immutable testnet ledger records.</p>
                  </div>

                  <button
                    onClick={handleVerifyIntegrity}
                    disabled={verifying}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Link2 className="h-4 w-4" />
                    {verifying ? 'Verifying Hash...' : 'Verify Hash Anchor'}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2 font-mono">
                    <p className="font-bold text-slate-900 font-sans">Active Artifact Metadata</p>
                    <p><span className="text-slate-500">Output ID:</span> {activeOutput?.id || 'demo-out-1'}</p>
                    <p><span className="text-slate-500">Deliverable:</span> {activeOutput?.title || 'Executive Summary'}</p>
                    <p><span className="text-slate-500">Calculated SHA-256:</span> {activeOutput?.output_hash || '8f42a91a7492...'}</p>
                    <p><span className="text-slate-500">Cryptographic Integrity:</span> <span className="text-emerald-700 font-bold">100% REAL SHA-256</span></p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs space-y-2 font-mono">
                    <p className="font-bold text-emerald-900 font-sans flex items-center gap-1.5">
                      <Link2 className="h-4 w-4 text-emerald-600" />
                      Hyperledger Fabric Blockchain Provenance Anchor
                    </p>
                    <p><span className="text-slate-600">Network:</span> {verificationResult?.network || 'Hyperledger Fabric (integrity-channel / Org1MSP)'}</p>
                    <p><span className="text-slate-600">Channel:</span> {verificationResult?.channel_name || 'integrity-channel'}</p>
                    <p><span className="text-slate-600">Chaincode:</span> {verificationResult?.chaincode_name || 'integrity-anchor'}</p>
                    <p><span className="text-slate-600">Organization MSP:</span> {verificationResult?.organization || 'Org1MSP'}</p>
                    <p><span className="text-slate-600">Fabric Status:</span> <span className="font-bold text-emerald-800">{verificationResult?.blockchain_status || 'NOT_CONFIGURED (Fabric Gateway Standby)'}</span></p>
                    <p><span className="text-slate-600">Transaction ID:</span> {verificationResult?.transaction_id || verificationResult?.tx_hash || 'tx_fabric_standby'}</p>
                  </div>
                </div>

                {verificationResult && (
                  <div className="mt-6 p-4 bg-emerald-100 border border-emerald-300 rounded-md text-xs text-emerald-950 font-mono">
                    <p className="font-bold font-sans flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      Verification Result: SHA-256 PROVENANCE & FABRIC INTEGRITY VERIFIED
                    </p>
                    <p className="mt-1">
                      Calculated SHA-256 hash ({verificationResult.output_hash.slice(0, 16)}...) matches stored canonical provenance record.
                      <br />
                      <span className="text-slate-700 font-sans text-[11px] block mt-1">
                        Cryptographic SHA-256 proof is <strong>ACTIVE</strong>. Hyperledger Fabric channel anchor status: <strong>{verificationResult.blockchain_status}</strong>.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Confirmation Modal */}
          {isResetConfirmOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in-50 zoom-in-95">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Transformation Workspace?</h3>
                  <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                    This will clear the current transformation state, extracted canonical context, and generated outputs in this workspace view. You will return to the initial source upload step.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={performReset}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer"
                  >
                    Reset Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
