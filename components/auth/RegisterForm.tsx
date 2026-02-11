'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { HiMail, HiLockClosed, HiUser, HiAcademicCap } from 'react-icons/hi';
import type { UserRole } from '@/utils/types';

export default function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push(role === 'teacher' ? '/teacher' : '/student');
    }
  };

  const handleGoogleRegister = async () => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
      },
    });

    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-text-secondary">Join TeachBuddy.ai as a teacher or student</p>
      </div>

      <div className="card p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                role === 'teacher'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-white/10 text-text-secondary hover:border-white/20'
              }`}
            >
              <HiAcademicCap className="w-5 h-5" />
              <span className="font-medium">Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                role === 'student'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-white/10 text-text-secondary hover:border-white/20'
              }`}
            >
              <HiUser className="w-5 h-5" />
              <span className="font-medium">Student</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Full Name
            </label>
            <div className="relative">
              <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field pl-10"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <div className="relative">
              <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : `Sign Up as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background-lighter text-text-secondary">
              or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleRegister}
          className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
        >
          <FcGoogle className="w-5 h-5" />
          Google
        </button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-light">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
