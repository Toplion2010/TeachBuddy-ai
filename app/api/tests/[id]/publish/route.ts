import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateAccessCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function PATCH(
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

    // Get current test state
    const { data: current } = await supabase
      .from('tests')
      .select('is_published, access_code')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const willPublish = !current.is_published;

    // Generate access code when publishing for the first time
    let accessCode = current.access_code;
    if (willPublish && !accessCode) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateAccessCode();
        const { data: existing } = await supabase
          .from('tests')
          .select('id')
          .eq('access_code', candidate)
          .single();

        if (!existing) {
          accessCode = candidate;
          break;
        }
      }

      if (!accessCode) {
        return NextResponse.json(
          { error: 'Failed to generate unique code. Please try again.' },
          { status: 500 }
        );
      }
    }

    const { data: test, error } = await supabase
      .from('tests')
      .update({
        is_published: willPublish,
        access_code: accessCode,
      })
      .eq('id', id)
      .eq('teacher_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ test });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}
