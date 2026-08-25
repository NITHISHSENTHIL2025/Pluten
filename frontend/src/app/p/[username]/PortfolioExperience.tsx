"use client";

import type {
  Portfolio,
  PortfolioAchievement,
  PortfolioCertification,
  PortfolioEducation,
  PortfolioExperience as Experience,
  PortfolioProject,
  PortfolioSkill,
  PortfolioSocialLink,
} from "@/lib/portfolioApi";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  Phone,
  X,
} from "lucide-react";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./portfolio.module.css";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function arr<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function initials(name: string): string {
  const words = str(name).split(/\s+/).filter(Boolean);
  if (!words.length) return "P";
  if (words.length === 1) return words[0][0].toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function normalizeUrl(value?: string | null): string | null {
  const raw = str(value);
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function emailUrl(value?: string | null): string | null {
  const raw = str(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null;
}

function dateLabel(value?: string | null): string {
  const raw = str(value);
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function rangeLabel(
  start?: string | null,
  end?: string | null,
  current = false,
): string {
  const a = dateLabel(start);
  const b = current ? "Present" : dateLabel(end);
  if (!a && !b) return "";
  if (!a) return b;
  if (!b) return a;
  return `${a} — ${b}`;
}

function SectionMarker({
  number,
  label,
  inverse = false,
}: {
  number: string;
  label: string;
  inverse?: boolean;
}) {
  return (
    <div className={inverse ? styles.markerInverse : styles.marker}>
      <span>{number}</span>
      <i />
      <span>{label}</span>
    </div>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const target = entry.target as HTMLElement;
        target.dataset.revealed = entry.isIntersecting ? "true" : "false";
      },
      { threshold: 0.14, rootMargin: "-8% 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${className}`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function SplitText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = str(text).split(/\s+/).filter(Boolean);
  return (
    <span className={`${styles.splitText} ${className ?? ""}`} aria-label={text}>
      {words.map((word, wordIndex) => (
        <span className={styles.splitWord} key={`${word}-${wordIndex}`}>
          {Array.from(word).map((char, charIndex) => (
            <span
              key={`${char}-${wordIndex}-${charIndex}`}
              style={{ "--i": wordIndex * 20 + charIndex } as CSSProperties}
            >
              {char}
            </span>
          ))}
          {wordIndex < words.length - 1 ? <span className={styles.splitSpace}>\u00A0</span> : null}
        </span>
      ))}
    </span>
  );
}

function TiltCard({
  children,
  dark = false,
  wide = false,
  offset = "none",
}: {
  children: ReactNode;
  dark?: boolean;
  wide?: boolean;
  offset?: "none" | "left" | "right";
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const animate = useCallback(() => {
    const node = shellRef.current;
    if (!node) return;

    current.current.x += (target.current.x - current.current.x) * 0.22;
    current.current.y += (target.current.y - current.current.y) * 0.22;

    node.style.setProperty("--rx", `${current.current.x}deg`);
    node.style.setProperty("--ry", `${current.current.y}deg`);

    if (
      Math.abs(target.current.x - current.current.x) > 0.02 ||
      Math.abs(target.current.y - current.current.y) > 0.02
    ) {
      raf.current = requestAnimationFrame(animate);
    } else {
      current.current.x = 0;
      current.current.y = 0;
      raf.current = null;
    }
  }, []);

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const hit = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - hit.left) / hit.width - 0.5;
    const y = (event.clientY - hit.top) / hit.height - 0.5;
    target.current.x = Math.max(-3.5, Math.min(3.5, -y * 4));
    target.current.y = Math.max(-4.5, Math.min(4.5, x * 5));
    if (raf.current === null) raf.current = requestAnimationFrame(animate);
  };

  const leave = () => {
    target.current.x = 0;
    target.current.y = 0;
    if (raf.current === null) raf.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  return (
    <div
      className={`${styles.tiltHitbox} ${wide ? styles.cardWide : ""}`}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div
        ref={shellRef}
        className={`${styles.cardShell} ${dark ? styles.cardDark : ""} ${
          offset === "left" ? styles.cardOffsetLeft : offset === "right" ? styles.cardOffsetRight : ""
        }`}
      >
        <div className={styles.cardShadow} aria-hidden="true" />
        <div className={styles.cardEdge} aria-hidden="true" />
        <div className={styles.cardSurface}>{children}</div>
      </div>
    </div>
  );
}

function CardHeader({
  left,
  right,
  dark = false,
}: {
  left: string;
  right?: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? styles.cardHeaderDark : styles.cardHeader}>
      <span>{left}</span>
      {right ? <span>{right}</span> : null}
    </div>
  );
}

function CardFooter({
  left,
  right,
  dark = false,
}: {
  left: string;
  right?: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? styles.cardFooterDark : styles.cardFooter}>
      <span>{left}</span>
      {right ? <span>{right}</span> : null}
    </div>
  );
}

function InfoLine({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <span className={styles.infoIcon}>{icon}</span>
      <span className={styles.infoText}>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      {href ? <ArrowUpRight size={15} /> : null}
    </>
  );

  if (!href) return <div className={styles.infoLine}>{content}</div>;
  return (
    <a className={styles.infoLine} href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

function ScrollTo({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={styles.textButton}
      onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      {children}
    </button>
  );
}

export default function PortfolioExperience({ portfolio }: { portfolio: Portfolio }) {
  const projects = arr(portfolio.projects);
  const experiences = arr(portfolio.experiences);
  const education = arr(portfolio.education);
  const skills = arr(portfolio.skills);
  const certifications = arr(portfolio.certifications);
  const achievements = arr(portfolio.achievements);
  const socialLinks = arr(portfolio.socialLinks);

  const sections = useMemo(() => {
    const list: { id: string; label: string; count?: number }[] = [
      { id: "about", label: "About" },
    ];
    if (projects.length) list.push({ id: "work", label: "Work", count: projects.length });
    if (experiences.length) list.push({ id: "experience", label: "Experience", count: experiences.length });
    if (education.length) list.push({ id: "education", label: "Education", count: education.length });
    if (skills.length) list.push({ id: "skills", label: "Skills", count: skills.length });
    if (certifications.length) list.push({ id: "credentials", label: "Credentials", count: certifications.length });
    if (achievements.length) list.push({ id: "achievements", label: "Achievements", count: achievements.length });
    if (socialLinks.length) list.push({ id: "connect", label: "Connect", count: socialLinks.length });
    if (emailUrl(portfolio.email) || str(portfolio.phone) || str(portfolio.location)) {
      list.push({ id: "contact", label: "Contact" });
    }
    return list;
  }, [
    achievements.length,
    certifications.length,
    education.length,
    experiences.length,
    portfolio.email,
    portfolio.location,
    portfolio.phone,
    projects.length,
    skills.length,
    socialLinks.length,
  ]);

  const [active, setActive] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const ids = ["portfolio-hero", ...sections.map((section) => section.id)];
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id === "portfolio-hero" ? "hero" : hit.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.05, 0.2, 0.4] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  const navigate = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className={styles.page}>
      <aside className={styles.sideNav}>
        <button
          type="button"
          className={styles.sideBrand}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <span>{initials(portfolio.fullName)}</span>
        </button>

        <div className={styles.sideTrack}>
          <button
            type="button"
            className={`${styles.sideItem} ${active === "hero" ? styles.sideItemActive : ""}`}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span>00</span>
            <b>HOME</b>
          </button>

          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={`${styles.sideItem} ${active === section.id ? styles.sideItemActive : ""}`}
              onClick={() => navigate(section.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{section.label}</b>
              {section.count !== undefined ? <em>{section.count}</em> : null}
            </button>
          ))}
        </div>

        <div className={styles.sideBottom}>
          <button type="button" onClick={() => navigate("contact")}>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={styles.mobileMenuButton}
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={19} />
      </button>

      {menuOpen ? (
        <div className={styles.mobileDrawer}>
          <div className={styles.mobileDrawerTop}>
            <span>{portfolio.fullName}</span>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
              <X size={19} />
            </button>
          </div>

          <div className={styles.mobileDrawerItems}>
            <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}>
              <span>00</span> Home
            </button>
            {sections.map((section, index) => (
              <button key={section.id} type="button" onClick={() => navigate(section.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.canvas}>
        <section id="portfolio-hero" className={styles.heroSection}>
          <SectionMarker number="01" label="PROFILE" />
          <div className={styles.heroSingleCard}>
            <TiltCard dark wide>
              <CardHeader left={`PROFILE / ${str(portfolio.username)}`} right="PUBLIC" dark />
              <div className={styles.heroCardBody}>
                <div className={styles.heroCardMain}>
                  <Reveal><p className={styles.eyebrowDark}>PROFILE</p></Reveal>
                  <Reveal delay={70}><h1 className={styles.heroNameDark}><SplitText text={str(portfolio.fullName)} /></h1></Reveal>
                  {str(portfolio.professionalTitle) ? <Reveal delay={150}><p className={styles.heroRoleDark}>{portfolio.professionalTitle}</p></Reveal> : null}
                  {str(portfolio.tagline) ? <Reveal delay={220}><p className={styles.heroBioDark}>{portfolio.tagline}</p></Reveal> : null}
                  <Reveal delay={290}>
                    <div className={styles.heroActions}>
                      {projects.length ? <ScrollTo id="work">View work <ArrowRight size={15} /></ScrollTo> : null}
                      {emailUrl(portfolio.email) ? <a className={styles.outlineButtonDark} href={`mailto:${emailUrl(portfolio.email)}`}>Get in touch <ArrowUpRight size={14} /></a> : null}
                    </div>
                  </Reveal>
                </div>
                <div className={styles.heroCardObject}>
                  <div className={styles.heroObjectInitials}>{initials(portfolio.fullName)}</div>
                  <div className={styles.heroObjectStats}>
                    {str(portfolio.location) ? <div><small>LOCATION</small><strong>{portfolio.location}</strong></div> : null}
                    {projects.length ? <div><small>PROJECTS</small><strong>{projects.length.toString().padStart(2, "0")}</strong></div> : null}
                    {skills.length ? <div><small>SKILLS</small><strong>{skills.length.toString().padStart(2, "0")}</strong></div> : null}
                  </div>
                </div>
              </div>
              <CardFooter left="01 / PROFILE" right="LIVE" dark />
            </TiltCard>
          </div>
          <button type="button" className={styles.heroScroll} onClick={() => navigate("about")}>
            <span>SCROLL</span>
            <ArrowDown size={14} />
          </button>
        </section>

        <section id="about" className={styles.section}>
          <SectionMarker number="02" label="ABOUT" />
          <div className={styles.sectionGrid}>
            <div className={styles.sectionIntro}>
              <Reveal><p className={styles.eyebrow}>ABOUT</p></Reveal>
              <Reveal delay={80}><h2>More than a résumé.</h2></Reveal>
              <Reveal delay={140}><p>A clear picture of the person, process and thinking behind the work.</p></Reveal>
            </div>

            <TiltCard offset="left" wide>
              <CardHeader left="IDENTITY" right={str(portfolio.location)} />
              <div className={styles.aboutCard}>
                <div className={styles.aboutMain}>
                  <span className={styles.smallLabel}>WHO I AM</span>
                  <h3>{str(portfolio.professionalTitle) || "Professional"}</h3>
                  <p>{str(portfolio.bio)}</p>
                </div>
                <div className={styles.aboutInfo}>
                  <InfoLine label="NAME" value={portfolio.fullName} icon={<Check size={14} />} />
                  <InfoLine label="LOCATION" value={str(portfolio.location)} icon={<MapPin size={14} />} />
                  <InfoLine label="EMAIL" value={str(portfolio.email)} icon={<Mail size={14} />} href={emailUrl(portfolio.email) ? `mailto:${emailUrl(portfolio.email)}` : undefined} />
                  <InfoLine label="PHONE" value={str(portfolio.phone)} icon={<Phone size={14} />} href={str(portfolio.phone) ? `tel:${portfolio.phone}` : undefined} />
                </div>
              </div>
              <CardFooter left="02 / ABOUT" />
            </TiltCard>
          </div>
        </section>

        {projects.length ? (
          <section id="work" className={styles.section}>
            <SectionMarker number="03" label="WORK" />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrow}>SELECTED WORK</p>
              <h2>Things I’ve built.</h2>
              <p>Projects are arranged as independent objects so each piece has room to breathe.</p>
            </div>

            <div className={styles.stack}>
              {projects.map((project, index) => <ProjectCard key={project.id ?? index} project={project} index={index} />)}
            </div>
          </section>
        ) : null}

        {experiences.length ? (
          <section id="experience" className={`${styles.section} ${styles.sectionDark}`}>
            <SectionMarker number="04" label="EXPERIENCE" inverse />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrowDark}>EXPERIENCE</p>
              <h2 className={styles.darkTitle}>Where the work became experience.</h2>
              <p className={styles.darkParagraph}>Roles, environments and responsibilities across the journey.</p>
            </div>
            <div className={styles.stackDark}>
              {experiences.map((experience, index) => <ExperienceCard key={experience.id ?? index} experience={experience} index={index} />)}
            </div>
          </section>
        ) : null}

        {education.length ? (
          <section id="education" className={styles.section}>
            <SectionMarker number="05" label="EDUCATION" />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrow}>EDUCATION</p>
              <h2>The foundation.</h2>
              <p>Academic background and the places where the foundation was built.</p>
            </div>
            <div className={styles.stack}>
              {education.map((item, index) => <EducationCard key={item.id ?? index} item={item} index={index} />)}
            </div>
          </section>
        ) : null}

        {skills.length ? (
          <section id="skills" className={styles.section}>
            <SectionMarker number="06" label="SKILLS" />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrow}>CAPABILITIES</p>
              <h2>The tools behind the work.</h2>
              <p>Grouped by category and kept intentionally quiet so the data reads first.</p>
            </div>
            <SkillsCard skills={skills} />
          </section>
        ) : null}

        {certifications.length ? (
          <section id="credentials" className={styles.section}>
            <SectionMarker number="07" label="CREDENTIALS" />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrow}>CREDENTIALS</p>
              <h2>Proof of progress.</h2>
              <p>Certifications and verified credentials from the profile.</p>
            </div>
            <div className={styles.stack}>
              {certifications.map((item, index) => <CredentialCard key={item.id ?? index} item={item} index={index} />)}
            </div>
          </section>
        ) : null}

        {achievements.length ? (
          <section id="achievements" className={styles.section}>
            <SectionMarker number="08" label="ACHIEVEMENTS" />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrow}>MILESTONES</p>
              <h2>Worth remembering.</h2>
              <p>Selected accomplishments and meaningful moments.</p>
            </div>
            <div className={styles.stack}>
              {achievements.map((item, index) => <AchievementCard key={item.id ?? index} item={item} index={index} />)}
            </div>
          </section>
        ) : null}

        {socialLinks.length ? (
          <section id="connect" className={styles.section}>
            <SectionMarker number="09" label="CONNECT" />
            <div className={styles.sectionIntroWide}>
              <p className={styles.eyebrow}>CONNECT</p>
              <h2>Find me around the web.</h2>
              <p>Professional profiles and places to follow the work.</p>
            </div>
            <div className={styles.socialGrid}>
              {socialLinks.map((item, index) => <SocialCard key={item.id ?? index} item={item} index={index} />)}
            </div>
          </section>
        ) : null}

        {(emailUrl(portfolio.email) || str(portfolio.phone) || str(portfolio.location)) ? (
          <section id="contact" className={`${styles.section} ${styles.sectionDark} ${styles.contactSection}`}>
            <SectionMarker number="10" label="CONTACT" inverse />
            <div className={styles.contactGrid}>
              <div className={styles.sectionIntroContact}>
                <p className={styles.eyebrowDark}>CONTACT</p>
                <h2 className={styles.darkTitle}>Let’s build something meaningful.</h2>
                <p className={styles.darkParagraph}>{str(portfolio.tagline) || "Start a conversation."}</p>
              </div>

              <TiltCard dark wide>
                <CardHeader left="CONTACT" right="DIRECT" dark />
                <div className={styles.contactCard}>
                  {emailUrl(portfolio.email) ? <InfoLine label="EMAIL" value={str(portfolio.email)} icon={<Mail size={14} />} href={`mailto:${emailUrl(portfolio.email)}`} /> : null}
                  {str(portfolio.phone) ? <InfoLine label="PHONE" value={str(portfolio.phone)} icon={<Phone size={14} />} href={`tel:${portfolio.phone}`} /> : null}
                  {str(portfolio.location) ? <InfoLine label="LOCATION" value={str(portfolio.location)} icon={<MapPin size={14} />} /> : null}
                  {normalizeUrl(portfolio.website) ? <InfoLine label="WEBSITE" value="Open website" icon={<Globe size={14} />} href={normalizeUrl(portfolio.website) ?? undefined} /> : null}
                </div>
                <CardFooter left="10 / CONTACT" right="DIRECT" dark />
              </TiltCard>
            </div>
          </section>
        ) : null}

        <footer className={styles.footer}>
          <div>
            <strong>{portfolio.fullName}</strong>
            <span>{str(portfolio.professionalTitle) || "Portfolio"}</span>
          </div>
          <span>{new Date().getFullYear()}</span>
        </footer>
      </div>
    </main>
  );
}

function ProjectCard({ project, index }: { project: PortfolioProject; index: number }) {
  const live = normalizeUrl(project.liveUrl ?? project.projectUrl);
  const github = normalizeUrl(project.githubUrl);
  return (
    <Reveal className={index % 2 === 0 ? "" : styles.staggerRight}>
      <TiltCard wide offset={index % 2 === 0 ? "left" : "right"}>
        <CardHeader left={`PROJECT / ${String(index + 1).padStart(2, "0")}`} right={project.featured ? "FEATURED" : "SELECTED"} />
        <div className={styles.projectCard}>
          <div className={styles.projectIndex}>{String(index + 1).padStart(2, "0")}</div>
          <div className={styles.projectMain}>
            {str(project.role) ? <span className={styles.smallLabel}>{project.role}</span> : null}
            <h3>{project.title}</h3>
            {str(project.description) ? <p>{project.description}</p> : null}
            {arr(project.technologies).length ? (
              <div className={styles.tags}>
                {arr(project.technologies).map((tag, i) => <span key={`${tag}-${i}`}>{tag}</span>)}
              </div>
            ) : null}
          </div>
          <div className={styles.projectActions}>
            {live ? <a href={live} target="_blank" rel="noopener noreferrer" className={styles.primaryAction}>Live <ArrowUpRight size={15} /></a> : null}
            {github ? <a href={github} target="_blank" rel="noopener noreferrer" className={styles.secondaryAction}>Source <ExternalLink size={14} /></a> : null}
            {!live && !github ? <span className={styles.none}>No links</span> : null}
          </div>
        </div>
        <CardFooter left={rangeLabel(project.startDate, project.endDate)} right={`${arr(project.technologies).length} technologies`} />
      </TiltCard>
    </Reveal>
  );
}

function ExperienceCard({ experience, index }: { experience: Experience; index: number }) {
  const responsibilities = arr(experience.responsibilities).filter(Boolean);
  const achievements = arr(experience.achievements).filter(Boolean);
  return (
    <Reveal>
      <TiltCard dark wide offset={index % 2 === 0 ? "left" : "right"}>
        <CardHeader left={`ROLE / ${String(index + 1).padStart(2, "0")}`} right={rangeLabel(experience.startDate, experience.endDate, Boolean(experience.currentlyWorking || experience.current))} dark />
        <div className={styles.experienceCard}>
          <div className={styles.experienceLead}>
            {str(experience.employmentType ?? experience.type) ? <span className={styles.smallLabelDark}>{str(experience.employmentType ?? experience.type)}</span> : null}
            <h3>{experience.position}</h3>
            <p>{experience.company}</p>
            {str(experience.location) ? <span className={styles.locationDark}><MapPin size={13} />{experience.location}</span> : null}
          </div>
          <div className={styles.experienceDetails}>
            {str(experience.description) ? <div><span>DESCRIPTION</span><p>{experience.description}</p></div> : null}
            {responsibilities.length ? <div><span>RESPONSIBILITIES</span>{responsibilities.map((item, i) => <p key={i}>• {item}</p>)}</div> : null}
            {achievements.length ? <div><span>ACHIEVEMENTS</span>{achievements.map((item, i) => <p key={i}>• {item}</p>)}</div> : null}
          </div>
        </div>
        <CardFooter left={`04 / EXPERIENCE`} right={experience.currentlyWorking || experience.current ? "CURRENT" : "COMPLETED"} dark />
      </TiltCard>
    </Reveal>
  );
}

function EducationCard({ item, index }: { item: PortfolioEducation; index: number }) {
  return (
    <Reveal>
      <TiltCard wide offset={index % 2 === 0 ? "right" : "left"}>
        <CardHeader left={`EDUCATION / ${String(index + 1).padStart(2, "0")}`} right={rangeLabel(item.startDate, item.endDate, Boolean(item.currentlyStudying || item.current))} />
        <div className={styles.educationCard}>
          <div className={styles.educationLead}>
            <span className={styles.smallLabel}>ACADEMIC FOUNDATION</span>
            <h3>{item.degree}</h3>
            {str(item.field ?? item.fieldOfStudy) ? <p>{str(item.field ?? item.fieldOfStudy)}</p> : null}
            {str(item.institution) ? <strong>{item.institution}</strong> : null}
            {str(item.location) ? <span className={styles.location}><MapPin size={13} />{item.location}</span> : null}
          </div>
          <div className={styles.educationDetails}>
            {str(item.grade) ? <div><span>GRADE</span><strong>{item.grade}</strong></div> : null}
            {arr(item.coursework).length ? <div><span>COURSEWORK</span><p>{arr(item.coursework).join(" · ")}</p></div> : null}
            {arr(item.achievements).length ? <div><span>ACHIEVEMENTS</span>{arr(item.achievements).map((a, i) => <p key={i}>• {a}</p>)}</div> : null}
          </div>
        </div>
        <CardFooter left="05 / EDUCATION" right={item.currentlyStudying || item.current ? "CURRENT" : "COMPLETED"} />
      </TiltCard>
    </Reveal>
  );
}

function SkillsCard({ skills }: { skills: PortfolioSkill[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, PortfolioSkill[]>();
    skills.forEach((skill) => {
      const key = str(skill.category) || "Other";
      map.set(key, [...(map.get(key) ?? []), skill]);
    });
    return [...map.entries()];
  }, [skills]);

  return (
    <Reveal>
      <TiltCard wide>
        <CardHeader left="SKILLS" right={`${skills.length.toString().padStart(2, "0")} ITEMS`} />
        <div className={styles.skillsCard}>
          {groups.map(([category, list]) => (
            <div key={category} className={styles.skillGroup}>
              <div className={styles.skillGroupTop}><span>{category}</span><span>{list.length.toString().padStart(2, "0")}</span></div>
              {list.map((skill, index) => {
                const level = Math.max(0, Math.min(100, Number(skill.level ?? 0)));
                return (
                  <div key={skill.id ?? `${skill.name}-${index}`} className={styles.skillRow}>
                    <div><strong>{skill.name}</strong><span>{Number(skill.yearsOfExperience ?? skill.yearsOfUse ?? 0)} yrs</span></div>
                    <div className={styles.skillBar}><i style={{ width: `${level}%` }} /></div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <CardFooter left="06 / SKILLS" />
      </TiltCard>
    </Reveal>
  );
}

function CredentialCard({ item, index }: { item: PortfolioCertification; index: number }) {
  const url = normalizeUrl(item.credentialUrl);
  return (
    <Reveal>
      <TiltCard wide offset={index % 2 ? "right" : "left"}>
        <CardHeader left={`CREDENTIAL / ${String(index + 1).padStart(2, "0")}`} right={dateLabel(item.issueDate)} />
        <div className={styles.simpleCard}>
          <div><span className={styles.smallLabel}>CERTIFICATION</span><h3>{item.name}</h3><p>{item.issuer}</p></div>
          <div className={styles.simpleData}>
            <span>ISSUED <strong>{dateLabel(item.issueDate)}</strong></span>
            <span>EXPIRES <strong>{dateLabel(item.expiryDate)}</strong></span>
            <span>ID <strong>{str(item.credentialId)}</strong></span>
            {url ? <a href={url} target="_blank" rel="noopener noreferrer">Verify <ArrowUpRight size={14} /></a> : null}
          </div>
        </div>
        <CardFooter left="07 / CREDENTIALS" />
      </TiltCard>
    </Reveal>
  );
}

function AchievementCard({ item, index }: { item: PortfolioAchievement; index: number }) {
  const url = normalizeUrl(item.credentialUrl);
  return (
    <Reveal>
      <TiltCard wide offset={index % 2 ? "right" : "left"}>
        <CardHeader left={`MILESTONE / ${String(index + 1).padStart(2, "0")}`} right={dateLabel(item.date)} />
        <div className={styles.achievementCard}>
          <div className={styles.achievementNumber}>{String(index + 1).padStart(2, "0")}</div>
          <div><span className={styles.smallLabel}>ACHIEVEMENT</span><h3>{item.title}</h3><p>{str(item.description)}</p><div className={styles.achievementMeta}><span>{str(item.organization)}</span>{url ? <a href={url} target="_blank" rel="noopener noreferrer">Open <ArrowUpRight size={14} /></a> : null}</div></div>
        </div>
        <CardFooter left="08 / ACHIEVEMENTS" />
      </TiltCard>
    </Reveal>
  );
}

function SocialCard({ item, index }: { item: PortfolioSocialLink; index: number }) {
  const url = normalizeUrl(item.url);
  if (!url) return null;
  return (
    <Reveal>
      <TiltCard offset={index % 2 ? "right" : "left"}>
        <div className={styles.socialCard}>
          <span className={styles.socialNumber}>{String(index + 1).padStart(2, "0")}</span>
          <div><span className={styles.smallLabel}>{str(item.platform) || "LINK"}</span><h3>{str(item.label) || str(item.platform) || "Link"}</h3></div>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={str(item.label) || str(item.platform) || "Open link"}><ArrowUpRight size={17} /></a>
        </div>
      </TiltCard>
    </Reveal>
  );
}
