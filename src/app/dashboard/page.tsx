'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AddCircleOutline,
  CheckCircleOutline,
  EmojiObjects,
  Timeline,
  TrendingUp,
} from '@mui/icons-material';

interface SummaryData {
  activeGoals: number;
  completedTasks: number;
  ongoingSessions: number;
  streak: string;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryData>({
    activeGoals: 0,
    completedTasks: 23,
    ongoingSessions: 2,
    streak: '7 Days',
  });

  useEffect(() => {
    // Fetch goal count
    const fetchData = async () => {
      try {
        const res = await fetch('/api/goals/count');
        const data = await res.json();
        setSummary((prev) => ({
          ...prev,
          activeGoals: data.count || 0,
        }));
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="text-3xl font-semibold text-slate-800 dark:text-white">
          Welcome back, 👋 Rajeev
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card icon={<TrendingUp />} label="Active Goals" value={String(summary.activeGoals)} />
          <Card icon={<CheckCircleOutline />} label="Completed Tasks" value={String(summary.completedTasks)} />
          <Card icon={<Timeline />} label="Ongoing Sessions" value={String(summary.ongoingSessions)} />
          <Card icon={<EmojiObjects />} label="Streak" value={summary.streak} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glassy-card p-4">
            <h2 className="text-xl font-semibold mb-4">Today's Tasks</h2>
            <ul className="space-y-3">
              {['Morning jog - 20 mins', 'Read 10 pages', 'Work on AI roadmap'].map((task, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between bg-white/20 backdrop-blur-md p-3 rounded-xl shadow-sm"
                >
                  <span className="text-sm">{task}</span>
                  <input type="checkbox" className="w-4 h-4" />
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="glassy-card p-4 text-center">
              <p className="italic text-slate-700 dark:text-slate-200">
                “Discipline is the bridge between goals and accomplishment.” – Jim Rohn
              </p>
            </div>

            <div className="glassy-card p-4 space-y-4">
              <h3 className="text-lg font-medium">Quick Actions</h3>

              <Link
                href="/dashboard/goal-chat"
                className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl shadow"
              >
                <AddCircleOutline className="mr-2" /> Add New Goal
              </Link>

              <Link
                href="/dashboard/goals"
                className="flex items-center justify-center w-full bg-slate-800 hover:bg-slate-900 text-white py-2 px-4 rounded-xl shadow"
              >
                <Timeline className="mr-2" /> View Prev Goals And Roadmaps
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Reusable Card
function Card({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glassy-card p-4 flex items-center space-x-4">
      <div className="text-3xl text-indigo-600">{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
