'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Question } from '@/utils/types';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiSave, HiPlus, HiTrash } from 'react-icons/hi';

const questionTypeLabel: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  open_ended: 'Open Ended',
  fill_in_blank: 'Fill in the Blank',
};

export default function EditTestPage() {
  const { id } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', id)
        .order('order_index');

      if (error) {
        toast.error('Failed to load questions');
      } else {
        setQuestions(data || []);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [id]);

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[qIndex].options || [])];
    options[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  const deleteQuestion = async (index: number) => {
    const q = questions[index];
    const { error } = await supabase.from('questions').delete().eq('id', q.id);
    if (error) {
      toast.error('Failed to delete question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));

    // Update test question count
    await supabase
      .from('tests')
      .update({ question_count: questions.length - 1 })
      .eq('id', id);

    toast.success('Question deleted');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const q of questions) {
        const { error } = await supabase
          .from('questions')
          .update({
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            points: q.points,
          })
          .eq('id', q.id);

        if (error) throw error;
      }
      toast.success('Questions saved!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-48 mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 mb-4">
            <div className="skeleton h-4 w-full mb-2" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/teacher/tests/${id}`}
          className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to Test
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <HiSave className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Questions</h1>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">Q{i + 1}</span>
                <span className="badge-primary text-xs">
                  {questionTypeLabel[q.question_type]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={q.points}
                  onChange={(e) => updateQuestion(i, { points: Number(e.target.value) })}
                  className="input-field w-20 text-sm py-1"
                  min={1}
                />
                <span className="text-xs text-text-secondary">pts</span>
                <button
                  onClick={() => deleteQuestion(i)}
                  className="p-1.5 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <textarea
              value={q.question_text}
              onChange={(e) => updateQuestion(i, { question_text: e.target.value })}
              className="textarea-field mb-3"
              rows={2}
            />

            {/* Options for MC */}
            {q.question_type === 'multiple_choice' && q.options && (
              <div className="space-y-2 mb-3">
                <label className="text-sm text-text-secondary">Options</label>
                {q.options.map((opt, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="text-sm w-6">{String.fromCharCode(65 + j)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, j, e.target.value)}
                      className="input-field text-sm py-1.5"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Correct Answer */}
            <div className="mb-3">
              <label className="text-sm text-text-secondary">Correct Answer</label>
              {q.question_type === 'multiple_choice' && q.options ? (
                <select
                  value={q.correct_answer}
                  onChange={(e) => updateQuestion(i, { correct_answer: e.target.value })}
                  className="select-field text-sm py-1.5 mt-1"
                >
                  {q.options.map((opt, j) => (
                    <option key={j} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : q.question_type === 'true_false' ? (
                <select
                  value={q.correct_answer}
                  onChange={(e) => updateQuestion(i, { correct_answer: e.target.value })}
                  className="select-field text-sm py-1.5 mt-1"
                >
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={q.correct_answer}
                  onChange={(e) => updateQuestion(i, { correct_answer: e.target.value })}
                  className="input-field text-sm py-1.5 mt-1"
                />
              )}
            </div>

            {/* Explanation */}
            <div>
              <label className="text-sm text-text-secondary">Explanation</label>
              <input
                type="text"
                value={q.explanation || ''}
                onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                className="input-field text-sm py-1.5 mt-1"
                placeholder="Why this is the correct answer..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
