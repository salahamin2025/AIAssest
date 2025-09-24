import React from 'react';

const ModelIcon = () => (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.5 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.5 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
    </div>
);

const DotPulse = () => (
    <div className="flex gap-1 items-center">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
    </div>
);


export const ThinkingIndicator: React.FC = () => {
    return (
        <div dir="rtl" className="flex items-center gap-3 sm:gap-4 justify-start">
             <ModelIcon />
             <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-r-2xl rounded-t-2xl flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">المساعد يفكر...</span>
                <DotPulse />
             </div>
        </div>
    );
};
