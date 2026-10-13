'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserRole } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  UserPlus,
  Send,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  FolderKanban,
  Inbox,
  Building2,
  Users,
} from 'lucide-react';

interface VolunteerApplicationItem {
  applicationId: number;
  opportunityId: number;
  title: string;
  status: string;
  appliedAt: string;
  projectName: string;
  ngoName: string;
  applicantName?: string;
  applicantEmail?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  sentAt: string;
  expiresAt: string;
}

const INITIAL_STAFF_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    email: 'karan.singh@example.com',
    role: 'COORDINATOR',
    status: 'PENDING',
    sentAt: '2026-10-01',
    expiresAt: '2026-10-08',
  },
];

export default function InvitationsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('VOLUNTEER');
  const [userId, setUserId] = useState<string | null>(null);
  const [myApplications, setMyApplications] = useState<VolunteerApplicationItem[]>([]);
  const [adminApplications, setAdminApplications] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_STAFF_INVITATIONS);
  const [activeTab, setActiveTab] = useState<'APPLICATIONS' | 'INVITATIONS'>('APPLICATIONS');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for Sending Staff Invitations
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('COORDINATOR');

  const updateRole = () => {
    const savedActiveView = localStorage.getItem('active_view') as UserRole;
    const savedRole = localStorage.getItem('user_role') as UserRole;
    const savedId = localStorage.getItem('user_id');
    setCurrentRole(savedActiveView || savedRole || 'VOLUNTEER');
    if (savedId) setUserId(savedId);
  };

  useEffect(() => {
    updateRole();

    const handleRoleChange = () => {
      updateRole();
    };

    window.addEventListener('roleViewChanged', handleRoleChange);
    return () => window.removeEventListener('roleViewChanged', handleRoleChange);
  }, []);

  const isVolunteer = currentRole === 'VOLUNTEER';

  // Fetch real applications based on role
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (isVolunteer) {
          if (!userId) {
            setMyApplications([]);
            return;
          }
          // Fetch this volunteer's real applications from backend
          const res = await fetch(`http://localhost:5000/api/volunteers/${userId}/summary`);
          if (res.ok) {
            const data = await res.json();
            setMyApplications(data.applications || []);
          } else {
            setMyApplications([]);
          }
        } else {
          // NGO Admins & Coordinators fetch all received volunteer applications
          const res = await fetch('http://localhost:5000/api/applications');
          if (res.ok) {
            const data = await res.json();
            setAdminApplications(data || []);
          }
        }
      } catch (err) {
        if (isVolunteer) setMyApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isVolunteer, userId]);

  // Handle Admin Approving / Rejecting an application
  const handleUpdateAppStatus = async (appId: number, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setAdminApplications((prev) =>
        prev.map((a) => (a.applicationId === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      // Local optimistic update
      setAdminApplications((prev) =>
        prev.map((a) => (a.applicationId === appId ? { ...a, status: newStatus } : a))
      );
    }
  };

  // Handle Sending Staff Invitation
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 7);

    const newInvite: Invitation = {
      id: `inv-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      status: 'PENDING',
      sentAt: today.toISOString().split('T')[0],
      expiresAt: expiry.toISOString().split('T')[0],
    };

    setInvitations([newInvite, ...invitations]);
    setIsDialogOpen(false);
    setInviteEmail('');
    setInviteRole('COORDINATOR');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> Pending Review
          </Badge>
        );
      case 'REJECTED':
      case 'EXPIRED':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Mail className="h-7 w-7 text-blue-600" />
            {isVolunteer ? 'My Applications & Status' : 'Applications & Staff Onboarding'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isVolunteer
              ? 'Track applications you have submitted to NGO initiatives and view current approval status.'
              : 'Review volunteer applications received for your initiatives and manage coordinator onboarding invitations.'}
          </p>
        </div>

        {/* Action Button: ONLY for Admins/Coordinators */}
        {!isVolunteer && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start sm:self-auto shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              Invite Coordinator
            </Button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VOLUNTEER VIEW: Real Sent Applications Only                    */}
      {/* ============================================================== */}
      {isVolunteer ? (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Submitted Applications</CardTitle>
              <CardDescription className="text-xs">
                Your direct applications for non-profit drives and field initiatives.
              </CardDescription>
            </div>
            <Link href="/projects">
              <Button size="sm" variant="outline" className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5">
                <Search className="h-3.5 w-3.5" /> Explore More Drives
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {myApplications.length > 0 ? (
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-xs">Initiative / Opportunity</TableHead>
                      <TableHead className="font-semibold text-xs">Host NGO</TableHead>
                      <TableHead className="font-semibold text-xs">Project</TableHead>
                      <TableHead className="font-semibold text-xs">Applied Date</TableHead>
                      <TableHead className="font-semibold text-xs">Application Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myApplications.map((app) => (
                      <TableRow key={app.applicationId} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900 text-xs">
                          {app.title}
                        </TableCell>
                        <TableCell className="text-xs text-gray-700 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            {app.ngoName}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {app.projectName}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 font-mono">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Clean Empty State for New Volunteers (No fake data!) */
              <div className="py-12 px-4 text-center space-y-4">
                <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mx-auto">
                  <Inbox className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">No Applications Submitted Yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    You have not submitted any volunteer applications yet. Browse verified NGO projects and apply for an opportunity to make an impact!
                  </p>
                </div>
                <Link href="/projects">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm">
                    <Search className="h-3.5 w-3.5" /> Explore Open Projects & Apply
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ============================================================== */
        /* NGO ADMIN / COORDINATOR VIEW: Applications & Staff Management  */
        /* ============================================================== */
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('APPLICATIONS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'APPLICATIONS' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Received Volunteer Applications ({adminApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('INVITATIONS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'INVITATIONS' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Staff Invitations ({invitations.length})
            </button>
          </div>

          {activeTab === 'APPLICATIONS' ? (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Volunteer Applications Queue</CardTitle>
                <CardDescription className="text-xs">
                  Review interested volunteers and approve their participation in your project drives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminApplications.length > 0 ? (
                  <div className="rounded-md border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold text-xs">Volunteer Name</TableHead>
                          <TableHead className="font-semibold text-xs">Applied Opportunity</TableHead>
                          <TableHead className="font-semibold text-xs">Skills & Location</TableHead>
                          <TableHead className="font-semibold text-xs">Applied Date</TableHead>
                          <TableHead className="font-semibold text-xs">Status</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminApplications.map((app) => (
                          <TableRow key={app.applicationId} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium text-gray-900 text-xs">
                              <div>
                                <span className="font-bold">{app.volunteerProfile?.user?.name || 'Volunteer'}</span>
                                <span className="text-[11px] text-gray-400 block">{app.volunteerProfile?.user?.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-700">
                              {app.opportunity?.title || 'Volunteer Drive'}
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">
                              {app.volunteerProfile?.skills || 'General'} • {app.volunteerProfile?.location || 'Rajasthan'}
                            </TableCell>
                            <TableCell className="text-xs text-gray-600 font-mono">
                              {new Date(app.appliedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                            <TableCell className="text-right">
                              {app.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateAppStatus(app.applicationId, 'ACCEPTED')}
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white font-medium"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateAppStatus(app.applicationId, 'REJECTED')}
                                    className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No volunteer applications received yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Coordinator & Staff Invitations</CardTitle>
                <CardDescription className="text-xs">
                  Active onboarding invitations sent to project coordinators.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-xs">Recipient Email</TableHead>
                        <TableHead className="font-semibold text-xs">Role</TableHead>
                        <TableHead className="font-semibold text-xs">Sent Date</TableHead>
                        <TableHead className="font-semibold text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((inv) => (
                        <TableRow key={inv.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900 text-xs">{inv.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                              {inv.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 font-mono">{inv.sentAt}</TableCell>
                          <TableCell>{getStatusBadge(inv.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Invite Coordinator Dialog */}
      {!isVolunteer && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSendInvite}>
              <DialogHeader>
                <DialogTitle>Invite Project Coordinator</DialogTitle>
                <DialogDescription className="text-xs">
                  Send an onboarding link to grant field coordination privileges.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Coordinator Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="coordinator@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Assigned Role</Label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="COORDINATOR">Project Coordinator</option>
                    <option value="VOLUNTEER">Field Volunteer</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1">
                  <Send className="h-3.5 w-3.5" /> Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}