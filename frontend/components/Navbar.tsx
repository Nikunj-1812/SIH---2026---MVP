"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldAlert, 
  Link2 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Projects', href: '/projects' },
    { name: 'Transformation Workspace', href: '/projects/new' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xs shadow-2xs">
      <div className="w-full max-w-[1440px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                Setuvani
              </span>
              <span className="text-[10px] font-semibold text-blue-700 tracking-wider mt-0.5 uppercase">
                SIH 2026 PS 26154
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors py-4.5 border-b-2 font-semibold ${
                  isActive
                    ? 'border-blue-700 text-blue-900 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Truthful Status & User Menu */}
        <div className="flex items-center gap-3">
          
          {/* System Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100/90 rounded-full border border-slate-200 text-[11px] font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Qwen 3.6 27B Active</span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100/80 transition-colors text-left focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                OP
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <p className="font-semibold text-slate-900">Operator User</p>
                <p className="text-[10px] text-slate-500 font-medium">NTRO Analyst</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-md py-1 z-50 text-xs font-medium text-slate-700 animate-in fade-in-50 zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">Operator User</p>
                  <p className="text-[11px] text-slate-500">operator@ntro.gov.in</p>
                </div>
                <Link
                  href="/login"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Slide-Out Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-md animate-in slide-in-from-top-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Navigation</p>
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-xs font-semibold rounded-md ${
                  pathname === link.href ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">Security Context</p>
          <div className="space-y-1 text-xs font-medium">
            <Link
              href="/projects/new?step=security"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              Security Operations Center
            </Link>
            <Link
              href="/projects/new?step=integrity"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <Link2 className="h-4 w-4 text-blue-600" />
              Integrity & Blockchain Proof
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
