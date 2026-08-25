"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Sparkles } from "lucide-react";
import PlutenNav from "@/components/PlutenNav";
import styles from "./portfolio.module.css";

const highlights = [
  {
    number: "01",
    title: "Built around you",
    description:
      "Your name, work, experience, education, skills and links become the structure of the portfolio.",
  },
  {
    number: "02",
    title: "Designed like a real website",
    description:
      "No generic resume-grid look. The result is a polished personal website designed to feel intentional.",
  },
  {
    number: "03",
    title: "Free to publish",
    description:
      "Create and publish your professional portfolio through Pluten without paying for hosting.",
  },
];

const sections = [
  "Profile",
  "About",
  "Selected work",
  "Experience",
  "Education",
  "Skills",
  "Certifications",
  "Achievements",
  "Social links",
  "Contact",
];

export default function PortfolioServicePage() {
  return (
    <main className={styles.page}>
      <PlutenNav />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroMeta}>
            <span>PLUTEN / SERVICES</span>
            <span className={styles.metaLine} />
            <span>PORTFOLIO BUILDER</span>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                Your work deserves a better first impression.
              </p>

              <h1>
                Build a portfolio
                <br />
                that feels <em>like you.</em>
              </h1>

              <p className={styles.heroDescription}>
                Create a premium professional portfolio from your
                information, publish it on Pluten, and give recruiters,
                clients and collaborators one place to understand what
                you can do.
              </p>

              <div className={styles.heroActions}>
                <Link
                  href="/portfolio"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Start building
                  <ArrowRight size={18} strokeWidth={1.8} />
                </Link>

                <a
                  href="#how-it-works"
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  See how it works
                  <ArrowDown size={17} strokeWidth={1.8} />
                </a>
              </div>

              <div className={styles.heroNote}>
                <Sparkles size={15} strokeWidth={1.8} />
                <span>
                  Free portfolio builder · No hosting setup required
                </span>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.browserFrame}>
                <div className={styles.browserTop}>
                  <div className={styles.browserDots}>
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className={styles.browserAddress}>
                    pluten.site/p/yourname
                  </div>

                  <div className={styles.browserGhost} />
                </div>

                <div className={styles.browserContent}>
                  <div className={styles.portfolioHeader}>
                    <div>
                      <div className={styles.miniLabel}>
                        PORTFOLIO / 001
                      </div>

                      <div className={styles.mockName}>
                        Your Name<span>.</span>
                      </div>

                      <div className={styles.mockRole}>
                        Full Stack Developer
                      </div>

                      <p className={styles.mockIntro}>
                        Building useful digital products with thoughtful
                        technology and clean execution.
                      </p>
                    </div>

                    <div className={styles.mockStatus}>
                      AVAILABLE
                    </div>
                  </div>

                  <div className={styles.mockDivider} />

                  <div className={styles.mockStats}>
                    <div>
                      <strong>06</strong>
                      <span>PROJECTS</span>
                    </div>

                    <div>
                      <strong>04</strong>
                      <span>YEARS</span>
                    </div>

                    <div>
                      <strong>12</strong>
                      <span>SKILLS</span>
                    </div>
                  </div>

                  <div className={styles.mockWork}>
                    <div className={styles.mockSectionLabel}>
                      SELECTED WORK
                    </div>

                    <div className={styles.mockProject}>
                      <div>
                        <small>01</small>
                        <strong>Featured project</strong>
                      </div>

                      <ArrowRight
                        size={19}
                        strokeWidth={1.6}
                      />
                    </div>

                    <div className={styles.mockProject}>
                      <div>
                        <small>02</small>
                        <strong>Another project</strong>
                      </div>

                      <ArrowRight
                        size={19}
                        strokeWidth={1.6}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.visualTag}>
                <span>01</span>
                <span>PUBLIC PORTFOLIO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className={styles.introduction}
      >
        <div className={styles.sectionShell}>
          <div className={styles.sectionLabel}>
            <span>01 / THE IDEA</span>
          </div>

          <div className={styles.introductionContent}>
            <h2>
              More than a resume.
              <br />
              A <em>professional presence.</em>
            </h2>

            <p>
              A resume tells someone what you have done. A portfolio gives
              them the context: what you build, how you think, where you
              have worked, what you know and how they can reach you.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.highlights}>
        <div className={styles.sectionShell}>
          <div className={styles.highlightGrid}>
            {highlights.map((item) => (
              <article
                key={item.number}
                className={styles.highlightCard}
              >
                <span className={styles.cardNumber}>
                  {item.number}
                </span>

                <div className={styles.cardContent}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <ArrowRight
                  className={styles.cardArrow}
                  size={20}
                  strokeWidth={1.5}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionShell}>
          <div className={styles.processHeader}>
            <div className={styles.sectionLabel}>
              <span>02 / HOW IT WORKS</span>
            </div>

            <div>
              <h2>
                Tell us about
                <br />
                <em>your work.</em>
              </h2>

              <p>
                The builder turns your information into a structured,
                responsive portfolio. You control the content. Pluten
                handles the presentation.
              </p>
            </div>
          </div>

          <div className={styles.processSteps}>
            <article className={styles.processStep}>
              <div className={styles.stepTop}>
                <span>01</span>
                <span>PROFILE</span>
              </div>

              <h3>Start with yourself.</h3>

              <p>
                Name, professional title, short introduction, location,
                availability and the links people need to know.
              </p>
            </article>

            <article className={styles.processStep}>
              <div className={styles.stepTop}>
                <span>02</span>
                <span>YOUR STORY</span>
              </div>

              <h3>Add the proof.</h3>

              <p>
                Projects, experience, education, skills, certifications
                and achievements give your portfolio substance.
              </p>
            </article>

            <article className={styles.processStep}>
              <div className={styles.stepTop}>
                <span>03</span>
                <span>PUBLISH</span>
              </div>

              <h3>Make it public.</h3>

              <p>
                Publish once you're ready and share your dedicated Pluten
                portfolio URL anywhere you apply, network or collaborate.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.information}>
        <div className={styles.sectionShell}>
          <div className={styles.informationGrid}>
            <div className={styles.sectionLabel}>
              <span>03 / YOUR PORTFOLIO</span>
            </div>

            <div>
              <h2>
                Everything important.
                <br />
                Nothing unnecessary.
              </h2>

              <p className={styles.informationLead}>
                Your portfolio adapts to the information you actually
                provide. Empty sections don't leave giant holes in the
                design, and every section has a reason to exist.
              </p>

              <div className={styles.sectionList}>
                {sections.map((section, index) => (
                  <div
                    className={styles.sectionListItem}
                    key={section}
                  >
                    <span className={styles.sectionListNumber}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>{section}</span>

                    <Check
                      size={17}
                      strokeWidth={1.7}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaShell}>
          <div className={styles.sectionLabel}>
            <span>04 / START</span>
          </div>

          <div className={styles.ctaContent}>
            <h2>
              Your next opportunity
              <br />
              should find <em>the real you.</em>
            </h2>

            <p>
              Build the portfolio. Add your work. Publish your story.
            </p>

            <Link
              href="/portfolio"
              className={`${styles.button} ${styles.buttonLight}`}
            >
              Create my portfolio
              <ArrowRight size={18} strokeWidth={1.8} />
            </Link>
          </div>

          <div className={styles.ctaFooter}>
            <span>PLUTEN / PORTFOLIO BUILDER</span>
            <span>BUILT FOR PEOPLE WHO BUILD.</span>
          </div>
        </div>
      </section>
    </main>
  );
}