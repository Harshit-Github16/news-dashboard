'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const router = useRouter();

  function handleLoginChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window !== 'undefined') localStorage.setItem('isLoggedIn', 'true');
      setLoginError('');
      router.push('/');
    } else {
      setLoginError('Invalid username or password');
    }
  }

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLoginSubmit} style={{ minWidth: 320, background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Login</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Username</label>
          <input
            type="text"
            name="username"
            value={loginForm.username}
            onChange={handleLoginChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
            autoComplete="username"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Password</label>
          <input
            type="password"
            name="password"
            value={loginForm.password}
            onChange={handleLoginChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
            autoComplete="current-password"
          />
        </div>
        {loginError && <div style={{ color: 'red', marginBottom: 12 }}>{loginError}</div>}
        <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: 10, fontWeight: 600, fontSize: 16 }}>
          Login
        </button>
      </form>
    </main>
  );
} 