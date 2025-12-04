import { CheckCircle, Zap, Clock, Activity, HelpCircle } from 'lucide-react';

interface Defect {
    time: number;
    score: number;
    description: string;
    defects: {
        description: string;
        category: 'physics' | 'consistency' | 'integrity' | 'other';
    }[];
}

interface DefectFeedProps {
    defects: Defect[];
    onJumpTo: (time: number) => void;
}

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'physics': return <Zap className="w-3 h-3" />;
        case 'consistency': return <Clock className="w-3 h-3" />;
        case 'integrity': return <Activity className="w-3 h-3" />;
        default: return <HelpCircle className="w-3 h-3" />;
    }
};

const CategoryColor = (category: string) => {
    switch (category) {
        case 'physics': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'consistency': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'integrity': return 'bg-red-500/10 text-red-400 border-red-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
};

export const DefectFeed = ({ defects, onJumpTo }: DefectFeedProps) => {
    return (
        <div className="h-full bg-surface rounded-xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-medium text-white">Analysis Feed</h3>
                <span className="text-xs text-muted">{defects.length} Issues</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {defects.length === 0 ? (
                    <div className="text-center text-muted py-8">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No defects found yet</p>
                    </div>
                ) : (
                    defects.map((defect, i) => (
                        <div
                            key={i}
                            onClick={() => onJumpTo(defect.time)}
                            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-muted bg-black/50 px-2 py-1 rounded">
                                    {defect.time}s
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${defect.score > 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {defect.score}% Risk
                                </span>
                            </div>

                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                                {defect.description}
                            </p>

                            {defect.defects.length > 0 && (
                                <div className="space-y-1">
                                    {defect.defects.map((d, idx) => (
                                        <div key={idx} className={`text-[10px] px-2 py-1 rounded border flex items-center gap-2 ${CategoryColor(d.category)}`}>
                                            <CategoryIcon category={d.category} />
                                            <span className="uppercase tracking-wider opacity-70">{d.category}</span>
                                            <span className="truncate flex-1">{d.description}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
