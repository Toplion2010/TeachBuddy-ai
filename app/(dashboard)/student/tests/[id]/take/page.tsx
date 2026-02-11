'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Question } from '@/utils/types';
import { HiChevronLeft, HiChevronRight, HiCheck } from 'react-icons/hi';

export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', id)
        .order('order_index');

      if (error || !data) {
        toast.error('Failed to load test');
        router.push(`/student/tests/${id}`);
        return;
      }

      setQuestions(data);
      setLoading(false);
    };

    if (attemptId) {
      fetchQuestions();
    } else {
      router.push(`/student/tests/${id}`);
    }
  }, [id, attemptId]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      if (!confirm(`You have ${questions.length - answeredCount} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          answers: Object.entries(answers).map(([question_id, student_answer]) => ({
            question_id,
            student_answer,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success('Test submitted!');
      router.push(`/student/tests/${id}/results?attempt=${attemptId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="skeleton h-8 w-64 mb-8" />
        <div className="card p-8">
          <div className="skeleton h-6 w-full mb-4" />
          <div className="skeleton h-10 w-full mb-2" />
          <div className="skeleton h-10 w-full mb-2" />
          <div className="skeleton h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-text-secondary">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Navigation dots */}
      <div className="flex flex-wrap gap-2 mb-6">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              i === currentIndex
                ? 'bg-primary text-white'
                : answers[q.id]
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="card p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="badge-primary text-xs">
            {currentQuestion.question_type.replace('_', ' ')}
          </span>
          <span className="text-xs text-text-secondary">
            {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
          </span>
        </div>

        <h2 className="text-lg font-medium mb-6">{currentQuestion.question_text}</h2>

        {/* Multiple Choice */}
        {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => setAnswer(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-primary bg-primary/10 text-text-primary'
                    : 'border-gray-800 hover:border-white/20'
                }`}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQuestion.question_type === 'true_false' && (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => setAnswer(currentQuestion.id, option)}
                className={`flex-1 p-4 rounded-lg border text-center transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-800 hover:border-white/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Fill in the Blank */}
        {currentQuestion.question_type === 'fill_in_blank' && (
          <input
            type="text"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            className="input-field"
            placeholder="Type your answer..."
          />
        )}

        {/* Open Ended */}
        {currentQuestion.question_type === 'open_ended' && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            className="textarea-field min-h-[150px]"
            placeholder="Write your answer here..."
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn-secondary flex items-center gap-1 disabled:opacity-30"
        >
          <HiChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            <HiCheck className="w-5 h-5" />
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            className="btn-primary flex items-center gap-1"
          >
            Next
            <HiChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
