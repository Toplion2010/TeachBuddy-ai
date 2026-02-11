import { AuthProvider } from '@/components/auth/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#12121a',
            color: '#f5f5f7',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </AuthProvider>
  );
}
