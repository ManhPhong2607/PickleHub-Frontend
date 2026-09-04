'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  duration?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatter = (v) => Math.round(v).toLocaleString('vi-VN'),
  duration = 0.9,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => formatter(value));
  const proxyRef = useRef<{ val: number }>({ val: 0 });
  const hasMountedRef = useRef<boolean>(false);

  useEffect(() => {
    // Tôn trọng prefers-reduced-motion của người dùng
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      proxyRef.current.val = value;
      setDisplayValue(formatter(value));
      return;
    }

    // Lần đầu mount: animate từ 0 lên value. Lần sau (đổi filter): animate từ giá trị cũ sang giá trị mới
    const startVal = hasMountedRef.current ? proxyRef.current.val : 0;
    hasMountedRef.current = true;

    const proxy = proxyRef.current;
    proxy.val = startVal;

    const tween = gsap.to(proxy, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(formatter(proxy.val));
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};
