import { useCallback, useEffect, useRef, useState } from "react";

import logo from "../../assets/logos/iste-logo.png";

import "./SiteIntro.css";

const INTRO_DURATION = 3600;
const EXIT_DURATION = 850;
const SKIP_DELAY = 650;
const REDUCED_MOTION_DURATION = 700;
const REDUCED_MOTION_EXIT_DURATION = 180;

export default function SiteIntro({ onFinish }) {
  const [isClosing, setIsClosing] = useState(false);
  const canSkipRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const exitTimerRef = useRef(null);
  const prefersReducedMotionRef = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const finish = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }

    hasFinishedRef.current = true;
    setIsClosing(true);

    const exitDuration = prefersReducedMotionRef.current
      ? REDUCED_MOTION_EXIT_DURATION
      : EXIT_DURATION;

    exitTimerRef.current = window.setTimeout(() => {
      onFinish();
    }, exitDuration);
  }, [onFinish]);

  const skip = useCallback(() => {
    if (canSkipRef.current) {
      finish();
    }
  }, [finish]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const introDuration = prefersReducedMotionRef.current
      ? REDUCED_MOTION_DURATION
      : INTRO_DURATION;
    const skipDelay = prefersReducedMotionRef.current ? 0 : SKIP_DELAY;

    const skipTimer = window.setTimeout(() => {
      canSkipRef.current = true;
    }, skipDelay);

    const finishTimer = window.setTimeout(finish, introDuration);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        skip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(skipTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(exitTimerRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [finish, skip]);

  return (
    <div
      className={`site-intro${isClosing ? " site-intro-closing" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Загрузка сайта ISTe"
    >
      <div className="site-intro-grid" aria-hidden="true" />
      <div className="site-intro-noise" aria-hidden="true" />
      <div className="site-intro-vignette" aria-hidden="true" />
      <div className="site-intro-scanline" aria-hidden="true" />

      <span className="site-intro-beam site-intro-beam-one" aria-hidden="true" />
      <span className="site-intro-beam site-intro-beam-two" aria-hidden="true" />

      <div className="site-intro-stage">
        <p className="site-intro-kicker">ISTe ESPORTS SYSTEM</p>

        <div className="site-intro-emblem" aria-hidden="true">
          <span className="site-intro-orbit site-intro-orbit-outer" />
          <span className="site-intro-orbit site-intro-orbit-inner" />
          <span className="site-intro-cross site-intro-cross-horizontal" />
          <span className="site-intro-cross site-intro-cross-vertical" />

          <div className="site-intro-logo-frame">
            <img className="site-intro-logo" src={logo} alt="" />
            <span className="site-intro-logo-flash" />
          </div>
        </div>

        <div className="site-intro-copy">
          <p className="site-intro-title" aria-hidden="true">
            PLAY <span>•</span> COMPETE <span>•</span> WIN
          </p>
          <p className="site-intro-status">INITIALIZING TEAM SYSTEM</p>
        </div>

        <div className="site-intro-progress" aria-hidden="true">
          <span className="site-intro-progress-fill" />
          <span className="site-intro-progress-glow" />
        </div>
      </div>

      <button className="site-intro-skip" type="button" onClick={skip}>
        ПРОПУСТИТЬ
      </button>

      <p className="site-intro-counter" aria-hidden="true">
        ISTE<span>:</span>CORE<span>:</span>01
      </p>
    </div>
  );
}
