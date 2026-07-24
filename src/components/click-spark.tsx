"use client";

import { useEffect, useRef } from "react";

type SparkBurst = {
  x: number;
  y: number;
  startedAt: number;
  rotation: number;
};

const SPARK_COUNT = 8;
const SPARK_DURATION = 420;

export function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const bursts: SparkBurst[] = [];
    let animationFrame: number | null = null;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const clearCanvas = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    const draw = (now: number) => {
      clearCanvas();

      for (let burstIndex = bursts.length - 1; burstIndex >= 0; burstIndex -= 1) {
        const burst = bursts[burstIndex];
        const progress = Math.min((now - burst.startedAt) / SPARK_DURATION, 1);

        if (progress >= 1) {
          bursts.splice(burstIndex, 1);
          continue;
        }

        const travel = 5 + 24 * (1 - (1 - progress) ** 3);
        const sparkLength = 9 * (1 - progress) + 2;
        const opacity = Math.sin(Math.PI * progress);

        context.save();
        context.globalCompositeOperation = "lighter";
        context.lineCap = "round";
        context.lineWidth = 1.4;
        context.shadowColor = "#c59a5a";
        context.shadowBlur = 6;

        for (let sparkIndex = 0; sparkIndex < SPARK_COUNT; sparkIndex += 1) {
          const angle = burst.rotation + (Math.PI * 2 * sparkIndex) / SPARK_COUNT;
          const startX = burst.x + Math.cos(angle) * travel;
          const startY = burst.y + Math.sin(angle) * travel;
          const endX = burst.x + Math.cos(angle) * (travel + sparkLength);
          const endY = burst.y + Math.sin(angle) * (travel + sparkLength);

          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(endX, endY);
          context.strokeStyle = sparkIndex % 2 === 0
            ? `rgba(197, 154, 90, ${opacity})`
            : `rgba(231, 220, 197, ${opacity * 0.78})`;
          context.stroke();
        }

        context.restore();
      }

      if (bursts.length > 0) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = null;
      }
    };

    const stopAnimation = () => {
      bursts.length = 0;
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      clearCanvas();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches || !event.isPrimary || event.button !== 0) return;

      bursts.push({
        x: event.clientX,
        y: event.clientY,
        startedAt: performance.now(),
        rotation: Math.random() * Math.PI,
      });

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) stopAnimation();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      stopAnimation();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handlePointerDown);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} className="click-spark-canvas" aria-hidden="true" />;
}
