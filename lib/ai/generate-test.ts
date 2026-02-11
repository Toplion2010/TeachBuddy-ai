import { getGroqClient } from '@/lib/groq';

interface GeneratedQuestion {
  question_type: 'multiple_choice' | 'true_false' | 'open_ended' | 'fill_in_blank';
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  points: number;
}

interface GenerateTestResult {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

export async function generateTest(
  materialContent: string,
  materialTitle: string,
  questionCount: number = 15
): Promise<GenerateTestResult> {
  const mcCount = Math.round(questionCount * 0.6);
  const tfCount = Math.round(questionCount * 0.15);
  const fibCount = Math.round(questionCount * 0.15);
  const oeCount = questionCount - mcCount - tfCount - fibCount;

  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert educational test generator. You create high-quality, comprehensive tests from teaching materials. Your tests should thoroughly assess student understanding of the material.

Generate questions in valid JSON format only. No additional text.`,
      },
      {
        role: 'user',
        content: `Based on the following teaching material, generate a comprehensive test with exactly ${questionCount} questions.

Question distribution:
- ${mcCount} multiple choice questions (4 options each, one correct)
- ${tfCount} true/false questions
- ${fibCount} fill-in-the-blank questions (use ___ for the blank)
- ${oeCount} open-ended questions

Material Title: ${materialTitle}
Material Content:
${materialContent.substring(0, 8000)}

Return a JSON object with this exact structure:
{
  "title": "Test: [appropriate test title]",
  "description": "A brief description of what this test covers",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question_text": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "The correct option text (must match one of the options exactly)",
      "explanation": "Why this is the correct answer",
      "points": 2
    },
    {
      "question_type": "true_false",
      "question_text": "A true or false statement",
      "options": null,
      "correct_answer": "True",
      "explanation": "Why this is true/false",
      "points": 1
    },
    {
      "question_type": "fill_in_blank",
      "question_text": "The ___ is the process by which...",
      "options": null,
      "correct_answer": "The word or short phrase that fills the blank",
      "explanation": "Explanation of the answer",
      "points": 2
    },
    {
      "question_type": "open_ended",
      "question_text": "Explain in your own words...",
      "options": null,
      "correct_answer": "A model answer that covers the key points",
      "explanation": "Key points that should be covered in the answer",
      "points": 5
    }
  ]
}

Important:
- Questions should cover different topics from the material
- Multiple choice options should be plausible
- Fill-in-the-blank answers should be single words or short phrases
- Open-ended questions should test deeper understanding
- Return ONLY valid JSON, no other text`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  // Parse the JSON response, handling potential markdown code blocks
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const result: GenerateTestResult = JSON.parse(jsonStr);

  if (!result.questions || !Array.isArray(result.questions)) {
    throw new Error('Invalid test format returned by AI');
  }

  return result;
}
