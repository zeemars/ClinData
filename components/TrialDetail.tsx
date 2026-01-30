
import React, { useState } from 'react';
import { Trial } from '../types';

interface TrialDetailProps {
  trial: Trial;
  onClose: () => void;
}

const TrialDetail: React.FC<TrialDetailProps> = ({ trial, onClose }) => {
  const [isCriteriaExpanded, setIsCriteriaExpanded] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* 弹窗主体 */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300">
        
        {/* 头部：精简布局 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                项目 #{trial.id}
              </span>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                {trial.department} · PI: {trial.pi}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {trial.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                主要适应症
              </h3>
              <p className="text-base font-bold text-blue-700">
                {trial.disease}
              </p>
            </section>

            <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                项目标签
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {trial.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* 详细标准卡片 */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
                详细标准 (入选 / 排除条件)
              </h3>
              
              {/* 放大阅读按钮 */}
              <button 
                onClick={() => setIsCriteriaExpanded(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-all text-xs font-bold group"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                全屏阅读
              </button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar bg-white">
              <div className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {trial.criteria}
              </div>
            </div>
          </section>

          <section className="bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm p-4">
            <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              联系人与电话
            </h3>
            <div className="text-emerald-900 font-bold leading-relaxed text-lg whitespace-pre-wrap">
              {trial.contact}
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
          >
            返回列表
          </button>
        </div>
      </div>

      {/* 详细标准全屏阅读模式 */}
      {isCriteriaExpanded && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">详细入选与排除标准</h3>
                <p className="text-xs text-slate-500 font-medium">项目标题：{trial.title.substring(0, 40)}...</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCriteriaExpanded(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg font-bold text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              退出阅读模式
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-10 sm:px-20 lg:px-40 custom-scrollbar bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="text-slate-800 whitespace-pre-wrap text-lg leading-loose font-sans antialiased">
                {trial.criteria}
              </div>
            </div>
          </div>
          <div className="h-4 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none sticky bottom-0"></div>
        </div>
      )}
    </div>
  );
};

export default TrialDetail;
