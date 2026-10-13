'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { NAV_ITEMS } from '@/config/navigation';
import { UserRole } from '@/types';
import {
  Building2,
  LogOut,
  LayoutDashboard,
  ArrowLeftRight,
  Sparkles,
  User,
  ShieldCheck,
  FolderKanban,
  CheckSquare,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeView, setActiveView] = useState<UserRole>('VOLUNTEER');
  const [isCoordinator, setIsCoordinator] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('user@servelink.org');

  const getNavIcon = (href: string) => {
    if (href === '/dashboard') return <LayoutDashboard className="h-4 w-4 shrink-0" />;
    if (href === '/ngos') return <Building2 className="h-4 w-4 shrink-0" />;
    if (href === '/projects') return <FolderKanban className="h-4 w-4 shrink-0" />;
    if (href === '/tasks') return <CheckSquare className="h-4 w-4 shrink-0" />;
    if (href === '/invitations') return <Mail className="h-4 w-4 shrink-0" />;
    if (href === '/admin/ngos') return <ShieldAlert className="h-4 w-4 shrink-0" />;
    return <Building2 className="h-4 w-4 shrink-0" />;
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') as UserRole;
    const savedActiveView = localStorage.getItem('active_view') as UserRole;
    const savedIsCoordinator = localStorage.getItem('is_coordinator') === 'true';
    const savedName = localStorage.getItem('user_name');
    const savedEmail = localStorage.getItem('user_email');

    if (!savedRole) {
      router.push('/login');
      return;
    }

    setRole(savedRole);
    setActiveView(savedActiveView || savedRole);
    setIsCoordinator(savedIsCoordinator);
    if (savedName) setUserName(savedName);
    if (savedEmail) setUserEmail(savedEmail);
  }, [router]);

  const handleToggleMode = () => {
    const nextView: UserRole = activeView === 'COORDINATOR' ? 'VOLUNTEER' : 'COORDINATOR';
    setActiveView(nextView);
    localStorage.setItem('active_view', nextView);
    // Dispatch a storage event so child pages can listen and re-render immediately
    window.dispatchEvent(new Event('roleViewChanged'));
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!role) {
    return null;
  }

  // Filter navigation items by active view (e.g. Volunteer vs Coordinator)
  const allowedNavItems = NAV_ITEMS.filter((item) => item.roles.includes(activeView));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight block">ServeLink</span>
              <span className="text-[10px] text-gray-400 font-medium block -mt-1">Social Impact Portal</span>
            </div>
          </div>

          {/* Dual-Role Switcher Toggle (For Volunteers with Coordinator Privileges) */}
          {isCoordinator && (
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-950">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Dual Role:
                </span>
                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">
                  {activeView === 'COORDINATOR' ? 'Coordinator Mode' : 'Volunteer Mode'}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleMode}
                className="w-full bg-white hover:bg-blue-100 text-blue-700 border-blue-300 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 h-8 transition-all"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
                {activeView === 'COORDINATOR' ? 'Switch to Volunteer Mode' : 'Switch to Coordinator Mode'}
              </Button>
            </div>
          )}

          {/* Dynamic Navigation Links */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">
              {activeView === 'VOLUNTEER' && 'Volunteer Portal'}
              {activeView === 'COORDINATOR' && 'Operations Workspace'}
              {activeView === 'NGO_ADMIN' && 'NGO Admin Space'}
              {activeView === 'SUPER_ADMIN' && 'Governance Console'}
            </span>
            <nav className="space-y-1 pt-1">
              {allowedNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {getNavIcon(item.href)}
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userName.charAt(0)}
            </div>
            <div className="truncate text-xs">
              <p className="font-semibold text-gray-900 truncate">{userName}</p>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-mono text-[10px] uppercase font-bold text-blue-600">
                  {activeView}
                </span>
                {isCoordinator && (
                  <span className="text-[9px] bg-blue-100 text-blue-800 rounded px-1 font-semibold">Dual</span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign Out"
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  );
}