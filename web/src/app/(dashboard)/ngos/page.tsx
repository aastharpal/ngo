'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Building2,
  Search,
  MapPin,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  FolderKanban,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface NgoDirectoryItem {
  ngoId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  website: string | null;
  registrationNumber: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  projectsCount: number;
  volunteersCount: number;
  userStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | null;
}

export default function BrowseNgosPage() {
  const [ngos, setNgos] = useState<NgoDirectoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(true);
  const [selectedNgo, setSelectedNgo] = useState<NgoDirectoryItem | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Volunteer');
  const [userRole, setUserRole] = useState<string>('VOLUNTEER');

  useEffect(() => {
    const savedId = localStorage.getItem('user_id');
    const savedName = localStorage.getItem('user_name');
    const savedRole = localStorage.getItem('user_role') || 'VOLUNTEER';
    if (savedId) setUserId(savedId);
    if (savedName) setUserName(savedName);
    setUserRole(savedRole);
  }, []);

  // Fetch registered NGOs from backend
  const fetchNgos = async () => {
    setIsLoading(true);
    try {
      const savedId = localStorage.getItem('user_id');
      const url = savedId
        ? `http://localhost:5000/api/ngos?userId=${savedId}`
        : 'http://localhost:5000/api/ngos';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNgos(data);
      }
    } catch (err) {
      console.error('Failed to fetch NGOs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, [userId]);

  // Handle Apply to Join NGO
  const handleApplyToNgo = async () => {
    if (!selectedNgo || !userId) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/ngos/${selectedNgo.ngoId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId, 10) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccessMessage(`Application to volunteer with "${selectedNgo.name}" submitted successfully!`);
      // Update local state to show PENDING immediately
      setNgos((prev) =>
        prev.map((ngo) =>
          ngo.ngoId === selectedNgo.ngoId ? { ...ngo, userStatus: 'PENDING' } : ngo
        )
      );

      setTimeout(() => {
        setIsApplyModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter NGOs by search and verified status
  const filteredNgos = ngos.filter((ngo) => {
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVerified = filterVerifiedOnly ? ngo.status === 'VERIFIED' : true;

    return matchesSearch && matchesVerified;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            Registered NGOs & Social Impact Organizations
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse verified grassroots non-profits, explore their causes, and apply directly to volunteer with them.
          </p>
        </div>

        <Link href="/projects">
          <Button variant="outline" className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5 shadow-xs">
            <FolderKanban className="h-4 w-4" /> View Projects & Drives
          </Button>
        </Link>
      </div>

      {/* Global Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by NGO name, cause, city (e.g. Hope, Education, Jaipur)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFilterVerifiedOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterVerifiedOnly
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Verified NGOs Only ({ngos.filter((n) => n.status === 'VERIFIED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterVerifiedOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !filterVerifiedOnly
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Organizations ({ngos.length})
          </button>
        </div>
      </div>

      {/* NGO Directory Grid */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-gray-500">Loading verified NGOs...</p>
        </div>
      ) : filteredNgos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map((ngo) => {
            const isAffiliated = ngo.userStatus === 'ACTIVE';
            const isPending = ngo.userStatus === 'PENDING';

            return (
              <Card
                key={ngo.ngoId}
                className="border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow bg-white"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {ngo.status === 'VERIFIED' ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> VERIFIED NON-PROFIT
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold">
                        PENDING VERIFICATION
                      </Badge>
                    )}

                    <span className="text-[10px] text-gray-400 font-mono">
                      {ngo.projectsCount} {ngo.projectsCount === 1 ? 'Project' : 'Projects'}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-gray-900 flex items-start gap-2">
                    <Building2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{ngo.name}</span>
                  </CardTitle>

                  <CardDescription className="text-xs text-gray-600 line-clamp-3 mt-1.5 leading-relaxed">
                    {ngo.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2.5 text-xs text-gray-600 py-3 border-t border-b border-gray-100 my-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{ngo.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="font-mono text-[11px] text-gray-700 font-medium truncate">
                      Reg: {ngo.registrationNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-[130px]">{ngo.email}</span>
                    </span>
                    {ngo.website && (
                      <a
                        href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Globe className="h-3 w-3" /> Website <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </CardContent>

                {/* Card Action Footer */}
                <CardFooter className="pt-2">
                  {isAffiliated ? (
                    <div className="w-full py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Affiliated Volunteer Member
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2 bg-amber-50 border border-amber-200 rounded-lg text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Application Under Review
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedNgo(ngo);
                        setErrorMessage('');
                        setSuccessMessage('');
                        setIsApplyModalOpen(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 gap-1.5 shadow-xs"
                    >
                      <HeartHandshake className="h-4 w-4" /> Apply to Volunteer with NGO
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-gray-200 shadow-sm p-12 text-center space-y-4">
          <div className="inline-flex p-4 bg-gray-50 text-gray-400 rounded-full mx-auto">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No NGOs Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No non-profit organizations match your search query "{searchQuery}". Try searching for broader terms like "Banasthali", "Jaipur", or "Education".
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setFilterVerifiedOnly(false);
            }}
            className="text-xs"
          >
            Clear Filters
          </Button>
        </Card>
      )}

      {/* Volunteer Application Modal */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedNgo && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-gray-900">
                      Apply to Join {selectedNgo.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Submit your volunteer profile for onboarding review
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {errorMessage && (
                <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage ? (
                <div className="py-6 text-center space-y-2">
                  <div className="inline-flex p-3 bg-green-100 text-green-700 rounded-full mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Application Submitted!</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    The leadership team at <strong>{selectedNgo.name}</strong> will review your volunteer profile. Once approved, this NGO will become your Primary NGO on your dashboard.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-4 text-xs text-gray-600">
                  {/* Organization Preview */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-gray-800">
                      <span>{selectedNgo.name}</span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
                        Verified NGO
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500">{selectedNgo.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                      <span>📍 {selectedNgo.address}</span>
                      <span>⚖️ {selectedNgo.registrationNumber}</span>
                    </div>
                  </div>

                  {/* Applicant Details Preview */}
                  <div className="space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                      Your Applicant Credentials
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-gray-400 block">Applicant:</span>
                        <span className="font-semibold text-gray-800">{userName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Assigned Role:</span>
                        <span className="font-semibold text-blue-700">Volunteer Member</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-normal">
                    By submitting, your contact credentials and skillsets from your volunteer profile will be shared with <strong>{selectedNgo.name}</strong> coordinators to review your field placement.
                  </p>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsApplyModalOpen(false)}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleApplyToNgo}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Confirm & Submit Application <HeartHandshake className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
