'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

export default function LoginPage() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 relative overflow-hidden">
      <style jsx global>{`
@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(20px); }
}
@keyframes floatYReverse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.float-animate {
  animation: floatY 5s ease-in-out infinite;
}
.float-animate-reverse {
  animation: floatYReverse 5s ease-in-out infinite;
}
`}</style>
      {/* Top-left SVG */}
      <svg className="absolute top-4 left-4 w-48 h-48 opacity-10 z-0 float-animate" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="100" fill="#fff" />
        <rect x="60" y="60" width="80" height="20" rx="4" fill="#2563eb" />
        <rect x="60" y="90" width="50" height="10" rx="3" fill="#2563eb" />
        <rect x="60" y="105" width="70" height="10" rx="3" fill="#2563eb" />
      </svg>
      {/* Bottom-right SVG */}
      <svg className="absolute bottom-4 right-4 w-56 h-56 opacity-10 z-0 float-animate-reverse" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="110" cy="110" r="110" fill="#fff" />
        <rect x="80" y="120" width="90" height="18" rx="4" fill="#2563eb" />
        <rect x="80" y="145" width="60" height="10" rx="3" fill="#2563eb" />
        <rect x="80" y="160" width="80" height="10" rx="3" fill="#2563eb" />
      </svg>
      <div className="w-full max-w-md bg-white rounded shadow-lg p-10 flex flex-col items-center z-10" style={{borderRadius: '6px'}}>
        <div className="mb-4 flex justify-center">
          <Image src="/logo_side.svg" alt="NiftyTrader Logo" width={100} height={100} className='h-20' priority />
        </div>
        {/* <div className="text-xl font-bold text-blue-700 mb-6 tracking-wide">NiftyTrader</div> */}
        <form onSubmit={handleLoginSubmit} className="w-full">
          <div className="mb-6">
            <input
              type="text"
              name="username"
              value={loginForm.username}
              onChange={handleLoginChange}
              placeholder="Username"
              className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-blue-600 focus:ring-0 text-base bg-transparent outline-none"
              autoComplete="username"
              style={{borderRadius: 0}}
            />
          </div>
          <div className="mb-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Password"
                className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-blue-600 focus:ring-0 text-base bg-transparent outline-none"
                autoComplete="current-password"
                style={{borderRadius: 0}}
              />
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-400 focus:outline-none px-2"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          {loginError && <div className="text-red-500 mb-4 font-semibold text-center text-sm">{loginError}</div>}
          <button type="submit" className="w-full px-0 py-2 font-bold text-base bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm" style={{borderRadius: 0}}>
            LOGIN
          </button>
        </form>
        <div className="w-full mt-6 bg-gray-50 border border-gray-200 rounded p-4 text-xs text-gray-700">
          <div className="font-semibold mb-1">Dummy Credentials:</div>
          <div><span className="font-medium">username</span> - news-admin</div>
          <div><span className="font-medium">password</span> - 4862</div>
        </div>
      </div>
    </div>
  );
} 