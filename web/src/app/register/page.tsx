import { Suspense } from 'react';
import { UnifiedAuth } from '@/components/auth/UnifiedAuth';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <UnifiedAuth initialTab="VOLUNTEER" />
    </Suspense>
  );
}
