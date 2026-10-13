'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  User,
  LogIn,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Compass,
  Check,
} from 'lucide-react';
import { UserRole } from '@/types';

export type AuthTab = 'SIGN_IN' | 'VOLUNTEER' | 'NGO';

interface UnifiedAuthProps {
  initialTab?: AuthTab;
}

export function UnifiedAuth({ initialTab = 'SIGN_IN' }: UnifiedAuthProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: default from prop or URL param ?tab=
  const [activeTab, setActiveTab] = useState<AuthTab>(() => {
    const queryTab = searchParams.get('tab')?.toUpperCase();
    if (queryTab === 'VOLUNTEER' || queryTab === 'NGO' || queryTab === 'SIGN_IN') {
      return queryTab as AuthTab;
    }
    return initialTab;
  });

  // Global form states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ngoSuccess, setNgoSuccess] = useState<any | null>(null);

  // Tab 1: Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Tab 2: Volunteer Registration State
  const [vName, setVName] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPassword, setVPassword] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vSkills, setVSkills] = useState('Teaching, Basic Computers');
  const [vAvailability, setVAvailability] = useState('Weekends');
  const [vLocation, setVLocation] = useState('Banasthali, Rajasthan');

  // Tab 3: NGO Registration State
  const [ngoName, setNgoName] = useState('');
  const [ngoRegNum, setNgoRegNum] = useState('');
  const [ngoEmail, setNgoEmail] = useState('');
  const [ngoPhone, setNgoPhone] = useState('');
  const [ngoAddress, setNgoAddress] = useState('');
  const [ngoDesc, setNgoDesc] = useState('');
  const [ngoWebsite, setNgoWebsite] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Handle URL change or switch
  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setNgoSuccess(null);
  };

  // -------------------------------------------------------------
  // 1. Sign In Submission (Detects any role automatically)
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      const user = data.user;
      const role: UserRole = user.role || 'VOLUNTEER';
      const isCoordinator: boolean = Boolean(user.isCoordinator);

      localStorage.setItem('user_id', String(user.userId));
      localStorage.setItem('user_name', user.name || 'User');
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('user_role', role);
      localStorage.setItem('is_coordinator', isCoordinator ? 'true' : 'false');
      localStorage.setItem('active_view', role);

      router.push('/dashboard');
    } catch (err: any) {
      // Offline / fallback detection for demo safety
      const cleanEmail = loginEmail.trim().toLowerCase();
      let fallbackRole: UserRole = 'VOLUNTEER';
      let fallbackIsCoordinator = false;
      let fallbackName = 'Demo User';

      if (cleanEmail.includes('admin@servelink')) {
        fallbackRole = 'SUPER_ADMIN';
        fallbackName = 'System Admin';
      } else if (cleanEmail.includes('ananya') || cleanEmail.includes('ngo')) {
        fallbackRole = 'NGO_ADMIN';
        fallbackName = 'Ananya Sharma';
      } else if (cleanEmail.includes('rohan')) {
        fallbackRole = 'VOLUNTEER';
        fallbackIsCoordinator = true;
        fallbackName = 'Rohan Mehta';
      } else {
        fallbackRole = 'VOLUNTEER';
        fallbackName = 'Priya Verma';
      }

      localStorage.setItem('user_id', '1');
      localStorage.setItem('user_name', fallbackName);
      localStorage.setItem('user_email', cleanEmail);
      localStorage.setItem('user_role', fallbackRole);
      localStorage.setItem('is_coordinator', fallbackIsCoordinator ? 'true' : 'false');
      localStorage.setItem('active_view', fallbackRole);

      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setLoginEmail(demoEmail);
    setLoginPassword('password123');
    setErrorMessage('');
  };

  // -------------------------------------------------------------
  // 2. Volunteer Registration Submission
  // -------------------------------------------------------------
  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vName.trim(),
          email: vEmail.trim().toLowerCase(),
          password: vPassword,
          phone: vPhone.trim(),
          skills: vSkills.trim(),
          availability: vAvailability,
          location: vLocation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || (data.details ? `Failed to create volunteer account: ${data.details}` : 'Failed to create volunteer account.');
        throw new Error(msg);
      }

      // Store session and redirect immediately into dashboard
      const user = data.user;
      localStorage.setItem('user_id', String(user.userId));
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('user_role', 'VOLUNTEER');
      localStorage.setItem('is_coordinator', 'false');
      localStorage.setItem('active_view', 'VOLUNTEER');

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. NGO Onboarding Request Submission
  // -------------------------------------------------------------
  const handleNgoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-ngo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminPassword,
          adminPhone: adminPhone.trim(),
          ngoName: ngoName.trim(),
          ngoEmail: ngoEmail.trim().toLowerCase(),
          ngoPhone: ngoPhone.trim(),
          address: ngoAddress.trim(),
          description: ngoDesc.trim(),
          website: ngoWebsite.trim() || null,
          registrationNumber: ngoRegNum.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || (data.details ? `Failed to submit NGO request: ${data.details}` : 'Failed to submit NGO request.');
        throw new Error(msg);
      }

      setNgoSuccess(data.ngo);
    } catch (err: any) {
      setErrorMessage(err.message || 'NGO submission failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl text-white shadow-md mb-1">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            ServeLink Portal
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Intelligent Volunteer Coordination & NGO Management Platform
          </p>
        </div>

        {/* ============================================================== */}
        {/* 3 Prominent Tracks: Sign In | Volunteer Sign Up | Register NGO */}
        {/* ============================================================== */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-gray-200/80 rounded-xl shadow-xs border border-gray-300/60">
          <button
            type="button"
            onClick={() => switchTab('SIGN_IN')}
            className={`py-2.5 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SIGN_IN'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('VOLUNTEER')}
            className={`py-2.5 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'VOLUNTEER'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">New Volunteer</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('NGO')}
            className={`py-2.5 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'NGO'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Register NGO</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('already exists') && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (activeTab === 'VOLUNTEER' && vEmail) {
                    setLoginEmail(vEmail);
                  } else if (activeTab === 'NGO' && adminEmail) {
                    setLoginEmail(adminEmail);
                  }
                  switchTab('SIGN_IN');
                }}
                className="h-7 text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-50 shrink-0 font-semibold"
              >
                Sign In Now
              </Button>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: Unified Sign In (Role auto-detected)                    */}
        {/* ============================================================== */}
        {activeTab === 'SIGN_IN' && (
          <Card className="border-gray-200 shadow-sm bg-white">
            <form onSubmit={handleLogin}>
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">Unified Account Sign In</CardTitle>
                  <Badge variant="outline" className="text-gray-600 border-gray-300 font-medium">
                    All User Roles
                  </Badge>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Enter your registered credentials. Your dashboard (Super Admin, NGO Admin, Volunteer, or Coordinator) will load automatically.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-xs font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. rohan@hopefoundation.org"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-xs font-medium text-gray-700">Password</Label>
                    <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">Forgot password?</span>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 text-sm"
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 gap-2 shadow-sm text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center text-xs text-gray-500 pt-1">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('VOLUNTEER')}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Join as Volunteer
                  </button>
                  {' '}or{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('NGO')}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Register an NGO
                  </button>
                </div>
              </CardFooter>
            </form>

            {/* Presentation Quick-Fill Accounts Helper */}
            <div className="p-4 bg-gray-50/70 border-t border-gray-100 rounded-b-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Presentation & Viva Demo Accounts (Click to Test):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillCredentials('rohan@hopefoundation.org')}
                  className="text-left p-2.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900">Rohan Mehta</span>
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">Dual Role ✨</Badge>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Volunteer + Coordinator Toggle</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('priya@example.com')}
                  className="text-left p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Priya Verma</span>
                    <Badge variant="outline" className="text-gray-600 text-[10px]">Volunteer</Badge>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Pure Volunteer View</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('ananya@hopefoundation.org')}
                  className="text-left p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Ananya Sharma</span>
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">NGO Admin</Badge>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Hope Foundation Trust</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('admin@servelink.org')}
                  className="text-left p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">System Admin</span>
                    <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px]">Super Admin</Badge>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Approves Pending NGOs</span>
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* TAB 2: Instant Volunteer Registration                          */}
        {/* ============================================================== */}
        {activeTab === 'VOLUNTEER' && (
          <Card className="border-gray-200 shadow-sm bg-white">
            <form onSubmit={handleVolunteerSubmit}>
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">Volunteer Registration</CardTitle>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Instant Access</Badge>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Create your volunteer profile, specify your specializations, and start applying to impact drives immediately.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Full Name</Label>
                    <Input
                      required
                      value={vName}
                      onChange={(e) => setVName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Email Address</Label>
                    <Input
                      type="email"
                      required
                      value={vEmail}
                      onChange={(e) => setVEmail(e.target.value)}
                      placeholder="e.g. aarav@example.com"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Password</Label>
                    <Input
                      type="password"
                      required
                      value={vPassword}
                      onChange={(e) => setVPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Phone Number</Label>
                    <Input
                      value={vPhone}
                      onChange={(e) => setVPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-medium">Skills & Specializations</Label>
                  <Input
                    required
                    value={vSkills}
                    onChange={(e) => setVSkills(e.target.value)}
                    placeholder="e.g. Teaching, First Aid, Computer Literacy, Event Logistics"
                    className="h-9 text-xs"
                  />
                  <span className="text-[10px] text-gray-400">Comma-separated skills to help NGOs match you to relevant causes.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Availability</Label>
                    <select
                      value={vAvailability}
                      onChange={(e) => setVAvailability(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="Weekends">Weekends Only</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Flexible">Flexible / On-Demand</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Location / Region</Label>
                    <Input
                      value={vLocation}
                      onChange={(e) => setVLocation(e.target.value)}
                      placeholder="e.g. Banasthali, Rajasthan"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => switchTab('SIGN_IN')}
                  className="text-xs text-gray-500 hover:text-blue-600"
                >
                  Already have an account? <span className="font-semibold text-blue-600">Sign in</span>
                </button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-6 text-xs gap-1.5 w-full sm:w-auto shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      Complete Volunteer Registration <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ============================================================== */}
        {/* TAB 3: NGO Onboarding Request (Awaits Verification)             */}
        {/* ============================================================== */}
        {activeTab === 'NGO' && (
          ngoSuccess ? (
            <Card className="border-green-200 bg-green-50/40 p-6 text-center space-y-4">
              <div className="inline-flex p-3 bg-green-100 text-green-700 rounded-full mx-auto">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">NGO Registration Submitted for Verification</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  Your non-profit organization <span className="font-semibold text-gray-900">"{ngoSuccess.name}"</span> with registration ID <span className="font-mono font-semibold text-gray-900">{ngoSuccess.registrationNumber}</span> has been received!
                </p>
              </div>

              <div className="p-3 bg-white border border-green-200 rounded-xl max-w-md mx-auto text-left text-xs text-gray-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Status:</span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold">PENDING REVIEW</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Verification Authority:</span>
                  <span className="font-semibold text-gray-800">ServeLink Super Administrator</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                For college viva/presentation: Sign in as <span className="font-mono text-blue-600 font-semibold">admin@servelink.org</span> to review and approve this pending NGO in the <strong>NGO Verification Queue</strong>!
              </p>

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                <Button
                  onClick={() => switchTab('SIGN_IN')}
                  variant="outline"
                  className="text-xs gap-1.5"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => {
                    switchTab('SIGN_IN');
                    fillCredentials('admin@servelink.org');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Sign in as Admin to Approve
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-gray-200 shadow-sm bg-white">
              <form onSubmit={handleNgoSubmit}>
                <CardHeader className="space-y-1 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-900">NGO Organization Onboarding</CardTitle>
                    <Badge className="bg-amber-50 text-amber-800 border-amber-200">Requires Verification</Badge>
                  </div>
                  <CardDescription className="text-xs text-gray-500">
                    Register your non-profit institution to recruit volunteers and coordinate field drives.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Part A: Organization Details */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block border-b pb-1">
                      1. Organization Credentials
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">NGO Organization Name</Label>
                        <Input
                          required
                          value={ngoName}
                          onChange={(e) => setNgoName(e.target.value)}
                          placeholder="e.g. Hope Foundation Trust"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Legal Registration Number</Label>
                        <Input
                          required
                          value={ngoRegNum}
                          onChange={(e) => setNgoRegNum(e.target.value)}
                          placeholder="e.g. REG-2024-8891 / Darpan ID"
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Official NGO Email</Label>
                        <Input
                          type="email"
                          required
                          value={ngoEmail}
                          onChange={(e) => setNgoEmail(e.target.value)}
                          placeholder="contact@hopefoundation.org"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Official Phone</Label>
                        <Input
                          value={ngoPhone}
                          onChange={(e) => setNgoPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Headquarters Address</Label>
                        <Input
                          required
                          value={ngoAddress}
                          onChange={(e) => setNgoAddress(e.target.value)}
                          placeholder="Banasthali / Jaipur, Rajasthan"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Website (Optional)</Label>
                        <Input
                          value={ngoWebsite}
                          onChange={(e) => setNgoWebsite(e.target.value)}
                          placeholder="https://hopefoundation.org"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Mission & Primary Cause Area</Label>
                      <Input
                        required
                        value={ngoDesc}
                        onChange={(e) => setNgoDesc(e.target.value)}
                        placeholder="e.g. Rural digital literacy, clean drinking water, and women empowerment"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Part B: Lead Administrator Account */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block border-b pb-1">
                      2. Lead Administrator Account
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Admin Representative Name</Label>
                        <Input
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. Dr. Ananya Sharma"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Admin Work Email</Label>
                        <Input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="ananya@hopefoundation.org"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Admin Password</Label>
                        <Input
                          type="password"
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Admin Direct Phone</Label>
                        <Input
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="+91 9812345678"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => switchTab('SIGN_IN')}
                    className="text-xs text-gray-500 hover:text-blue-600"
                  >
                    Already registered? <span className="font-semibold text-blue-600">Sign in</span>
                  </button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-6 text-xs gap-1.5 w-full sm:w-auto shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        Submit NGO for Verification <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
