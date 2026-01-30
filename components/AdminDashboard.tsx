
import React, { useState, useMemo } from 'react';
import { Trial } from '../types';

interface AdminDashboardProps {
  trials: Trial[];
  onUpdate: (updatedTrials: Trial[]) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ trials, onUpdate, onLogout }) => {
  const [search, setSearch] = useState('');
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);
  const [editForm, setEditForm] = useState<Trial | null>(null);

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

  const handleFormChange = (field: keyof Trial, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handleSave = () => {
    if (!editForm) return;
    const newTrials = trials.map(t => t.id === editForm.id ? editForm : t);
    onUpdate(newTrials);
    setEditingTrial(null);
    setEditForm(null);
    alert('修改已保存在内存中，记得导出 JSON 以持久化！');
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trials, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "clinical_trials_search_db.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-300">
      {/* 顶部栏 */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <h1 className="text-white font-bold tracking-tight">实验数据库后台管理</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportJSON}
            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出数据库 (JSON)
          </button>
          <button 
            onClick={onLogout}
            className="text-slate-400 hover:text-white transition-colors"
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧列表 */}
        <div className="w-96 border-r border-slate-700 flex flex-col bg-slate-800/50">
          <div className="p-4 border-b border-slate-700">
            <input 
              type="text"
              placeholder="快速过滤项目..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.map(trial => (
              <div 
                key={trial.id}
                onClick={() => handleEditClick(trial)}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors ${editingTrial?.id === trial.id ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/30'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID #{trial.id}</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">{trial.pi}</span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-2">{trial.title}</h4>
                <div className="text-[11px] text-blue-400 font-bold">{trial.disease}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧编辑器 */}
        <div className="flex-1 bg-slate-900 overflow-y-auto custom-scrollbar p-8">
          {editForm ? (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">编辑试验资料</h2>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {setEditingTrial(null); setEditForm(null);}}
                    className="px-6 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all"
                  >
                    保存修改
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">科室</label>
                    <input 
                      type="text" 
                      value={editForm.department}
                      onChange={e => handleFormChange('department', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PI (主要研究者)</label>
                    <input 
                      type="text" 
                      value={editForm.pi}
                      onChange={e => handleFormChange('pi', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">适应症 (疾病名称)</label>
                    <input 
                      type="text" 
                      value={editForm.disease}
                      onChange={e => handleFormChange('disease', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-blue-400 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">标签 (逗号分隔)</label>
                    <input 
                      type="text" 
                      value={editForm.tags.join(', ')}
                      onChange={e => handleFormChange('tags', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">项目完整标题</label>
                <textarea 
                  rows={3}
                  value={editForm.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none resize-none font-bold text-white leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">入选与排除标准 (长文本)</label>
                <textarea 
                  rows={15}
                  value={editForm.criteria}
                  onChange={e => handleFormChange('criteria', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none resize-y text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">联系方式</label>
                <textarea 
                  rows={2}
                  value={editForm.contact}
                  onChange={e => handleFormChange('contact', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none text-emerald-400 font-bold"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-400">选择左侧项目开始编辑</h3>
              <p className="mt-2 text-sm max-w-xs text-center">所有修改仅在当前会话生效。若要永久保存，请在修改完成后点击右上角的“导出”按钮并替换原始 JSON 文件。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
