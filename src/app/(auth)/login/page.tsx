// src/app/login/page.tsx (or src/app/auth/login/page.tsx)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Glows */}
      <div className="glow-purple" style={{ top: '-10%', left: '-10%' }}></div>
      <div className="glow-blue" style={{ bottom: '-10%', right: '-10%' }}></div>

      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition z-20">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="auth-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-xl mb-4 border border-purple-500/20">
            <Wallet className="text-purple-500" size={32} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Enter your credentials to access your dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label className="form-label">Password</label>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <Loader2 className="animate-spin m-auto" size={20} /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer mt-6">
          <p>Don't have an account? <Link href="/register" className="auth-link">Create Account</Link></p>
        </div>
      </div>
    </div>
  );
}