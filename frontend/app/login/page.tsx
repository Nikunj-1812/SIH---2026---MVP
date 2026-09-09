"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertTriangle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: any = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', data.role);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCredentials = () => {
    setEmail('operator@ntro.gov.in');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          SETU-VANI Workspace
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          SIH 2026 Problem Statement 26154 — Secure GenAI Content Engine
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs border border-slate-200/80 rounded-xl space-y-6">
          
          {error && (
            <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="text-slate-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                  placeholder="operator@ntro.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 font-normal leading-relaxed">
              <span className="font-bold text-slate-800">Security Policy:</span> Account locks for 5 minutes after 5 consecutive failed attempts.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-2xs text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 min-h-[38px] transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In to Secure Engine'}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={loadDemoCredentials}
              className="text-xs text-blue-700 hover:underline font-semibold"
            >
              Load Demo Operator Credentials
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
