'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Material } from '@/utils/types';
import { HiLightningBolt } from 'react-icons/hi';

interface GenerateTestButtonProps {
  materials: Material[];
}

export default function GenerateTestButton({ materials }: GenerateTestButtonProps) {
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [questionCount, setQuestionCount] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!selectedMaterial) {
      toast.error('Please select a material');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterial,
          question_count: questionCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      toast.success('Test generated successfully!');
      setShowModal(false);
      router.push(`/teacher/tests/${data.test.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary flex items-center gap-2"
        disabled={materials.length === 0}
      >
        <HiLightningBolt className="w-5 h-5" />
        Generate Test
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Generate AI Test</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Select Material
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="select-field"
                >
                  <option value="">Choose a material...</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  min={5}
                  max={30}
                  className="input-field"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Mix: ~60% multiple choice, ~15% true/false, ~15% fill-in-blank, ~10% open-ended
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedMaterial || generating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
