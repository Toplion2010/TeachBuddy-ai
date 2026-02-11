'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';

interface StudentResult {
  student_name: string;
  student_email: string;
  attempts: number;
  best_score: number | null;
  latest_score: number | null;
}

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<StudentResult[]>([]);
  const [testTitle, setTestTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchResults = async () => {
      // Fetch test title
      const { data: test } = await supabase
        .from('tests')
        .select('title')
        .eq('id', id)
        .single();

      if (test) setTestTitle(test.title);

      // Fetch assignments with attempts
      const { data: assignments } = await supabase
        .from('test_assignments')
        .select(`
          student:profiles!student_id(full_name, email),
          attempts:test_attempts(score, completed_at)
        `)
        .eq('test_id', id);

      if (assignments) {
        const studentResults: StudentResult[] = assignments.map((a: any) => {
          const completedAttempts = (a.attempts || []).filter(
            (att: any) => att.completed_at
          );
          const scores = completedAttempts.map((att: any) => att.score).filter(Boolean);

          return {
            student_name: a.student?.full_name || 'Unknown',
            student_email: a.student?.email || '',
            attempts: completedAttempts.length,
            best_score: scores.length > 0 ? Math.max(...scores) : null,
            latest_score: scores.length > 0 ? scores[scores.length - 1] : null,
          };
        });
        setResults(studentResults);
      }

      setLoading(false);
    };

    fetchResults();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/teacher/tests/${id}`}
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to Test
      </Link>

      <h1 className="text-2xl font-bold mb-2">Results</h1>
      <p className="text-text-secondary mb-6">{testTitle}</p>

      {loading ? (
        <div className="card p-6">
          <div className="skeleton h-4 w-full mb-3" />
          <div className="skeleton h-4 w-full mb-3" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary">
            No students have been assigned or attempted this test yet
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-text-secondary">
                  Student
                </th>
                <th className="text-center p-4 text-sm font-medium text-text-secondary">
                  Attempts
                </th>
                <th className="text-center p-4 text-sm font-medium text-text-secondary">
                  Best Score
                </th>
                <th className="text-center p-4 text-sm font-medium text-text-secondary">
                  Latest Score
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-4">
                    <p className="font-medium">{r.student_name}</p>
                    <p className="text-xs text-text-secondary">{r.student_email}</p>
                  </td>
                  <td className="p-4 text-center">{r.attempts}</td>
                  <td className="p-4 text-center">
                    {r.best_score !== null ? (
                      <span
                        className={
                          r.best_score >= 70
                            ? 'text-green-400'
                            : r.best_score >= 50
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }
                      >
                        {Math.round(r.best_score)}%
                      </span>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {r.latest_score !== null ? (
                      `${Math.round(r.latest_score)}%`
                    ) : (
                      <span className="text-text-secondary">Not taken</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
