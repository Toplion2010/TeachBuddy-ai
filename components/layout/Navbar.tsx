'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HiMenu, HiX, HiLogout, HiUser } from 'react-icons/hi';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="h-16 border-b border-white/10 bg-background-lighter/80 backdrop-blur-sm px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {sidebarOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
        </button>
        <Link href={profile?.role === 'teacher' ? '/teacher' : '/student'} className="text-lg font-bold gradient-text">
          TeachBuddy.ai
        </Link>
      </div>

      {/* Right side */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <HiUser className="w-4 h-4 text-primary" />
          </div>
          <span className="hidden sm:block text-sm">
            {profile?.full_name || 'User'}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-12 w-56 bg-background-lighter border border-white/10 rounded-lg shadow-xl z-50 py-2">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-text-secondary">{profile?.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                  {profile?.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
              >
                <HiLogout className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
