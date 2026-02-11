import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Dashboard - TeachBuddy.ai',
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
