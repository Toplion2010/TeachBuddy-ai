'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Material } from '@/utils/types';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiTrash, HiDocumentText } from 'react-icons/hi';

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const fetchMaterial = async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast.error('Material not found');
        router.push('/teacher/materials');
      } else {
        setMaterial(data);
      }
      setLoading(false);
    };

    fetchMaterial();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete material');
    } else {
      toast.success('Material deleted');
      router.push('/teacher/materials');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-4 w-96 mb-8" />
        <div className="card p-6">
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!material) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/teacher/materials"
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to Materials
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{material.title}</h1>
          {material.description && (
            <p className="text-text-secondary">{material.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {material.file_type && (
              <span className="badge-primary uppercase">{material.file_type}</span>
            )}
            {material.file_name && (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <HiDocumentText className="w-4 h-4" />
                {material.file_name}
              </span>
            )}
            <span className="text-sm text-text-secondary">
              Uploaded {new Date(material.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <button onClick={handleDelete} className="btn-danger flex items-center gap-2">
          <HiTrash className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Content Preview */}
      <div className="card p-6">
        <h2 className="font-medium mb-4">Extracted Content</h2>
        <div className="bg-background rounded-lg p-4 max-h-[500px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-text-secondary font-sans">
            {material.content_text}
          </pre>
        </div>
      </div>

      {/* Generate Test CTA */}
      <div className="card p-6 mt-6 text-center">
        <h3 className="font-medium mb-2">Ready to generate a test?</h3>
        <p className="text-sm text-text-secondary mb-4">
          AI will create a mix of question types based on this material
        </p>
        <Link
          href={`/teacher/tests?generate=${material.id}`}
          className="btn-primary"
        >
          Generate Test from This Material
        </Link>
      </div>
    </div>
  );
}
