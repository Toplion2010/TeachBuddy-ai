'use client';

import Link from 'next/link';
import type { Material } from '@/utils/types';
import { HiDocumentText, HiTrash } from 'react-icons/hi';

interface MaterialCardProps {
  material: Material;
  onDelete: (id: string) => void;
}

export default function MaterialCard({ material, onDelete }: MaterialCardProps) {
  const fileTypeLabel = {
    pdf: 'PDF',
    docx: 'Word',
    txt: 'Text',
  };

  return (
    <div className="card-hover p-6">
      <div className="flex items-start justify-between">
        <Link
          href={`/teacher/materials/${material.id}`}
          className="flex items-start gap-4 flex-1"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HiDocumentText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{material.title}</h3>
            {material.description && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                {material.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {material.file_type && (
                <span className="badge-primary">
                  {fileTypeLabel[material.file_type] || material.file_type}
                </span>
              )}
              <span className="text-xs text-text-secondary">
                {new Date(material.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Link>

        <button
          onClick={() => onDelete(material.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors flex-shrink-0"
          title="Delete material"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
