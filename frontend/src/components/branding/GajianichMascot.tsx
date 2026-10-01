import React from 'react';

export interface GajianichMascotProps { size?: 'compact' | 'hero'; decorative?: boolean; className?: string; }

export default function GajianichMascot({ size = 'compact', decorative = false, className = '' }: GajianichMascotProps) {
  const hero = size === 'hero';
  return <svg viewBox="0 0 96 96" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : 'Kucing kantor GAJIANICH'} className={className}>
    {!decorative && <title>Kucing kantor GAJIANICH</title>}
    <path d="M20 38 25 17l14 11h18l14-11 5 21v29c0 13-10 21-28 21S20 80 20 67Z" fill="#FEF3C7" stroke="#0F172A" strokeWidth="4" strokeLinejoin="round" />
    <path d="m26 28 4-8 7 8m25 0 7-8 4 8" fill="#F59E0B" /><path d="M34 48c2-3 6-3 8 0m12 0c2-3 6-3 8 0M43 59c3 3 7 3 10 0" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
    <path d="M29 68h38l-4 17H33Z" fill="#059669" /><path d="M43 68h10l-5 10Z" fill="#F59E0B" />
    {hero && <><path d="M71 58h13v14H71z" fill="#F59E0B" stroke="#0F172A" strokeWidth="3" /><path d="M84 62c8 0 8 9 0 9" fill="none" stroke="#0F172A" strokeWidth="3" /><path d="M75 52c-3-5 4-7 1-12m5 12c-3-5 4-7 1-12" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" /></>}
  </svg>;
}
