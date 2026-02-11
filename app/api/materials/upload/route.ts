import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseFile, getFileType } from '@/lib/parsers';
import { generateTest } from '@/lib/ai/generate-test';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // Parse file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentText = await parseFile(buffer, file.name);

    if (!contentText || contentText.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from the file' },
        { status: 400 }
      );
    }

    const fileType = getFileType(file.name);

    // Upload file to Supabase Storage
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    let fileUrl: string | null = null;
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }

    // Save to database
    const { data: material, error: dbError } = await supabase
      .from('materials')
      .insert({
        teacher_id: user.id,
        title,
        description,
        content_text: contentText,
        file_url: fileUrl,
        file_type: fileType,
        file_name: file.name,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Generate test automatically
    try {
      console.log('Starting AI test generation for material:', material.id);
      const generatedTest = await generateTest(
        material.content_text,
        material.title,
        15
      );
      console.log('AI test generation completed, saving to database...');

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

      if (testError) {
        console.error('Test save error:', testError);
        throw testError;
      }

      if (test) {
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

        const { error: qError } = await supabase.from('questions').insert(questions);

        if (qError) {
          console.error('Questions save error:', qError);
          // Cleanup test if questions failed
          await supabase.from('tests').delete().eq('id', test.id);
          throw qError;
        }

        console.log('Test and questions saved successfully');
        return NextResponse.json({ material, test }, { status: 201 });
      }
    } catch (aiError) {
      // If test generation fails, still return the material
      console.error('Test generation failed:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
      return NextResponse.json(
        {
          material,
          test: null,
          warning: `Material uploaded but test generation failed: ${errorMessage}`
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ material, test: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
