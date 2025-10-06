import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-cyber-darker flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Neon Circuit Spinner */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 border-4 border-neon-cyan rounded-full animate-spin-slow box-glow-cyan opacity-50" />
          <div className="absolute inset-4 border-4 border-neon-purple rounded-full animate-spin-slow box-glow-purple" style={{ animationDirection: "reverse" }} />
          <div className="absolute inset-8 border-4 border-neon-green rounded-full animate-spin-slow box-glow-green" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold text-neon-cyan text-glow-cyan">
              {progress}%
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-neon-cyan text-glow-cyan">
            {progress < 50 ? "PREPARING BIRTHDAY..." : progress < 100 ? "LOADING CELEBRATION..." : "🎂 READY! 🎉"}
          </h2>
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse box-glow-cyan" />
            <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse box-glow-purple" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse box-glow-green" style={{ animationDelay: "0.4s" }} />
          </div>
          {progress === 100 && (
            <p className="text-lg text-neon-purple text-glow-purple animate-pulse">
              Get ready for something special...
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-cyber-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-green transition-all duration-300 box-glow-cyan"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
