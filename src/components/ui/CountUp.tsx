'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface CountUpProps {
  value: number;
  format: (val: number) => string;
  duration?: number;
}

export default function CountUp({ value, format, duration = 1.5 }: CountUpProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useGSAP(() => {
    const el = spanRef.current;
    if (!el || animatedRef.current) return;
    
    animatedRef.current = true;
    
    const dummy = { val: 0 };
    
    gsap.to(dummy, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.innerText = format(dummy.val);
      },
      onComplete: () => {
        el.innerText = format(value); // Ensure exact final value
      }
    });
  }, [value, format, duration]);

  // Reset animation flag when value changes
  useEffect(() => {
    animatedRef.current = false;
  }, [value]);

  return (
    <span ref={spanRef} className="tabular-nums">
      {format(0)}
    </span>
  );
}