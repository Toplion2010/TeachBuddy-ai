import LoginForm from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign In - TeachBuddy.ai',
};

export default function LoginPage() {
  return <LoginForm />;
}
