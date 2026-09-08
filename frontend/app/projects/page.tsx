"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/components/Toast';
import { FolderKanban, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import TryDemoSources from '@/components/TryDemoSources';

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data: any = await fetchApi('/api/projects');
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setLoading(true);

    try {
      await fetchApi('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
      });
      toast("✓ Workspace Created", "success", `Created project "${newProjectName}"`);
      setNewProjectName('');
      setNewProjectDesc('');
      setIsModalOpen(false);
      await loadProjects();
    } catch (err: any) {
      toast("✕ Creation Failed", "error", err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete workspace "${name}"? This will permanently remove all associated source and output records.`)) return;
    setDeletingId(id);
    try {
      await fetchApi(`/api/projects/${id}`, { method: 'DELETE' });
      toast("✓ Project Deleted", "info", `Removed workspace "${name}"`);
      await loadProjects();
    } catch (err: any) {
      toast("✕ Delete Failed", "error", err.message || "Failed to delete project");
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
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Transformation Workspaces
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-normal">
                Manage secure content transformation projects and active document pipelines.
              </p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors min-h-[38px]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </button>
          </div>

          <TryDemoSources />

          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">All Active Workspaces</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                        <FolderKanban className="h-4.5 w-4.5 text-blue-700" />
                        <span>{proj.name}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 font-normal leading-relaxed">
                      {proj.description || "No description provided."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Sources: {proj.source_count || 1}</span>
                      <span>Outputs: {proj.output_count || 5}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="flex-1 inline-flex justify-center items-center gap-2 py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all h-9 cursor-pointer group hover:shadow-xs"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.name)}
                      disabled={deletingId === proj.id}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors"
                      title="Delete Project Workspace"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Project Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in-50 zoom-in-95">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create New Workspace</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">Set up a new secure content transformation workspace.</p>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Project Name</label>
                    <input
                      type="text"
                      required
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                      placeholder="e.g. Cyber Security Incident Briefing"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                      rows={3}
                      placeholder="Context regarding source documents and target output deliverables..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-2xs min-h-[36px]"
                    >
                      {loading ? 'Creating...' : 'Create Workspace'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
