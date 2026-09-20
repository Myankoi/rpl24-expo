"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowsPointingOutIcon, ArrowUturnLeftIcon, PlayIcon, SparklesIcon, TrophyIcon } from "@heroicons/react/24/outline";
import type { RankingProject } from "@/lib/types";

type RevealStep = "intro" | "countdown" | "winner" | "complete";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function WinnerReveal({ ranking, eventName }: { ranking: RankingProject[]; eventName: string }) {
  const podium = useMemo(() => ranking.reduce<Array<RankingProject & { rank: number }>>((acc, project, index) => {
    const previous = acc.at(-1);
    const rank = previous?.voteCount === project.voteCount ? previous.rank : index + 1;
    return acc.concat({ ...project, rank });
  }, []).filter((project) => project.rank <= 3), [ranking]);
  const revealOrder = useMemo(() => [...podium].sort((a, b) => b.rank - a.rank), [podium]);
  const [step, setStep] = useState<RevealStep>("intro");
  const [countdown, setCountdown] = useState(3);
  const [current, setCurrent] = useState<RankingProject | null>(null);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    if (step !== "complete") return;
    const end = Date.now() + 3500;
    const colors = ["#5de6ff", "#9f7aea", "#ffd166", "#ff5fa2"];
    const timer = window.setInterval(() => {
      if (Date.now() > end) return window.clearInterval(timer);
      confetti({ particleCount: 10, angle: 60, spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: 10, angle: 120, spread: 65, origin: { x: 1 }, colors });
    }, 180);
    return () => window.clearInterval(timer);
  }, [step]);

  async function start() {
    if (!podium.length) return;
    for (const value of [3, 2, 1]) {
      setStep("countdown");
      setCountdown(value);
      await wait(720);
    }
    for (let index = 0; index < revealOrder.length; index += 1) {
      const project = revealOrder[index];
      const place = project.rank;
      setCurrent(project);
      setRank(place);
      setStep("winner");
      if (place === 1) confetti({ particleCount: 180, spread: 95, origin: { y: 0.68 }, colors: ["#ffd166", "#ffffff", "#5de6ff"] });
      await wait(place === 1 ? 4200 : 3200);
    }
    setStep("complete");
  }

  function restart() {
    setStep("intro");
    setCurrent(null);
  }

  async function fullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }

  return (
    <main className="reveal-stage">
      <div className="reveal-mesh" aria-hidden="true" />
      <button className="stage-fullscreen" type="button" onClick={fullscreen}><ArrowsPointingOutIcon />Fullscreen</button>
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.section key="intro" className="reveal-intro" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <motion.div className="reveal-trophy" animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 3.2 }}><TrophyIcon /></motion.div>
            <span className="eyebrow">{eventName}</span><h1>People&apos;s Choice<br /><span>Winner Reveal</span></h1><p>{ranking.length} proyek · {ranking.reduce((sum, item) => sum + item.voteCount, 0)} suara masuk</p>
            <button className="button stage-start" type="button" onClick={start} disabled={!podium.length}><PlayIcon />{podium.length ? "Mulai pengumuman" : "Belum ada hasil"}</button>
          </motion.section>
        )}
        {step === "countdown" && <motion.div key={`count-${countdown}`} className="stage-countdown" initial={{ opacity: 0, scale: 0.35 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.7 }} transition={{ duration: 0.55 }}>{countdown}</motion.div>}
        {step === "winner" && current && (
          <motion.section key={current.id} className={`winner-card-stage rank-${rank}`} initial={{ opacity: 0, y: 90, rotateX: 16 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -70, scale: 1.08 }} transition={{ type: "spring", damping: 19 }}>
            <motion.div className="rank-medal" initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.35, type: "spring" }}>{rank}</motion.div>
            <span className="winner-label">JUARA {rank}</span>
            <h2>{current.title}</h2><p>{current.teamName} · {current.className}</p>
            <div className="winner-votes"><strong>{current.voteCount}</strong><span>suara</span></div>
            {rank === 1 && <motion.div className="winner-spark"><SparklesIcon /></motion.div>}
          </motion.section>
        )}
        {step === "complete" && (
          <motion.section key="complete" className="podium-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="eyebrow">CONGRATULATIONS</span><h1>Our winners!</h1>
            <div className="stage-podium">
              {[2, 1, 3].flatMap((place) => podium.filter((item) => item.rank === place)).map((item, index) => <motion.div key={item.id} className={`podium-item podium-${item.rank}`} initial={{ y: 160, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.16, type: "spring" }}><span>{item.rank}</span><h2>{item.title}</h2><p>{item.teamName}</p><strong>{item.voteCount} suara</strong></motion.div>)}
            </div>
            <button className="stage-restart" type="button" onClick={restart}><ArrowUturnLeftIcon />Ulangi reveal</button>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
