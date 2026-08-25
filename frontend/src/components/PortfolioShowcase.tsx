"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "./PortfolioShowcase.module.css";

type Slide = {
  id: string;
  number: string;
  label: string;
  title: string;
  description: string;
  video: string;
};

const slides: Slide[] = [
  {
    id: "create",
    number: "01",
    label: "CREATE",
    title: "A portfolio,\nbuilt around you.",
    description:
      "Bring your work, experience and identity together in one polished professional presence.",
    video: "/videos/portfolio-01.mp4",
  },
  {
    id: "design",
    number: "02",
    label: "DESIGN",
    title: "Make your work\nthe first impression.",
    description:
      "Present what you do with the clarity and precision your work deserves.",
    video: "/videos/portfolio-02.mp4",
  },
  {
    id: "publish",
    number: "03",
    label: "PUBLISH",
    title: "Build.\nPublish. Share.",
    description:
      "Publish instantly and carry one professional portfolio link everywhere.",
    video: "/videos/portfolio-03.mp4",
  },
];

const AUTO_ADVANCE_MS = 8000;

export default function PortfolioShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoRefs =
    useRef<Array<HTMLVideoElement | null>>([]);

  const current = slides[active];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();

    if (paused) return;

    timerRef.current = setTimeout(() => {
      setActive((index) =>
        index === slides.length - 1
          ? 0
          : index + 1,
      );
    }, AUTO_ADVANCE_MS);
  }, [paused, stopTimer]);

  const goToSlide = useCallback(
    (index: number) => {
      const next =
        (index + slides.length) % slides.length;

      setActive(next);

      videoRefs.current.forEach(
        (video, videoIndex) => {
          if (!video) return;

          if (videoIndex === next) {
            video.currentTime = 0;

            void video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        },
      );
    },
    [],
  );

  const nextSlide = useCallback(() => {
    setActive((index) =>
      index === slides.length - 1
        ? 0
        : index + 1,
    );
  }, []);

  const previousSlide = useCallback(() => {
    setActive((index) =>
      index === 0
        ? slides.length - 1
        : index - 1,
    );
  }, []);

  useEffect(() => {
    startTimer();

    return () => {
      stopTimer();
    };
  }, [
    active,
    paused,
    startTimer,
    stopTimer,
  ]);

  useEffect(() => {
    const activeVideo =
      videoRefs.current[active];

    if (activeVideo) {
      activeVideo.currentTime = 0;

      void activeVideo.play().catch(() => {});
    }
  }, [active]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextSlide();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousSlide();
      }

      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [nextSlide, previousSlide]);

  return (
    <section
      className={styles.section}
      aria-label="Pluten Portfolio Maker"
    >
      {/* ======================================================
          SECTION INTRO
      ====================================================== */}

      <div className={styles.intro}>
        <div className={styles.introMain}>
          <p className={styles.eyebrow}>
            PLUTEN / PORTFOLIO MAKER
          </p>

          <h2 className={styles.introTitle}>
            Your work.
            <br />
            <em>Presented properly.</em>
          </h2>
        </div>

        <p className={styles.introDescription}>
          Create a premium portfolio,
          publish it instantly, and share
          one clean link everywhere.
        </p>
      </div>

      {/* ======================================================
          VIDEO STAGE
      ====================================================== */}

      <div
        className={styles.stage}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className={styles.media}>
          {slides.map((slide, index) => (
            <video
              key={slide.id}
              ref={(element) => {
                videoRefs.current[index] =
                  element;
              }}
              className={`${styles.video} ${
                index === active
                  ? styles.videoActive
                  : ""
              }`}
              src={slide.video}
              muted
              playsInline
              loop
              preload={
                index === active
                  ? "auto"
                  : "metadata"
              }
              aria-hidden={
                index !== active
              }
            />
          ))}

          <div className={styles.mediaShade} />
          <div className={styles.mediaVignette} />
        </div>

        {/* TOP */}
        <div className={styles.stageTop}>
          <span className={styles.stageBrand}>
            PLUTEN
          </span>

          <div className={styles.stageMeta}>
            <span>
              {current.label}
            </span>

            <span className={styles.metaLine} />

            <span>
              {current.number} / 03
            </span>
          </div>
        </div>

        {/* CENTER PLAY */}
        <button
          type="button"
          className={styles.playButton}
          onClick={() =>
            setPaused((value) => !value)
          }
          aria-label={
            paused
              ? "Play showcase"
              : "Pause showcase"
          }
        >
          {paused ? (
            <Play
              size={15}
              fill="currentColor"
              strokeWidth={1.6}
            />
          ) : (
            <Pause
              size={15}
              fill="currentColor"
              strokeWidth={1.6}
            />
          )}
        </button>

        {/* CTA */}
        <div className={styles.stageCta}>
          <Link
            href="/portfolio"
            className={styles.cta}
          >
            <span>
              Create your portfolio
            </span>

            <ArrowRight
              size={16}
              strokeWidth={1.8}
            />
          </Link>
        </div>

        {/* SMALL CONTROLS */}
        <div className={styles.stageControls}>
          <button
            type="button"
            className={styles.arrowButton}
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft
              size={16}
              strokeWidth={1.7}
            />
          </button>

          <div className={styles.progress}>
            {slides.map(
              (slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() =>
                    goToSlide(index)
                  }
                  className={
                    index === active
                      ? styles.progressActive
                      : styles.progressItem
                  }
                  aria-label={`Show ${slide.label}`}
                  aria-current={
                    index === active
                  }
                />
              ),
            )}
          </div>

          <button
            type="button"
            className={styles.arrowButton}
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight
              size={16}
              strokeWidth={1.7}
            />
          </button>
        </div>
      </div>

      {/* ======================================================
          INFORMATION BELOW VIDEO
      ====================================================== */}

      <div
        className={styles.details}
        key={current.id}
      >
        <div>
          <span className={styles.detailLabel}>
            {current.label}
          </span>

          <h3 className={styles.detailTitle}>
            {current.title
              .split("\n")
              .map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
          </h3>
        </div>

        <p className={styles.detailDescription}>
          {current.description}
        </p>
      </div>

      <p className={styles.microCopy}>
        YOUR PROFESSIONAL PRESENCE,
        DESIGNED BY YOU.
      </p>
    </section>
  );
}