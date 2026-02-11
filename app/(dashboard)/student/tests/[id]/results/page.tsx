'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { StudentResponse, Question } from '@/utils/types';
import {
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiAcademicCap,
  HiRefresh,
} from 'react-icons/hi';

interface ResponseWithQuestion extends StudentResponse {
  question: Question;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const [attempt, setAttempt] = useState<any>(null);
  const [responses, setResponses] = useState<ResponseWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!attemptId) return;

      const [attemptRes, responsesRes] = await Promise.all([
        supabase
          .from('test_attempts')
          .select('*')
          .eq('id', attemptId)
          .single(),
        supabase
          .from('student_responses')
          .select('*, question:questions(*)')
          .eq('attempt_id', attemptId),
      ]);

      if (attemptRes.data) setAttempt(attemptRes.data);
      if (responsesRes.data) {
        const sorted = responsesRes.data.sort(
          (a: any, b: any) => a.question.order_index - b.question.order_index
        );
        setResponses(sorted);
      }
      setLoading(false);
    };

    fetchResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-64 mb-8" />
        <div className="skeleton h-32 w-full mb-6" />
      </div>
    );
  }

  if (!attempt) return null;

  const correctCount = responses.filter((r) => r.is_correct).length;
  const wrongResponses = responses.filter((r) => !r.is_correct);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/student/tests/${id}`}
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to Test
      </Link>

      {/* Score Summary */}
      <div className="card p-8 text-center mb-8">
        <p
          className={`text-6xl font-bold mb-2 ${
            attempt.score >= 70
              ? 'text-green-400'
              : attempt.score >= 50
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}
        >
          {Math.round(attempt.score)}%
        </p>
        <p className="text-text-secondary mb-4">
          {correctCount} of {responses.length} correct
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href={`/student/tests/${id}`}
            className="btn-secondary flex items-center gap-2"
          >
            <HiRefresh className="w-4 h-4" />
            Retake Test
          </Link>
          {wrongResponses.length > 0 && (
            <Link
              href={`/student/tests/${id}/tutor?attempt=${attemptId}`}
              className="btn-primary flex items-center gap-2"
            >
              <HiAcademicCap className="w-4 h-4" />
              Get AI Tutoring
            </Link>
          )}
        </div>
      </div>

      {/* Question Breakdown */}
      <h2 className="text-lg font-semibold mb-4">Question Breakdown</h2>
      <div className="space-y-4">
        {responses.map((r, i) => (
          <div
            key={r.id}
            className={`card p-5 border-l-4 ${
              r.is_correct ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {r.is_correct ? (
                  <HiCheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <HiXCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Q{i + 1}</span>
                  <span className="badge-primary text-xs">
                    {r.question.question_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {r.points_earned}/{r.question.points} pts
                  </span>
                </div>

                <p className="mb-2">{r.question.question_text}</p>

                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-text-secondary">Your answer: </span>
                    <span className={r.is_correct ? 'text-green-400' : 'text-red-400'}>
                      {r.student_answer || '(no answer)'}
                    </span>
                  </p>
                  {!r.is_correct && (
                    <p>
                      <span className="text-text-secondary">Correct answer: </span>
                      <span className="text-green-400">{r.question.correct_answer}</span>
                    </p>
                  )}
                  {r.ai_feedback && (
                    <p className="text-text-secondary italic mt-2">
                      {r.ai_feedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
