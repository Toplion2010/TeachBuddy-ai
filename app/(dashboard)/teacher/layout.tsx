import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Dashboard - TeachBuddy.ai',
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
