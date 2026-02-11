'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useMemo, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  HiDocumentText,
  HiClipboardList,
  HiUserGroup,
  HiPlus,
} from 'react-icons/hi';

interface DashboardStats {
  materialCount: number;
  testCount: number;
  studentCount: number;
}

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    materialCount: 0,
    testCount: 0,
    studentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;

      const [materialsRes, testsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('materials')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', profile.id),
        supabase
          .from('tests')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', profile.id),
        supabase
          .from('test_assignments')
          .select('student_id', { count: 'exact', head: true })
          .eq('assigned_by', profile.id),
      ]);

      setStats({
        materialCount: materialsRes.count ?? 0,
        testCount: testsRes.count ?? 0,
        studentCount: assignmentsRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Teacher'}
        </h1>
        <p className="text-text-secondary">
          Manage your materials, create tests, and track student progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <HiDocumentText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {loading ? '...' : stats.materialCount}
              </p>
              <p className="text-sm text-text-secondary">Materials</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <HiClipboardList className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {loading ? '...' : stats.testCount}
              </p>
              <p className="text-sm text-text-secondary">Tests</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-violet/10 flex items-center justify-center">
              <HiUserGroup className="w-6 h-6 text-accent-violet" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {loading ? '...' : stats.studentCount}
              </p>
              <p className="text-sm text-text-secondary">Assignments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/teacher/materials/upload"
            className="card-hover p-6 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HiPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Upload Material</h3>
              <p className="text-sm text-text-secondary">
                Upload a PDF, Word, or text file
              </p>
            </div>
          </Link>

          <Link
            href="/teacher/tests"
            className="card-hover p-6 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <HiClipboardList className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h3 className="font-medium">View Tests</h3>
              <p className="text-sm text-text-secondary">
                Manage and assign your tests
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
