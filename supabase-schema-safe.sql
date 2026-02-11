-- ============================================
-- TeachBuddy.ai - Safe Schema Setup
-- ============================================
-- This version checks for existing objects
-- ============================================

-- 1. Create custom enums (only if they don't exist)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('teacher', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'open_ended', 'fill_in_blank');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'txt');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  school TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Materials table (teacher uploads)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT NOT NULL,
  file_url TEXT,
  file_type file_type,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Test assignments
CREATE TABLE IF NOT EXISTS test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

-- 7. Test attempts
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES test_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  total_points INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. Student responses
CREATE TABLE IF NOT EXISTS student_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tutoring sessions
CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_materials_teacher ON materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_teacher ON tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_material ON tests(material_id);
CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_assignments_test ON test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON test_attempts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON student_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_attempt ON tutoring_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_student ON tutoring_sessions(student_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS materials_updated_at ON materials;
CREATE TRIGGER materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tests_updated_at ON tests;
CREATE TRIGGER tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tutoring_sessions_updated_at ON tutoring_sessions;
CREATE TRIGGER tutoring_sessions_updated_at BEFORE UPDATE ON tutoring_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Auto-create profile on auth.users insert
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can manage own materials" ON materials;
DROP POLICY IF EXISTS "Students can view materials for assigned tests" ON materials;
DROP POLICY IF EXISTS "Teachers can manage own tests" ON tests;
DROP POLICY IF EXISTS "Students can view assigned tests" ON tests;
DROP POLICY IF EXISTS "Teachers can manage questions of own tests" ON questions;
DROP POLICY IF EXISTS "Students can view questions for assigned tests" ON questions;
DROP POLICY IF EXISTS "Teachers can manage assignments for own tests" ON test_assignments;
DROP POLICY IF EXISTS "Students can view own assignments" ON test_assignments;
DROP POLICY IF EXISTS "Students can manage own attempts" ON test_attempts;
DROP POLICY IF EXISTS "Teachers can view attempts for own tests" ON test_attempts;
DROP POLICY IF EXISTS "Students can manage own responses" ON student_responses;
DROP POLICY IF EXISTS "Teachers can view responses for own tests" ON student_responses;
DROP POLICY IF EXISTS "Students can manage own tutoring sessions" ON tutoring_sessions;
DROP POLICY IF EXISTS "Teachers can view tutoring sessions" ON tutoring_sessions;

-- Profiles: users can read all profiles, update their own
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Materials: teachers can CRUD their own
CREATE POLICY "Teachers can manage own materials" ON materials
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view materials for assigned tests" ON materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests t
      JOIN test_assignments ta ON ta.test_id = t.id
      WHERE t.material_id = materials.id AND ta.student_id = auth.uid()
    )
  );

-- Tests: teachers can CRUD their own, students can read assigned
CREATE POLICY "Teachers can manage own tests" ON tests
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view assigned tests" ON tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      WHERE ta.test_id = tests.id AND ta.student_id = auth.uid()
    )
  );

-- Questions
CREATE POLICY "Teachers can manage questions of own tests" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tests t WHERE t.id = questions.test_id AND t.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Students can view questions for assigned tests" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests t
      JOIN test_assignments ta ON ta.test_id = t.id
      WHERE t.id = questions.test_id AND ta.student_id = auth.uid()
    )
  );

-- Test assignments
CREATE POLICY "Teachers can manage assignments for own tests" ON test_assignments
  FOR ALL USING (auth.uid() = assigned_by);
CREATE POLICY "Students can view own assignments" ON test_assignments
  FOR SELECT USING (auth.uid() = student_id);

-- Test attempts
CREATE POLICY "Students can manage own attempts" ON test_attempts
  FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view attempts for own tests" ON test_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.id = test_attempts.assignment_id AND t.teacher_id = auth.uid()
    )
  );

-- Student responses
CREATE POLICY "Students can manage own responses" ON student_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM test_attempts ta
      WHERE ta.id = student_responses.attempt_id AND ta.student_id = auth.uid()
    )
  );
CREATE POLICY "Teachers can view responses for own tests" ON student_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_attempts ta
      JOIN test_assignments tas ON tas.id = ta.assignment_id
      JOIN tests t ON t.id = tas.test_id
      WHERE ta.id = student_responses.attempt_id AND t.teacher_id = auth.uid()
    )
  );

-- Tutoring sessions
CREATE POLICY "Students can manage own tutoring sessions" ON tutoring_sessions
  FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view tutoring sessions" ON tutoring_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_attempts ta
      JOIN test_assignments tas ON tas.id = ta.assignment_id
      JOIN tests t ON t.id = tas.test_id
      WHERE ta.id = tutoring_sessions.attempt_id AND t.teacher_id = auth.uid()
    )
  );

-- ============================================
-- Storage bucket for file uploads
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Teachers can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own files" ON storage.objects;

CREATE POLICY "Teachers can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'materials' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Authenticated users can read files" ON storage.objects
  FOR SELECT USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Create profiles for existing auth users
-- ============================================
INSERT INTO profiles (id, role, full_name, email)
SELECT
  id,
  COALESCE((raw_user_meta_data->>'role')::user_role, 'student'),
  COALESCE(raw_user_meta_data->>'full_name', email),
  email
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;
