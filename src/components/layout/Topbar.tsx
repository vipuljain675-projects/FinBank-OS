// src/components/layout/Topbar.tsx
import { Search, Bell, Settings } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="topbar">
      {/* Title changes based on page, but for now static or dynamic via context */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Overview</h2>

      <div className="flex items-center gap-2">
        <div style={{ 
          position: 'relative', 
          background: 'var(--bg-card)', 
          padding: '8px 16px', 
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid var(--border)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search..." 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              outline: 'none' 
            }} 
          />
        </div>

        <button className="btn" style={{ background: 'transparent', color: 'white' }}>
          <Bell size={20} />
        </button>
        <button className="btn" style={{ background: 'transparent', color: 'white' }}>
          <Settings size={20} />
        </button>
        
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
          V
        </div>
      </div>
    </header>
  );
}