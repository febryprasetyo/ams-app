'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2, ArrowRight, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      
      if (data.token && data.user) {
        login(data.token, data.user);
        router.push('/dashboard/master/departments');
      } else {
        throw new Error('Invalid response payload from server');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@company.com');
    setPassword('Admin123!');
    setError(null);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/40 p-4 relative overflow-hidden font-sans select-none text-slate-900">
      {/* Radiant Fresh Red Glow Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Light Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white mb-4 shadow-xl shadow-red-500/25 relative group">
            <ShieldCheck className="w-9 h-9 transform group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>AMS</span>
            <span className="text-red-600 font-mono">Platform</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Enterprise Asset & Service Management Portal
          </p>
        </div>

        {/* Crisp White Card */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-8 shadow-2xl relative overflow-hidden bg-white/90 border border-slate-200">
          {/* Top border accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-rose-600 to-red-700" />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Access corporate management portal</p>
            </div>
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-red-600" />
              v2.0 LIGHT
            </span>
          </div>

          {/* Quick Auto-Fill Demo Credentials */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full mb-6 py-2.5 px-3 bg-slate-50 hover:bg-red-50/60 border border-slate-200 hover:border-red-300 rounded-xl text-xs font-mono text-slate-700 hover:text-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5 text-red-600 group-hover:rotate-12 transition-transform" />
            <span>Auto-fill SuperAdmin Credentials</span>
          </button>

          {/* Error Alert Display */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="font-bold text-red-800">Authentication Error</p>
                <p className="text-xs text-red-600/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Fresh Red CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold font-sans rounded-xl shadow-xl shadow-red-600/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500 mt-6 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>
          <span>End-to-End Encrypted • Enterprise SSO Ready</span>
        </div>
      </div>
    </main>
  );
}
