'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  HiArrowLeft,
  HiPaperAirplane,
  HiAcademicCap,
  HiLightBulb,
} from 'react-icons/hi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function TutorPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const { profile } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing session or start a new one
  useEffect(() => {
    const initSession = async () => {
      if (!attemptId || !profile) return;

      // Check for existing session
      const { data: existingSession } = await supabase
        .from('tutoring_sessions')
        .select('*')
        .eq('attempt_id', attemptId)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSession) {
        setSessionId(existingSession.id);
        setMessages(existingSession.messages || []);
        setWeakTopics(existingSession.weak_topics || []);
        setInitialized(true);
        return;
      }

      // Start a new session with introductory message
      setInitialized(true);
      await sendMessage(
        "Hi! I just finished my test and I'd like help understanding the topics I got wrong. Can you help me?"
      );
    };

    initSession();
  }, [attemptId, profile]);

  const sendMessage = async (messageText: string) => {
    if (!attemptId) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const res = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          message: messageText,
          session_id: sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (data.session_id) setSessionId(data.session_id);
      if (data.weak_topics) setWeakTopics(data.weak_topics);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const message = input.trim();
    setInput('');
    sendMessage(message);
  };

  const suggestedQuestions = [
    "Can you explain the topic I struggled with the most?",
    "Why was my answer wrong for the first question I missed?",
    "Can you give me a simpler explanation?",
    "Can you give me a practice question?",
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/student/tests/${id}/results?attempt=${attemptId}`}
            className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"
          >
            <HiArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <HiAcademicCap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">AI Tutor</h1>
              <p className="text-xs text-text-secondary">
                Helping you understand your mistakes
              </p>
            </div>
          </div>
        </div>

        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <HiLightBulb className="w-4 h-4 text-yellow-400" />
            <div className="flex gap-1">
              {weakTopics.map((topic, i) => (
                <span key={i} className="badge-warning text-xs">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-background-lighter border border-white/10 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-background-lighter border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (shown when no messages or few messages) */}
      {messages.length <= 2 && !sending && (
        <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-text-secondary hover:border-primary/50 hover:text-text-primary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI tutor anything about the test..."
          className="input-field flex-1"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="btn-primary px-4 disabled:opacity-50"
        >
          <HiPaperAirplane className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
