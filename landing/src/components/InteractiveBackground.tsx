import { useEffect, useState } from "react";

export default function InteractiveBackground() {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const update = (event: PointerEvent) => {
      setPosition({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("pointermove", update);
    return () => window.removeEventListener("pointermove", update);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07060c] scanlines"
    >
      {/* 3D scrolling retrowave grid */}
      <div className="absolute inset-0" style={{ perspective: "300px", perspectiveOrigin: "50% 30%" }}>
        <div
          className="absolute inset-0 origin-top"
          style={{
            transform: "rotateX(60deg) translateY(-30%)",
            backgroundImage: `
              linear-gradient(rgba(255, 0, 127, 0.18) 2px, transparent 2px),
              linear-gradient(90deg, rgba(255, 0, 127, 0.18) 2px, transparent 2px)
            `,
            backgroundSize: "60px 60px",
            animation: "grid-scroll 16s linear infinite",
            height: "200%",
            top: "-50%",
          }}
        />
      </div>

      {/* Cyber sun / glowing neon horizon */}
      <div 
        className="absolute left-1/2 top-[35%] h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[80px]"
        style={{
          background: "radial-gradient(circle, rgba(255, 0, 127, 0.6) 0%, rgba(49, 186, 245, 0.2) 50%, transparent 100%)"
        }}
      />
      
      {/* Neon horizon horizontal divider */}
      <div 
        className="absolute left-0 right-0 top-[35%] h-[2px] bg-gradient-to-r from-transparent via-[#31baf5] to-transparent shadow-[0_0_10px_#31baf5]"
        style={{ opacity: 0.6 }}
      />

      {/* Mouse pointer spotlight radial glow */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 220px at ${position.x}% ${position.y}%, rgba(49, 186, 245, 0.12) 0%, transparent 100%)`,
        }}
      />

      {/* Retro CSS animations */}
      <style>{`
        @keyframes grid-scroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 960px;
          }
        }
      `}</style>
    </div>
  );
}
