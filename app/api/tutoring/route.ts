import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGroqClient } from '@/lib/groq';
import { buildTutorSystemPrompt, identifyWeakTopics } from '@/lib/ai/tutor';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attempt_id, message, session_id } = await request.json();

    if (!attempt_id || !message) {
      return NextResponse.json(
        { error: 'attempt_id and message are required' },
        { status: 400 }
      );
    }

    // Get or create session
    let session;
    if (session_id) {
      const { data } = await supabase
        .from('tutoring_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('student_id', user.id)
        .single();
      session = data;
    }

    if (!session) {
      // Fetch attempt data with wrong answers
      const { data: responses } = await supabase
        .from('student_responses')
        .select('*, question:questions(*)')
        .eq('attempt_id', attempt_id)
        .eq('is_correct', false);

      const { data: attempt } = await supabase
        .from('test_attempts')
        .select('*, assignment:test_assignments(test:tests(*, material:materials(*)))')
        .eq('id', attempt_id)
        .single();

      if (!attempt || !responses) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      const test = attempt.assignment?.test;
      const material = test?.material;

      const wrongAnswers = responses.map((r: any) => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer || '(no answer)',
        correctAnswer: r.question.correct_answer,
        explanation: r.question.explanation || '',
      }));

      // Identify weak topics
      const weakTopics = await identifyWeakTopics(
        wrongAnswers.map((w: any) => ({
          question: w.question,
          correctAnswer: w.correctAnswer,
        }))
      );

      // Create session
      const { data: newSession, error: sessError } = await supabase
        .from('tutoring_sessions')
        .insert({
          attempt_id,
          student_id: user.id,
          weak_topics: weakTopics,
          messages: [],
        })
        .select()
        .single();

      if (sessError || !newSession) {
        return NextResponse.json(
          { error: 'Failed to create tutoring session' },
          { status: 500 }
        );
      }

      session = {
        ...newSession,
        _context: {
          materialContent: material?.content_text || '',
          materialTitle: material?.title || 'Unknown',
          wrongAnswers,
          weakTopics,
        },
      };
    }

    // Build context if not already loaded
    if (!session._context) {
      const { data: responses } = await supabase
        .from('student_responses')
        .select('*, question:questions(*)')
        .eq('attempt_id', attempt_id)
        .eq('is_correct', false);

      const { data: attempt } = await supabase
        .from('test_attempts')
        .select('*, assignment:test_assignments(test:tests(*, material:materials(*)))')
        .eq('id', attempt_id)
        .single();

      const test = attempt?.assignment?.test;
      const material = test?.material;

      session._context = {
        materialContent: material?.content_text || '',
        materialTitle: material?.title || 'Unknown',
        wrongAnswers: (responses || []).map((r: any) => ({
          question: r.question.question_text,
          studentAnswer: r.student_answer || '(no answer)',
          correctAnswer: r.question.correct_answer,
          explanation: r.question.explanation || '',
        })),
        weakTopics: session.weak_topics || [],
      };
    }

    // Build messages for AI
    const systemPrompt = buildTutorSystemPrompt(session._context);
    const chatHistory = (session.messages || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory,
      { role: 'user' as const, content: message },
    ];

    // Get AI response
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: aiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message.content || '';

    // Update session with new messages
    const updatedMessages = [
      ...session.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    await supabase
      .from('tutoring_sessions')
      .update({ messages: updatedMessages })
      .eq('id', session.id);

    return NextResponse.json({
      session_id: session.id,
      message: assistantMessage,
      weak_topics: session.weak_topics || session._context?.weakTopics || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tutoring failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
