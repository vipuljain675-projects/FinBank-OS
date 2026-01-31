// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // --- AUTO-LOGIN LOGIC ---
        // 1. Store the token we received from the backend
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        // 2. Redirect straight to Dashboard instead of Login
        router.push('/dashboard'); 
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="glow-purple" style={{ top: '-20%', right: '30%' }}></div>
      <div className="glow-blue" style={{ bottom: '-20%', left: '30%' }}></div>

      {/* Back to Home Link */}
      <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition z-20">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="auth-card z-10 relative backdrop-blur-sm bg-[#111827]/80">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-600/10 rounded-xl mb-4 border border-purple-500/20">
            <Wallet className="text-purple-500" size={32} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join FinBank to track your wealth today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message animate-fade-in mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-auth flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer mt-6">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="auth-link font-semibold text-purple-400 hover:text-purple-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}