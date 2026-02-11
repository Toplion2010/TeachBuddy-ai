import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a student
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can join tests' },
        { status: 403 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Test code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid test code format' },
        { status: 400 }
      );
    }

    // Find the published test with this code
    const { data: test } = await supabase
      .from('tests')
      .select('id, title, teacher_id')
      .eq('access_code', normalizedCode)
      .eq('is_published', true)
      .single();

    if (!test) {
      return NextResponse.json(
        { error: 'Invalid or expired test code' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('test_assignments')
      .select('id')
      .eq('test_id', test.id)
      .eq('student_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        test_id: test.id,
        title: test.title,
        already_joined: true,
      });
    }

    // Create assignment
    const { error: assignError } = await supabase
      .from('test_assignments')
      .insert({
        test_id: test.id,
        student_id: user.id,
        assigned_by: test.teacher_id,
      });

    if (assignError) {
      return NextResponse.json(
        { error: assignError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      test_id: test.id,
      title: test.title,
      already_joined: false,
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to join test' },
      { status: 500 }
    );
  }
}
