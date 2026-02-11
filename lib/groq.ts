import Groq from 'groq-sdk';

let _groq: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing GROQ_API_KEY environment variable. Please set it in your .env.local file.'
      );
    }
    _groq = new Groq({ apiKey });
  }
  return _groq;
}
