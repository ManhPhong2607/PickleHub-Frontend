'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderHistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account?tab=orders');
  }, [router]);

  return null;
}
