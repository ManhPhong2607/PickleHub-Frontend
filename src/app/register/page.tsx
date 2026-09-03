'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuthModalOpen } = useAuthStore();

  useEffect(() => {
    setAuthModalOpen(true, 'register');
    router.replace('/');
  }, [router, setAuthModalOpen]);

  return null;
}
