import { getGroqClient } from '@/lib/groq';

interface GradeResult {
  is_correct: boolean;
  points_earned: number;
  feedback: string;
}

export async function gradeOpenEnded(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  maxPoints: number
): Promise<GradeResult> {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert teacher grading student answers. Grade the student's answer compared to the correct answer.

Grading Guidelines:
- Award FULL points if the answer demonstrates understanding of key concepts, even if wording differs
- Award PARTIAL points if the answer is incomplete but shows some understanding
- Be lenient with minor spelling/grammar errors, synonyms, or different phrasings
- Focus on whether the student grasped the core ideas, not exact word matching
- Return only valid JSON.`,
      },
      {
        role: 'user',
        content: `Question: ${questionText}

Correct/Model Answer: ${correctAnswer}

Student Answer: ${studentAnswer}

Max Points: ${maxPoints}

Grade this answer and return JSON:
{
  "points_earned": <number between 0 and ${maxPoints}>,
  "is_correct": <true if points_earned >= ${Math.ceil(maxPoints * 0.7)}>,
  "feedback": "<brief feedback explaining the grade>"
}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    return { is_correct: false, points_earned: 0, feedback: 'Unable to grade' };
  }

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(jsonStr);
}
