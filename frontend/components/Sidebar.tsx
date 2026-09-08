"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Sparkles, 
  ShieldAlert, 
  Link2,
  Lock
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const sections = [
    {
      title: "WORKSPACE",
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects Workspace', href: '/projects', icon: FolderKanban },
      ]
    },
    {
      title: "TRANSFORMATION",
      items: [
        { name: 'Transformation Pipeline', href: '/projects/new', icon: Sparkles },
      ]
    },
    {
      title: "SECURITY & PROVENANCE",
      items: [
        { name: 'Security Center', href: '/projects/new?step=security', icon: ShieldAlert },
        { name: 'Integrity & Blockchain', href: '/projects/new?step=integrity', icon: Link2 },
      ]
    }
  ];

  return (
    <aside className="w-60 border-r border-slate-200/80 bg-white sticky top-16 h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 hidden md:flex overflow-y-auto">
      <div className="space-y-6">
        {sections.map((sec, idx) => (
          <div key={idx}>
            <h2 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {sec.title}
            </h2>
            <nav className="mt-2 space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href.includes('/projects/') && pathname.includes('/projects/'));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50/70 text-blue-900 border-l-2 border-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        {/* Security Controls Badge */}
        <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Active Security Controls</span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-600 font-medium leading-relaxed">
            <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-blue-600" /> 5-Failed Auth Lockout</li>
            <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-blue-600" /> Max 3 AI Retry Limit</li>
            <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-blue-600" /> Presidio PII Redaction</li>
            <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-blue-600" /> SHA-256 Provenance</li>
          </ul>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
        <p className="font-semibold text-slate-800">SIH 2026 PS 26154 MVP</p>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Secure GenAI Engine v1.0</p>
      </div>
    </aside>
  );
}
