"use client";

import Image from "next/image";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { animate, motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startRotateX: number;
  startRotateY: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
};

export function InteractiveLogoCard() {
  const rotateX = useMotionValue(-3);
  const rotateY = useMotionValue(-5);
  const smoothRotateX = useSpring(rotateX, { stiffness: 180, damping: 24 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 180, damping: 24 });
  const dragState = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotateX: rotateX.get(),
      startRotateY: rotateY.get(),
      lastX: event.clientX,
      lastTime: performance.now(),
      velocityX: 0,
    };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const now = performance.now();
    const elapsed = Math.max(now - drag.lastTime, 1);
    drag.velocityX = (event.clientX - drag.lastX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = now;

    rotateY.set(drag.startRotateY + (event.clientX - drag.startX) * 0.62);
    rotateX.set(Math.max(-28, Math.min(28, drag.startRotateX - (event.clientY - drag.startY) * 0.25)));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragState.current = null;
    setDragging(false);
    animate(rotateY, rotateY.get() + Math.max(-90, Math.min(90, drag.velocityX * 85)), {
      type: "spring",
      stiffness: 85,
      damping: 18,
    });
    animate(rotateX, 0, { type: "spring", stiffness: 150, damping: 22 });
  }

  function resetRotation() {
    animate(rotateX, 0, { type: "spring", stiffness: 170, damping: 22 });
    animate(rotateY, 0, { type: "spring", stiffness: 170, damping: 22 });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      rotateY.set(rotateY.get() + (event.key === "ArrowLeft" ? -20 : 20));
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      rotateX.set(Math.max(-28, Math.min(28, rotateX.get() + (event.key === "ArrowUp" ? 10 : -10))));
    }
    if (event.key === "Home") resetRotation();
  }

  return (
    <div className="hero-card-scene">
      <motion.div
        className={`hero-logo-card ${dragging ? "is-dragging" : ""}`}
        style={{ rotateX: smoothRotateX, rotateY: smoothRotateY }}
        whileHover={{ scale: 1.018 }}
        whileTap={{ scale: 0.99 }}
        tabIndex={0}
        role="img"
        aria-label="Kartu 3D logo RPL. Geser untuk memutar, klik dua kali untuk mengembalikan posisi."
        title="Geser untuk memutar · Klik dua kali untuk reset"
        onDoubleClick={resetRotation}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="hero-card-face hero-card-front">
          <div className="hero-logo-stage">
            <Image src="/rpl-smkn24-logo.png" alt="Logo Rekayasa Perangkat Lunak SMK Negeri 24 Jakarta" width={700} height={700} priority sizes="(max-width: 680px) 76vw, (max-width: 980px) 380px, 425px" draggable={false} />
          </div>
          <div className="hero-logo-card-foot"><span>Software Engineering</span><span>Jakarta, Indonesia</span></div>
        </div>
        <div className="hero-card-face hero-card-back" aria-hidden="true">
          <CodeBracketIcon />
          <span>RPL EXPO 2026</span>
          <strong>CODE.<br />CREATE.<br /><em>INSPIRE.</em></strong>
          <small>SMK NEGERI 24 JAKARTA</small>
        </div>
      </motion.div>
    </div>
  );
}
