'use client';

import Link from 'next/link';
import type { Test } from '@/utils/types';
import { HiClipboardList, HiTrash } from 'react-icons/hi';

interface TestCardProps {
  test: Test & { material?: { title: string } };
  onDelete: (id: string) => void;
}

export default function TestCard({ test, onDelete }: TestCardProps) {
  return (
    <div className="card-hover p-6">
      <div className="flex items-start justify-between">
        <Link
          href={`/teacher/tests/${test.id}`}
          className="flex items-start gap-4 flex-1"
        >
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
            <HiClipboardList className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{test.title}</h3>
            {test.description && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                {test.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-text-secondary">
                {test.question_count} questions
              </span>
              <span
                className={
                  test.is_published ? 'badge-success' : 'badge-warning'
                }
              >
                {test.is_published ? 'Published' : 'Draft'}
              </span>
              {test.material && (
                <span className="text-xs text-text-secondary">
                  From: {test.material.title}
                </span>
              )}
            </div>
          </div>
        </Link>

        <button
          onClick={() => onDelete(test.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors flex-shrink-0"
          title="Delete test"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
