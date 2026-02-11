// ============================================
// TeachBuddy.ai - TypeScript Types
// ============================================

export type UserRole = 'teacher' | 'student';
export type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended' | 'fill_in_blank';
export type FileType = 'pdf' | 'docx' | 'txt';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  school: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  content_text: string;
  file_url: string | null;
  file_type: FileType | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  material_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  access_code: string | null;
  question_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  material?: Material;
  questions?: Question[];
}

export interface Question {
  id: string;
  test_id: string;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
  created_at: string;
}

export interface TestAssignment {
  id: string;
  test_id: string;
  student_id: string;
  assigned_by: string;
  assigned_at: string;
  // Joined fields
  test?: Test;
  student?: Profile;
}

export interface TestAttempt {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number | null;
  total_points: number | null;
  started_at: string;
  completed_at: string | null;
  // Joined fields
  responses?: StudentResponse[];
  assignment?: TestAssignment;
}

export interface StudentResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  student_answer: string | null;
  is_correct: boolean | null;
  points_earned: number;
  ai_feedback: string | null;
  created_at: string;
  // Joined fields
  question?: Question;
}

export interface TutoringSession {
  id: string;
  attempt_id: string;
  student_id: string;
  messages: ChatMessage[];
  weak_topics: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
