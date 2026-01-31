// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Wallet, ArrowRight, ShieldCheck, PieChart, Globe, Activity } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="landing-container">
      
      {/* --- NAVBAR --- */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon">
            <Wallet color="white" size={24} />
          </div>
          <span className="logo-text">FinBank</span>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-link">
            Log in
          </Link>
          <Link href="/register" className="nav-btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="landing-hero">
        
        {/* Background Glows (CSS handled) */}
        <div className="glow-purple"></div>
        <div className="glow-blue"></div>

        {/* Badge */}
        <div className="landing-badge">
          <span className="badge-dot"></span>
          v2.0 is now live
        </div>

        <h1 className="hero-title">
          Master your money <br/> with precision.
        </h1>
        
        <p className="hero-subtitle">
          The all-in-one financial operating system. Track investments, manage multiple accounts, and analyze spending habits in real-time.
        </p>
        
        <div className="hero-cta-group">
          <Link href="/register" className="btn-hero-primary">
            Start for free <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn-hero-secondary">
            Live Demo
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="hero-preview">
           <div className="preview-glass">
              <div className="preview-content">
                 <div className="preview-icon-box">
                    <Activity color="#7c3aed" size={32} />
                 </div>
                 <p>System Operational</p>
              </div>
              
              {/* Floating Elements */}
              <div className="float-card float-left">
                 <div className="skeleton-line w-12"></div>
                 <div className="skeleton-block"></div>
              </div>
              <div className="float-card float-right">
                 <div className="float-header">
                    <div className="skeleton-circle"></div>
                    <div className="skeleton-line w-12"></div>
                 </div>
                 <div className="skeleton-line w-full"></div>
              </div>
           </div>
        </div>

      </main>

      {/* --- FEATURES SECTION --- */}
      <section className="features-section">
        <div className="features-header">
          <h2>Everything you need to grow</h2>
          <p>Powerful features tailored for modern financial management.</p>
        </div>

        <div className="features-grid">
          <FeatureCard 
            icon={ShieldCheck}
            title="Bank-Grade Security"
            desc="Your data is encrypted with AES-256 standards. We prioritize your privacy above everything else."
          />
          <FeatureCard 
            icon={PieChart}
            title="Smart Analytics"
            desc="Visualize cash flow with beautiful charts. Understand exactly where your money goes every month."
          />
          <FeatureCard 
            icon={Globe}
            title="Global Assets"
            desc="Track Stocks, Crypto, and ETFs in real-time. One dashboard for your entire net worth."
          />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="landing-footer">
        <p>&copy; 2026 FinBank Inc. Built for the future of finance.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        <Icon color="#a78bfa" size={24} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}