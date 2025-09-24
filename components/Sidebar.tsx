import React from 'react';
import type { ChatSession } from '../types';

interface SidebarProps {
  chats: ChatSession[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const JusticeScaleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-3-11l-3 3m12-3l-3 3M3.75 6.75h16.5M3.75 17.25h16.5M6 6.75v10.5m12-10.5v10.5M9 21h6" />
    </svg>
);

const NewChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ chats, currentChatId, onNewChat, onSelectChat, isOpen, setIsOpen }) => {
  
  const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
        {/* Overlay for mobile */}
        <div 
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        <aside className={`absolute md:relative flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 w-72 md:w-80 transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <JusticeScaleIcon />
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        المساعد القانوني الآلي
                    </h1>
                </div>
                 {/* Close button for mobile */}
                <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-slate-500">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
                <button 
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-blue-500"
                >
                    <NewChatIcon />
                    محادثة جديدة
                </button>
            </div>
            
            {/* Chat History */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 pt-4 pb-2">سجل المحادثات</h2>
                {sortedChats.map(chat => (
                    <a
                        key={chat.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); onSelectChat(chat.id); }}
                        className={`block w-full text-right p-3 rounded-lg truncate transition-colors ${
                            currentChatId === chat.id 
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' 
                                : 'hover:bg-slate-200 dark:hover:bg-slate-800/60'
                        }`}
                    >
                        {chat.title}
                    </a>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
                 <p className="text-xs text-slate-500 dark:text-slate-400">
                    بواسطة: صلاح حامد أمين
                    <br/>
                    أمين كلية الحقوق، جامعة سوهاج
                 </p>
            </div>
        </aside>
    </>
  );
};