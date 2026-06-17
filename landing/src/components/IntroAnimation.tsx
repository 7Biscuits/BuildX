import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type IntroAnimationProps = {
  onComplete: () => void;
};

const letters = ["B", "U", "I", "L", "D"];

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [showX, setShowX] = useState(false);
  const [breaking, setBreaking] = useState(false);

  useEffect(() => {
    const xTimer = window.setTimeout(() => setShowX(true), 1700);
    const breakTimer = window.setTimeout(() => setBreaking(true), 2350);
    const doneTimer = window.setTimeout(onComplete, 3300);

    return () => {
      window.clearTimeout(xTimer);
      window.clearTimeout(breakTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#10131a]"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55 }}
      >
        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          animate={{ backgroundPosition: ["0px 0px", "44px 44px"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative flex items-center font-display text-6xl font-bold tracking-normal text-white sm:text-8xl">
          {letters.map((letter, index) => (
            <motion.span
              key={letter}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.25,
                type: "spring",
                stiffness: 260,
                damping: 16,
              }}
            >
              {letter}
            </motion.span>
          ))}
          <AnimatePresence>
            {showX && (
              <motion.span
                className="ml-1 inline-block text-accent"
                initial={{ y: -360, rotate: -18, scale: 1.45 }}
                animate={{ y: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 18,
                  mass: 1.2,
                }}
              >
                X
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {breaking && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 9 }).map((_, index) => (
              <motion.span
                key={index}
                className="absolute left-1/2 top-1/2 h-[2px] origin-left bg-white/70"
                style={{
                  width: `${130 + index * 28}px`,
                  rotate: `${index * 24 - 95}deg`,
                }}
                initial={{ scaleX: 0, x: 0, y: 0 }}
                animate={{
                  scaleX: 1,
                  x: Math.cos(index) * 28,
                  y: Math.sin(index) * 28,
                }}
                transition={{ duration: 0.32, ease: "easeOut" }}
              />
            ))}
            <motion.div
              className="absolute inset-0 bg-background"
              initial={{ clipPath: "circle(0% at 52% 50%)" }}
              animate={{ clipPath: "circle(145% at 52% 50%)" }}
              transition={{ duration: 0.85, ease: [0.19, 1, 0.22, 1] }}
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
