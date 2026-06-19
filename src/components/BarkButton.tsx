import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, X, Check, Square, RotateCcw, SkipForward, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioPlayer } from '@/components/AudioPlayer';

interface BarkButtonProps {
  onClick: (audioData?: { data: string; mimeType: string; duration: number }) => void;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const MAX_RECORD_DURATION = 10;

export function BarkButton({ onClick, disabled = false }: BarkButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordWithAudio, setRecordWithAudio] = useState(false);

  const {
    isRecording,
    elapsed,
    audioData,
    audioMimeType,
    audioDuration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio,
  } = useAudioRecorder({ maxDuration: MAX_RECORD_DURATION });

  useEffect(() => {
    if (showRecorder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showRecorder]);

  const handleQuickClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick();
  };

  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setShowRecorder(true);
  };

  const handleStartRecording = async () => {
    setRecordWithAudio(true);
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleConfirmSave = () => {
    if (recordWithAudio && audioData) {
      onClick({
        data: audioData,
        mimeType: audioMimeType || 'audio/webm',
        duration: audioDuration,
      });
    } else {
      onClick();
    }
    closeRecorder();
  };

  const handleSkipAudio = () => {
    onClick();
    closeRecorder();
  };

  const handleReRecord = () => {
    clearAudio();
    setRecordWithAudio(false);
  };

  const closeRecorder = () => {
    cancelRecording();
    clearAudio();
    setShowRecorder(false);
    setRecordWithAudio(false);
  };

  const progressPercent = Math.min((elapsed / MAX_RECORD_DURATION) * 100, 100);

  return (
    <div className="relative">
      <div className="relative">
        <motion.button
          onClick={handleQuickClick}
          onContextMenu={handleLongPressStart}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              const timer = setTimeout(() => handleLongPressStart(e), 500);
              const cancelTimer = () => {
                clearTimeout(timer);
                (e.target as HTMLElement).removeEventListener('touchend', cancelTimer);
                (e.target as HTMLElement).removeEventListener('touchmove', cancelTimer);
              };
              (e.target as HTMLElement).addEventListener('touchend', cancelTimer);
              (e.target as HTMLElement).addEventListener('touchmove', cancelTimer);
            }
          }}
          disabled={disabled}
          className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow hover:shadow-2xl transition-all duration-300 overflow-hidden flex items-center justify-center group select-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                className="absolute w-32 h-32 rounded-full bg-white/30 pointer-events-none"
                style={{
                  left: ripple.x - 64,
                  top: ripple.y - 64,
                }}
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>

          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex flex-col items-center gap-3 text-white">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
            >
              <Volume2 size={48} strokeWidth={2.5} />
            </motion.div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold">听到狗叫</div>
              <div className="text-sm opacity-80">点击记录 · 长按录音</div>
            </div>
          </div>

          <motion.div
            className="absolute -inset-2 border-2 border-amber-300/50 rounded-full"
            animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.button>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
          💡 长按按钮可录制环境声音
        </div>
      </div>

      <AnimatePresence>
        {showRecorder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            onClick={closeRecorder}
          >
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Mic className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-gray-800">记录狗叫</h3>
                    <p className="text-xs text-gray-500">可选择录制环境声音作为证据</p>
                  </div>
                </div>
                <button
                  onClick={closeRecorder}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                {!recordWithAudio && !audioData && (
                  <div className="space-y-3">
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-200 text-center">
                      <motion.div
                        animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                      >
                        <Mic
                          size={48}
                          className={`mx-auto mb-3 ${isRecording ? 'text-red-500' : 'text-amber-500'}`}
                        />
                      </motion.div>
                      <p className="font-medium text-amber-800 mb-1">录制环境声音</p>
                      <p className="text-xs text-amber-600 mb-4">
                        最长 {MAX_RECORD_DURATION} 秒，录制狗叫现场声音
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartRecording}
                        disabled={isRecording}
                        className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                      >
                        <Mic size={18} />
                        开始录音
                      </motion.button>
                    </div>

                    <button
                      onClick={handleSkipAudio}
                      className="w-full py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <SkipForward size={18} />
                      仅记录，不录音
                    </button>
                  </div>
                )}

                {isRecording && (
                  <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200">
                    <div className="text-center mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-flex"
                      >
                        <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-200">
                          <Mic size={40} className="text-white" />
                        </div>
                      </motion.div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-red-600 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          正在录音
                        </span>
                        <span className="font-mono font-bold text-red-700">
                          {elapsed}s / {MAX_RECORD_DURATION}s
                        </span>
                      </div>
                      <div className="h-3 bg-white rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStopRecording}
                        className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Square size={18} fill="currentColor" />
                        停止录音
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          cancelRecording();
                          setRecordWithAudio(false);
                        }}
                        className="py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        取消
                      </motion.button>
                    </div>
                  </div>
                )}

                {audioData && !isRecording && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">录音完成</p>
                        <p className="text-xs text-green-600">
                          时长 {audioDuration} 秒，可预览后保存
                        </p>
                      </div>
                    </div>

                    <AudioPlayer
                      audioData={audioData}
                      audioMimeType={audioMimeType || undefined}
                      duration={audioDuration}
                    />

                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReRecord}
                        className="py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={18} />
                        重新录制
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleConfirmSave}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        保存记录
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
