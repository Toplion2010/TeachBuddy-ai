import { getGroqClient } from '@/lib/groq';

interface TutorContext {
  materialContent: string;
  materialTitle: string;
  wrongAnswers: {
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];
  weakTopics: string[];
}

export function buildTutorSystemPrompt(context: TutorContext): string {
  const wrongAnswersSummary = context.wrongAnswers
    .map(
      (w, i) =>
        `${i + 1}. Question: "${w.question}"
   Student answered: "${w.studentAnswer}"
   Correct answer: "${w.correctAnswer}"
   Explanation: ${w.explanation}`
    )
    .join('\n\n');

  return `You are a friendly, patient, and encouraging AI tutor for TeachBuddy.ai. Your job is to help this student understand the topics they got wrong on their test.

## Teaching Material
Title: ${context.materialTitle}
Content (excerpt):
${context.materialContent.substring(0, 4000)}

## Student's Wrong Answers
${wrongAnswersSummary}

## Identified Weak Topics
${context.weakTopics.length > 0 ? context.weakTopics.join(', ') : 'General understanding needs improvement'}

## Your Teaching Approach
1. Start by acknowledging the student's effort and identifying the main areas to work on
2. Teach concepts step by step, starting from basics and building up
3. Use the original teaching material as your source of truth
4. Give clear, simple explanations with examples
5. After explaining a concept, ask the student a quick check question to verify understanding
6. Be encouraging and positive - celebrate when they understand something
7. Focus on the topics where they made mistakes
8. If they ask about something outside the material, gently redirect to the relevant topics
9. Keep explanations concise but thorough

Remember: Your goal is to make sure the student truly understands the topics, not just memorizes answers.`;
}

export async function identifyWeakTopics(
  wrongAnswers: { question: string; correctAnswer: string }[]
): Promise<string[]> {
  if (wrongAnswers.length === 0) return [];

  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You identify learning topics from test questions. Return only a JSON array of topic strings.',
      },
      {
        role: 'user',
        content: `Based on these questions the student got wrong, identify the main topics/concepts they need to study:

${wrongAnswers.map((w, i) => `${i + 1}. ${w.question} (Answer: ${w.correctAnswer})`).join('\n')}

Return a JSON array of 2-5 topic names, e.g.: ["Photosynthesis", "Cell Division"]`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = response.choices[0].message.content;
  if (!content) return [];

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(jsonStr);
}
