
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface AdminLoginProps {
  onLogin: (role: UserRole) => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 使用 Supabase 官方 Auth 接口
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? '邮箱或密码错误' : authError.message);
        return;
      }

      if (data.user) {
        // 登录成功后，App.tsx 的监听器会自动处理后续逻辑
        onLogin('data_admin');
      }
    } catch (err) {
      setError('认证服务暂时不可用');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300">
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-500/40">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900">官方认证</h2>
            <p className="text-slate-500 text-sm mt-2">请使用管理员邮箱登录</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">注册邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                placeholder="admin@hospital.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">安全密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : '建立加密会话'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
