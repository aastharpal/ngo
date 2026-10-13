'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Users,
  FolderKanban,
  Building2,
  Search,
  ArrowRight,
  Sparkles,
  CheckSquare,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';

interface VolunteerSummary {
  primaryNgo: string | null;
  metrics: {
    assignedTasksCount: number;
    completedTasksCount: number;
    hoursLogged: number;
    applicationsCount: number;
  };
  assignedTasks: Array<{
    assignmentId: number;
    taskId: number;
    title: string;
    description: string;
    status: string;
    dueDate?: string;
    projectName: string;
    ngoName: string;
    hoursLogged?: number;
  }>;
  applications: Array<{
    applicationId: number;
    opportunityId: number;
    title: string;
    status: string;
    appliedAt: string;
    projectName: string;
    ngoName: string;
  }>;
}

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>('VOLUNTEER');
  const [userName, setUserName] = useState<string>('User');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [summary, setSummary] = useState<VolunteerSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateRoleFromStorage = () => {
    const savedActiveView = localStorage.getItem('active_view') as UserRole;
    const savedRole = localStorage.getItem('user_role') as UserRole;
    const savedName = localStorage.getItem('user_name');
    const savedId = localStorage.getItem('user_id');
    const savedEmail = localStorage.getItem('user_email');

    if (savedActiveView) setRole(savedActiveView);
    else if (savedRole) setRole(savedRole);
    if (savedName) setUserName(savedName);
    if (savedId) setUserId(savedId);
    if (savedEmail) setUserEmail(savedEmail);
  };

  useEffect(() => {
    updateRoleFromStorage();

    const handleRoleChange = () => {
      updateRoleFromStorage();
    };

    window.addEventListener('roleViewChanged', handleRoleChange);
    return () => window.removeEventListener('roleViewChanged', handleRoleChange);
  }, []);

  // Fetch real volunteer summary from backend
  useEffect(() => {
    if (!userId) return;

    async function fetchSummary() {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/volunteers/${userId}/summary`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        } else {
          // If backend returns 404 (new user without profile sync), set empty state
          setSummary({
            primaryNgo: null,
            metrics: { assignedTasksCount: 0, completedTasksCount: 0, hoursLogged: 0, applicationsCount: 0 },
            assignedTasks: [],
            applications: [],
          });
        }
      } catch (err) {
        // Safe offline fallback: for non-demo volunteers, ensure zero fake data
        setSummary({
          primaryNgo: null,
          metrics: { assignedTasksCount: 0, completedTasksCount: 0, hoursLogged: 0, applicationsCount: 0 },
          assignedTasks: [],
          applications: [],
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (role === 'VOLUNTEER') {
      fetchSummary();
    }
  }, [userId, role]);

  return (
    <div className="space-y-6">
      {/* Dynamic Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {role === 'SUPER_ADMIN' && 'Platform Governance Dashboard'}
              {role === 'NGO_ADMIN' && 'NGO Overview & Operations'}
              {role === 'COORDINATOR' && 'Field Coordination & Operations'}
              {role === 'VOLUNTEER' && `Welcome, ${userName}!`}
            </h1>
            <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200">
              {role}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'SUPER_ADMIN' && 'System-wide compliance, NGO legal verifications, and platform stats.'}
            {role === 'NGO_ADMIN' && 'Manage organization initiatives, physical resources, and project lifecycles.'}
            {role === 'COORDINATOR' && 'Track project tasks, volunteer assignments, and field deliverables.'}
            {role === 'VOLUNTEER' &&
              (summary?.primaryNgo
                ? `Active volunteer with ${summary.primaryNgo}. Track your deliverables and applications.`
                : 'Your personal volunteer dashboard. Discover non-profit initiatives and apply to join a cause.')}
          </p>
        </div>

        {/* Role Actions - Strictly Separated */}
        <div className="flex items-center gap-2">
          {role === 'VOLUNTEER' && (
            <>
              <Link href="/ngos">
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 shadow-xs text-xs font-semibold">
                  <Building2 className="h-4 w-4 text-blue-600" /> Browse NGOs
                </Button>
              </Link>
              <Link href="/projects">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs text-xs font-semibold">
                  <Search className="h-4 w-4" /> Explore Opportunities
                </Button>
              </Link>
            </>
          )}

          {role === 'NGO_ADMIN' && (
            <Link href="/projects">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </Link>
          )}

          {role === 'COORDINATOR' && (
            <Link href="/tasks">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
                <Plus className="h-4 w-4" /> Assign New Task
              </Button>
            </Link>
          )}

          {role === 'SUPER_ADMIN' && (
            <Link href="/admin/ngos">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
                <ShieldAlert className="h-4 w-4" /> Review Pending NGOs
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Role Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'SUPER_ADMIN' && (
          <>
            <MetricCard title="Total Registered NGOs" value="12" subtext="3 Pending Verification" icon={Building2} />
            <MetricCard title="Active Volunteers" value="480" subtext="Across 8 regions" icon={Users} />
            <MetricCard title="Total Projects" value="24" subtext="18 Active" icon={FolderKanban} />
            <MetricCard title="Platform Health" value="99.9%" subtext="All systems operational" icon={CheckCircle2} />
          </>
        )}

        {role === 'NGO_ADMIN' && (
          <>
            <MetricCard title="Active Projects" value="2" subtext="Out of 2 total" icon={FolderKanban} />
            <MetricCard title="Open Tasks" value="4" subtext="In progress with teams" icon={Clock} />
            <MetricCard title="Pending Applications" value="3" subtext="Volunteers awaiting review" icon={Users} />
            <MetricCard title="NGO Verification" value="Verified" subtext="Compliance approved" icon={CheckCircle2} />
          </>
        )}

        {role === 'COORDINATOR' && (
          <>
            <MetricCard title="Coordinated Projects" value="2" subtext="Banasthali Region" icon={FolderKanban} />
            <MetricCard title="Deliverables Tracking" value="5" subtext="2 High Priority" icon={Clock} />
            <MetricCard title="Assigned Volunteers" value="18" subtext="Active in field" icon={Users} />
            <MetricCard title="Completion Ratio" value="84%" subtext="+5% this week" icon={CheckCircle2} />
          </>
        )}

        {role === 'VOLUNTEER' && (
          <>
            <MetricCard
              title="My Assigned Tasks"
              value={String(summary?.metrics?.assignedTasksCount ?? 0)}
              subtext={summary?.metrics?.assignedTasksCount ? 'Active deliverables' : 'No pending tasks'}
              icon={Clock}
            />
            <MetricCard
              title="Completed Tasks"
              value={String(summary?.metrics?.completedTasksCount ?? 0)}
              subtext="Deliverables fulfilled"
              icon={CheckCircle2}
            />
            <MetricCard
              title="Hours Contributed"
              value={`${summary?.metrics?.hoursLogged ?? 0} hrs`}
              subtext="Logged across projects"
              icon={Users}
            />
            <MetricCard
              title="Primary NGO"
              value={summary?.primaryNgo || 'Unaffiliated'}
              subtext={summary?.primaryNgo ? 'Active Volunteer' : 'Browse & Join an NGO →'}
              icon={Building2}
              href={summary?.primaryNgo ? undefined : '/ngos'}
            />
          </>
        )}
      </div>

      {/* Onboarding Callout for Unaffiliated Volunteers */}
      {role === 'VOLUNTEER' && !summary?.primaryNgo && (
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">You are not affiliated with an NGO yet</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Browse verified non-profit organizations on ServeLink and apply to join a cause that matches your skills.
              </p>
            </div>
          </div>
          <Link href="/ngos" className="shrink-0">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
              <Building2 className="h-3.5 w-3.5" /> Browse Registered NGOs
            </Button>
          </Link>
        </div>
      )}

      {/* Volunteer-Specific Content vs Coordinator/Admin Content */}
      {role === 'VOLUNTEER' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* My Tasks Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">My Upcoming Tasks</CardTitle>
                <CardDescription className="text-xs">Tasks assigned to you by NGO project coordinators</CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary?.assignedTasks && summary.assignedTasks.length > 0 ? (
                <div className="space-y-3">
                  {summary.assignedTasks.map((t) => (
                    <div
                      key={t.assignmentId}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">{t.title}</h4>
                        <p className="text-xs text-gray-500">
                          {t.projectName} • {t.ngoName}
                        </p>
                      </div>
                      <Badge
                        className={
                          t.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                            : 'bg-blue-100 text-blue-800 border-blue-200 text-xs'
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                /* Clean Empty State for New Volunteers */
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full">
                    <CheckSquare className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-800">No Tasks Assigned Yet</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      You are not currently assigned to any project deliverables. Explore open initiatives and apply to join a cause.
                    </p>
                  </div>
                  <Link href="/projects">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs">
                      <Search className="h-3.5 w-3.5" /> Explore Opportunities
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunities & Applications Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">My Applications & Opportunities</CardTitle>
                <CardDescription className="text-xs">Track approval status for initiatives you applied to</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs gap-1">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary?.applications && summary.applications.length > 0 ? (
                <div className="space-y-3">
                  {summary.applications.map((app) => (
                    <div
                      key={app.applicationId}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">{app.title}</h4>
                        <p className="text-xs text-gray-500">
                          {app.ngoName} • {app.projectName}
                        </p>
                      </div>
                      <Badge
                        className={
                          app.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 border-red-200 text-xs'
                            : 'bg-amber-100 text-amber-800 border-amber-200 text-xs'
                        }
                      >
                        {app.status === 'PENDING' ? 'Pending Review' : app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                /* Clean Empty State for New Volunteers */
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="inline-flex p-3 bg-purple-50 text-purple-600 rounded-full">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-800">No Applications Submitted</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      You haven't applied to any NGO initiatives yet. Browse available projects and submit an application to join.
                    </p>
                  </div>
                  <Link href="/projects">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <FolderKanban className="h-3.5 w-3.5" /> Browse Projects
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Coordinator / NGO Admin Operational View */
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900">Active Operations Overview</CardTitle>
            <CardDescription className="text-xs">
              Project timelines and volunteer allocation status across active non-profit drives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Project Vidyadaan Phase 2</h4>
                  <p className="text-xs text-gray-500">12 of 15 volunteer slots filled • 4 tasks active</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Active Initiative</Badge>
                  <Link href="/projects">
                    <Button variant="outline" size="sm" className="text-xs">Manage</Button>
                  </Link>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Clean Water Relief Drive</h4>
                  <p className="text-xs text-gray-500">10 of 15 volunteer slots filled • Medical logistics</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Field Deployed</Badge>
                  <Link href="/projects">
                    <Button variant="outline" size="sm" className="text-xs">Manage</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  href,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  href?: string;
}) {
  const card = (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtext}</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href} className="block">{card}</Link> : card;
}