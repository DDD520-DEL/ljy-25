import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderOptions {
  maxDuration?: number;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  elapsed: number;
  audioData: string | null;
  audioMimeType: string | null;
  audioDuration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ data: string; mimeType: string; duration: number } | null>;
  cancelRecording: () => void;
  clearAudio: () => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { maxDuration = 10 } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setElapsed(0);
    setAudioData(null);
    setAudioMimeType(null);
    setAudioDuration(0);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('当前浏览器不支持录音功能');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      setAudioMimeType(mediaRecorder.mimeType || mimeType || 'audio/webm');

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(elapsedSec);

        if (elapsedSec >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (err: any) {
      cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('请允许麦克风权限以进行录音');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('未找到可用的麦克风设备');
      } else {
        setError(`录音启动失败：${err.message || '未知错误'}`);
      }
      setIsRecording(false);
    }
  }, [maxDuration, cleanup]);

  const stopRecording = useCallback(async (): Promise<{
    data: string;
    mimeType: string;
    duration: number;
  } | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      cleanup();
      setIsRecording(false);
      return null;
    }

    const finalDuration = elapsed;

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;
      const finalMimeType = recorder.mimeType || audioMimeType || 'audio/webm';

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setAudioData(base64Data);
            setAudioDuration(finalDuration || elapsed || Math.ceil(audioBlob.size / 10000));
            setIsRecording(false);
            setIsPaused(false);
            cleanup();
            resolve({
              data: base64Data,
              mimeType: finalMimeType,
              duration: finalDuration || elapsed || 0,
            });
          };
          reader.onerror = () => {
            setError('音频数据处理失败');
            setIsRecording(false);
            cleanup();
            resolve(null);
          };
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          setError('音频处理出错');
          setIsRecording(false);
          cleanup();
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        setIsRecording(false);
        cleanup();
        resolve(null);
      }
    });
  }, [elapsed, audioMimeType, cleanup]);

  const cancelRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setElapsed(0);
    setError(null);
  }, [cleanup]);

  const clearAudio = useCallback(() => {
    setAudioData(null);
    setAudioMimeType(null);
    setAudioDuration(0);
  }, []);

  return {
    isRecording,
    isPaused,
    elapsed,
    audioData,
    audioMimeType,
    audioDuration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio,
  };
}
