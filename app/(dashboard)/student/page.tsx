'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useMemo, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiClipboardList,
  HiCheckCircle,
  HiAcademicCap,
  HiKey,
} from 'react-icons/hi';

interface DashboardStats {
  assignedTests: number;
  completedTests: number;
  averageScore: number | null;
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    assignedTests: 0,
    completedTests: 0,
    averageScore: null,
  });
  const [loading, setLoading] = useState(true);
  const [testCode, setTestCode] = useState('');
  const [joining, setJoining] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const handleJoinTest = async () => {
    if (!testCode.trim()) return;

    setJoining(true);
    try {
      const res = await fetch('/api/tests/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: testCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      toast.success(
        data.already_joined
          ? `Already joined "${data.title}"`
          : `Joined "${data.title}"!`
      );
      setTestCode('');
      router.push(`/student/tests/${data.test_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join test');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;

      const [assignmentsRes, attemptsRes] = await Promise.all([
        supabase
          .from('test_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', profile.id),
        supabase
          .from('test_attempts')
          .select('score')
          .eq('student_id', profile.id)
          .not('completed_at', 'is', null),
      ]);

      const completedAttempts = attemptsRes.data ?? [];
      const avgScore =
        completedAttempts.length > 0
          ? completedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) /
            completedAttempts.length
          : null;

      setStats({
        assignedTests: assignmentsRes.count ?? 0,
        completedTests: completedAttempts.length,
        averageScore: avgScore,
      });
      setLoading(false);
    };

    fetchStats();
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {profile?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-text-secondary">
          Take your assigned tests and get AI-powered tutoring on your weak areas.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <HiClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {loading ? '...' : stats.assignedTests}
              </p>
              <p className="text-sm text-text-secondary">Assigned Tests</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {loading ? '...' : stats.completedTests}
              </p>
              <p className="text-sm text-text-secondary">Completed</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-violet/10 flex items-center justify-center">
              <HiAcademicCap className="w-6 h-6 text-accent-violet" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {loading
                  ? '...'
                  : stats.averageScore !== null
                  ? `${Math.round(stats.averageScore)}%`
                  : 'N/A'}
              </p>
              <p className="text-sm text-text-secondary">Avg. Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Test by Code */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Join a Test</h2>
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
              <HiKey className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-secondary mb-3">
                Enter the test code provided by your teacher to start a test
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinTest()}
                  placeholder="Enter test code (e.g. XK7M2P)"
                  maxLength={6}
                  className="input-field font-mono text-lg tracking-widest uppercase flex-1"
                />
                <button
                  onClick={handleJoinTest}
                  disabled={!testCode.trim() || joining}
                  className="btn-primary disabled:opacity-50 whitespace-nowrap"
                >
                  {joining ? 'Joining...' : 'Join Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Get Started</h2>
        <Link
          href="/student/tests"
          className="card-hover p-6 flex items-center gap-4 inline-block"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <HiClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">View Assigned Tests</h3>
            <p className="text-sm text-text-secondary">
              See your pending and completed tests
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
