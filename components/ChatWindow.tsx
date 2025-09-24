import React, { useRef, useEffect } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatWindowProps {
    messages: MessageType[];
    isLoading: boolean;
    isThinking: boolean;
    onSendMessage: (prompt: string) => void;
}

const ExamplePrompts: React.FC<{ onSendMessage: (prompt: string) => void }> = ({ onSendMessage }) => {
    const prompts = [
        "ما هي شروط القبول بكلية الحقوق؟",
        "اشرح لي لائحة الساعات المعتمدة.",
        "ما هي الإجراءات التأديبية للطالب؟",
        "لخص لي قانون تنظيم الجامعات.",
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {prompts.map((prompt) => (
                <button
                    key={prompt}
                    onClick={() => onSendMessage(prompt)}
                    className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-right hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                    {prompt}
                </button>
            ))}
        </div>
    );
};

const WelcomeMessage: React.FC<{ onSendMessage: (prompt: string) => void }> = ({ onSendMessage }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-3-11l-3 3m12-3l-3 3M3.75 6.75h16.5M3.75 17.25h16.5M6 6.75v10.5m12-10.5v10.5M9 21h6" />
            </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            المساعد القانوني الآلي المصري
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
            مرحباً بك! أنا هنا لمساعدتك في فهم القوانين واللوائح المصرية. كيف يمكنني خدمتك اليوم؟
        </p>
        <ExamplePrompts onSendMessage={onSendMessage} />
    </div>
);
    
export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, isThinking, onSendMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading, isThinking]);
    
    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
            <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
                {messages.length === 0 && !isLoading && <WelcomeMessage onSendMessage={onSendMessage}/>}
                {messages.map((msg, index) => (
                    <Message 
                        key={index} 
                        message={msg} 
                        isLoading={isLoading && index === messages.length - 1}
                        isLastMessage={index === messages.length - 1}
                        messageIndex={index}
                    />
                ))}
                {isThinking && <ThinkingIndicator />}
            </div>
        </div>
    );
};
