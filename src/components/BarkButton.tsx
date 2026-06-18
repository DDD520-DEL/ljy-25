import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';

interface BarkButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function BarkButton({ onClick, disabled = false }: BarkButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
    
    onClick();
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow hover:shadow-2xl transition-all duration-300 overflow-hidden flex items-center justify-center group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <AnimatePresence>
          {ripples.map(ripple => (
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
            <div className="text-sm opacity-80">点击记录</div>
          </div>
        </div>

        <motion.div
          className="absolute -inset-2 border-2 border-amber-300/50 rounded-full"
          animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.button>
    </div>
  );
}
