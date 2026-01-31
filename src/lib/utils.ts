// src/lib/utils.ts

// 1. Format Currency (e.g., $15,000.00)
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// 2. Simple class joiner (No external libraries needed)
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}