
import React, { useState, useMemo, useEffect } from 'react';
import { Trial, UserRole, LogEntry } from '../types';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  trials: Trial[];
  role: UserRole;
  onUpdate: () => void;
  onLogout: () => void;
}

interface AdminProfile {
  user_id: string;
  role: string;
  email?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ trials, role, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'profiles' | 'logs'>('data');
  const [search, setSearch] = useState('');
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trial> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  
  // 数据导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'profiles' && role === 'super_admin') {
      fetchProfiles();
    }
    if (activeTab === 'logs' && role === 'super_admin') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('admin_users').select('*');
    setProfiles(data || []);
  };

  const fetchLogs = async () => {
    setIsLogsLoading(true);
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setLogs(data || []);
    setIsLogsLoading(false);
  };

  const logAction = async (action: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('logs').insert([{
      user_id: user.id,
      user_email: user.email,
      action: action,
      details: details
    }]);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return trials.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.disease.toLowerCase().includes(q) ||
      t.pi.toLowerCase().includes(q)
    );
  }, [search, trials]);

  const handleEditClick = (trial: Trial) => {
    setEditingTrial(trial);
    setEditForm({ ...trial });
  };

  const handleAddNew = () => {
    const newTrial: Partial<Trial> = {
      title: '新临床试验项目',
      department: '肿瘤内科',
      pi: '未指定',
      disease: '未指定适应症',
      tags: [],
      criteria: '请在此输入标准...',
      contact: '联系人：\n电话：'
    };
    setEditingTrial(null);
    setEditForm(newTrial);
  };

  const handleSaveTrial = async () => {
    if (!editForm) return;
    setIsSaving(true);
    try {
      let error;
      const isUpdate = !!editForm.id;
      
      if (isUpdate) {
        const { error: updateError } = await supabase.from('trials').update(editForm).eq('id', editForm.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('trials').insert([editForm]);
        error = insertError;
      }
      
      if (error) throw error;
      
      // 记录日志
      await logAction(
        isUpdate ? `修改试验项目: ${editForm.title}` : `创建新试验项目: ${editForm.title}`,
        { trial_id: editForm.id, disease: editForm.disease }
      );

      onUpdate();
      setEditingTrial(null);
      setEditForm(null);
      alert('云端同步成功并记录审计日志！');
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', '科室', '研究者(PI)', '项目标题', '适应症', '标签', '详细标准', '联系方式'];
    const rows = trials.map(t => [t.id, t.department, t.pi, t.title, t.disease, t.tags?.join('; ') || '', t.criteria, t.contact]);
    const csvString = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DATA_EXPORT.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 数据导入相关函数
  const handleImportData = () => {
    setShowImportModal(true);
    setImportFile(null);
    setImportError(null);
    setImportSuccess(null);
    setImportProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setImportFile(file);
        setImportError(null);
      } else {
        setImportError('请选择CSV格式的文件');
        setImportFile(null);
      }
    }
  };

  const parseCSV = (csvText: string): Partial<Trial>[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const result: Partial<Trial>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 处理带引号的CSV字段
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim().replace(/""/g, '"'));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/""/g, '"'));

      const trial: Partial<Trial> = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header.toLowerCase()) {
          case '科室':
          case 'department':
            trial.department = value;
            break;
          case '研究者(pi)':
          case '研究者':
          case 'pi':
            trial.pi = value;
            break;
          case '项目标题':
          case '标题':
          case 'title':
            trial.title = value;
            break;
          case '适应症':
          case 'disease':
            trial.disease = value;
            break;
          case '标签':
          case 'tags':
            trial.tags = value ? value.split(';').map(tag => tag.trim()) : [];
            break;
          case '详细标准':
          case '标准':
          case 'criteria':
            trial.criteria = value;
            break;
          case '联系方式':
          case '联系':
          case 'contact':
            trial.contact = value;
            break;
        }
      });

      // 验证必填字段
      if (trial.title || trial.disease || trial.pi) {
        result.push(trial);
      }
    }

    return result;
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportError('请选择要导入的CSV文件');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    setImportProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const trialsToImport = parseCSV(csvText);

          if (trialsToImport.length === 0) {
            setImportError('CSV文件中没有有效的数据');
            setIsImporting(false);
            return;
          }

          // 批量导入数据
          const batchSize = 10;
          const total = trialsToImport.length;
          let imported = 0;

          for (let i = 0; i < total; i += batchSize) {
            const batch = trialsToImport.slice(i, i + batchSize);
            const { error } = await supabase.from('trials').insert(batch);
            
            if (error) {
              throw error;
            }

            imported += batch.length;
            setImportProgress(Math.round((imported / total) * 100));
          }

          // 记录导入日志
          await logAction('批量导入试验项目', {
            count: total,
            fileName: importFile.name
          });

          setImportSuccess(`成功导入 ${total} 个试验项目`);
          onUpdate();

          // 3秒后关闭模态框
          setTimeout(() => {
            setShowImportModal(false);
          }, 3000);
        } catch (error: any) {
          setImportError(`导入失败: ${error.message}`);
        } finally {
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        setImportError('文件读取失败');
        setIsImporting(false);
      };
      reader.readAsText(importFile, 'UTF-8');
    } catch (error: any) {
      setImportError(`导入失败: ${error.message}`);
      setIsImporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div className="leading-tight">
            <h2 className="text-white font-black text-lg tracking-tight">管理工作台</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Supabase JWT Auth</p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-sm ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            项目列表管理
          </button>
          
          {role === 'super_admin' && (
            <>
              <button 
                onClick={() => setActiveTab('profiles')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-sm ${activeTab === 'profiles' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                管理员权限分布
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-sm ${activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                系统操作日志
              </button>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4">
             <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-1">当前身份</span>
             <span className="text-indigo-400 font-black text-xs">{role === 'super_admin' ? '核心超级管理员' : '临床数据管理员'}</span>
          </div>
          <button onClick={onLogout} className="w-full py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
            安全退出
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <header className="h-20 border-b border-slate-900 flex items-center justify-between px-10 shrink-0">
          <h2 className="text-xl font-black text-white">
            {activeTab === 'data' ? '试验数据库' : activeTab === 'profiles' ? '管理员架构' : '系统审计日志'}
          </h2>
          {activeTab === 'data' && (
            <div className="flex gap-4">
              <button onClick={handleImportData} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest">导入数据</button>
              <button onClick={exportCSV} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest">导出数据</button>
              <button onClick={handleAddNew} className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest">+ 新增试验</button>
            </div>
          )}
          {activeTab === 'logs' && (
            <button onClick={fetchLogs} className="px-5 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-xl hover:bg-emerald-600/30 transition-all">刷新审计流</button>
          )}
        </header>

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'data' ? (
            <>
              <div className="w-96 border-r border-slate-900 flex flex-col">
                <div className="p-6 border-b border-slate-900">
                  <input 
                    type="text" 
                    placeholder="快速检索..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" 
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filtered.map(trial => (
                    <div 
                      key={trial.id} 
                      onClick={() => handleEditClick(trial)}
                      className={`p-6 border-b border-slate-900/50 cursor-pointer transition-all ${editingTrial?.id === trial.id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : 'hover:bg-slate-900/30'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-600 font-black"># {trial.id}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-indigo-400 font-bold">{trial.department}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-200 line-clamp-1">{trial.title}</h4>
                      <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{trial.disease}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                {editForm ? (
                  <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-3xl font-black text-white">{editForm.id ? `编辑项目 ${editForm.id}` : '创建新临床试验'}</h3>
                        <p className="text-slate-500 text-sm mt-1">所有更改将实时应用 RLS 权限进行同步</p>
                      </div>
                      <button onClick={handleSaveTrial} disabled={isSaving} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/20">
                        {isSaving ? '正在同步云端...' : '立即发布更改'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">适应症</label>
                        <input type="text" value={editForm.disease || ''} onChange={e => setEditForm({...editForm, disease: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 font-bold text-indigo-400 outline-none focus:border-indigo-500 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">主研究员 (PI)</label>
                        <input type="text" value={editForm.pi || ''} onChange={e => setEditForm({...editForm, pi: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">项目完整标题</label>
                      <textarea rows={3} value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner resize-none text-white leading-relaxed" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">详细准入条件</label>
                      <textarea rows={15} value={editForm.criteria || ''} onChange={e => setEditForm({...editForm, criteria: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-6 text-sm font-medium outline-none focus:border-indigo-500 shadow-inner resize-y leading-loose text-slate-300 antialiased" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-emerald-500">联系信息</label>
                      <textarea rows={2} value={editForm.contact || ''} onChange={e => setEditForm({...editForm, contact: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 font-black outline-none focus:border-emerald-500 shadow-inner text-emerald-400" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 italic space-y-4">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center opacity-30">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest">请选择或创建一个临床项目</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'profiles' ? (
            <div className="flex-1 p-12 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="bg-indigo-900/10 border border-indigo-500/20 p-8 rounded-3xl mb-10">
                  <h4 className="text-indigo-400 font-black text-lg mb-2">安全提示</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    当前版本已启用 <b>Supabase Auth</b>。增加或删除管理员账号现在需要在 Supabase 控制台的 <b>Authentication</b> 页面操作。
                  </p>
                </div>
                
                <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">用户 UUID (Auth ID)</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase text-right">角色权限级别</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {profiles.map(p => (
                        <tr key={p.user_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-5 font-mono text-xs text-slate-400">{p.user_id}</td>
                          <td className="px-8 py-5 text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${p.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                              {p.role === 'super_admin' ? '核心超级管理' : '数据专员'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
              <div className="max-w-5xl mx-auto">
                {isLogsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {logs.map((log) => (
                      <div key={log.id} className="group relative pl-8 border-l border-slate-800 pb-8 last:pb-0">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform"></div>
                        <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl group-hover:bg-slate-900 group-hover:border-emerald-500/20 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="text-emerald-400 font-black text-sm uppercase tracking-tight">{log.action}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-bold">操作员:</span>
                                <span className="text-[10px] text-slate-300 font-black">{log.user_email}</span>
                              </div>
                            </div>
                            <time className="text-[10px] text-slate-500 font-bold bg-slate-950 px-3 py-1 rounded-full">
                              {new Date(log.created_at).toLocaleString('zh-CN', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </time>
                          </div>
                          {log.details && (
                            <div className="mt-4 p-3 bg-slate-950 rounded-xl font-mono text-[9px] text-slate-500 overflow-x-auto">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-20 text-slate-600 font-black uppercase tracking-widest italic">
                        暂无审计记录
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 数据导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-800 animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-600/40">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-white">批量导入数据</h2>
                <p className="text-slate-500 text-sm mt-2">请选择CSV格式的文件进行导入</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">选择文件</label>
                  <div className={`border-2 border-dashed ${importFile ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 bg-slate-800/50'} rounded-2xl p-8 text-center transition-all`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer ${importFile ? 'text-emerald-400' : 'text-slate-400'} transition-colors`}
                    >
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="font-bold">{importFile ? importFile.name : '点击或拖拽文件到此处'}</p>
                      <p className="text-xs text-slate-600 mt-1">支持CSV格式文件</p>
                    </label>
                  </div>
                </div>

                {importProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400">导入进度</span>
                      <span className="text-indigo-400">{importProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {importError && (
                  <div className="p-4 bg-red-900/20 text-red-400 text-xs font-bold rounded-2xl border border-red-500/20 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                    {importError}
                  </div>
                )}

                {importSuccess && (
                  <div className="p-4 bg-emerald-900/20 text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></div>
                    {importSuccess}
                  </div>
                )}

                <div className="flex flex-col gap-4 pt-4">
                  <button
                    onClick={handleImportSubmit}
                    disabled={isImporting || !importFile}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        正在导入...
                      </>
                    ) : (
                      '开始导入'
                    )}
                  </button>
                  <button
                    onClick={() => setShowImportModal(false)}
                    disabled={isImporting}
                    className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold hover:bg-slate-700 transition-all text-xs uppercase tracking-widest"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
