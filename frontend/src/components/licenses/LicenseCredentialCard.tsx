'use client';

import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  MapPin,
} from 'lucide-react';
import { SoftwareLicenseDetail } from '@/lib/licenses/types';

export interface LicenseCredentialCardProps {
  license: SoftwareLicenseDetail;
}

export default function LicenseCredentialCard({ license }: LicenseCredentialCardProps) {
  const [showFullKey, setShowFullKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyKey = () => {
    if (!license.licenseKey) return;
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const expFormatted = license.expirationDate
    ? new Date(license.expirationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No Expiry (Perpetual)';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-red-600" />
          <span>License Credentials & Keys</span>
        </h2>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
          Protected Key
        </span>
      </div>

      {/* Key Preview Badge Box */}
      <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-red-400 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Software Key / Serial
            </p>
            <p className="font-bold text-white tracking-widest truncate">
              {license.licenseKey
                ? showFullKey
                  ? license.licenseKey
                  : license.licenseKey.length <= 8
                  ? '••••' + license.licenseKey.slice(-4)
                  : '••••-••••-••••-' + license.licenseKey.slice(-4)
                : 'No License Key Recorded'}
            </p>
          </div>
        </div>

        {license.licenseKey && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFullKey(!showFullKey)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title={showFullKey ? 'Mask License Key' : 'Reveal License Key'}
            >
              {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{showFullKey ? 'Mask' : 'Reveal'}</span>
            </button>

            <button
              onClick={handleCopyKey}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
              title="Copy Key to Clipboard"
            >
              {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* License Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Type</p>
          <p className="text-xs font-bold text-slate-900 mt-1">
            {license.licenseType || 'Perpetual'}
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
            Purchase Date
          </p>
          <p className="text-xs font-bold text-slate-900 mt-1">
            {license.purchaseDate
              ? new Date(license.purchaseDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A'}
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
            Expiration Date
          </p>
          <p className="text-xs font-bold text-slate-900 mt-1">{expFormatted}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
            Cost / Value
          </p>
          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
            {license.cost ? `IDR ${Number(license.cost).toLocaleString('id-ID')}` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Office Location & Notes Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-red-600" />
            <span>Office Location / Entity (PT / Site):</span>
          </p>
          <p className="text-slate-900 font-bold font-sans">
            {license.locationName
              ? license.locationCode
                ? `${license.locationCode} - ${license.locationName}`
                : license.locationName
              : 'Unassigned Location'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Physical Notes / Cabinet:</span>
          </p>
          <p className="text-slate-600 leading-relaxed font-sans">
            {license.notes || 'No physical notes recorded.'}
          </p>
        </div>
      </div>
    </div>
  );
}
