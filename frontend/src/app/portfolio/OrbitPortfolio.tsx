"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Code2,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import styles from "./OrbitPortfolio.module.css";

export type OrbitProject = {
  id?: string;
  title?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  role?: string | null;
  technologies?: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  projectUrl?: string | null;
  featured?: boolean;
};

export type OrbitExperience = {
  id?: string;
  company?: string | null;
  position?: string | null;
  employmentType?: string | null;
  type?: string | null;
  location?: string | null;
  description?: string | null;
  achievements?: string[];
  startDate?: string | null;
  endDate?: string | null;
  currentlyWorking?: boolean;
  current?: boolean;
};

export type OrbitEducation = {
  id?: string;
  institution?: string | null;
  degree?: string | null;
  field?: string | null;
  fieldOfStudy?: string | null;
  location?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  currentlyStudying?: boolean;
  current?: boolean;
};

export type OrbitSkill = {
  id?: string;
  name?: string | null;
  category?: string | null;
  level?: number | null;
  yearsOfExperience?: number | null;
  yearsOfUse?: number | null;
};

export type OrbitCertification = {
  id?: string;
  name?: string | null;
  issuer?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  description?: string | null;
};

export type OrbitAchievement = {
  id?: string;
  title?: string | null;
  description?: string | null;
  organization?: string | null;
  date?: string | null;
  category?: string | null;
};

export type OrbitSocial = {
  id?: string;
  platform?: string | null;
  label?: string | null;
  url?: string | null;
};

export type OrbitPortfolioData = {
  fullName?: string | null;
  professionalTitle?: string | null;
  tagline?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;

  projects?: OrbitProject[];
  experiences?: OrbitExperience[];
  education?: OrbitEducation[];
  skills?: OrbitSkill[];
  certifications?: OrbitCertification[];
  achievements?: OrbitAchievement[];
  socialLinks?: OrbitSocial[];
};

type OrbitItem =
  | { id: string; type: "profile"; title: string; label: string }
  | { id: string; type: "about"; title: string; label: string }
  | { id: string; type: "project"; projectIndex: number; project: OrbitProject; title: string; label: string }
  | { id: string; type: "experience"; experienceIndex: number; experience: OrbitExperience; title: string; label: string }
  | { id: string; type: "education"; educationIndex: number; education: OrbitEducation; title: string; label: string }
  | { id: string; type: "skills"; title: string; label: string }
  | { id: string; type: "certification"; certificationIndex: number; certification: OrbitCertification; title: string; label: string }
  | { id: string; type: "achievement"; achievementIndex: number; achievement: OrbitAchievement; title: string; label: string }
  | { id: string; type: "connect"; title: string; label: string };

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function list<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function initials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "N"
  );
}

function formatDate(value?: string | null): string {
  const raw = clean(value);
  if (!raw) return "";

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function safeExternalUrl(value?: string | null): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    const url = new URL(
      /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
    );
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function stopLinkEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

function titleClass(
  value: string,
  normal: string,
  medium: string,
  long: string,
  extraLong: string,
): string {
  const length = value.trim().length;
  if (length > 44) return extraLong;
  if (length > 30) return long;
  if (length > 19) return medium;
  return normal;
}

export default function OrbitPortfolio({
  portfolio,
  preview = false,
  interactive = true,
}: {
  portfolio: OrbitPortfolioData;
  preview?: boolean;
  interactive?: boolean;
}) {
  const projects = list(portfolio.projects);
  const experiences = list(portfolio.experiences);
  const education = list(portfolio.education);
  const skills = list(portfolio.skills);
  const certifications = list(portfolio.certifications);
  const achievements = list(portfolio.achievements);
  const socialLinks = list(portfolio.socialLinks);

  const items = useMemo<OrbitItem[]>(() => {
    const result: OrbitItem[] = [
      {
        id: "profile",
        type: "profile",
        title: clean(portfolio.fullName) || "Your Name",
        label: "PROFILE",
      },
      {
        id: "about",
        type: "about",
        title: "About.",
        label: "ABOUT",
      },
    ];

    projects.forEach((project, index) => {
      result.push({
        id: project.id || `project-${index}`,
        type: "project",
        projectIndex: index,
        project,
        title: clean(project.title) || `Project ${index + 1}`,
        label: `PROJECT / ${String(index + 1).padStart(2, "0")}`,
      });
    });

    experiences.forEach((experience, index) => {
      result.push({
        id: experience.id || `experience-${index}`,
        type: "experience",
        experienceIndex: index,
        experience,
        title: clean(experience.position) || "Experience.",
        label: `EXPERIENCE / ${String(index + 1).padStart(2, "0")}`,
      });
    });

    education.forEach((entry, index) => {
      result.push({
        id: entry.id || `education-${index}`,
        type: "education",
        educationIndex: index,
        education: entry,
        title: clean(entry.degree) || "Education.",
        label: `EDUCATION / ${String(index + 1).padStart(2, "0")}`,
      });
    });

    if (skills.length) {
      result.push({
        id: "skills",
        type: "skills",
        title: "Capabilities.",
        label: "SKILLS",
      });
    }

    certifications.forEach((certification, index) => {
      result.push({
        id: certification.id || `certification-${index}`,
        type: "certification",
        certificationIndex: index,
        certification,
        title: clean(certification.name) || `Certification ${index + 1}`,
        label: `CERTIFICATION / ${String(index + 1).padStart(2, "0")}`,
      });
    });

    achievements.forEach((achievement, index) => {
      result.push({
        id: achievement.id || `achievement-${index}`,
        type: "achievement",
        achievementIndex: index,
        achievement,
        title: clean(achievement.title) || "Achievement.",
        label: `ACHIEVEMENT / ${String(index + 1).padStart(2, "0")}`,
      });
    });

    if (
      clean(portfolio.email) ||
      clean(portfolio.phone) ||
      safeExternalUrl(portfolio.website) ||
      socialLinks.some((social) => safeExternalUrl(social.url))
    ) {
      result.push({
        id: "connect",
        type: "connect",
        title: "Let's connect.",
        label: "CONTACT",
      });
    }

    return result;
  }, [
    achievements,
    certifications,
    education,
    experiences,
    portfolio.email,
    portfolio.fullName,
    portfolio.phone,
    portfolio.website,
    projects,
    skills,
    socialLinks,
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const pointerDelta = useRef(0);


  const goTo = useCallback(
    (index: number) => {
      if (!items.length) return;
      const normalized = ((index % items.length) + items.length) % items.length;
      setActiveIndex(normalized);
    },
    [items.length],
  );

  const next = useCallback(() => {
    if (!interactive) return;
    goTo(activeIndex + 1);
  }, [activeIndex, goTo, interactive]);

  const previous = useCallback(() => {
    if (!interactive) return;
    goTo(activeIndex - 1);
  }, [activeIndex, goTo, interactive]);

  useEffect(() => {
    if (preview || !interactive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, button, a, [contenteditable="true"]',
        )
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, previous, preview, interactive]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (preview || !interactive) return;
    pointerStart.current = event.clientX;
    pointerDelta.current = 0;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (preview || !interactive || pointerStart.current === null) return;
    pointerDelta.current = event.clientX - pointerStart.current;
  };

  const handlePointerUp = () => {
    if (preview || !interactive || pointerStart.current === null) return;

    const delta = pointerDelta.current;
    pointerStart.current = null;
    pointerDelta.current = 0;

    if (Math.abs(delta) < 55) return;
    if (delta < 0) next();
    else previous();
  };

  const safeActiveIndex = items.length
    ? Math.min(activeIndex, items.length - 1)
    : 0;
  const activeItem = items[safeActiveIndex] || items[0];
  if (!activeItem) return null;

  return (
    <main className={`${styles.page} ${preview ? styles.previewMode : ""}`}>
      {!preview && (
        <header className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.avatar}>
              {initials(clean(portfolio.fullName))}
            </span>
            <div className={styles.identityText}>
              <strong>{clean(portfolio.fullName) || "Portfolio"}</strong>
              <span>{clean(portfolio.professionalTitle)}</span>
            </div>
          </div>

          <div className={styles.counter}>
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
            <i />
            <span>{String(items.length).padStart(2, "0")}</span>
          </div>
        </header>
      )}

      <section className={styles.stage}>
        <div className={styles.heading}>
          <span className={styles.headingLabel}>
            {String(activeIndex + 1).padStart(2, "0")} / {activeItem.label}
          </span>
          <h1
            className={titleClass(
              activeItem.title,
              styles.headingNormal,
              styles.headingMedium,
              styles.headingLong,
              styles.headingExtraLong,
            )}
          >
            {activeItem.title}
          </h1>
          {activeItem.type === "profile" && clean(portfolio.professionalTitle) && (
            <p>{portfolio.professionalTitle}</p>
          )}
        </div>

        <div
          className={styles.orbit}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className={styles.ringOuter} />
          <div className={styles.ringInner} />
          <div className={styles.centerPoint} />

          {items.map((item, index) => {
            const raw = (index - activeIndex + items.length) % items.length;
            const signed = raw > items.length / 2 ? raw - items.length : raw;
            const distance = Math.abs(signed);
            const active = index === activeIndex;

            const style = {
              "--x": `${signed * 500}px`,
              "--y": `${active ? 0 : 20 + distance * 16}px`,
              "--z": `${active ? 180 : 0 - distance * 150}px`,
              "--rotate": `${signed * -9}deg`,
              "--scale": active ? 1 : Math.max(0.58, 0.91 - distance * 0.1),
              "--opacity": active ? 1 : Math.max(0.08, 0.48 - distance * 0.12),
            } as CSSProperties;

            return (
              <OrbitCard
                key={item.id}
                item={item}
                active={active}
                style={style}
                itemNumber={index + 1}
                interactive={interactive}
                onActivate={() => goTo(index)}
                portfolio={portfolio}
              />
            );
          })}
        </div>

        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.arrow}
            onClick={previous}
            disabled={!interactive}
            aria-label="Previous section"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={styles.dots} role="tablist" aria-label="Portfolio sections">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === activeIndex ? styles.dotActive : styles.dot}
                onClick={() => interactive && goTo(index)}
                disabled={!interactive}
                aria-label={`Go to ${item.title}`}
                aria-selected={index === activeIndex}
                role="tab"
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.arrow}
            onClick={next}
            disabled={!interactive}
            aria-label="Next section"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {!preview && <span className={styles.hint}>DRAG / SWIPE / ARROW KEYS</span>}
      </section>

      {!preview && (
        <footer className={styles.footer}>
          <span>{clean(portfolio.location)}</span>
          <span>
            {String(safeActiveIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
          <span>{clean(portfolio.email)}</span>
        </footer>
      )}
    </main>
  );
}

function OrbitCard({
  item,
  active,
  style,
  itemNumber,
  interactive,
  onActivate,
  portfolio,
}: {
  item: OrbitItem;
  active: boolean;
  style: CSSProperties;
  itemNumber: number;
  interactive: boolean;
  onActivate: () => void;
  portfolio: OrbitPortfolioData;
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (active || !interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <article
      className={`${styles.card} ${active ? styles.cardActive : styles.cardInactive}`}
      style={style}
      role={!active && interactive ? "button" : undefined}
      tabIndex={!active && interactive ? 0 : undefined}
      onClick={!active && interactive ? onActivate : undefined}
      onKeyDown={handleKeyDown}
      aria-label={!active && interactive ? `View ${item.title}` : undefined}
    >
      <div className={styles.cardTop}>
        <span>{String(itemNumber).padStart(2, "0")}</span>
        <span>{item.label}</span>
      </div>

      <div className={styles.cardContent}>
        <OrbitCardContent item={item} portfolio={portfolio} />
      </div>

      <div className={styles.cardBottom}>
        <span>{active ? "CURRENT" : "VIEW"}</span>
        <span>{String(itemNumber).padStart(2, "0")}</span>
      </div>
    </article>
  );
}

function OrbitCardContent({
  item,
  portfolio,
}: {
  item: OrbitItem;
  portfolio: OrbitPortfolioData;
}) {
  if (item.type === "profile") {
    return (
      <div className={styles.contentProfile}>
        <div className={styles.sectionIcon}><UserRound size={22} /></div>
        <span className={styles.innerLabel}>PROFILE</span>
        <h2
          className={titleClass(
            clean(portfolio.fullName) || "Your Name",
            styles.cardTitleNormal,
            styles.cardTitleMedium,
            styles.cardTitleLong,
            styles.cardTitleExtraLong,
          )}
        >
          {clean(portfolio.fullName) || "Your Name"}
        </h2>
        {clean(portfolio.professionalTitle) && <p className={styles.role}>{portfolio.professionalTitle}</p>}
        {clean(portfolio.tagline) && <p className={styles.description}>{portfolio.tagline}</p>}
        {clean(portfolio.location) && (
          <div className={styles.inlineMeta}><MapPin size={14} />{portfolio.location}</div>
        )}
      </div>
    );
  }

  if (item.type === "about") {
    return (
      <div className={styles.contentAbout}>
        <span className={styles.innerLabel}>ABOUT</span>
        <div className={styles.aboutScroll}>
          <p className={styles.aboutText}>
            {clean(portfolio.bio) || "A thoughtful approach to building useful digital products."}
          </p>
        </div>
        {clean(portfolio.professionalTitle) && <p className={styles.role}>{portfolio.professionalTitle}</p>}
      </div>
    );
  }

  if (item.type === "project") {
    const project = item.project;
    const liveUrl = safeExternalUrl(project.liveUrl || project.projectUrl);
    const githubUrl = safeExternalUrl(project.githubUrl);
    const description = clean(project.description) || clean(project.shortDescription);

    return (
      <div className={styles.contentProject}>
        <div className={styles.innerLabel}>SELECTED WORK / {String(item.projectIndex + 1).padStart(2, "0")}</div>
        <h2
          className={titleClass(
            clean(project.title) || `Project ${item.projectIndex + 1}`,
            styles.cardTitleNormal,
            styles.cardTitleMedium,
            styles.cardTitleLong,
            styles.cardTitleExtraLong,
          )}
        >
          {clean(project.title) || `Project ${item.projectIndex + 1}`}
        </h2>
        {clean(project.role) && <p className={styles.projectRole}>{project.role}</p>}
        <div className={styles.descriptionScroll}>
          <p className={styles.description}>{description || "Project details are available here."}</p>
        </div>
        {project.technologies?.length ? (
          <div className={styles.pillRow}>
            {project.technologies.filter(Boolean).slice(0, 24).map((technology, index) => (
              <span key={`${technology}-${index}`}>{technology}</span>
            ))}
          </div>
        ) : null}
        {(liveUrl || githubUrl) && (
          <div className={styles.projectActions}>
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryButton} onClick={stopLinkEvent}>
                <ExternalLink size={14} /> Live project
              </a>
            )}
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton} onClick={stopLinkEvent}>
                <Code2 size={14} /> GitHub
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  if (item.type === "experience") {
    const experience = item.experience;
    return (
      <div className={styles.standardContent}>
        <div className={styles.sectionIcon}><BriefcaseBusiness size={21} /></div>
        <span className={styles.innerLabel}>PROFESSIONAL EXPERIENCE</span>
        <h2 className={titleClass(clean(experience.position) || "Experience", styles.cardTitleNormal, styles.cardTitleMedium, styles.cardTitleLong, styles.cardTitleExtraLong)}>
          {clean(experience.position) || "Experience"}
        </h2>
        {clean(experience.company) && <p className={styles.role}>{experience.company}</p>}
        {clean(experience.location) && <p className={styles.muted}>{experience.location}</p>}
        <div className={styles.dateLine}>
          <span>{formatDate(experience.startDate)}</span>
          <span>—</span>
          <span>{experience.current || experience.currentlyWorking ? "Present" : formatDate(experience.endDate) || "Present"}</span>
        </div>
        {(clean(experience.description) || experience.achievements?.length) && (
          <div className={styles.descriptionScroll}>
            {clean(experience.description) && <p className={styles.description}>{experience.description}</p>}
            {experience.achievements?.length ? (
              <ul className={styles.list}>
                {experience.achievements.filter(Boolean).slice(0, 12).map((achievement, index) => <li key={`${achievement}-${index}`}>{achievement}</li>)}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  if (item.type === "education") {
    const education = item.education;
    return (
      <div className={styles.standardContent}>
        <div className={styles.sectionIcon}><GraduationCap size={22} /></div>
        <span className={styles.innerLabel}>ACADEMIC FOUNDATION</span>
        <h2 className={titleClass(clean(education.degree) || "Education", styles.cardTitleNormal, styles.cardTitleMedium, styles.cardTitleLong, styles.cardTitleExtraLong)}>
          {clean(education.degree) || "Education"}
        </h2>
        {clean(education.institution) && <p className={styles.role}>{education.institution}</p>}
        {clean(education.field || education.fieldOfStudy) && <p className={styles.muted}>{clean(education.field || education.fieldOfStudy)}</p>}
        {clean(education.location) && <div className={styles.inlineMeta}><MapPin size={14} />{education.location}</div>}
        <div className={styles.dateLine}>
          <span>{formatDate(education.startDate)}</span>
          <span>—</span>
          <span>{education.current || education.currentlyStudying ? "Present" : formatDate(education.endDate) || "Present"}</span>
        </div>
        {clean(education.description) && <div className={styles.descriptionScroll}><p className={styles.description}>{education.description}</p></div>}
      </div>
    );
  }

  if (item.type === "skills") {
    const grouped = new Map<string, OrbitSkill[]>();
    skillsFromPortfolio(portfolio.skills).forEach((skill) => {
      const category = clean(skill.category) || "Skills";
      grouped.set(category, [...(grouped.get(category) || []), skill]);
    });

    return (
      <div className={styles.skillsContent}>
        <div className={styles.sectionIcon}><Code2 size={21} /></div>
        <span className={styles.innerLabel}>CORE CAPABILITIES</span>
        <div className={styles.skillsScroll}>
          {Array.from(grouped.entries()).map(([category, categorySkills]) => (
            <div key={category} className={styles.skillGroup}>
              <div className={styles.skillGroupTop}><span>{category}</span><span>{String(categorySkills.length).padStart(2, "0")}</span></div>
              <div className={styles.pillRow}>
                {categorySkills.map((skill, index) => <span key={skill.id || `${skill.name}-${index}`}>{clean(skill.name)}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "certification") {
    const certification = item.certification;
    const credentialUrl = safeExternalUrl(certification.credentialUrl);
    return (
      <div className={styles.standardContent}>
        <div className={styles.sectionIcon}><ShieldCheck size={21} /></div>
        <span className={styles.innerLabel}>CERTIFICATION {String(item.certificationIndex + 1).padStart(2, "0")}</span>
        <h2 className={titleClass(clean(certification.name) || "Certification", styles.cardTitleNormal, styles.cardTitleMedium, styles.cardTitleLong, styles.cardTitleExtraLong)}>
          {clean(certification.name) || "Certification"}
        </h2>
        {clean(certification.issuer) && <p className={styles.role}>{certification.issuer}</p>}
        {clean(certification.credentialId) && <p className={styles.muted}>Credential {certification.credentialId}</p>}
        <div className={styles.dateLine}>
          {formatDate(certification.issueDate) && <span>Issued {formatDate(certification.issueDate)}</span>}
          {formatDate(certification.expiryDate) && <span>· Expires {formatDate(certification.expiryDate)}</span>}
        </div>
        {clean(certification.description) && <div className={styles.descriptionScroll}><p className={styles.description}>{certification.description}</p></div>}
        {credentialUrl && (
          <div className={styles.projectActions}>
            <a href={credentialUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryButton} onClick={stopLinkEvent}>
              <ArrowUpRight size={14} /> Verify credential
            </a>
          </div>
        )}
      </div>
    );
  }

  if (item.type === "achievement") {
    const achievement = item.achievement;
    return (
      <div className={styles.standardContent}>
        <div className={styles.sectionIcon}><Award size={21} /></div>
        <span className={styles.innerLabel}>ACHIEVEMENT {String(item.achievementIndex + 1).padStart(2, "0")}</span>
        <h2 className={titleClass(clean(achievement.title) || "Achievement", styles.cardTitleNormal, styles.cardTitleMedium, styles.cardTitleLong, styles.cardTitleExtraLong)}>
          {clean(achievement.title) || "Achievement"}
        </h2>
        {clean(achievement.organization) && <p className={styles.role}>{achievement.organization}</p>}
        {clean(achievement.category) && <p className={styles.muted}>{achievement.category}</p>}
        {clean(achievement.description) && <div className={styles.descriptionScroll}><p className={styles.description}>{achievement.description}</p></div>}
        {formatDate(achievement.date) && <div className={styles.dateLine}><span>{formatDate(achievement.date)}</span></div>}
      </div>
    );
  }

  return (
    <div className={styles.connectContent}>
      <div className={styles.sectionIcon}><Globe size={21} /></div>
      <span className={styles.innerLabel}>CONTACT</span>
      <h2 className={styles.connectTitle}>Let&apos;s build<br />something.</h2>
      <div className={styles.connectList}>
        {clean(portfolio.email) && (
          <a href={`mailto:${portfolio.email}`} onClick={stopLinkEvent}>
            <Mail size={15} /><span>Email</span><ArrowUpRight size={14} />
          </a>
        )}
        {clean(portfolio.phone) && (
          <a href={`tel:${portfolio.phone}`} onClick={stopLinkEvent}>
            <Phone size={15} /><span>Phone</span><ArrowUpRight size={14} />
          </a>
        )}
        {safeExternalUrl(portfolio.website) && (
          <a href={safeExternalUrl(portfolio.website)!} target="_blank" rel="noopener noreferrer" onClick={stopLinkEvent}>
            <Globe size={15} /><span>Website</span><ArrowUpRight size={14} />
          </a>
        )}
        {list(portfolio.socialLinks).map((social, index) => {
          const url = safeExternalUrl(social.url);
          if (!url) return null;
          const label = clean(social.label) || clean(social.platform) || "Profile";
          return (
            <a key={social.id || `${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" onClick={stopLinkEvent}>
              <ArrowUpRight size={15} /><span>{label}</span><ArrowUpRight size={14} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function skillsFromPortfolio(value?: OrbitSkill[]) {
  return list(value);
}
