import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTest } from '@/lib/ai/generate-test';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { material_id, question_count = 15 } = await request.json();

    if (!material_id) {
      return NextResponse.json(
        { error: 'material_id is required' },
        { status: 400 }
      );
    }

    // Fetch the material
    const { data: material, error: matError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', material_id)
      .eq('teacher_id', user.id)
      .single();

    if (matError || !material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Generate test using AI
    const generatedTest = await generateTest(
      material.content_text,
      material.title,
      question_count
    );

    // Save test to database
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        material_id: material.id,
        teacher_id: user.id,
        title: generatedTest.title,
        description: generatedTest.description,
        question_count: generatedTest.questions.length,
      })
      .select()
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: 'Failed to create test' },
        { status: 500 }
      );
    }

    // Save questions
    const questions = generatedTest.questions.map((q, index) => ({
      test_id: test.id,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points,
      order_index: index + 1,
    }));

    const { error: qError } = await supabase
      .from('questions')
      .insert(questions);

    if (qError) {
      // Cleanup test if questions failed
      await supabase.from('tests').delete().eq('id', test.id);
      return NextResponse.json(
        { error: 'Failed to save questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Test generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
