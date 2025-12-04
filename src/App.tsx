import { useState } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { TimelineGraph } from './components/TimelineGraph';
import { DefectFeed } from './components/DefectFeed';
import { analyzeWithOllama, OllamaResponse } from './utils/ollama';
import { Upload, Play, Activity, Sparkles, Zap, Clock, Copy, Eye, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { VoiceDirector } from './components/VoiceDirector';

const VideoAppContent = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState<'landing' | 'studio' | 'voice-director'>('landing');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);

    // Player State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Analysis State
    const [frames, setFrames] = useState<{ time: number; src: string }[]>([]);
    const [prompt, setPrompt] = useState('');
    const [analysisResults, setAnalysisResults] = useState<Record<number, OllamaResponse>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Derived State for Current Frame
    const currentAnalysis = analysisResults[Math.round(currentTime)] || analysisResults[Object.keys(analysisResults).reduce((prev, curr) => Math.abs(Number(curr) - currentTime) < Math.abs(Number(prev) - currentTime) ? Number(curr) : Number(prev), 0)];

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith('video/')) {
            alert('Please upload a valid video file.');
            return;
        }

        setVideoFile(file);
        setVideoSrc(URL.createObjectURL(file));
        setFrames([]);
        setAnalysisResults({});

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(true);
        });

        const vidDuration = video.duration;
        setDuration(vidDuration);

        const interval = 2; // Extract every 2 seconds
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const extractedFrames: { time: number; src: string }[] = [];

        if (!ctx) return;

        canvas.width = 480;
        canvas.height = 270;

        for (let time = 0; time < vidDuration; time += interval) {
            video.currentTime = time;
            await new Promise((resolve) => {
                video.onseeked = () => resolve(true);
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            extractedFrames.push({
                time: Math.round(time),
                src: canvas.toDataURL('image/jpeg', 0.7)
            });
            setFrames([...extractedFrames]);
        }
    };

    const startAnalysis = async () => {
        if (!prompt.trim()) {
            alert("Please enter the original prompt.");
            return;
        }

        setIsAnalyzing(true);
        const results: Record<number, OllamaResponse> = {};

        for (const frame of frames) {
            try {
                const result = await analyzeWithOllama(prompt, frame.src);
                results[frame.time] = result;
                setAnalysisResults({ ...results });
            } catch (e) {
                console.error("Frame analysis failed:", e);
            }
        }
        setIsAnalyzing(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    // Prepare data for TimelineGraph
    const graphData = frames.map(f => ({
        time: f.time,
        score: analysisResults[f.time]?.score || 0
    }));

    // Prepare data for DefectFeed
    const defectData = Object.entries(analysisResults).map(([time, result]) => ({
        time: Number(time),
        score: result.score,
        description: result.analysis,
        defects: result.defects || []
    })).sort((a, b) => a.time - b.time);

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
            {view === 'landing' ? (
                <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#09090b] to-[#09090b] -z-10" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                    {/* User Profile Badge */}
                    <div className="absolute top-6 right-6 flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-xs text-muted">{user.email}</div>
                        </div>
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-white/10" />
                        <button onClick={logout} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-center z-10 space-y-8 p-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            v2.0 Professional Studio
                        </div>

                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                            Video Hallucination<br />Studio
                        </h1>

                        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                            The industry standard for AI video verification. Detect hallucinations, enforce brand guidelines, and ensure technical compliance frame-by-frame.
                        </p>

                        <button
                            onClick={() => setView('studio')}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:scale-105 transition-transform duration-200"
                        >
                            Launch Studio
                            <Play className="w-5 h-5 fill-current" />
                            <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/30 transition-all" />
                        </button>

                        <button
                            onClick={() => setView('voice-director')}
                            className="block mx-auto text-muted hover:text-white transition-colors flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Talk to AI Director
                        </button>
                    </div>
                </div>
            ) : view === 'voice-director' ? (
                <VoiceDirector
                    onBack={() => setView('landing')}
                    onPromptGenerated={(newPrompt) => {
                        setPrompt(newPrompt);
                        setView('studio');
                    }}
                />
            ) : (
                <div className="h-screen flex flex-col">
                    {/* Header */}
                    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">VHS Pro</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                                <span className="text-sm text-white hidden md:block">{user.name}</span>
                            </div>
                            <button onClick={logout} className="text-sm text-muted hover:text-white transition-colors flex items-center gap-2">
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                            <button onClick={() => setView('landing')} className="text-sm text-muted hover:text-white transition-colors">
                                Exit Studio
                            </button>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar (Navigation/Stats) */}
                        <aside className="w-80 border-r border-white/5 bg-surface/30 p-4 hidden md:flex flex-col gap-6 overflow-y-auto">
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Project</div>
                                <div className="p-2 rounded bg-white/5 border border-white/5 text-sm truncate">
                                    {videoFile ? videoFile.name : 'No Project Loaded'}
                                </div>
                            </div>

                            {videoFile && (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/5 border border-primary/20">
                                        <div className="text-sm text-primary mb-1">Avg. Hallucination</div>
                                        <div className="text-3xl font-bold text-white">
                                            {Object.keys(analysisResults).length > 0
                                                ? Math.round(Object.values(analysisResults).reduce((a, b) => a + b.score, 0) / Object.values(analysisResults).length)
                                                : 0}%
                                        </div>
                                    </div>

                                    {/* Advanced Metrics Dashboard */}
                                    {currentAnalysis && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-medium text-muted uppercase tracking-wider">Current Frame Metrics</h4>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Consistency</span>
                                                    <span className="font-mono">{currentAnalysis.metrics.temporalConsistency}/10</span>
                                                </div>
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${currentAnalysis.metrics.temporalConsistency * 10}%` }} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Physics</span>
                                                    <span className="font-mono">{currentAnalysis.metrics.physicsCompliance}/10</span>
                                                </div>
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-500" style={{ width: `${currentAnalysis.metrics.physicsCompliance * 10}%` }} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Integrity</span>
                                                    <span className="font-mono">{currentAnalysis.metrics.subjectIntegrity}/10</span>
                                                </div>
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-500" style={{ width: `${currentAnalysis.metrics.subjectIntegrity * 10}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted">Original Prompt</label>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Describe the video..."
                                            className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                        />
                                        <button
                                            onClick={startAnalysis}
                                            disabled={isAnalyzing || !frames.length}
                                            className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${isAnalyzing
                                                ? 'bg-white/5 text-muted cursor-not-allowed'
                                                : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                                                }`}
                                        >
                                            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                                        </button>
                                    </div>

                                    {/* Refined Prompt Section */}
                                    {currentAnalysis?.refinedPrompt && (
                                        <div className="space-y-2 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-medium text-primary flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Refined Prompt
                                                </label>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(currentAnalysis.refinedPrompt)}
                                                    className="text-xs text-muted hover:text-white flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" /> Copy
                                                </button>
                                            </div>
                                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-xs text-gray-300 italic">
                                                "{currentAnalysis.refinedPrompt}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </aside>

                        {/* Center Stage */}
                        <main className="flex-1 flex flex-col min-w-0 bg-black/50 relative">
                            {!videoFile ? (
                                <div
                                    className="absolute inset-0 flex items-center justify-center p-8"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDrop}
                                >
                                    <div
                                        onClick={() => document.getElementById('file-input')?.click()}
                                        className="w-full max-w-2xl h-96 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8 text-muted group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-medium text-white mb-1">Upload Video</h3>
                                            <p className="text-muted">Drag & drop or click to browse</p>
                                        </div>
                                        <input
                                            type="file"
                                            id="file-input"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
                                    {/* Video Player Area */}
                                    <div className="flex-1 min-h-0 relative">
                                        <VideoPlayer
                                            src={videoSrc}
                                            currentTime={currentTime}
                                            onTimeUpdate={setCurrentTime}
                                            onDurationChange={setDuration}
                                            isPlaying={isPlaying}
                                            onPlayPause={() => setIsPlaying(!isPlaying)}
                                        />

                                        {/* Explainability Overlay */}
                                        {currentAnalysis && (
                                            <div className="absolute top-4 right-4 max-w-xs bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4">
                                                <div className="flex items-center gap-2 mb-2 text-primary">
                                                    <Eye className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Analysis Insight</span>
                                                </div>
                                                <p className="text-sm text-white/90 leading-relaxed">
                                                    {currentAnalysis.analysis}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Timeline */}
                                    <div className="h-48 flex-shrink-0">
                                        <TimelineGraph
                                            data={graphData}
                                            duration={duration}
                                            currentTime={currentTime}
                                            onSeek={(t) => {
                                                setCurrentTime(t);
                                                setIsPlaying(false);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </main>

                        {/* Right Sidebar (Defect Feed) */}
                        {videoFile && (
                            <aside className="w-80 border-l border-white/5 bg-surface/30 p-4 hidden lg:block">
                                <DefectFeed
                                    defects={defectData}
                                    onJumpTo={(t) => {
                                        setCurrentTime(t);
                                        setIsPlaying(false);
                                    }}
                                />
                            </aside>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const VideoApp = () => {
    return (
        <AuthProvider>
            <VideoAppContent />
        </AuthProvider>
    );
};

export default VideoApp;
