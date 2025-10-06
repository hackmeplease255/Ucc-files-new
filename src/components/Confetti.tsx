import { useEffect, useRef } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

export const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiPieces: ConfettiPiece[] = [];
    const colors = ["#00F0FF", "#B026FF", "#00FF41", "#FF00FF", "#00FFFF"];
    const pieceCount = 100;

    for (let i = 0; i < pieceCount; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -20,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 3,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Stop after 5 seconds
      if (elapsed > 5000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiPieces.forEach((piece) => {
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();

        piece.x += piece.speedX;
        piece.y += piece.speedY;
        piece.rotation += piece.rotationSpeed;
        piece.speedY += 0.1; // Gravity

        if (piece.y > canvas.height) {
          piece.y = -20;
          piece.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
    />
  );
};
