import { motion } from "framer-motion";

export default function HeroVisualization() {
  return (
    <div className="relative w-full max-w-[1240px] lg:scale-120 xl:scale-140 bg-transparent p-0 flex items-center justify-center">
      {/* GLOW LAYER */}
      <div className="absolute inset-0 bg-blue-500/15 blur-[100px] rounded-full scale-90 opacity-80 pointer-events-none" />
      
      {/* STATIC ASSET */}
      <div className="relative z-10 drop-shadow-[0_25px_50px_rgba(0,0,0,0.08)] overflow-hidden">
        <img
          src="/banner_hero_v6.webp"
          alt="LinkedIn Banner Comparison"
          className="w-full h-auto block"
        />
        
        {/* Subtle glass reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
      </div>
    </div>
  );
}
