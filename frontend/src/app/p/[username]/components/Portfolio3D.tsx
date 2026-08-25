"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Trophy,
} from "lucide-react";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  Portfolio,
  PortfolioAchievement,
  PortfolioCertification,
  PortfolioEducation,
  PortfolioExperience,
  PortfolioProject,
  PortfolioSkill,
  PortfolioSocialLink,
} from "@/lib/portfolioApi";

import styles from "../portfolio.module.css";

/* =========================================================
   TYPES
========================================================= */

interface Portfolio3DProps {
  portfolio: Portfolio;
}

type SectionId =
  | "about"
  | "work"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "achievements"
  | "connect"
  | "contact";

interface NavigationItem {
  id: SectionId;
  label: string;
  count?: number;
}

/* =========================================================
   SAFE HELPERS
========================================================= */

function clean(value?: string | null) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function countOf(
  value:
    | unknown[]
    | null
    | undefined,
) {
  return Array.isArray(value)
    ? value.length
    : 0;
}

function initials(name: string) {
  const parts = clean(name)
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 1)
      .toUpperCase();
  }

  return (
    parts[0].slice(0, 1) +
    parts[parts.length - 1].slice(0, 1)
  ).toUpperCase();
}

function formatDate(
  value?: string | null,
) {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "numeric",
    },
  );
}
function safeString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}
function formatRange(
  start?: string | null,
  end?: string | null,
  current = false,
) {
  const startText = formatDate(start);

  const endText = current
    ? "Present"
    : formatDate(end);

  if (!startText && !endText) {
    return "";
  }

  if (!startText) {
    return endText;
  }

  if (!endText) {
    return startText;
  }

  return `${startText} — ${endText}`;
}

function externalUrl(
  value?: string | null,
) {
  const raw = clean(value);

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(raw)
        ? raw
        : `https://${raw}`,
    );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function mailto(
  email?: string | null,
) {
  const value = clean(email);

  return value
    ? `mailto:${value}`
    : null;
}

function tel(
  phone?: string | null,
) {
  const value = clean(phone);

  if (!value) {
    return null;
  }

  return `tel:${value.replace(
    /[^\d+]/g,
    "",
  )}`;
}

function labelize(value: string) {
  return clean(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function numberLabel(
  value: number,
) {
  return String(value).padStart(2, "0");
}

/* =========================================================
   MAIN
========================================================= */

export default function Portfolio3D({
  portfolio,
}: Portfolio3DProps) {
  const [activeSection, setActiveSection] =
    useState<SectionId | "top">("top");

  const projectCount = countOf(
    portfolio.projects,
  );

  const experienceCount = countOf(
    portfolio.experiences,
  );

  const educationCount = countOf(
    portfolio.education,
  );

  const skillCount = countOf(
    portfolio.skills,
  );

  const certificationCount = countOf(
    portfolio.certifications,
  );

  const achievementCount = countOf(
    portfolio.achievements,
  );

  const socialCount = countOf(
    portfolio.socialLinks,
  );

  const sections = useMemo<
    NavigationItem[]
  >(
    () => [
      {
        id: "about",
        label: "About",
      },
      ...(projectCount > 0
        ? [
            {
              id: "work" as const,
              label: "Work",
              count: projectCount,
            },
          ]
        : []),
      ...(experienceCount > 0
        ? [
            {
              id: "experience" as const,
              label: "Experience",
              count:
                experienceCount,
            },
          ]
        : []),
      ...(educationCount > 0
        ? [
            {
              id: "education" as const,
              label: "Education",
              count:
                educationCount,
            },
          ]
        : []),
      ...(skillCount > 0
        ? [
            {
              id: "skills" as const,
              label: "Skills",
              count: skillCount,
            },
          ]
        : []),
      ...(certificationCount > 0
        ? [
            {
              id: "certifications" as const,
              label: "Credentials",
              count:
                certificationCount,
            },
          ]
        : []),
      ...(achievementCount > 0
        ? [
            {
              id: "achievements" as const,
              label: "Achievements",
              count:
                achievementCount,
            },
          ]
        : []),
      ...(socialCount > 0
        ? [
            {
              id: "connect" as const,
              label: "Connect",
              count: socialCount,
            },
          ]
        : []),
      ...(portfolio.email ||
      portfolio.phone ||
      portfolio.location
        ? [
            {
              id: "contact" as const,
              label: "Contact",
            },
          ]
        : []),
    ],
    [
      projectCount,
      experienceCount,
      educationCount,
      skillCount,
      certificationCount,
      achievementCount,
      socialCount,
      portfolio.email,
      portfolio.phone,
      portfolio.location,
    ],
  );

  useActiveSection(
    setActiveSection,
    sections,
  );

  const handleNavigate = (
    id: SectionId,
  ) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <main
      className={
        styles.portfolio
      }
    >
      <div
        className={
          styles.ambientLight
        }
      />

      <div
        className={
          styles.texture
        }
      />

      {/* =====================================================
          CONTROL NAV
      ===================================================== */}

      <NavigationDock
        activeSection={
          activeSection
        }
        sections={sections}
        onNavigate={
          handleNavigate
        }
      />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="top"
        className={
          styles.heroSection
        }
      >
        <div
          className={
            styles.heroIntro
          }
        >
          <div
            className={
              styles.heroEyebrow
            }
          >
            <span>
              PLUTEN /{" "}
              {portfolio.username}
            </span>

            <span
              className={
                styles.liveIndicator
              }
            >
              <i />
              LIVE
            </span>
          </div>

          <div
            className={
              styles.heroIndex
            }
          >
            01
          </div>
        </div>

        <TiltCard
          className={
            styles.heroCard
          }
          intensity={7}
          glare
        >
          <div
            className={
              styles.cardThickness
            }
          />

          <div
            className={
              styles.cardFace
            }
          >
            <CardHeader
              left="SELECTED PROFILE"
              right={`${numberLabel(
                projectCount +
                  experienceCount +
                  educationCount +
                  skillCount,
              )} ITEMS`}
            />

            <div
              className={
                styles.heroCardMain
              }
            >
              <div
                className={
                  styles.heroCardCopy
                }
              >
                <PrintText
                  as="span"
                  text={
                    clean(
                      portfolio.professionalTitle,
                    ) ||
                    "Professional portfolio"
                  }
                  className={
                    styles.heroCardKicker
                  }
                />

                <PrintHeading
                  text={
                    portfolio.fullName
                  }
                  className={
                    styles.heroCardName
                  }
                  delay={120}
                />

                <PrintText
                  as="p"
                  text={
                    clean(
                      portfolio.tagline,
                    ) ||
                    "Building thoughtful digital products with modern technology."
                  }
                  className={
                    styles.heroCardDescription
                  }
                  delay={340}
                />

                <div
                  className={
                    styles.heroCardMeta
                  }
                >
                  <MetaCell
                    label="PROFILE"
                    value={
                      portfolio.fullName
                    }
                  />

                  <MetaCell
                    label="FOCUS"
                    value={
                      clean(
                        portfolio.professionalTitle,
                      ) ||
                      "Digital work"
                    }
                  />

                  <MetaCell
                    label="LOCATION"
                    value={
                      clean(
                        portfolio.location,
                      ) ||
                      "—"
                    }
                  />
                </div>
              </div>

              <div
                className={
                  styles.heroMark
                }
              >
                <span>
                  {initials(
                    portfolio.fullName,
                  )}
                </span>
              </div>
            </div>

            <CardFooter
              left={
                clean(
                  portfolio.email,
                ) ||
                "PLUTEN PORTFOLIO"
              }
              right="SCROLL TO EXPLORE"
              icon
            />
          </div>
        </TiltCard>

        <ScrollCue
          target="#about"
        />
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <PortfolioSection
        id="about"
        number="02"
        label="ABOUT"
        title="The person behind the work."
        subtitle="Everything important should live on the surface."
      >
        <TiltCard
          intensity={6}
          className={
            styles.contentCard
          }
          glare
        >
          <div
            className={
              styles.cardThickness
            }
          />

          <div
            className={
              styles.cardFace
            }
          >
            <CardHeader
              left="PROFILE"
              right={
                clean(
                  portfolio.professionalTitle,
                ) ||
                "ABOUT"
              }
            />

            <div
              className={
                styles.aboutCardGrid
              }
            >
              <CardColumn
                label="IDENTITY"
              >
                <PrintHeading
                  text={
                    portfolio.fullName
                  }
                  className={
                    styles.mediumPrint
                  }
                />

                <PrintText
                  as="p"
                  text={
                    clean(
                      portfolio.professionalTitle,
                    ) ||
                    "Professional"
                  }
                  className={
                    styles.subtlePrint
                  }
                  delay={90}
                />
              </CardColumn>

              <CardColumn
                label="BIOGRAPHY"
              >
                <PrintText
                  as="p"
                  text={
                    clean(
                      portfolio.bio,
                    ) ||
                    "—"
                  }
                  className={
                    styles.bodyPrint
                  }
                  delay={150}
                />
              </CardColumn>

              <CardColumn
                label="LOCATION"
              >
                <InfoValue
                  icon={
                    <MapPin
                      size={14}
                    />
                  }
                  value={
                    clean(
                      portfolio.location,
                    ) ||
                    "—"
                  }
                />
              </CardColumn>

              <CardColumn
                label="WEBSITE"
              >
                <InfoValue
                  icon={
                    <Globe
                      size={14}
                    />
                  }
                  value={
                    externalUrl(
                      portfolio.website,
                    )
                      ? "AVAILABLE"
                      : "—"
                  }
                />
              </CardColumn>
            </div>

            <CardFooter
              left="ABOUT / 02"
              right="PLUTEN"
            />
          </div>
        </TiltCard>
      </PortfolioSection>

      {/* =====================================================
          WORK
      ===================================================== */}

      {projectCount > 0 && (
        <PortfolioSection
          id="work"
          number="03"
          label="WORK"
          title="Things I've built."
          subtitle="Projects remain inside vertically stacked physical surfaces."
        >
          <div
            className={
              styles.projectStack
            }
          >
            {portfolio.projects.map(
              (
                project,
                index,
              ) => (
                <ProjectCard
                  key={
                    project.id ??
                    index
                  }
                  project={
                    project
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </PortfolioSection>
      )}

      {/* =====================================================
          EXPERIENCE
      ===================================================== */}

      {experienceCount > 0 && (
        <PortfolioSection
          id="experience"
          number="04"
          label="EXPERIENCE"
          title="Where the work became experience."
          subtitle="Roles, dates, responsibilities and outcomes."
          dark
        >
          <div
            className={
              styles.verticalCards
            }
          >
            {portfolio.experiences.map(
              (
                experience,
                index,
              ) => (
                <ExperienceCard
                  key={
                    experience.id ??
                    index
                  }
                  item={
                    experience
                  }
                  index={
                    index
                  }
                  dark
                />
              ),
            )}
          </div>
        </PortfolioSection>
      )}

      {/* =====================================================
          EDUCATION
      ===================================================== */}

      {educationCount > 0 && (
        <PortfolioSection
          id="education"
          number="05"
          label="EDUCATION"
          title="The foundation."
          subtitle="Academic history, fields and milestones."
        >
          <div
            className={
              styles.verticalCards
            }
          >
            {portfolio.education.map(
              (
                education,
                index,
              ) => (
                <EducationCard
                  key={
                    education.id ??
                    index
                  }
                  item={
                    education
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </PortfolioSection>
      )}

      {/* =====================================================
          SKILLS
      ===================================================== */}

      {skillCount > 0 && (
        <PortfolioSection
          id="skills"
          number="06"
          label="SKILLS"
          title="The tools behind the work."
          subtitle="Every capability is rendered from the user's actual data."
        >
          <SkillsCard
            skills={
              portfolio.skills
            }
          />
        </PortfolioSection>
      )}

      {/* =====================================================
          CERTIFICATIONS
      ===================================================== */}

      {certificationCount >
        0 && (
        <PortfolioSection
          id="certifications"
          number="07"
          label="CREDENTIALS"
          title="Proof of progress."
          subtitle="Certifications and credentials."
        >
          <div
            className={
              styles.verticalCards
            }
          >
            {portfolio.certifications.map(
              (
                certification,
                index,
              ) => (
                <CertificationCard
                  key={
                    certification.id ??
                    index
                  }
                  item={
                    certification
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </PortfolioSection>
      )}

      {/* =====================================================
          ACHIEVEMENTS
      ===================================================== */}

      {achievementCount >
        0 && (
        <PortfolioSection
          id="achievements"
          number="08"
          label="ACHIEVEMENTS"
          title="Milestones worth remembering."
          subtitle="Selected accomplishments and moments."
        >
          <div
            className={
              styles.verticalCards
            }
          >
            {portfolio.achievements.map(
              (
                achievement,
                index,
              ) => (
                <AchievementCard
                  key={
                    achievement.id ??
                    index
                  }
                  item={
                    achievement
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </PortfolioSection>
      )}

      {/* =====================================================
          CONNECT
      ===================================================== */}

      {socialCount > 0 && (
        <PortfolioSection
          id="connect"
          number="09"
          label="CONNECT"
          title="Find me around the web."
          subtitle="Only real, valid links are rendered."
        >
          <div
            className={
              styles.socialCardStack
            }
          >
            {portfolio.socialLinks.map(
              (
                social,
                index,
              ) => (
                <SocialCard
                  key={
                    social.id ??
                    index
                  }
                  item={social}
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </PortfolioSection>
      )}

      {/* =====================================================
          CONTACT
      ===================================================== */}

      {(portfolio.email ||
        portfolio.phone ||
        portfolio.location) && (
        <PortfolioSection
          id="contact"
          number="10"
          label="CONTACT"
          title="Let's build something meaningful."
          subtitle="Real contact methods only."
          dark
        >
          <ContactCard
            portfolio={
              portfolio
            }
          />
        </PortfolioSection>
      )}

      <footer
        className={
          styles.portfolioFooter
        }
      >
        <div
          className={
            styles.footerInner
          }
        >
          <span>
            {
              portfolio.fullName
            }
          </span>

          <span>
            BUILT WITH PLUTEN
          </span>

          <span>
            ©{" "}
            {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   NAVIGATION
========================================================= */

function NavigationDock({
  sections,
  activeSection,
  onNavigate,
}: {
  sections: NavigationItem[];
  activeSection:
    | SectionId
    | "top";
  onNavigate: (
    id: SectionId,
  ) => void;
}) {
  return (
    <div
      className={
        styles.navigationWrap
      }
    >
      <div
        className={
          styles.navigationDock
        }
      >
        <button
          type="button"
          className={
            activeSection === "top"
              ? styles.navButtonActive
              : styles.navButton
          }
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          HOME
        </button>

        {sections.map(
          (section) => (
            <button
              key={section.id}
              type="button"
              className={
                activeSection ===
                section.id
                  ? styles.navButtonActive
                  : styles.navButton
              }
              onClick={() =>
                onNavigate(
                  section.id,
                )
              }
            >
              {section.label
                .toUpperCase()}

              {typeof section.count ===
                "number" && (
                <sup>
                  {section.count}
                </sup>
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function PortfolioSection({
  id,
  number,
  label,
  title,
  subtitle,
  dark = false,
  children,
}: {
  id: SectionId;
  number: string;
  label: string;
  title: string;
  subtitle: string;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={
        dark
          ? styles.sectionDark
          : styles.sectionLight
      }
    >
      <div
        className={
          styles.sectionContainer
        }
      >
        <div
          className={
            styles.sectionIntro
          }
        >
          <span>
            {number} /{" "}
            {label}
          </span>

          <div>
            <PrintHeading
              text={title}
              className={
                dark
                  ? styles.sectionTitleDark
                  : styles.sectionTitle
              }
            />

            <PrintText
              as="p"
              text={subtitle}
              className={
                dark
                  ? styles.sectionSubtitleDark
                  : styles.sectionSubtitle
              }
              delay={120}
            />
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

/* =========================================================
   3D CARD
========================================================= */

function TiltCard({
  children,
  className = "",
  intensity = 8,
  glare = false,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}) {
  const ref =
    useRef<HTMLDivElement | null>(
      null,
    );

  const frame =
    useRef<number | null>(
      null,
    );

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const element =
      ref.current;

    if (!element) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const x =
      (event.clientX -
        rect.left) /
      rect.width;

    const y =
      (event.clientY -
        rect.top) /
      rect.height;

    const rotateY =
      (x - 0.5) *
      intensity;

    const rotateX =
      (0.5 - y) *
      intensity;

    const shadowX =
      (x - 0.5) * -24;

    const shadowY =
      (y - 0.5) * -20;

    const lightX =
      x * 100;

    const lightY =
      y * 100;

    if (
      frame.current !== null
    ) {
      cancelAnimationFrame(
        frame.current,
      );
    }

    frame.current =
      requestAnimationFrame(
        () => {
          element.style.setProperty(
            "--rotate-x",
            `${rotateX.toFixed(
              3,
            )}deg`,
          );

          element.style.setProperty(
            "--rotate-y",
            `${rotateY.toFixed(
              3,
            )}deg`,
          );

          element.style.setProperty(
            "--shadow-x",
            `${shadowX.toFixed(
              2,
            )}px`,
          );

          element.style.setProperty(
            "--shadow-y",
            `${shadowY.toFixed(
              2,
            )}px`,
          );

          element.style.setProperty(
            "--light-x",
            `${lightX.toFixed(
              2,
            )}%`,
          );

          element.style.setProperty(
            "--light-y",
            `${lightY.toFixed(
              2,
            )}%`,
          );
        },
      );
  };

  const reset =
    () => {
      const element =
        ref.current;

      if (!element) {
        return;
      }

      element.style.setProperty(
        "--rotate-x",
        "0deg",
      );

      element.style.setProperty(
        "--rotate-y",
        "0deg",
      );

      element.style.setProperty(
        "--shadow-x",
        "0px",
      );

      element.style.setProperty(
        "--shadow-y",
        "0px",
      );

      element.style.setProperty(
        "--light-x",
        "50%",
      );

      element.style.setProperty(
        "--light-y",
        "30%",
      );
    };

  useEffect(
    () => () => {
      if (
        frame.current !== null
      ) {
        cancelAnimationFrame(
          frame.current,
        );
      }
    },
    [],
  );

  return (
    <div
      ref={ref}
      className={`${
        styles.tiltRoot
      } ${className}`}
      onPointerMove={
        handlePointerMove
      }
      onPointerLeave={reset}
      style={
        {
          "--tilt-intensity": intensity,
        } as CSSProperties
      }
    >
      {glare && (
        <div
          className={
            styles.tiltGlare
          }
        />
      )}

      <div
        className={
          styles.cardAmbientShadow
        }
      />

      {children}
    </div>
  );
}

/* =========================================================
   CARD PIECES
========================================================= */

function CardHeader({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <div
      className={
        styles.cardHeader
      }
    >
      <span>
        {left}
      </span>

      <span>
        {right}
      </span>
    </div>
  );
}

function CardFooter({
  left,
  right,
  icon = false,
}: {
  left: string;
  right: string;
  icon?: boolean;
}) {
  return (
    <div
      className={
        styles.cardFooter
      }
    >
      <span>
        {left}
      </span>

      <span
        className={
          icon
            ? styles.footerAction
            : undefined
        }
      >
        {right}

        {icon && (
          <ArrowDown
            size={14}
          />
        )}
      </span>
    </div>
  );
}

function MetaCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={
        styles.metaCell
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}

function CardColumn({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        styles.cardColumn
      }
    >
      <span
        className={
          styles.cardColumnLabel
        }
      >
        {label}
      </span>

      <div>
        {children}
      </div>
    </div>
  );
}

function InfoValue({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div
      className={
        styles.infoValue
      }
    >
      <span>
        {icon}
      </span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}

/* =========================================================
   PROJECT
========================================================= */

function ProjectCard({
  project,
  index,
}: {
  project: PortfolioProject;
  index: number;
}) {
  const live =
    externalUrl(
      project.liveUrl ??
        project.projectUrl,
    );

  const source =
    externalUrl(
      project.githubUrl,
    );

  return (
    <TiltCard
      intensity={
        index % 2 === 0
          ? 6
          : 5
      }
      glare
      className={
        styles.projectCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left={`PROJECT / ${numberLabel(
            index + 1,
          )}`}
          right={
            project.featured
              ? "FEATURED"
              : "SELECTED"
          }
        />

        <div
          className={
            styles.projectCardGrid
          }
        >
          <div
            className={
              styles.projectIndex
            }
          >
            {numberLabel(
              index + 1,
            )}
          </div>

          <div
            className={
              styles.projectMain
            }
          >
            <PrintText
              as="span"
              text={
                clean(
                  project.role,
                ) ||
                "PROJECT"
              }
              className={
                styles.cardMini
              }
            />

            <PrintHeading
              text={
                project.title
              }
              className={
                styles.projectTitle
              }
              delay={100}
            />

            <PrintText
              as="p"
              text={
                clean(
                  project.description,
                ) ||
                "—"
              }
              className={
                styles.projectDescription
              }
              delay={190}
            />

            {project.technologies
              ?.length > 0 && (
              <div
                className={
                  styles.technologyLine
                }
              >
                {project.technologies.map(
                  (
                    technology,
                    technologyIndex,
                  ) => (
                    <span
                      key={`${technology}-${technologyIndex}`}
                    >
                      {
                        technology
                      }
                    </span>
                  ),
                )}
              </div>
            )}
          </div>

          <div
            className={
              styles.projectSide
            }
          >
            <span>
              LINKS
            </span>

            {live && (
              <a
                href={live}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.cardActionPrimary
                }
              >
                LIVE PROJECT
                <ArrowUpRight
                  size={15}
                />
              </a>
            )}

            {source && (
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.cardActionSecondary
                }
              >
                SOURCE
                <ExternalLink
                  size={14}
                />
              </a>
            )}

            {!live &&
              !source && (
                <span
                  className={
                    styles.emptyValue
                  }
                >
                  NO LINKS
                </span>
              )}
          </div>
        </div>

        <CardFooter
          left={
            formatRange(
              project.startDate,
              project.endDate,
            ) || "—"
          }
          right={
            `${project.technologies?.length ?? 0} TECHNOLOGIES`
          }
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   EXPERIENCE
========================================================= */

function ExperienceCard({
  item,
  index,
  dark = false,
}: {
  item: PortfolioExperience;
  index: number;
  dark?: boolean;
}) {
  const responsibilities =
    (
      item.responsibilities ??
      []
    ).filter(Boolean);

  const achievements =
    (
      item.achievements ??
      []
    ).filter(Boolean);

  return (
    <TiltCard
      intensity={5}
      glare
      className={
        dark
          ? styles.darkContentCard
          : styles.contentCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left={`ROLE / ${numberLabel(
            index + 1,
          )}`}
          right={
            formatRange(
              item.startDate,
              item.endDate,
              item.currentlyWorking ??
                item.current ??
                false,
            ) || "—"
          }
        />

        <div
          className={
            styles.experienceCardGrid
          }
        >
          <div>
            <span
              className={
                styles.cardMini
              }
            >
              {labelize(
                item.employmentType ??
                  item.type ??
                  "EXPERIENCE",
              )}
            </span>

            <PrintHeading
              text={
                item.position
              }
              className={
                styles.mediumTitle
              }
            />

            <PrintText
              as="p"
              text={
                item.company
              }
              className={
                styles.companyText
              }
              delay={100}
            />

            <InfoValue
              icon={
                <MapPin
                  size={14}
                />
              }
              value={
                clean(
                  item.location,
                ) || "—"
              }
            />
          </div>

          <div
            className={
              styles.experienceDetails
            }
          >
            <CardColumn
              label="DESCRIPTION"
            >
              <PrintText
                as="p"
                text={
                  clean(
                    item.description,
                  ) || "—"
                }
                className={
                  styles.bodyPrint
                }
              />
            </CardColumn>

            <CardColumn
              label="RESPONSIBILITIES"
            >
              {responsibilities.length >
              0 ? (
                <BulletList
                  items={
                    responsibilities
                  }
                />
              ) : (
                <EmptyState />
              )}
            </CardColumn>

            <CardColumn
              label="ACHIEVEMENTS"
            >
              {achievements.length >
              0 ? (
                <BulletList
                  items={
                    achievements
                  }
                />
              ) : (
                <EmptyState />
              )}
            </CardColumn>
          </div>
        </div>

        <CardFooter
          left={`EXPERIENCE / ${numberLabel(
            index + 1,
          )}`}
          right={
            item.currentlyWorking ||
            item.current
              ? "CURRENT"
              : "COMPLETED"
          }
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   EDUCATION
========================================================= */

function EducationCard({
  item,
  index,
}: {
  item: PortfolioEducation;
  index: number;
}) {
  const coursework = (
    item.coursework ?? []
  ).filter(Boolean);

  const achievements = (
    item.achievements ?? []
  ).filter(Boolean);

  return (
    <TiltCard
      intensity={5}
      glare
      className={
        styles.contentCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left={`EDUCATION / ${numberLabel(
            index + 1,
          )}`}
          right={
            formatRange(
              item.startDate,
              item.endDate,
              item.currentlyStudying ??
                item.current ??
                false,
            ) || "—"
          }
        />

        <div
          className={
            styles.educationCardGrid
          }
        >
          <div
            className={
              styles.educationPrimary
            }
          >
            <span
              className={
                styles.cardMini
              }
            >
              EDUCATION
            </span>

            <PrintHeading
              text={
                item.degree
              }
              className={
                styles.mediumTitle
              }
            />

            <PrintText
              as="p"
              text={
                clean(
                  item.field ??
                    item.fieldOfStudy,
                ) || "—"
              }
              className={
                styles.companyText
              }
              delay={100}
            />

            <strong
              className={
                styles.institutionPrint
              }
            >
              {
                item.institution
              }
            </strong>

            <InfoValue
              icon={
                <MapPin
                  size={14}
                />
              }
              value={
                clean(
                  item.location,
                ) || "—"
              }
            />
          </div>

          <div
            className={
              styles.educationDetails
            }
          >
            <CardColumn
              label="GRADE"
            >
              <PrintText
                as="p"
                text={
                  clean(
                    item.grade,
                  ) || "—"
                }
                className={
                  styles.bodyPrint
                }
              />
            </CardColumn>

            <CardColumn
              label="COURSEWORK"
            >
              {coursework.length >
              0 ? (
                <PillList
                  values={
                    coursework
                  }
                />
              ) : (
                <EmptyState />
              )}
            </CardColumn>

            <CardColumn
              label="ACHIEVEMENTS"
            >
              {achievements.length >
              0 ? (
                <BulletList
                  items={
                    achievements
                  }
                />
              ) : (
                <EmptyState />
              )}
            </CardColumn>
          </div>
        </div>

        <CardFooter
          left={
            `EDUCATION / ${numberLabel(
              index + 1,
            )}`
          }
          right={
            item.currentlyStudying ||
            item.current
              ? "CURRENT"
              : "COMPLETED"
          }
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   SKILLS
========================================================= */

function SkillsCard({
  skills,
}: {
  skills: PortfolioSkill[];
}) {
  const grouped =
    new Map<
      string,
      PortfolioSkill[]
    >();

  skills.forEach(
    (skill) => {
      const category =
        clean(skill.category) ||
        "Other";

      const current =
        grouped.get(
          category,
        ) ?? [];

      current.push(skill);

      grouped.set(
        category,
        current,
      );
    },
  );

  return (
    <TiltCard
      intensity={5}
      glare
      className={
        styles.contentCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left="SKILLS"
          right={`${numberLabel(
            skills.length,
          )} ITEMS`}
        />

        <div
          className={
            styles.skillsCard
          }
        >
          {Array.from(
            grouped.entries(),
          ).map(
            (
              [category, values],
              categoryIndex,
            ) => (
              <div
                key={
                  category
                }
                className={
                  styles.skillColumn
                }
              >
                <div
                  className={
                    styles.skillColumnHeader
                  }
                >
                  <span>
                    {labelize(
                      category,
                    )}
                  </span>

                  <span>
                    {numberLabel(
                      values.length,
                    )}
                  </span>
                </div>

                {values.map(
                  (
                    skill,
                    skillIndex,
                  ) => {
                    const level =
                      Math.max(
                        0,
                        Math.min(
                          100,
                          Number(
                            skill.level ??
                              0,
                          ),
                        ),
                      );

                    return (
                      <div
                        key={
                          skill.id ??
                          `${skill.name}-${skillIndex}`
                        }
                        className={
                          styles.skillRow
                        }
                        style={
                          {
                            "--skill-delay": `${
                              (
                                categoryIndex *
                                  90 +
                                skillIndex *
                                  55
                              )
                            }ms`,
                            "--skill-level": `${Math.max(
                              level,
                              4,
                            )}%`,
                          } as CSSProperties
                        }
                      >
                        <div
                          className={
                            styles.skillRowTop
                          }
                        >
                          <strong>
                            {
                              skill.name
                            }
                          </strong>

                          <span>
                            {skill.yearsOfExperience ??
                              skill.yearsOfUse ??
                              0}
                            {" "}
                            yrs
                          </span>
                        </div>

                        <div
                          className={
                            styles.skillTrack
                          }
                        >
                          <span />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ),
          )}
        </div>

        <CardFooter
          left="SKILLS / 06"
          right={
            `${skills.length} TOTAL`
          }
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   CERTIFICATION
========================================================= */

function CertificationCard({
  item,
  index,
}: {
  item: PortfolioCertification;
  index: number;
}) {
  const credential =
    externalUrl(
      item.credentialUrl,
    );

  return (
    <TiltCard
      intensity={5}
      glare
      className={
        styles.contentCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left={`CREDENTIAL / ${numberLabel(
            index + 1,
          )}`}
          right={
            formatDate(
              item.issueDate,
            ) || "—"
          }
        />

        <div
          className={
            styles.simpleCardGrid
          }
        >
          <div>
            <span
              className={
                styles.cardMini
              }
            >
              CERTIFICATION
            </span>

            <PrintHeading
              text={
                item.name
              }
              className={
                styles.mediumTitle
              }
            />

            <PrintText
  as="p"
  text={
    safeString(item.issuer) || "—"
  }
  className={
    styles.companyText
  }
/>
          </div>

          <div
            className={
              styles.detailStack
            }
          >
            <InfoPair
              label="ISSUED"
              value={
                formatDate(
                  item.issueDate,
                ) || "—"
              }
            />

            <InfoPair
              label="EXPIRES"
              value={
                formatDate(
                  item.expiryDate,
                ) || "—"
              }
            />

            <InfoPair
              label="CREDENTIAL ID"
              value={
                clean(
                  item.credentialId,
                ) || "—"
              }
            />

            {credential && (
              <a
                href={credential}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.inlineLink
                }
              >
                VERIFY CREDENTIAL
                <ArrowUpRight
                  size={14}
                />
              </a>
            )}
          </div>
        </div>

        <CardFooter
          left={`CREDENTIAL / ${numberLabel(
            index + 1,
          )}`}
          right="VERIFIED DATA"
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   ACHIEVEMENT
========================================================= */

function AchievementCard({
  item,
  index,
}: {
  item: PortfolioAchievement;
  index: number;
}) {
  const url =
    externalUrl(
      item.credentialUrl,
    );

  return (
    <TiltCard
      intensity={5}
      glare
      className={
        styles.contentCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left={`MILESTONE / ${numberLabel(
            index + 1,
          )}`}
          right={
            formatDate(
              item.date,
            ) || "—"
          }
        />

        <div
          className={
            styles.achievementGrid
          }
        >
          <div
            className={
              styles.achievementNumber
            }
          >
            {numberLabel(
              index + 1,
            )}
          </div>

          <div>
            <span
              className={
                styles.cardMini
              }
            >
              ACHIEVEMENT
            </span>

            <PrintHeading
              text={
                item.title
              }
              className={
                styles.mediumTitle
              }
            />

            <PrintText
              as="p"
              text={
                clean(
                  item.description,
                ) || "—"
              }
              className={
                styles.bodyPrint
              }
              delay={120}
            />

            {clean(
              item.organization,
            ) && (
              <MetaCell
                label="ORGANIZATION"
                value={
                  item.organization ??
                  "—"
                }
              />
            )}

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.inlineLink
                }
              >
                OPEN CREDENTIAL
                <ArrowUpRight
                  size={14}
                />
              </a>
            )}
          </div>
        </div>

        <CardFooter
          left={`ACHIEVEMENT / ${numberLabel(
            index + 1,
          )}`}
          right={
            formatDate(
              item.date,
            ) || "—"
          }
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   SOCIAL
========================================================= */

function SocialCard({
  item,
  index,
}: {
  item: PortfolioSocialLink;
  index: number;
}) {
  const url =
    externalUrl(
      item.url,
    );

  if (!url) {
    return null;
  }

  return (
    <TiltCard
      intensity={4}
      className={
        styles.socialCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <div
          className={
            styles.socialCardInner
          }
        >
          <span
            className={
              styles.socialIndex
            }
          >
            {numberLabel(
              index + 1,
            )}
          </span>

          <div>
            <span
              className={
                styles.cardMini
              }
            >
              {labelize(
                item.platform,
              )}
            </span>

            <strong
              className={
                styles.socialTitle
              }
            >
              {clean(
                item.label,
              ) ||
                labelize(
                  item.platform,
                )}
            </strong>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              styles.circleAction
            }
            aria-label={
              clean(
                item.label,
              ) ||
              item.platform
            }
          >
            <ArrowUpRight
              size={17}
            />
          </a>
        </div>
      </div>
    </TiltCard>
  );
}

/* =========================================================
   CONTACT
========================================================= */

function ContactCard({
  portfolio,
}: {
  portfolio: Portfolio;
}) {
  const email =
    mailto(
      portfolio.email,
    );

  const phone =
    tel(
      portfolio.phone,
    );

  const website =
    externalUrl(
      portfolio.website,
    );

  return (
    <TiltCard
      intensity={5}
      glare
      className={
        styles.contactCard
      }
    >
      <div
        className={
          styles.cardThickness
        }
      />

      <div
        className={
          styles.cardFace
        }
      >
        <CardHeader
          left="PLUTEN / CONTACT"
          right="DIRECT"
        />

        <div
          className={
            styles.contactGrid
          }
        >
          <div>
            <PrintHeading
              text="Let's build something meaningful."
              className={
                styles.contactTitle
              }
            />

            <PrintText
              as="p"
              text={
                clean(
                  portfolio.tagline,
                ) ||
                "Have a project, opportunity or idea?"
              }
              className={
                styles.bodyPrint
              }
              delay={180}
            />
          </div>

          <div
            className={
              styles.contactMethods
            }
          >
            {email && (
              <ContactMethod
                icon={
                  <Mail
                    size={15}
                  />
                }
                label="EMAIL"
                value={
                  portfolio.email ??
                  ""
                }
                href={email}
              />
            )}

            {phone && (
              <ContactMethod
                icon={
                  <Phone
                    size={15}
                  />
                }
                label="PHONE"
                value={
                  portfolio.phone ??
                  ""
                }
                href={phone}
              />
            )}

            {portfolio.location && (
              <ContactMethod
                icon={
                  <MapPin
                    size={15}
                  />
                }
                label="LOCATION"
                value={
                  portfolio.location
                }
              />
            )}

            {website && (
              <ContactMethod
                icon={
                  <Globe
                    size={15}
                  />
                }
                label="WEBSITE"
                value="OPEN WEBSITE"
                href={
                  website
                }
                external
              />
            )}
          </div>
        </div>

        <CardFooter
          left="10 / CONTACT"
          right="PLUTEN"
        />
      </div>
    </TiltCard>
  );
}

/* =========================================================
   SMALL UI
========================================================= */

function ContactMethod({
  icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span
        className={
          styles.contactMethodIcon
        }
      >
        {icon}
      </span>

      <span
        className={
          styles.contactMethodCopy
        }
      >
        <small>
          {label}
        </small>

        <strong>
          {value}
        </strong>
      </span>

      {href && (
        <ArrowUpRight
          size={15}
        />
      )}
    </>
  );

  if (!href) {
    return (
      <div
        className={
          styles.contactMethod
        }
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
      className={
        styles.contactMethod
      }
      target={
        external
          ? "_blank"
          : undefined
      }
      rel={
        external
          ? "noopener noreferrer"
          : undefined
      }
    >
      {content}
    </a>
  );
}

function InfoPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={
        styles.infoPair
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}

function BulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <div
      className={
        styles.bulletList
      }
    >
      {items.map(
        (
          item,
          index,
        ) => (
          <span
            key={`${item}-${index}`}
          >
            <i />
            {item}
          </span>
        ),
      )}
    </div>
  );
}

function PillList({
  values,
}: {
  values: string[];
}) {
  return (
    <div
      className={
        styles.pillList
      }
    >
      {values.map(
        (
          value,
          index,
        ) => (
          <span
            key={`${value}-${index}`}
          >
            {value}
          </span>
        ),
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <span
      className={
        styles.emptyValue
      }
    >
      00 / NONE PROVIDED
    </span>
  );
}

function ScrollCue({
  target,
}: {
  target: string;
}) {
  return (
    <a
      href={target}
      className={
        styles.scrollCue
      }
    >
      <span>
        SCROLL TO EXPLORE
      </span>

      <ArrowDown
        size={15}
      />
    </a>
  );
}

/* =========================================================
   PRINT / TYPE REVEAL
========================================================= */

function PrintHeading({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <PrintText
      as="h2"
      text={text}
      className={className}
      delay={delay}
      heading
    />
  );
}

function PrintText({
  as,
  text,
  className,
  delay = 0,
  heading = false,
}: {
  as:
    | "span"
    | "p"
    | "h2";
  text: string;
  className?: string;
  delay?: number;
  heading?: boolean;
}) {
  const Tag =
    as;

  const ref =
    useRef<HTMLElement | null>(
      null,
    );

  useEffect(() => {
    const element =
      ref.current;

    if (!element) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      element.dataset.printed =
        "true";

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (
            entries.some(
              (entry) =>
                entry.isIntersecting,
            )
          ) {
            element.dataset.printed =
              "true";

            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
        },
      );

    observer.observe(
      element,
    );

    return () =>
      observer.disconnect();
  }, []);

  return (
    <Tag
      ref={
        ref as never
      }
      className={`${
        styles.printText
      } ${className ?? ""} ${
        heading
          ? styles.printHeading
          : ""
      }`}
      style={
        {
          "--print-delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      {text
        .split("")
        .map(
          (
            character,
            index,
          ) => (
            <span
              key={`${character}-${index}`}
              className={
                styles.printCharacter
              }
            >
              {character ===
              " "
                ? "\u00a0"
                : character}
            </span>
          ),
        )}
    </Tag>
  );
}

/* =========================================================
   ACTIVE SECTION OBSERVER
========================================================= */

function useActiveSection(
  setActiveSection: (
    value:
      | SectionId
      | "top",
  ) => void,
  sections: NavigationItem[],
) {
  useEffect(() => {
    const ids = [
      "top",
      ...sections.map(
        (section) =>
          section.id,
      ),
    ];

    const elements =
      ids
        .map((id) =>
          document.getElementById(
            id,
          ),
        )
        .filter(
          (
            element,
          ): element is HTMLElement =>
            Boolean(element),
        );

    if (!elements.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (
                  a,
                  b,
                ) =>
                  b.intersectionRatio -
                  a.intersectionRatio,
              );

          if (!visible.length) {
            return;
          }

          const id =
            visible[0].target.id;

          if (
            id ===
            "top"
          ) {
            setActiveSection(
              "top",
            );
            return;
          }

          setActiveSection(
            id as SectionId,
          );
        },
        {
          rootMargin:
            "-15% 0px -55% 0px",
          threshold: [
            0,
            0.1,
            0.25,
            0.5,
          ],
        },
      );

    elements.forEach(
      (element) =>
        observer.observe(
          element,
        ),
    );

    return () =>
      observer.disconnect();
  }, [
    sections,
    setActiveSection,
  ]);
}