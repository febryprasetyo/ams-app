'use client';

import React from 'react';
import { BadgeCheck } from 'lucide-react';
import type { CustodianSummary } from '@/lib/assetCustodian';

export function VerificationBadge({
  status,
}: {
  status?: CustodianSummary['verificationStatus'] | null;
}) {
  if (status !== 'VERIFIED') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
      <BadgeCheck className="h-3 w-3" />
      VERIFIED
    </span>
  );
}

export default VerificationBadge;
