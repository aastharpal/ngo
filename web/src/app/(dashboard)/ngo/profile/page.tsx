'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function NgoProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-7 w-7 text-blue-600" />
          NGO Organization Profile
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Verified organizational details and legal registration status.
        </p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Hope Foundation</CardTitle>
              <CardDescription className="text-xs">Reg No: REG-2024-8891</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified NGO
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>Jaipur, Rajasthan, India</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>contact@hopefoundation.org</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>+91 98765 43210</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}