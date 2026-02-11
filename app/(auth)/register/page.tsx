import RegisterForm from '@/components/auth/RegisterForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up - TeachBuddy.ai',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
