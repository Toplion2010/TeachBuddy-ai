'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiPlay, HiRefresh, HiAcademicCap } from 'react-icons/hi';

export default function StudentTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [test, setTest] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch test
      const { data: testData } = await supabase
        .from('tests')
        .select('*, material:materials(title)')
        .eq('id', id)
        .single();

      // Fetch assignment
      const { data: assignmentData } = await supabase
        .from('test_assignments')
        .select('*')
        .eq('test_id', id)
        .eq('student_id', profile.id)
        .single();

      if (!testData || !assignmentData) {
        toast.error('Test not found');
        router.push('/student/tests');
        return;
      }

      // Fetch attempts
      const { data: attemptsData } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('assignment_id', assignmentData.id)
        .order('started_at', { ascending: false });

      setTest(testData);
      setAssignment(assignmentData);
      setAttempts(attemptsData || []);
      setLoading(false);
    };

    fetchData();
  }, [id, profile]);

  const startTest = async () => {
    if (!assignment || !profile) return;

    // Create a new attempt
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .insert({
        assignment_id: assignment.id,
        student_id: profile!.id,
      })
      .select()
      .single();

    if (error || !attempt) {
      toast.error('Failed to start test');
      return;
    }

    router.push(`/student/tests/${id}/take?attempt=${attempt.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-4 w-96" />
      </div>
    );
  }

  if (!test) return null;

  const completedAttempts = attempts.filter((a) => a.completed_at);
  const latestCompleted = completedAttempts[0];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/student/tests"
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to Tests
      </Link>

      <div className="card p-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
        {test.description && (
          <p className="text-text-secondary mb-4">{test.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-text-secondary mb-6">
          <span>{test.question_count} questions</span>
          <span>No time limit</span>
          {test.material && <span>Topic: {test.material.title}</span>}
        </div>

        <div className="flex gap-3">
          <button onClick={startTest} className="btn-primary flex items-center gap-2">
            {completedAttempts.length > 0 ? (
              <>
                <HiRefresh className="w-5 h-5" />
                Retake Test
              </>
            ) : (
              <>
                <HiPlay className="w-5 h-5" />
                Start Test
              </>
            )}
          </button>

          {latestCompleted && (
            <>
              <Link
                href={`/student/tests/${id}/results?attempt=${latestCompleted.id}`}
                className="btn-secondary"
              >
                View Latest Results
              </Link>
              <Link
                href={`/student/tests/${id}/tutor?attempt=${latestCompleted.id}`}
                className="btn-secondary flex items-center gap-2"
              >
                <HiAcademicCap className="w-4 h-4" />
                AI Tutor
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Previous Attempts */}
      {completedAttempts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Previous Attempts</h2>
          <div className="space-y-3">
            {completedAttempts.map((attempt, i) => (
              <Link
                key={attempt.id}
                href={`/student/tests/${id}/results?attempt=${attempt.id}`}
                className="card p-4 flex items-center justify-between hover:border-white/20 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    Attempt {completedAttempts.length - i}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {new Date(attempt.completed_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-lg font-bold ${
                    attempt.score >= 70
                      ? 'text-green-400'
                      : attempt.score >= 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {Math.round(attempt.score)}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
