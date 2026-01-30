
import React from 'react';
import { Trial } from '../types';

interface TrialCardProps {
  trial: Trial;
  onClick: (trial: Trial) => void;
  highlight?: string;
}

const TrialCard: React.FC<TrialCardProps> = ({ trial, onClick, highlight }) => {
  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() ? 
      <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{part}</mark> : part
    );
  };

  return (
    <div 
      onClick={() => onClick(trial)}
      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer flex flex-col h-full group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          {trial.department}
        </span>
        <span className="text-xs text-slate-400 font-medium">PI: {trial.pi}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
        {highlight ? highlightText(trial.title, highlight) : trial.title}
      </h3>
      
      <div className="flex items-center text-sm text-slate-600 mb-4">
        <svg className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        {highlight ? highlightText(trial.disease, highlight) : trial.disease}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {trial.tags.slice(0, 4).map((tag, idx) => (
          <span 
            key={idx} 
            className={`px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-500 uppercase tracking-wider
              ${highlight && tag.toLowerCase().includes(highlight.toLowerCase()) ? 'ring-2 ring-blue-300 ring-offset-1 bg-blue-50 text-blue-600' : ''}
            `}
          >
            {tag}
          </span>
        ))}
        {trial.tags.length > 4 && (
          <span className="text-[10px] text-slate-400 pt-1">+{trial.tags.length - 4}</span>
        )}
      </div>
    </div>
  );
};

export default TrialCard;
