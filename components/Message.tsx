import React, { useState, useEffect, useMemo } from 'react';
import { Message as MessageType, MessageRole, Source, Citation } from '../types';

// --- Start of Text Renderer with Citations & Markdown ---

// 1. Low-level parser for inline styles (bold, italic) and legal terms
const parseInlineFormatting = (text: string): React.ReactNode => {
    const legalPatterns = [
        /(المادة رقم \d+)/,
        /(قانون رقم \d+ لسنة \d+)/,
        /(قرار رئيس مجلس الوزراء رقم \d+ لسنة \d+)/,
        /(الكتاب الدوري رقم \d+)/,
    ];
    const markdownPattern = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;

    const highlightLegal = (str: string) => {
        const combinedLegalPattern = new RegExp(`(${legalPatterns.map(p => p.source).join('|')})`, 'g');
        return str.split(combinedLegalPattern).filter(Boolean).map((part, i) => {
            const isLegal = legalPatterns.some(p => new RegExp(`^${p.source}$`).test(part));
            return isLegal ? <strong key={i} className="font-semibold bg-yellow-100 dark:bg-yellow-800/50 px-1 py-0.5 rounded-sm">{part}</strong> : part;
        });
    };

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = markdownPattern.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(...highlightLegal(text.substring(lastIndex, match.index)));
        if (match[2] !== undefined) parts.push(<strong key={lastIndex} className="font-bold">{highlightLegal(match[2])}</strong>);
        else if (match[4] !== undefined) parts.push(<em key={lastIndex} className="italic">{highlightLegal(match[4])}</em>);
        lastIndex = markdownPattern.lastIndex;
    }
    if (lastIndex < text.length) parts.push(...highlightLegal(text.substring(lastIndex)));
    return parts;
};

// 2. Component to render a text block with citation highlighting
const CitedContent: React.FC<{ text: string; citations: Citation[]; offset: number; messageIndex: number; }> = ({ text, citations, offset, messageIndex }) => {
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    const relevantCitations = citations
        .filter(c => c.endIndex > offset && c.startIndex < offset + text.length)
        .sort((a, b) => a.startIndex - b.startIndex);

    relevantCitations.forEach(citation => {
        const localStart = Math.max(0, citation.startIndex - offset);
        const localEnd = Math.min(text.length, citation.endIndex - offset);

        if (localStart > lastIndex) {
            segments.push(parseInlineFormatting(text.substring(lastIndex, localStart)));
        }
        
        segments.push(
            <span key={`${citation.startIndex}-${citation.sourceIndex}`} className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded-sm">
                {parseInlineFormatting(text.substring(localStart, localEnd))}
                <sup className="font-bold text-blue-600 dark:text-blue-400">
                    <a href={`#source-${messageIndex}-${citation.sourceIndex}`} title={`Source ${citation.sourceIndex + 1}`}>
                        [{citation.sourceIndex + 1}]
                    </a>
                </sup>
            </span>
        );
        lastIndex = localEnd;
    });

    if (lastIndex < text.length) {
        segments.push(parseInlineFormatting(text.substring(lastIndex)));
    }

    return <>{segments}</>;
};

// 3. High-level renderer for block-level markdown (paragraphs, lists, headings)
const MarkdownRenderer: React.FC<{ text: string; citations: Citation[]; messageIndex: number; }> = ({ text, citations, messageIndex }) => {
    let offset = 0;

    const renderedBlocks = useMemo(() => {
        return text.split('\n\n').map((block, index) => {
            const blockOffset = offset;
            offset += block.length + 2; // +2 for the \n\n

            const renderBlockContent = (content: string) => (
                <CitedContent text={content} citations={citations} offset={blockOffset + (block.length - content.length)} messageIndex={messageIndex} />
            );

            if (block.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-2 mb-2">{renderBlockContent(block.substring(4))}</h3>;
            if (block.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{renderBlockContent(block.substring(3))}</h2>;
            if (block.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{renderBlockContent(block.substring(2))}</h1>;

            const lines = block.split('\n').filter(line => line.trim() !== '');
            const isUnorderedList = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
            const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));

            if (isUnorderedList) {
                return (
                    <ul key={index} className="list-disc list-outside space-y-1 my-2 pr-6">
                        {lines.map((line, lineIndex) => <li key={lineIndex}>{renderBlockContent(line.trim().substring(2))}</li>)}
                    </ul>
                );
            }
            if (isOrderedList) {
                return (
                    <ol key={index} className="list-decimal list-outside space-y-1 my-2 pr-6">
                        {lines.map((line, lineIndex) => <li key={lineIndex}>{renderBlockContent(line.trim().replace(/^\d+\.\s/, ''))}</li>)}
                    </ol>
                );
            }
            return <p key={index} className="my-2 leading-relaxed">{renderBlockContent(block)}</p>;
        });
    }, [text, citations, messageIndex]);

    return <>{renderedBlocks}</>;
};

// --- End of Renderer ---


interface MessageProps {
    message: MessageType;
    isLoading: boolean;
    isLastMessage: boolean;
    messageIndex: number;
}

const UserIcon = () => (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    </div>
);

const ModelIcon = () => (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.5 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.5 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
    </div>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const SpeakerIcon = ({ isSpeaking }: { isSpeaking: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {isSpeaking ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M15 9.75l-2.25 2.25M15 9.75l2.25 2.25M15 9.75l2.25-2.25M15 9.75l-2.25-2.25M9 15l-3 3m0 0l3 3m-3-3h12a6 6 0 000-12h-3" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5 5 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        )}
    </svg>
);

const SourceLink: React.FC<{ source: Source; index: number; messageIndex: number; }> = ({ source, index, messageIndex }) => (
    <li id={`source-${messageIndex}-${index}`} className="flex items-start gap-2">
        <span className="text-xs pt-1 text-slate-500 dark:text-slate-400 font-medium">{index + 1}.</span>
        <a 
            href={source.uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            title={source.title}
        >
           {source.title || new URL(source.uri).hostname}
        </a>
    </li>
);

export const Message: React.FC<MessageProps> = ({ message, isLoading, isLastMessage, messageIndex }) => {
    const isUser = message.role === MessageRole.USER;
    const [copied, setCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleSpeak = () => {
        if (!('speechSynthesis' in window)) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            window.speechSynthesis.cancel(); // Stop any other speech
            const utterance = new SpeechSynthesisUtterance(message.text);
            utterance.lang = 'ar-SA';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const messageBubbleClasses = isUser 
        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-l-2xl rounded-t-2xl' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-r-2xl rounded-t-2xl';
    
    const renderedText = isUser 
      ? <p>{message.text}</p> 
      : <MarkdownRenderer text={message.text} citations={message.citations || []} messageIndex={messageIndex} />;

    return (
        <div dir="rtl" className={`group flex items-start gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <ModelIcon />}
            
            <div className={`max-w-2xl w-full flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative p-4 sm:p-5 shadow-md ${messageBubbleClasses}`}>
                     {!isUser && !isLoading && message.text && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={handleSpeak} title={isSpeaking ? "إيقاف القراءة" : "قراءة النص"} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                               <SpeakerIcon isSpeaking={isSpeaking} />
                            </button>
                            <button onClick={handleCopy} title="نسخ النص" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                                {copied ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                    )}
                    <div className="text-right whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                        {renderedText}
                        {isLastMessage && isLoading && !isUser && <span className="inline-block w-1 h-4 bg-slate-600 dark:bg-slate-400 animate-pulse ml-1"></span>}
                    </div>
                    {message.imageUrl && (
                        <div className="mt-4">
                            <img 
                                src={message.imageUrl} 
                                alt="User upload" 
                                className="rounded-lg max-w-xs h-auto"
                            />
                        </div>
                    )}
                </div>

                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 w-full">
                        <h4 className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2 text-right">المصادر:</h4>
                        <ol className="list-inside space-y-2">
                           {message.sources.map((source, index) => (
                               <SourceLink key={source.uri} source={source} index={index} messageIndex={messageIndex} />
                           ))}
                        </ol>
                    </div>
                )}
            </div>

            {isUser && <UserIcon />}
        </div>
    );
};