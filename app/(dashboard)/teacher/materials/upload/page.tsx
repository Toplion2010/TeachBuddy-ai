'use client';

import UploadForm from '@/components/teacher/UploadForm';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi';

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/teacher/materials"
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to Materials
      </Link>

      <h1 className="text-2xl font-bold mb-2">Upload Material</h1>
      <p className="text-text-secondary mb-8">
        Upload a PDF, Word, or text file. The AI will use its content to generate tests.
      </p>

      <UploadForm />
    </div>
  );
}
