import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import type { ChatSession, Message } from './types';
import { MessageRole } from './types';
import { sendMessageStream, getChatTitle } from './services/geminiService';
import { ProgressBar } from './components/ProgressBar';

const App: React.FC = () => {
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // --- State Initialization and Persistence ---
    useEffect(() => {
        try {
            const savedChats = localStorage.getItem('chatSessions');
            if (savedChats) {
                const parsedChats = JSON.parse(savedChats);
                if (Array.isArray(parsedChats) && parsedChats.length > 0) {
                    setChats(parsedChats);
                } else {
                    handleNewChat();
                }
            } else {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to load chats from localStorage", error);
            handleNewChat();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!currentChatId && chats.length > 0) {
            const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
            setCurrentChatId(sortedChats[0].id);
        }
    }, [chats, currentChatId]);

    useEffect(() => {
        if (chats.length > 0) {
            localStorage.setItem('chatSessions', JSON.stringify(chats));
        }
    }, [chats]);
    
    const currentChat = chats.find(chat => chat.id === currentChatId);
    
    // --- Chat Actions ---
    const handleNewChat = useCallback(() => {
        const newChat: ChatSession = {
            id: `chat-${Date.now()}`,
            title: 'محادثة جديدة',
            messages: [],
            createdAt: Date.now(),
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        setIsSidebarOpen(false);
    }, []);

    const handleSelectChat = (id: string) => {
        if (isLoading) {
            abortControllerRef.current?.abort();
            setIsLoading(false);
            setIsThinking(false);
        }
        setCurrentChatId(id);
        setIsSidebarOpen(false);
    };

    const updateChatMessages = (chatId: string, updateFn: (messages: Message[]) => Message[]) => {
        setChats(prevChats => prevChats.map(chat => 
            chat.id === chatId ? { ...chat, messages: updateFn(chat.messages) } : chat
        ));
    };

    const handleSendMessage = async (prompt: string, imageUrl?: string) => {
        if (!currentChatId || isLoading) return;

        abortControllerRef.current = new AbortController();
        const isNewChat = currentChat?.messages.length === 0;
        
        const userMessage: Message = { role: MessageRole.USER, text: prompt, imageUrl };
        const historyForApi = [...(currentChat?.messages || []), userMessage];
        
        updateChatMessages(currentChatId, messages => [...messages, userMessage]);

        setIsLoading(true);
        setIsThinking(true);

        let accumulatedText = "";
        let textBuffer = "";
        const bufferInterval = 50; 

        try {
            const stream = sendMessageStream(historyForApi, abortControllerRef.current.signal);
            let firstChunk = true;
            
            const intervalId = setInterval(() => {
                if (textBuffer.length > 0) {
                    accumulatedText += textBuffer;
                    textBuffer = "";
                    updateChatMessages(currentChatId, messages => {
                        const newMessages = [...messages];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.role === MessageRole.MODEL) {
                            lastMessage.text = accumulatedText;
                        }
                        return newMessages;
                    });
                }
            }, bufferInterval);

            for await (const chunk of stream) {
                if (abortControllerRef.current.signal.aborted) break;

                if (firstChunk) {
                    setIsThinking(false);
                    const modelMessage: Message = {
                        role: MessageRole.MODEL,
                        text: chunk.text || '',
                        sources: chunk.sources,
                        citations: chunk.citations
                    };
                    accumulatedText = modelMessage.text;
                    updateChatMessages(currentChatId, messages => [...messages, modelMessage]);
                    firstChunk = false;
                } else {
                    if (chunk.text) {
                       textBuffer += chunk.text;
                    }
                     // Update sources/citations directly as they arrive
                     if (chunk.sources || chunk.citations) {
                        updateChatMessages(currentChatId, messages => {
                            const newMessages = [...messages];
                            const lastMessage = newMessages[newMessages.length - 1];
                            if (lastMessage?.role === MessageRole.MODEL) {
                                lastMessage.sources = chunk.sources || lastMessage.sources;
                                lastMessage.citations = chunk.citations || lastMessage.citations;
                            }
                            return newMessages;
                        });
                    }
                }
            }
            
            clearInterval(intervalId);
            // Final update with any remaining buffer
            if (textBuffer.length > 0) {
                accumulatedText += textBuffer;
                updateChatMessages(currentChatId, messages => {
                    const newMessages = [...messages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === MessageRole.MODEL) {
                        lastMessage.text = accumulatedText;
                    }
                    return newMessages;
                });
            }

            if (isNewChat && !abortControllerRef.current.signal.aborted && accumulatedText) {
                const historyForTitle: Message[] = [
                    userMessage,
                    { role: MessageRole.MODEL, text: accumulatedText }
                ];
                getChatTitle(historyForTitle).then(title => {
                    setChats(prevChats => prevChats.map(chat => 
                        chat.id === currentChatId ? { ...chat, title } : chat
                    ));
                });
            }

        } catch (error) {
             if ((error as Error).name !== 'AbortError') {
                console.error("Failed to get response:", error);
                const errorMessage: Message = {
                    role: MessageRole.MODEL,
                    text: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى."
                };
                updateChatMessages(currentChatId, messages => [...messages, errorMessage]);
            }
        } finally {
            setIsLoading(false);
            setIsThinking(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };
    
    return (
        <div className="flex h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
            <Sidebar
                chats={chats}
                currentChatId={currentChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col relative">
                {isLoading && !isThinking && <ProgressBar />}
                <header className="md:hidden p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h1 className="text-lg font-bold">المساعد القانوني الآلي</h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <ChatWindow 
                        messages={currentChat?.messages || []} 
                        isLoading={isLoading}
                        isThinking={isThinking}
                        onSendMessage={handleSendMessage}
                    />
                     <MessageInput 
                        onSendMessage={handleSendMessage} 
                        isLoading={isLoading} 
                        onStopGeneration={handleStopGeneration}
                    />
                </main>
            </div>
        </div>
    );
};

export default App;