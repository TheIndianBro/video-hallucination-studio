import { useRef, useEffect } from 'react';
import { Play, Pause, Maximize } from 'lucide-react';

interface VideoPlayerProps {
    src: string | null;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
    onDurationChange: (duration: number) => void;
    isPlaying: boolean;
    onPlayPause: () => void;
}

export const VideoPlayer = ({ src, currentTime, onTimeUpdate, onDurationChange, isPlaying, onPlayPause }: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
                videoRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime]);

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.play();
            else videoRef.current.pause();
        }
    }, [isPlaying]);

    if (!src) return (
        <div className="w-full h-full bg-surface rounded-xl flex items-center justify-center border border-white/5">
            <div className="text-center text-muted">
                <Maximize className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No video loaded</p>
            </div>
        </div>
    );

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden group border border-white/10 shadow-2xl">
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
                onClick={onPlayPause}
            />

            {/* Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={onPlayPause}
                    className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
                </button>
            </div>
        </div>
    );
};
