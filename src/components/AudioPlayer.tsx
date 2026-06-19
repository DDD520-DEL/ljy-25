import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, X, Download } from 'lucide-react';

interface AudioPlayerProps {
  audioData: string;
  audioMimeType?: string;
  duration?: number;
  onClose?: () => void;
  compact?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getAudioExtension(mimeType?: string): string {
  if (!mimeType) return 'webm';
  if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

export function AudioPlayer({ audioData, audioMimeType, duration, onClose, compact = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
      } else if (duration) {
        setTotalDuration(duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  useEffect(() => {
    return () => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(percent * totalDuration, totalDuration));
  };

  const handleDownload = () => {
    const ext = getAudioExtension(audioMimeType);
    const a = document.createElement('a');
    a.href = audioData;
    a.download = `录音_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <audio ref={audioRef} src={audioData} preload="metadata" />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white hover:bg-amber-600 transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </motion.button>
        <div className="flex-1">
          <div
            className="h-2 bg-amber-100 rounded-full cursor-pointer overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 min-w-[40px] text-right">
          {formatTime(currentTime)}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200"
    >
      <audio ref={audioRef} src={audioData} preload="metadata" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Volume2 className="text-amber-600" size={18} />
          </div>
          <div>
            <div className="font-medium text-amber-800 text-sm">环境录音</div>
            <div className="text-xs text-amber-600">
              {totalDuration > 0 ? `时长 ${formatTime(totalDuration)}` : '点击播放'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
            title="下载录音"
          >
            <Download size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              title="关闭"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex-shrink-0"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
        </motion.button>

        <div className="flex-1">
          <div
            className="h-3 bg-amber-200 rounded-full cursor-pointer overflow-hidden relative group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-amber-700">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
