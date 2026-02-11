import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gradeOpenEnded } from '@/lib/ai/grade-response';

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

    const { attempt_id, answers } = await request.json();

    if (!attempt_id || !answers) {
      return NextResponse.json(
        { error: 'attempt_id and answers are required' },
        { status: 400 }
      );
    }

    // Fetch all questions for this test
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', id);

    if (!questions) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let totalPoints = 0;
    let earnedPoints = 0;

    const responses = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.question_id);
      if (!question) continue;

      totalPoints += question.points;
      let isCorrect = false;
      let pointsEarned = 0;
      let feedback = '';

      if (question.question_type === 'open_ended') {
        // AI grading for open-ended questions
        const gradeResult = await gradeOpenEnded(
          question.question_text,
          question.correct_answer,
          answer.student_answer || '',
          question.points
        );
        isCorrect = gradeResult.is_correct;
        pointsEarned = gradeResult.points_earned;
        feedback = gradeResult.feedback;
      } else if (question.question_type === 'fill_in_blank') {
        // Flexible comparison for fill-in-blank (handles spaces, case, punctuation)
        const normalize = (str: string) =>
          str
            .toLowerCase()
            .trim()
            .replace(/[^\w]/g, '') // Remove all non-word characters (spaces, hyphens, etc.)
            .replace(/\s+/g, '');

        isCorrect =
          normalize(answer.student_answer || '') ===
          normalize(question.correct_answer);
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? 'Correct!'
          : `The correct answer is: ${question.correct_answer}`;
      } else {
        // Exact match for multiple choice and true/false
        isCorrect = answer.student_answer === question.correct_answer;
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? 'Correct!'
          : `The correct answer is: ${question.correct_answer}`;
      }

      if (question.explanation && !isCorrect) {
        feedback += ` Explanation: ${question.explanation}`;
      }

      earnedPoints += pointsEarned;

      responses.push({
        attempt_id,
        question_id: answer.question_id,
        student_answer: answer.student_answer || '',
        is_correct: isCorrect,
        points_earned: pointsEarned,
        ai_feedback: feedback,
      });
    }

    // Save responses
    const { error: respError } = await supabase
      .from('student_responses')
      .insert(responses);

    if (respError) {
      return NextResponse.json({ error: respError.message }, { status: 500 });
    }

    // Calculate score as percentage
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Update attempt
    const { error: attemptError } = await supabase
      .from('test_attempts')
      .update({
        score,
        total_points: totalPoints,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt_id);

    if (attemptError) {
      return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    return NextResponse.json({
      score: Math.round(score),
      earned_points: earnedPoints,
      total_points: totalPoints,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Grading failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
