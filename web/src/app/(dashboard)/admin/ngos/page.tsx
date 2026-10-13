'use client';

import { useState, useEffect } from 'react';
import { MOCK_NGOS } from '@/lib/mock-data';
import { Ngo, NgoStatus } from '@/types';
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
import { Building2, CheckCircle2, XCircle, FileText, ExternalLink, RefreshCw } from 'lucide-react';

export default function NgoVerificationQueuePage() {
  const [ngos, setNgos] = useState<Ngo[]>(MOCK_NGOS);
  const [selectedNgo, setSelectedNgo] = useState<Ngo | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNgos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ngos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized: Ngo[] = data.map((item: any) => ({
            id: String(item.ngoId || item.id),
            name: item.name,
            email: item.email,
            phone: item.phone,
            address: item.address,
            description: item.description,
            website: item.website,
            registrationNumber: item.registrationNumber,
            status: item.status as NgoStatus,
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          setNgos(normalized);
        }
      }
    } catch (e) {
      // Keep mock data if backend not reachable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, []);

  // Approve NGO handler
  const handleApprove = async (ngoId: string) => {
    // 1. Optimistic update
    setNgos((prev) =>
      prev.map((ngo) =>
        ngo.id === ngoId
          ? { ...ngo, status: 'VERIFIED' as NgoStatus, verifiedAt: new Date().toISOString() }
          : ngo
      )
    );

    // 2. Persist to backend
    try {
      await fetch(`http://localhost:5000/api/ngos/${ngoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED' }),
      });
    } catch (e) {
      console.error('Failed to update NGO status on backend', e);
    }
  };

  // Open Rejection Dialog
  const openRejectModal = (ngo: Ngo) => {
    setSelectedNgo(ngo);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  // Confirm Rejection handler
  const handleConfirmReject = async () => {
    if (!selectedNgo) return;
    const targetId = selectedNgo.id;

    // 1. Optimistic update
    setNgos((prev) =>
      prev.map((ngo) =>
        ngo.id === targetId
          ? { ...ngo, status: 'REJECTED' as NgoStatus, rejectionReason: rejectReason }
          : ngo
      )
    );

    setIsRejectDialogOpen(false);
    setSelectedNgo(null);

    // 2. Persist to backend
    try {
      await fetch(`http://localhost:5000/api/ngos/${targetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
    } catch (e) {
      console.error('Failed to update NGO rejection on backend', e);
    }
  };

  const getStatusBadge = (status: NgoStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Verified</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending Review</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Rejected</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Building2 className="h-7 w-7 text-blue-600" />
          NGO Verification Queue
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Review legal registration documents submitted by NGOs and grant platform access.
        </p>
      </div>

      {/* Main Table Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Registered NGOs</CardTitle>
          <CardDescription>
            Unverified NGOs are restricted from creating projects or sending invitations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">NGO Name</TableHead>
                  <TableHead className="font-semibold">Reg Number</TableHead>
                  <TableHead className="font-semibold">Contact Email</TableHead>
                  <TableHead className="font-semibold">Document</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ngos.map((ngo) => (
                  <TableRow key={ngo.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      <div>{ngo.name}</div>
                      <div className="text-xs text-gray-500">{ngo.address}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ngo.registrationNumber}</TableCell>
                    <TableCell className="text-sm">{ngo.email}</TableCell>
                    <TableCell>
                      {ngo.documentUrl ? (
                        <a
                          href={ngo.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          <span>View Doc</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No document</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(ngo.status)}</TableCell>
                    <TableCell className="text-right">
                      {ngo.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs gap-1"
                            onClick={() => handleApprove(ngo.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs gap-1"
                            onClick={() => openRejectModal(ngo)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No pending action</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject NGO Registration
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Provide a clear reason for rejecting <span className="font-semibold text-gray-800">{selectedNgo?.name}</span>. An email notification will be sent to their address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">Rejection Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Registration document expired or registration number invalid"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}