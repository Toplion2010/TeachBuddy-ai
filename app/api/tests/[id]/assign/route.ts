import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_ids } = await request.json();

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json(
        { error: 'student_ids array is required' },
        { status: 400 }
      );
    }

    // Verify test belongs to teacher
    const { data: test } = await supabase
      .from('tests')
      .select('id')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single();

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Create assignments (ignore duplicates)
    const assignments = student_ids.map((studentId: string) => ({
      test_id: id,
      student_id: studentId,
      assigned_by: user.id,
    }));

    const { data, error } = await supabase
      .from('test_assignments')
      .upsert(assignments, { onConflict: 'test_id,student_id' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignments: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to assign test' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: assignments, error } = await supabase
      .from('test_assignments')
      .select('*, student:profiles!student_id(*)')
      .eq('test_id', id)
      .eq('assigned_by', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignments });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
