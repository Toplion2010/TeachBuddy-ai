'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Profile } from '@/utils/types';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiCheck, HiUserAdd } from 'react-icons/hi';

export default function AssignTestPage() {
  const { id } = useParams<{ id: string }>();
  const [students, setStudents] = useState<Profile[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all students
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      // Fetch already assigned students
      const { data: assignments } = await supabase
        .from('test_assignments')
        .select('student_id')
        .eq('test_id', id);

      setStudents(allStudents || []);
      setAssignedIds(new Set(assignments?.map((a: { student_id: string }) => a.student_id) || []));
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const toggleStudent = (studentId: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(studentId)) {
      updated.delete(studentId);
    } else {
      updated.add(studentId);
    }
    setSelectedIds(updated);
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/tests/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(`Assigned to ${selectedIds.size} student(s)`);
      setAssignedIds(new Set([...assignedIds, ...selectedIds]));
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const selectAll = () => {
    const unassigned = students.filter((s) => !assignedIds.has(s.id));
    setSelectedIds(new Set(unassigned.map((s) => s.id)));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/teacher/tests/${id}`}
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to Test
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Assign Test</h1>
          <p className="text-text-secondary mt-1">
            Select students to assign this test to
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="btn-secondary text-sm">
            Select All
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedIds.size === 0 || assigning}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <HiUserAdd className="w-4 h-4" />
            {assigning ? 'Assigning...' : `Assign (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-5 w-40" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary">
            No students have registered yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const isAssigned = assignedIds.has(student.id);
            const isSelected = selectedIds.has(student.id);

            return (
              <button
                key={student.id}
                onClick={() => !isAssigned && toggleStudent(student.id)}
                disabled={isAssigned}
                className={`w-full card p-4 flex items-center justify-between text-left transition-all ${
                  isAssigned
                    ? 'opacity-60'
                    : isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'hover:border-white/20'
                }`}
              >
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-text-secondary">{student.email}</p>
                </div>
                {isAssigned ? (
                  <span className="badge-success">Assigned</span>
                ) : isSelected ? (
                  <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                    <HiCheck className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded border border-gray-800" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
