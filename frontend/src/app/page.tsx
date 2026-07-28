'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError('Could not connect to backend server: ' + err.message));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-500">
          IT Asset & Service Management System
        </h1>
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-center shadow-xl">
          <h2 className="text-xl font-semibold mb-3">System Health Status</h2>
          {health && (
            <div className="text-green-400">
              <p>Backend API: <span className="font-bold">{health.status}</span></p>
              <p className="text-xs text-slate-400 mt-1">Timestamp: {health.timestamp}</p>
            </div>
          )}
          {error && <p className="text-red-400">{error}</p>}
          {!health && !error && <p className="text-slate-400">Connecting to Backend...</p>}
        </div>
      </div>
    </main>
  );
}

