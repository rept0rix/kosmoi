import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Bot, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BoardRoomMessageList({
    messages,
    typingAgent,
    boardAgents,
    isRTL,
    messagesEndRef,
    onBookingRequest,
    className
}) {
    const getAgentById = (id) => boardAgents.find(a => a.id === id);

    return (
        <ScrollArea className="flex-1 p-6">
            <div className={`space-y-6 ${className || 'max-w-4xl mx-auto'}`}>
                {messages.map((msg) => {
                    const isUser = msg.agent_id === 'HUMAN_USER';
                    const agent = getAgentById(msg.agent_id);

                    return (
                        <div key={msg.id} className={`flex gap-5 ${isUser ? 'flex-row-reverse' : ''} group`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white ${isUser ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'}`}>
                                {isUser ? <Users className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                            </div>
                            <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {isUser ? (isRTL ? 'אתה' : 'You') : (agent?.role || msg.agent_id)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {msg.type === 'system_hidden' || (msg.agent_id === 'SYSTEM' && msg.content.includes('[DIRECTIVE]')) ? (
                                    <div className="p-4 rounded-2xl rounded-tl-none bg-purple-50 border border-purple-200 border-dashed text-purple-900 shadow-sm relative overflow-hidden group/thought">
                                        <div className="absolute top-2 right-2 opacity-10 group-hover/thought:opacity-20 transition-opacity">
                                            <BrainCircuit className="w-12 h-12" />
                                        </div>
                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="mt-1 p-1 bg-purple-100 rounded-lg">
                                                <BrainCircuit className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Chain of Thought</span>
                                                <div className="text-sm font-medium italic opacity-90 leading-relaxed font-mono">
                                                    {msg.content.replace('[DIRECTIVE]:', '').trim()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : msg.content.includes('[BOOK_NOW:') ? (
                                    <div className={`p-5 rounded-2xl text-base shadow-sm leading-relaxed ${isUser
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                img: ({ node, ...props }) => (
                                                    <img {...props} className="max-w-full h-auto rounded-lg shadow-md my-2 border border-gray-100" />
                                                ),
                                                code({ node, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return match ? (
                                                        <pre className="p-2 rounded-md bg-gray-800 text-white overflow-x-auto text-xs">
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    ) : (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }
                                            }}
                                        >
                                            {msg.content.replace(/\[BOOK_NOW:(.*?)\|(.*?)\]/g, '')}
                                        </ReactMarkdown>

                                        {/* Render Action Button if pattern found */}
                                        {(() => {
                                            const match = /\[BOOK_NOW:(.*?)\|(.*?)\]/.exec(msg.content);
                                            if (match) {
                                                const [_, serviceName, providerId] = match;
                                                return (
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                        <button
                                                            onClick={() => onBookingRequest({ serviceName, providerId })}
                                                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <span>📅 Book {serviceName}</span>
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                ) : (
                                    <div className={`p-5 rounded-2xl text-base shadow-sm leading-relaxed ${isUser
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : msg.type === 'task_created'
                                            ? 'bg-green-50 border-2 border-green-200 text-green-900 rounded-tl-none'
                                            : msg.type === 'proposal'
                                                ? 'bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-tl-none'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                img: ({ node, ...props }) => (
                                                    <img {...props} className="max-w-full h-auto rounded-lg shadow-md my-2 border border-gray-100" />
                                                ),
                                                code({ node, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return match ? (
                                                        <pre className="p-2 rounded-md bg-gray-800 text-white overflow-x-auto text-xs">
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    ) : (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                {!isUser && agent && (
                                    <div className="mt-1 px-1">
                                        <Badge variant="outline" className="text-[10px] h-5 bg-gray-50/50 border-gray-200 text-gray-500">
                                            {agent.role}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {typingAgent && (
                    <div className="flex gap-5">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-sm font-semibold text-gray-700">
                                    {typingAgent.role || typingAgent.id}
                                </span>
                                <span className="text-xs text-gray-400">Typing...</span>
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
    );
}
