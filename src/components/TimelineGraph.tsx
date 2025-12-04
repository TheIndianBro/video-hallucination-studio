import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface TimelineGraphProps {
    data: { time: number; score: number }[];
    duration: number;
    currentTime: number;
    onSeek: (time: number) => void;
}

export const TimelineGraph = ({ data, duration, currentTime, onSeek }: TimelineGraphProps) => {
    return (
        <div className="w-full h-48 bg-surface rounded-xl border border-white/5 p-4 relative">
            <h3 className="text-sm font-medium text-muted mb-4">Hallucination Timeline</h3>

            <div className="w-full h-[calc(100%-2rem)]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        onClick={(e) => e && e.activeLabel && onSeek(Number(e.activeLabel))}
                    >
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="time"
                            type="number"
                            domain={[0, duration]}
                            tickFormatter={(val) => `${Math.round(val)}s`}
                            stroke="#52525b"
                            fontSize={12}
                        />
                        <YAxis
                            hide
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={(value: number) => [`${value}%`, 'Hallucination Score']}
                            labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorScore)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Current Time Indicator */}
            <div
                className="absolute top-12 bottom-8 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none transition-all duration-100 ease-linear"
                style={{ left: `${(currentTime / duration) * 100}%` }}
            />
        </div>
    );
};
