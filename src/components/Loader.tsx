"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_MESSAGES = [
    "Indexing datasets",
    "Calibrating marketplace",
    "Encrypting channels",
    "Mapping data pipelines",
    "Syncing contributor nodes",
];

export default function Loader() {
    const [phase, setPhase] = useState<"loading" | "wiping" | "revealed" | "done">("loading");
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const [cornersVisible, setCornersVisible] = useState(false);
    const [showEyebrow, setShowEyebrow] = useState(false);
    const [showStatus, setShowStatus] = useState(false);
    const [monoColor, setMonoColor] = useState("rgba(204, 88, 51, 0)");
    const [skipLoader, setSkipLoader] = useState(false);
    const frameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Session check — skip loader on repeat visits
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasLoaded = sessionStorage.getItem("kled-loaded");
            if (hasLoaded) {
                setSkipLoader(true);
                setPhase("done");
                // Reveal content immediately
                const header = document.getElementById("site-header");
                const content = document.getElementById("site-content");
                if (header) {
                    header.style.opacity = "1";
                    header.style.transition = "none";
                }
                if (content) {
                    content.style.opacity = "1";
                    content.style.visibility = "visible";
                    content.style.transition = "none";
                    content.classList.add("revealed");
                }
            }
        }
    }, []);

    // Progress animation loop
    useEffect(() => {
        if (skipLoader || phase !== "loading") return;

        const DURATION = 2800; // ms
        startTimeRef.current = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTimeRef.current;
            const pct = Math.min(elapsed / DURATION, 1);
            // ease-in-out curve
            const eased = pct < 0.5 ? 2 * pct * pct : 1 - Math.pow(-2 * pct + 2, 2) / 2;
            setProgress(Math.round(eased * 100));

            if (pct < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [skipLoader, phase]);

    // Status message cycling
    useEffect(() => {
        if (skipLoader || phase !== "loading") return;
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        }, 600);
        return () => clearInterval(interval);
    }, [skipLoader, phase]);

    // Staged reveals during loading
    useEffect(() => {
        if (skipLoader) return;

        const timers = [
            setTimeout(() => setCornersVisible(true), 200),
            setTimeout(() => setShowEyebrow(true), 400),
            setTimeout(() => setShowStatus(true), 500),
            setTimeout(() => setMonoColor("rgba(204, 88, 51, 0.9)"), 1200),
        ];
        return () => timers.forEach(clearTimeout);
    }, [skipLoader]);

    // Phase transitions
    useEffect(() => {
        if (skipLoader) return;

        const timers = [
            // Begin wipe at 3.5s
            setTimeout(() => setPhase("wiping"), 3500),
            // Reveal content at 4.5s
            setTimeout(() => {
                setPhase("revealed");
                sessionStorage.setItem("kled-loaded", "true");
            }, 4800),
            // Remove loader DOM at 6s
            setTimeout(() => setPhase("done"), 6500),
        ];
        return () => timers.forEach(clearTimeout);
    }, [skipLoader]);

    // Handle wipe phases and content reveal
    const handleWipePhases = useCallback(() => {
        if (phase === "wiping") {
            // wipe-in
            const wipe = document.getElementById("wipe-overlay");
            if (wipe) {
                wipe.classList.add("wipe-in");
            }
        } else if (phase === "revealed") {
            const wipe = document.getElementById("wipe-overlay");
            const header = document.getElementById("site-header");
            const content = document.getElementById("site-content");

            // Set the wipe to slide off
            if (wipe) {
                wipe.classList.remove("wipe-in");
                wipe.classList.add("wipe-out");
            }

            // Reveal header
            if (header) {
                header.style.opacity = "1";
                header.style.transition = "opacity 0.8s ease-out";
            }

            // Reveal content with stagger
            if (content) {
                content.style.opacity = "1";
                content.style.visibility = "visible";
                content.style.transition = "opacity 0.6s ease-out";
                // Small delay then add revealed class for stagger
                setTimeout(() => {
                    content.classList.add("revealed");
                }, 200);
            }
        }
    }, [phase]);

    useEffect(() => {
        handleWipePhases();
    }, [handleWipePhases]);

    if (skipLoader && phase === "done") return null;

    const loaderFading = phase === "wiping" || phase === "revealed" || phase === "done";

    return (
        <>
            {/* Wipe overlay — always present until done */}
            {phase !== "done" && <div id="wipe-overlay" />}

            {/* Loader screen */}
            <AnimatePresence>
                {phase !== "done" && phase !== "revealed" && (
                    <motion.div
                        id="kled-loader"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Corner markers */}
                        <div className={`loader-corner tl ${cornersVisible ? "visible" : ""}`} />
                        <div className={`loader-corner tr ${cornersVisible ? "visible" : ""}`} />
                        <div className={`loader-corner bl ${cornersVisible ? "visible" : ""}`} />
                        <div className={`loader-corner br ${cornersVisible ? "visible" : ""}`} />

                        {/* Eyebrow */}
                        <motion.div
                            className="loader-eyebrow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: showEyebrow && !loaderFading ? 1 : 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            Data Intelligence Platform
                            <br />
                            v1.0 — Kled
                            <br />
                            System Initializing
                        </motion.div>

                        {/* Center — orbit + monogram */}
                        <motion.div
                            className="loader-center"
                            animate={
                                loaderFading
                                    ? { scale: 1.15, opacity: 0 }
                                    : { scale: 1, opacity: 1 }
                            }
                            transition={{ duration: 0.6, ease: "easeIn" }}
                        >
                            <div className="orbit-system">
                                <div className="orbit-ring orbit-ring-1">
                                    <div className="orbit-dot" />
                                </div>
                                <div className="orbit-ring orbit-ring-2">
                                    <div className="orbit-dot" />
                                </div>
                                <div className="orbit-ring orbit-ring-3">
                                    <div className="orbit-dot" />
                                </div>
                            </div>

                            <motion.div
                                className="loader-mono"
                                style={{ color: monoColor }}
                                animate={
                                    loaderFading
                                        ? { opacity: 0, scale: 1.2 }
                                        : { opacity: 1, scale: 1 }
                                }
                                transition={{ duration: 0.5 }}
                            >
                                KLED
                            </motion.div>
                        </motion.div>

                        {/* Status bar */}
                        <motion.div
                            className="loader-status"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: showStatus && !loaderFading ? 1 : 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="status-label">
                                {STATUS_MESSAGES[statusIndex]}
                            </div>
                            <div className="progress-bar-wrap">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="status-percent">{progress}%</div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
