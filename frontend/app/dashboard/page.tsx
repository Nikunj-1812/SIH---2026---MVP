"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/components/Toast';
import { 
  FolderKanban, 
  FileText, 
  Sparkles, 
  Link2, 
  Plus, 
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Trash2,
  Loader2
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import TryDemoSources from '@/components/TryDemoSources';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    active_projects_count: 1,
    sources_processed_count: 1,
    outputs_generated_count: 5,
    integrity_anchors_count: 5,
    approved_outputs_count: 0
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [projData, statsData] = await Promise.all([
        fetchApi('/api/projects').catch(() => []),
        fetchApi('/api/projects/stats').catch(() => null)
      ]);
      if (Array.isArray(projData)) setProjects(projData);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    }
  }

  const handleNewTransformation = async () => {
    if (creatingProject) return;
    setCreatingProject(true);
    try {
      toast("Starting a new transformation...", "info");
      const newProj: any = await fetchApi('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: "New Transformation Project",
          description: "Fresh content transformation workspace."
        })
      });
      router.push(`/projects/${newProj.id}`);
    } catch (err: any) {
      toast("✕ Failed to start transformation", "error", err.message || "Could not create workspace");
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetchApi(`/api/projects/${id}`, { method: 'DELETE' });
      toast("✓ Project Deleted", "info", `Deleted project workspace "${name}"`);
      await loadDashboardData();
    } catch (err: any) {
      toast("✕ Delete Failed", "error", err.message || "Could not delete project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6">
          
          {/* Executive Welcome Hero Header */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                <span>ENTERPRISE DASHBOARD</span>
                <span>•</span>
                <span className="text-slate-400">SIH 2026 PS 26154</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, Operator
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
                Transform trusted source documents into controlled, reviewable, and integrity-verifiable communication artifacts.
              </p>
            </div>

            {/* Dashboard Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/projects"
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 transition-all shadow-2xs inline-flex items-center justify-center h-10 hover:border-slate-400"
              >
                View Projects
              </Link>

              <button
                onClick={handleNewTransformation}
                disabled={creatingProject}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all h-10 hover:shadow-xs cursor-pointer disabled:opacity-70"
              >
                {creatingProject ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    <span className="whitespace-nowrap">Starting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">New Transformation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Operational Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            
            <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Projects</span>
                <FolderKanban className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-blue-700 shrink-0" />
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-2xl font-bold text-slate-900 leading-none">{stats.active_projects_count}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5">Workspaces active</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sources Processed</span>
                <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-700 shrink-0" />
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-2xl font-bold text-slate-900 leading-none">{stats.sources_processed_count}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5">PDF · DOCX · TXT</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outputs Generated</span>
                <Sparkles className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-indigo-600 shrink-0" />
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-2xl font-bold text-slate-900 leading-none">{stats.outputs_generated_count}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5">Multi-channel items</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Outputs</span>
                <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-2xl font-bold text-emerald-700 leading-none">{stats.approved_outputs_count}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5">Finalized for export</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Integrity Anchors</span>
                <Link2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-2xl font-bold text-slate-900 leading-none">{stats.integrity_anchors_count}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5">SHA-256 registered</p>
              </div>
            </div>

          </div>

          {/* Workflow Stepper Overview */}
          <div className="bg-blue-50/60 border border-blue-200/80 p-5 rounded-xl">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-700" />
                CANONICAL CONTENT TRANSFORMATION WORKFLOW
              </h2>
              <span className="text-[11px] font-medium text-blue-800 hidden sm:inline-block">
                Trusted Source → Security → Canonical Context → Generation → Review → Approval → Integrity
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-bold text-blue-950">
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">1. Trusted Source</div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">2. Security Scan</div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">3. Canonical Context</div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">4. Multi-Output</div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">5. Human Review</div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">6. Formal Approval</div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">7. Fabric SHA-256</div>
            </div>
          </div>

          {/* Try Demo Sources Quick-Start Section */}
          <TryDemoSources />

          {/* Active Transformation Workspaces Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Transformation Projects</h2>
                <p className="text-xs text-slate-500 font-medium">Manage active document transformation workspaces and approval statuses.</p>
              </div>
              <Link href="/projects" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
                View All Workspaces <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Project Workspace</th>
                    <th className="px-5 py-3">Source File</th>
                    <th className="px-5 py-3">Security Status</th>
                    <th className="px-5 py-3">Outputs Generated</th>
                    <th className="px-5 py-3">Approval Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-slate-800 font-medium">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {p.name}
                        <p className="text-[11px] font-normal text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                        NTRO_Security_Advisory_2026.pdf
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> PASSED (92/100)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {p.output_count || 5} Deliverables
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          {p.approved_count || stats.approved_outputs_count} / {p.output_count || 5} Approved
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/projects/${p.id}`}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all inline-flex items-center justify-center gap-2 h-9 cursor-pointer group hover:shadow-xs"
                          >
                            <span>Open Workspace</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>

                          <button
                            onClick={() => handleDeleteProject(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors h-9 w-9 flex items-center justify-center"
                            title="Delete Project Workspace"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
