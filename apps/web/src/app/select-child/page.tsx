'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import ChildSelector from '../../components/child/ChildSelector';

export default function SelectChildPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute allowedRoles={['parent', 'educator']}>
      <ChildSelector onBack={handleBack} mode="selection" />
    </ProtectedRoute>
  );
}