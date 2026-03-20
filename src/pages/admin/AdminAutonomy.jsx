import React from 'react';
import { AutonomyDashboard } from '@/components/admin/AutonomyDashboard';
import { Brain } from 'lucide-react';

export default function AdminAutonomy() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Brain className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Autonomous Brain</h1>
          <p className="text-sm text-slate-500">
            Real-time view of every decision, signal, and agent action. Runs 24/7 with no human input.
          </p>
        </div>
      </div>
      <AutonomyDashboard />
    </div>
  );
}
