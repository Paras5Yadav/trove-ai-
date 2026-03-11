import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

export function SplashIntro() {
  const [showSplash, setShowSplash] = useState(false);

  // Handle the splash screen lifecycle
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    
    if (!hasSeenSplash) {
      // Small delay to avoid hydration mismatch warnings
      const initTimer = setTimeout(() => setShowSplash(true), 10);
      
      // The total animation takes about 4.5 seconds now
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 4500);
      
      return () => {
        clearTimeout(initTimer);
        clearTimeout(timer);
      };
    }
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          className="fixed inset-0 w-full h-full bg-charcoal text-white z-[1000] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
        >
          {/* Top Left Tech Text */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute top-6 left-6 md:top-10 md:left-10 text-[8px] md:text-[10px] font-mono tracking-[0.2em] leading-relaxed uppercase text-[#85d7ff]"
          >
            Synchronizing...<br/>
            Trove Protocol v2.0<br/><br/>
            Processing<br/>
            Telemetry Captured<br/>
            Routing to Master Vault
          </motion.div>

          {/* Bottom Right Logo */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex items-center gap-2"
          >
            <ShieldAlert className="w-5 h-5 text-moss" />
            <span className="text-sm md:text-base font-bold tracking-widest uppercase">Trove AI</span>
          </motion.div>

          {/* Center Animation Group */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex items-center justify-center">
            
            {/* Center Dot */}
            <motion.div 
              className="absolute w-1.5 h-1.5 bg-[#85d7ff] rounded-full z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 1, 0.5], 
                opacity: [0, 1, 1, 0] 
              }}
              transition={{ 
                duration: 2.3, 
                times: [0, 0.2, 0.8, 1],
                ease: "easeInOut" 
              }}
            />
            
            {/* Drawing Arc SVG */}
            <motion.svg 
              className="absolute w-32 h-32 z-10" 
              viewBox="0 0 100 100"
              initial={{ rotate: -90, opacity: 1, scale: 1 }}
              animate={{ 
                rotate: 0,
                opacity: [1, 1, 0],
                scale: [1, 1, 0.5]
              }}
              transition={{ 
                duration: 2.3,
                times: [0, 0.8, 1],
                ease: "easeInOut" 
              }}
            >
              <motion.circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="#85d7ff" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.svg>

            {/* Expanding Square Box (Matches the background color of the main site) */}
            <motion.div 
              className="absolute w-12 h-12 bg-cream rounded-xl z-20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 0, 1, 1, 250], 
                opacity: [0, 0, 1, 1, 1] 
              }}
              transition={{ 
                duration: 4, 
                times: [0, 0.55, 0.65, 0.75, 1], 
                ease: "easeInOut" 
              }}
            />

            {/* Central Text overlaying the expansion */}
            <motion.div
              className="absolute z-30 flex flex-col items-center justify-center text-center w-full px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 0, 1, 1, 0], y: [20, 20, 0, 0, -20] }}
              transition={{ 
                duration: 4.2,
                times: [0, 0.65, 0.75, 0.9, 1],
                ease: "easeOut"
              }}
            >
              <p className="text-charcoal/60 uppercase tracking-[0.3em] text-xs md:text-sm mb-4 font-mono font-bold">
                Welcome to Trove
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif text-charcoal tracking-tight leading-[1.1]">
                The Sovereign <br />
                Human Data <br />
                <span className="text-[#85d7ff] italic">Marketplace</span>
              </h1>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
