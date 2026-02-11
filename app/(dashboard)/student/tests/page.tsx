'use client';

import { useMemo, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiClipboardList, HiCheckCircle, HiClock, HiKey } from 'react-icons/hi';

interface AssignedTest {
  id: string;
  test_id: string;
  assigned_at: string;
  test: {
    id: string;
    title: string;
    description: string | null;
    question_count: number;
    material: { title: string };
  };
  hasAttempt: boolean;
  bestScore: number | null;
}

export default function StudentTestsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<AssignedTest[]>([]);
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
    const fetchTests = async () => {
      if (!profile) return;

      const { data } = await supabase
        .from('test_assignments')
        .select(`
          id,
          test_id,
          assigned_at,
          test:tests(id, title, description, question_count, material:materials(title))
        `)
        .eq('student_id', profile.id)
        .order('assigned_at', { ascending: false });

      if (data) {
        // Fetch attempts for each assignment
        const enriched = await Promise.all(
          data.map(async (a: any) => {
            const { data: attempts } = await supabase
              .from('test_attempts')
              .select('score')
              .eq('assignment_id', a.id)
              .not('completed_at', 'is', null);

            const scores = (attempts || [])
              .map((att: { score: number | null }) => att.score)
              .filter((s: number | null): s is number => s !== null);

            return {
              ...a,
              hasAttempt: scores.length > 0,
              bestScore: scores.length > 0 ? Math.max(...scores) : null,
            };
          })
        );

        setAssignments(enriched);
      }
      setLoading(false);
    };

    fetchTests();
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">My Tests</h1>
      </div>
      <p className="text-text-secondary mb-6">
        View your assigned tests and results
      </p>

      {/* Join Test by Code */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <HiKey className="w-5 h-5 text-accent-cyan flex-shrink-0" />
        <input
          type="text"
          value={testCode}
          onChange={(e) => setTestCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoinTest()}
          placeholder="Enter test code"
          maxLength={6}
          className="input-field font-mono tracking-widest uppercase flex-1 text-sm"
        />
        <button
          onClick={handleJoinTest}
          disabled={!testCode.trim() || joining}
          className="btn-primary text-sm disabled:opacity-50 whitespace-nowrap"
        >
          {joining ? 'Joining...' : 'Join'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-4 w-72" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary">
            No tests yet. Enter a test code above or ask your teacher for one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/student/tests/${a.test_id}`}
              className="card-hover p-6 flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    a.hasAttempt ? 'bg-green-500/10' : 'bg-primary/10'
                  }`}
                >
                  {a.hasAttempt ? (
                    <HiCheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <HiClipboardList className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{a.test.title}</h3>
                  {a.test.description && (
                    <p className="text-sm text-text-secondary mt-1">
                      {a.test.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-secondary">
                      {a.test.question_count} questions
                    </span>
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <HiClock className="w-3 h-3" />
                      Assigned {new Date(a.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {a.bestScore !== null && (
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      a.bestScore >= 70
                        ? 'text-green-400'
                        : a.bestScore >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {Math.round(a.bestScore)}%
                  </p>
                  <p className="text-xs text-text-secondary">Best Score</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
