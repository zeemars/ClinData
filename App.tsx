
import React, { useState, useMemo, useEffect } from 'react';
import { Trial, UserRole } from './types';
import { supabase } from './lib/supabase';
import SearchBox from './components/SearchBox';
import TrialCard from './components/TrialCard';
import TrialDetail from './components/TrialDetail';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

type ViewMode = 'public' | 'admin_login' | 'admin_panel';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<{message: string, code?: string} | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('public');
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetchTrials();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkUserRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
        setViewMode('admin_panel');
      } else {
        setCurrentRole(null);
        setRoleError(null);
        setViewMode('public');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trials')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setTrials(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Trials fetch error:', err);
      setError('无法获取临床试验数据。请确认数据库中的 trials 表已设置 RLS 策略（如：SELECT USING true）。');
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async (userId: string) => {
    setRoleError(null);
    try {
      // 优先直接查询 admin_users 表
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Role check failed:', error);
        // 如果仍然报错递归，说明 SQL 脚本还没跑
        if (error.message.includes('recursion')) {
          setRoleError({
            message: '数据库权限死循环：请在 Supabase SQL 编辑器中运行我提供的 SQL 修复脚本。',
            code: 'RLS_RECURSION'
          });
        } else {
          setRoleError({ message: error.message, code: error.code });
        }
        return;
      }
      
      if (data) {
        setCurrentRole(data.role as UserRole);
      } else {
        // 账号在 Auth 里但不在 admin_users 里，降级为普通管理员
        setCurrentRole('data_admin');
      }
    } catch (err: any) {
      setRoleError({ message: '权限系统连接中断' });
    }
  };

  const filteredTrials = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return trials;
    return trials.filter(trial => {
      return trial.disease.toLowerCase().includes(q) || 
             trial.title.toLowerCase().includes(q) || 
             trial.pi.toLowerCase().includes(q);
    });
  }, [query, trials]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setViewMode('public');
    setCurrentRole(null);
    setRoleError(null);
  };

  // 错误提示界面
  if (roleError && viewMode === 'admin_panel') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white max-w-xl w-full rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">数据库配置错误</h2>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed mb-8">
            {roleError.message}
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.location.reload()} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">刷新页面</button>
            <button onClick={handleLogout} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200">退出</button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'admin_panel' && session && currentRole) {
    return (
      <AdminDashboard trials={trials} role={currentRole} onUpdate={fetchTrials} onLogout={handleLogout} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setQuery('')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">临床试验搜索</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Secure Cloud Sync</p>
            </div>
          </div>
          <button 
            onClick={() => setViewMode(session ? 'admin_panel' : 'admin_login')}
            className="text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50"
          >
            {session ? (currentRole ? '返回管理面板' : '正在验证...') : '管理员登录'}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="max-w-3xl mx-auto mb-16">
          <SearchBox value={query} onChange={setQuery} placeholder="搜索疾病、研究者或项目标题..." />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium text-sm">正在同步数据...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrials.map(trial => (
              <TrialCard key={trial.id} trial={trial} onClick={setSelectedTrial} highlight={query} />
            ))}
          </div>
        )}
      </main>

      {viewMode === 'admin_login' && (
        <AdminLogin onLogin={() => {}} onCancel={() => setViewMode('public')} />
      )}

      {selectedTrial && (
        <TrialDetail trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
      )}
    </div>
  );
};

export default App;
