import { useEffect, useMemo, useState } from "react";

const targetDate = new Date("2026-08-01T09:00:00+05:30").getTime();

function getRemaining() {
  const diff = Math.max(targetDate - Date.now(), 0);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer() {
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units = useMemo(
    () => [
      ["Days", remaining.days],
      ["Hours", remaining.hours],
      ["Minutes", remaining.minutes],
      ["Seconds", remaining.seconds],
    ],
    [remaining],
  );

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 font-terminal" aria-label="Countdown timer">
      {units.map(([label, value]) => (
        <div 
          key={label} 
          className="relative overflow-hidden rounded border-2 border-secondary/50 bg-[#090812] p-3 text-center shadow-neon-cyan/20"
        >
          {/* Top orange filament glow matching nixie tubes */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary" />
          
          <div className="font-pixel text-4xl font-bold text-secondary text-neon-cyan sm:text-5xl leading-none">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
