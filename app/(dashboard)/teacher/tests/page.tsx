'use client';

import { useMemo, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import TestCard from '@/components/teacher/TestCard';
import GenerateTestButton from '@/components/teacher/GenerateTestButton';
import type { Test, Material } from '@/utils/types';
import toast from 'react-hot-toast';

export default function TestsPage() {
  const { profile } = useAuth();
  const [tests, setTests] = useState<(Test & { material?: { title: string } })[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const [testsRes, materialsRes] = await Promise.all([
        supabase
          .from('tests')
          .select('*, material:materials(title)')
          .eq('teacher_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('materials')
          .select('*')
          .eq('teacher_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);

      if (testsRes.data) setTests(testsRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete test');
    } else {
      setTests(tests.filter((t) => t.id !== id));
      toast.success('Test deleted');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Tests</h1>
          <p className="text-text-secondary mt-1">
            Generate and manage AI-powered tests
          </p>
        </div>
        <GenerateTestButton materials={materials} />
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
      ) : tests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-4">
            {materials.length === 0
              ? 'Upload a material first, then generate a test from it'
              : 'No tests generated yet. Click "Generate Test" to create one.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
