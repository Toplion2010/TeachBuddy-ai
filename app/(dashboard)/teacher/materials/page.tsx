'use client';

import { useMemo, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import MaterialCard from '@/components/teacher/MaterialCard';
import type { Material } from '@/utils/types';
import toast from 'react-hot-toast';
import { HiPlus } from 'react-icons/hi';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load materials');
      } else {
        setMaterials(data || []);
      }
      setLoading(false);
    };

    fetchMaterials();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete material');
    } else {
      setMaterials(materials.filter((m) => m.id !== id));
      toast.success('Material deleted');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-text-secondary mt-1">
            Upload and manage your teaching materials
          </p>
        </div>
        <Link href="/teacher/materials/upload" className="btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" />
          Upload
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-4 w-72" />
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-4">No materials uploaded yet</p>
          <Link href="/teacher/materials/upload" className="btn-primary">
            Upload Your First Material
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
