import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, ArrowLeft, Sparkles, Film, User, Bot } from 'lucide-react';
import { chatWithDirector, ChatMessage } from '../utils/ollama';

interface VoiceDirectorProps {
    onBack: () => void;
    onPromptGenerated: (prompt: string) => void;
}

export const VoiceDirector = ({ onBack, onPromptGenerated }: VoiceDirectorProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Speech Recognition Setup
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initial Greeting
        setMessages([{
            role: 'assistant',
            content: "Hello! I'm your AI Director. Tell me about the video you want to create. What's the main subject?"
        }]);

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const newUserMsg: ChatMessage = { role: 'user', content: text };
        const newHistory = [...messages, newUserMsg];
        setMessages(newHistory);
        setTranscript('');
        setIsProcessing(true);

        try {
            const response = await chatWithDirector(newHistory);

            // Check if it's a final prompt (heuristic: long and descriptive, or user said 'done')
            // For now, we rely on the user explicitly clicking a "Use this Prompt" button if they like it,
            // or we can detect if the AI returns a pure prompt.
            // The system prompt tells AI to output ONLY the prompt when done.

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUsePrompt = (text: string) => {
        onPromptGenerated(text);
    };

    return (
        <div className="h-screen flex flex-col bg-black text-white font-sans">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-muted hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Studio</span>
                </button>
                <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-primary" />
                    <span className="font-bold tracking-wide">AI Director Mode</span>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-primary/20'
                            }`}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />}
                        </div>

                        <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-white text-black rounded-tr-none'
                                    : 'bg-surface border border-white/10 rounded-tl-none'
                                }`}>
                                <p className="leading-relaxed">{msg.content}</p>
                            </div>

                            {msg.role === 'assistant' && idx > 0 && (
                                <button
                                    onClick={() => handleUsePrompt(msg.content)}
                                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors px-2"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Use this as Prompt
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-4 max-w-3xl mx-auto">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="bg-surface border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-surface/50 backdrop-blur-md border-t border-white/10">
                <div className="max-w-3xl mx-auto flex items-end gap-4">
                    <button
                        onClick={toggleListening}
                        className={`p-4 rounded-full transition-all ${isListening
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <div className="flex-1 bg-black/50 border border-white/10 rounded-2xl p-2 flex items-end gap-2 focus-within:border-primary/50 transition-colors">
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(transcript);
                                }
                            }}
                            placeholder={isListening ? "Listening..." : "Type or speak your idea..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white resize-none max-h-32 p-3"
                            rows={1}
                        />
                        <button
                            onClick={() => handleSendMessage(transcript)}
                            disabled={!transcript.trim() || isProcessing}
                            className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs text-muted mt-4">
                    Tip: Say "Done" when you're satisfied with the details.
                </p>
            </div>
        </div>
    );
};
