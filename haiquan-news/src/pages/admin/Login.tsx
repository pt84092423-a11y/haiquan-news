import React, { useState } from 'react';
import React, { useLocation } from 'wouter';
import React, { login, addAuditLog } from '@/lib/auth';
import logoImg from '@assets/logo_haiquan.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!username || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true);
    setError('');
    const user = await login(username, password);
    setLoading(false);
    if (!user) {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    } else {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => {
          if (d.ip) addAuditLog('LOGIN_IP', 'ip_info', null,
            JSON.stringify({ ip: d.ip, city: d.city, region: d.region, country_name: d.country_name, org: d.org }),
            user);
        }).catch(() => {});
      setLocation('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01122e] via-[#02183b] to-[#003a75] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImg} alt="Logo" className="h-14 w-auto mx-auto mb-4 brightness-0 invert" />
          <h1 className="text-white font-['Playfair_Display',serif] font-black text-[26px] uppercase tracking-widest">HQ Admin</h1>
          <p className="text-white/50 text-[13px] mt-1">Hệ thống Quản trị Báo Hải Quân Việt Nam</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-lg text-[13px]">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-white/80 text-[12px] font-bold uppercase tracking-widest mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#FFD700] transition"
              placeholder="username"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-white/80 text-[12px] font-bold uppercase tracking-widest mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#FFD700] transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD700] text-[#02183b] font-black text-[15px] py-3.5 rounded-lg hover:bg-yellow-400 transition disabled:opacity-60 uppercase tracking-wider"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-white/30 text-[12px] mt-6">
          Hệ thống dành riêng cho nhân viên SROV. Mọi hoạt động đều được ghi lại.
        </p>
      </div>
    </div>
  );
}
