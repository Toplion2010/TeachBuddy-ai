'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  HiHome,
  HiDocumentText,
  HiClipboardList,
  HiChartBar,
  HiAcademicCap,
  HiTrendingUp,
} from 'react-icons/hi';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const teacherLinks = [
  { href: '/teacher', label: 'Dashboard', icon: HiHome },
  { href: '/teacher/materials', label: 'Materials', icon: HiDocumentText },
  { href: '/teacher/tests', label: 'Tests', icon: HiClipboardList },
  { href: '/teacher/analytics', label: 'Analytics', icon: HiChartBar },
];

const studentLinks = [
  { href: '/student', label: 'Dashboard', icon: HiHome },
  { href: '/student/tests', label: 'My Tests', icon: HiClipboardList },
  { href: '/student/progress', label: 'Progress', icon: HiTrendingUp },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const links = profile?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background-lighter border-r border-white/10 z-20 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <HiAcademicCap className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium capitalize">
              {profile?.role} Panel
            </span>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/teacher' &&
                  link.href !== '/student' &&
                  pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
