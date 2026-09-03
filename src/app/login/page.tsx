'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthModalOpen } = useAuthStore();

  useEffect(() => {
    setAuthModalOpen(true, 'login');
    router.replace('/');
  }, [router, setAuthModalOpen]);

  return null;
}
