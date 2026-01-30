
import React, { useState, useMemo, useEffect } from 'react';
import { Trial } from './types';
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
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('public');

  // 获取 JSON 数据库
  useEffect(() => {
    const loadTrials = async () => {
      try {
        setLoading(true);
        const response = await fetch('./clinical_trials_search_db.json');
        if (!response.ok) {
          throw new Error('无法获取数据库文件');
        }
        const data = await response.json();
        setTrials(data);
        setError(null);
      } catch (err) {
        console.error('加载数据库失败:', err);
        setError('加载临床试验数据库失败，请刷新页面重试。');
      } finally {
        setLoading(false);
      }
    };

    loadTrials();
  }, []);

  // 核心实时过滤逻辑
  const filteredTrials = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return trials;

    return trials.filter(trial => {
      const matchDisease = trial.disease.toLowerCase().includes(q);
      const matchTitle = trial.title.toLowerCase().includes(q);
      const matchTags = trial.tags.some(tag => tag.toLowerCase().includes(q));
      const matchPI = trial.pi.toLowerCase().includes(q);
      return matchDisease || matchTitle || matchTags || matchPI;
    });
  }, [query, trials]);

  // 如果处于管理面板模式，渲染管理组件
  if (viewMode === 'admin_panel') {
    return (
      <AdminDashboard 
        trials={trials} 
        onUpdate={setTrials} 
        onLogout={() => setViewMode('public')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">临床药物试验库</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Clinical Trial Explorer</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-xs font-bold text-slate-400">
              {loading ? '数据库连接中...' : `已挂载 JSON 库 · 共 ${trials.length} 条数据`}
            </div>
            <button 
              onClick={() => setViewMode('admin_login')}
              className="text-slate-400 hover:text-blue-600 font-bold text-xs transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 hover:bg-blue-50"
            >
              管理端登录
            </button>
          </div>
        </div>
      </nav>

      {/* 搜索区域 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
              快速定位患者招募项目
            </h2>
            <p className="text-slate-500 text-lg">
              支持疾病、药物、研究者实时过滤
            </p>
          </div>
          <SearchBox 
            value={query} 
            onChange={setQuery} 
            placeholder="搜索：如‘非小细胞肺癌’、‘EGFR’、‘于国华’..." 
          />
        </div>

        {/* 结果标题 */}
        <div className="flex items-end justify-between mb-8 border-b border-slate-200 pb-4">
          <div>
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Search Results</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '正在检索...' : (query ? `匹配项目 (${filteredTrials.length})` : `全部临床试验 (${filteredTrials.length})`)}
            </h3>
          </div>
        </div>

        {/* 核心内容区 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">正在解析本地 JSON 数据库...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
            <p className="text-red-600 font-bold">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-lg"
            >
              重新加载
            </button>
          </div>
        ) : filteredTrials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredTrials.map(trial => (
              <TrialCard 
                key={trial.id} 
                trial={trial} 
                onClick={setSelectedTrial} 
                highlight={query}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="text-slate-300 mb-4">
              <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">未找到相关匹配项</h3>
            <p className="text-slate-400 mt-2 text-center max-w-xs">
              请尝试输入更通用的疾病名称或检查您的拼写是否正确
            </p>
            <button 
              onClick={() => setQuery('')}
              className="mt-8 px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
            >
              显示全部
            </button>
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">临床药物实验搜索系统 · 本地静态 JSON 存储</p>
          <div className="mt-4 flex justify-center space-x-6">
            <button 
              onClick={() => setViewMode('admin_login')}
              className="text-[10px] text-slate-300 hover:text-blue-400 uppercase tracking-tighter transition-colors"
            >
              Admin Access
            </button>
            <span className="text-[10px] text-slate-300 uppercase tracking-tighter">Full Screen Reading</span>
            <span className="text-[10px] text-slate-300 uppercase tracking-tighter">Real-time Search</span>
          </div>
        </div>
      </footer>

      {/* 登录弹窗 */}
      {viewMode === 'admin_login' && (
        <AdminLogin 
          onLogin={() => setViewMode('admin_panel')} 
          onCancel={() => setViewMode('public')} 
        />
      )}

      {/* 详情模态框 */}
      {selectedTrial && (
        <TrialDetail 
          trial={selectedTrial} 
          onClose={() => setSelectedTrial(null)} 
        />
      )}
    </div>
  );
};

export default App;
