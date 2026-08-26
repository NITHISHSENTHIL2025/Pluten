"use client";
import PortfolioTemplateSelector, {
  type PortfolioTemplateId,
} from "../../PortfolioTemplateSelector";
import OrbitTemplatePreview from "../../OrbitTemplatePreview";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  Link2,
  Loader2,
  Plus,
  Save,
  Trash2,
  UserRound,
  BriefcaseBusiness,
  Award,
  Trophy,
  Sparkles,
  X,
} from "lucide-react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPortfolio,
  updatePortfolio,
  publishPortfolio,
  type Portfolio,
  type CreatePortfolioPayload,
} from "@/lib/portfolioApi";

import styles from "./editor.module.css";

type SectionId =
  | "profile"
  | "about"
  | "projects"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "achievements"
  | "social"
  | "template"
  | "review";

type ProjectForm = {
  id?: string;
  title: string;
  description: string;
  role: string;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  startDate: string;
  endDate: string;
  featured: boolean;
};

type ExperienceForm = {
  id?: string;
  company: string;
  position: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
};

type EducationForm = {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyStudying: boolean;
  grade: string;
  coursework: string[];
  achievements: string[];
};

type SkillForm = {
  id?: string;
  name: string;
  category: string;
  level: number | null;
  yearsOfExperience: number | null;
};

type CertificationForm = {
  id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
};

type AchievementForm = {
  id?: string;
  title: string;
  description: string;
  organization: string;
  date: string;
  credentialUrl: string;
};

type SocialForm = {
  id?: string;
  platform: string;
  label: string;
  url: string;
};

const SECTIONS: {
  id: SectionId;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Your identity and public URL.",
    icon: UserRound,
  },
  {
    id: "about",
    label: "About",
    description: "Tell people what you do.",
    icon: Sparkles,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Show the work you've built.",
    icon: BriefcaseBusiness,
  },
  {
    id: "experience",
    label: "Experience",
    description: "Your professional journey.",
    icon: BriefcaseBusiness,
  },
  {
    id: "education",
    label: "Education",
    description: "Academic background.",
    icon: GraduationCap,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Technologies and capabilities.",
    icon: CheckCircle2,
  },
  {
    id: "certifications",
    label: "Certifications",
    description: "Credentials and certifications.",
    icon: Award,
  },
  {
    id: "achievements",
    label: "Achievements",
    description: "Awards and milestones.",
    icon: Trophy,
  },
  {
    id: "social",
    label: "Social",
    description: "Professional profiles.",
    icon: Link2,
  },
  {
    id: "template",
    label: "Template",
    description: "Choose how your portfolio is presented.",
    icon: Sparkles,
  },
  {
    id: "review",
    label: "Review",
    description: "Check everything before publishing.",
    icon: Check,
  },
];

const SKILL_CATEGORIES = [
  "LANGUAGE",
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "DEVOPS",
  "CLOUD",
  "MOBILE",
  "AI_ML",
  "DESIGN",
  "TOOLS",
  "OTHER",
];

const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "FREELANCE",
  "CONTRACT",
  "SELF_EMPLOYED",
  "OTHER",
];

const SOCIAL_PLATFORMS = [
  "GITHUB",
  "LINKEDIN",
  "INSTAGRAM",
  "X",
  "YOUTUBE",
  "LEETCODE",
  "CODECHEF",
  "HACKERRANK",
  "CODEFORCES",
  "DEVTO",
  "MEDIUM",
  "BEHANCE",
  "DRIBBBLE",
  "DISCORD",
  "WEBSITE",
  "OTHER",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

function normalizeUrl(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return "";
  }

  if (
    /^https?:\/\//i.test(cleaned)
  ) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

function validUrl(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return true;
  }

  try {
    const parsed = new URL(
      normalizeUrl(cleaned),
    );

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value: string[]) {
  return value.join("\n");
}

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function initials(value: string) {
  const result = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return result.toUpperCase() || "P";
}

function emptyProject(): ProjectForm {
  return {
    title: "",
    description: "",
    role: "",
    technologies: [],
    githubUrl: "",
    liveUrl: "",
    startDate: "",
    endDate: "",
    featured: false,
  };
}

function emptyExperience(): ExperienceForm {
  return {
    company: "",
    position: "",
    employmentType: "FULL_TIME",
    location: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
    responsibilities: [],
    achievements: [],
  };
}

function emptyEducation(): EducationForm {
  return {
    institution: "",
    degree: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    currentlyStudying: false,
    grade: "",
    coursework: [],
    achievements: [],
  };
}

function emptySkill(): SkillForm {
  return {
    name: "",
    category: "OTHER",
    level: null,
    yearsOfExperience: null,
  };
}

function emptyCertification(): CertificationForm {
  return {
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
  };
}

function emptyAchievement(): AchievementForm {
  return {
    title: "",
    description: "",
    organization: "",
    date: "",
    credentialUrl: "",
  };
}

function emptySocial(): SocialForm {
  return {
    platform: "GITHUB",
    label: "GitHub",
    url: "",
  };
}

export default function PortfolioEditorPage() {
  const params = useParams();
  const router = useRouter();

  const portfolioId = String(
    params.id || "",
  );

  const [portfolio, setPortfolio] =
    useState<Portfolio | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionId>("profile");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [dirty, setDirty] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [tagline, setTagline] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [projects, setProjects] =
    useState<ProjectForm[]>([]);

  const [experiences, setExperiences] =
    useState<ExperienceForm[]>([]);

  const [education, setEducation] =
    useState<EducationForm[]>([]);

  const [skills, setSkills] =
    useState<SkillForm[]>([]);

  const [certifications, setCertifications] =
    useState<CertificationForm[]>([]);

  const [achievements, setAchievements] =
    useState<AchievementForm[]>([]);

  const [socialLinks, setSocialLinks] =
    useState<SocialForm[]>([]);

  const [selectedTemplate, setSelectedTemplate] =
    useState<PortfolioTemplateId>("premium-editorial");

  const markDirty = useCallback(() => {
    setDirty(true);
    setMessage("");
    setError("");
  }, []);

  const load = useCallback(async () => {
    if (!portfolioId) {
      setError("Invalid portfolio ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await getPortfolio(portfolioId);

      if (!response.success || !response.portfolio) {
        throw new Error(
          "Portfolio could not be loaded.",
        );
      }

      const data = response.portfolio;

      setPortfolio(data);

      setSelectedTemplate(
        data.template === "orbit"
          ? "orbit"
          : "premium-editorial",
      );

      setName(data.fullName || "");
      setUsername(data.username || "");
      setTitle(data.professionalTitle || "");
      setTagline(data.tagline || "");
      setBio(data.bio || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setLocation(data.location || "");
      setWebsite(data.website || "");

      setProjects(
        (data.projects || []).map((item) => ({
          id: item.id,
          title: item.title || "",
          description: item.description || "",
          role: item.role || "",
          technologies: item.technologies || [],
          githubUrl: item.githubUrl || "",
          liveUrl:
            item.projectUrl ||
            item.liveUrl ||
            "",
          startDate: formatDate(
            item.startDate,
          ),
          endDate: formatDate(
            item.endDate,
          ),
          featured: Boolean(
            item.featured,
          ),
        })),
      );

      setExperiences(
        (data.experiences || []).map(
          (item) => ({
            id: item.id,
            company: item.company || "",
            position: item.position || "",
            employmentType:
              (item as any).employmentType ||
              item.type ||
              "FULL_TIME",
            location:
              item.location || "",
            startDate: formatDate(
              item.startDate,
            ),
            endDate: formatDate(
              item.endDate,
            ),
            currentlyWorking:
              Boolean(
                (item as any)
                  .currentlyWorking,
              ) ||
              Boolean(
                (item as any).current,
              ),
            description:
              item.description || "",
            responsibilities:
              (item as any)
                .responsibilities || [],
            achievements:
              item.achievements || [],
          }),
        ),
      );

      setEducation(
        (data.education || []).map(
          (item) => ({
            id: item.id,
            institution:
              item.institution || "",
            degree:
              item.degree || "",
            field:
              (item as any).field ||
              (item as any).fieldOfStudy ||
              "",
            location:
              item.location || "",
            startDate: formatDate(
              item.startDate,
            ),
            endDate: formatDate(
              item.endDate,
            ),
            currentlyStudying:
              Boolean(
                (item as any)
                  .currentlyStudying,
              ) ||
              Boolean(
                (item as any).current,
              ),
            grade:
              (item as any).grade ||
              "",
            coursework:
              (item as any).coursework ||
              [],
            achievements:
              (item as any).achievements ||
              [],
          }),
        ),
      );

      setSkills(
        (data.skills || []).map(
          (item) => ({
            id: item.id,
            name: item.name || "",
            category:
              item.category || "OTHER",
            level:
              item.level ?? null,
            yearsOfExperience:
              (item as any)
                .yearsOfExperience ??
              item.yearsOfUse ??
              null,
          }),
        ),
      );

      setCertifications(
        (data.certifications || []).map(
          (item) => ({
            id: item.id,
            name: item.name || "",
            issuer:
              item.issuer || "",
            issueDate: formatDate(
              item.issueDate,
            ),
            expiryDate: formatDate(
              (item as any).expiryDate,
            ),
            credentialId:
              (item as any)
                .credentialId || "",
            credentialUrl:
              item.credentialUrl || "",
          }),
        ),
      );

      setAchievements(
        (data.achievements || []).map(
          (item) => ({
            id: item.id,
            title: item.title || "",
            description:
              item.description || "",
            organization:
              item.organization || "",
            date: formatDate(
              (item as any).date,
            ),
            credentialUrl:
              (item as any)
                .credentialUrl || "",
          }),
        ),
      );

      setSocialLinks(
        (data.socialLinks || []).map(
          (item) => ({
            id: item.id,
            platform:
              item.platform || "OTHER",
            label:
              item.label ||
              item.platform ||
              "",
            url: item.url || "",
          }),
        ),
      );

      setDirty(false);
      setMessage("");
    } catch (err: any) {
      console.error(
        "Portfolio editor load error:",
        err,
      );

      if (
        err?.response?.status === 401
      ) {
        router.replace(
          `/login?redirect=${encodeURIComponent(
            `/portfolio/edit/${portfolioId}`,
          )}`,
        );
        return;
      }

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load this portfolio.",
      );
    } finally {
      setLoading(false);
    }
  }, [portfolioId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleBeforeUnload = (
      event: BeforeUnloadEvent,
    ) => {
      if (!dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [dirty]);

  const payload = useMemo<CreatePortfolioPayload>(
    () => ({
      username:
        slugify(username) ||
        "portfolio",

      fullName: name.trim(),

      professionalTitle:
        title.trim(),

      tagline:
        tagline.trim(),

      bio:
        bio.trim(),

      email:
        email.trim(),

      phone:
        phone.trim(),

      location:
        location.trim(),

      website:
  website.trim()
    ? normalizeUrl(website)
    : "",

      projects:
        projects.map(
          (project, index) => ({
            id: project.id,
            title:
              project.title.trim(),
            description:
              project.description.trim(),
            role:
              project.role.trim() ||
              null,
            technologies:
              project.technologies,
            githubUrl:
  project.githubUrl.trim()
    ? normalizeUrl(
        project.githubUrl,
      )
    : null,
            liveUrl:
  project.liveUrl.trim()
    ? normalizeUrl(
        project.liveUrl,
      )
    : null,

projectUrl:
  project.liveUrl.trim()
    ? normalizeUrl(
        project.liveUrl,
      )
    : null,
            startDate:
              project.startDate || null,
            endDate:
              project.endDate || null,
            featured:
              project.featured,
            sortOrder: index,
          }),
        ),

      experiences:
        experiences.map(
          (item, index) => ({
            id: item.id,
            company:
              item.company.trim(),
            position:
              item.position.trim(),
            employmentType:
              item.employmentType,
            type:
              item.employmentType,
            location:
              item.location.trim() ||
              null,
            startDate:
              item.startDate || null,
            endDate:
              item.currentlyWorking
                ? null
                : item.endDate || null,
            currentlyWorking:
              item.currentlyWorking,
            current:
              item.currentlyWorking,
            description:
              item.description.trim() ||
              null,
            responsibilities:
              item.responsibilities,
            achievements:
              item.achievements,
            sortOrder: index,
          }),
        ),

      education:
        education.map(
          (item, index) => ({
            id: item.id,
            institution:
              item.institution.trim(),
            degree:
              item.degree.trim(),
            field:
              item.field.trim() ||
              null,
            fieldOfStudy:
              item.field.trim() ||
              null,
            location:
              item.location.trim() ||
              null,
            startDate:
              item.startDate || null,
            endDate:
              item.currentlyStudying
                ? null
                : item.endDate || null,
            currentlyStudying:
              item.currentlyStudying,
            current:
              item.currentlyStudying,
            grade:
              item.grade.trim() ||
              null,
            coursework:
              item.coursework,
            achievements:
              item.achievements,
            sortOrder: index,
          }),
        ),

      skills:
        skills.map(
          (item, index) => ({
            id: item.id,
            name:
              item.name.trim(),
            category:
              item.category,
            level:
              item.level,
            yearsOfExperience:
              item.yearsOfExperience,
            yearsOfUse:
              item.yearsOfExperience,
            sortOrder: index,
          }),
        ),

      certifications:
        certifications.map(
          (item, index) => ({
            id: item.id,
            name:
              item.name.trim(),
            issuer:
              item.issuer.trim(),
            issueDate:
              item.issueDate || null,
            expiryDate:
              item.expiryDate || null,
            credentialId:
              item.credentialId.trim() ||
              null,
            credentialUrl:
  item.credentialUrl.trim()
    ? normalizeUrl(
        item.credentialUrl,
      )
    : null,
            sortOrder: index,
          }),
        ),

      achievements:
        achievements.map(
          (item, index) => ({
            id: item.id,
            title:
              item.title.trim(),
            description:
              item.description.trim() ||
              null,
            organization:
              item.organization.trim() ||
              null,
            date:
              item.date || null,
            credentialUrl:
  item.credentialUrl.trim()
    ? normalizeUrl(
        item.credentialUrl,
      )
    : null,
            sortOrder: index,
          }),
        ),

      socialLinks:
        socialLinks.map(
          (item, index) => ({
            id: item.id,
            platform:
              item.platform,
            label:
              item.label.trim() ||
              item.platform,
            url:
  item.url.trim()
    ? normalizeUrl(item.url)
    : "",
          }),
        ),

      template:
        selectedTemplate,

      templateVersion:
        1,

      seo: {
        title:
          `${name.trim() || "Portfolio"} — Portfolio`,
        description:
          tagline.trim() ||
          bio.trim() ||
          `${name.trim() || "Professional"}'s portfolio.`,
        keywords: [],
        noIndex: !(
          portfolio?.status ===
          "PUBLISHED"
        ),
      },

      settings: {
        showEmail: true,
        showPhone: Boolean(
          phone.trim(),
        ),
        showLocation: Boolean(
          location.trim(),
        ),
        showProjects: true,
        showExperience: true,
        showEducation: true,
        showSkills: true,
        showCertifications: true,
        showAchievements: true,
        showSocialLinks: true,
        showBranding: true,
        contactEnabled: Boolean(
          email.trim(),
        ),
      },
    }),
    [
      name,
      username,
      title,
      tagline,
      bio,
      email,
      phone,
      location,
      website,
      projects,
      experiences,
      education,
      skills,
      certifications,
      achievements,
      socialLinks,
      selectedTemplate,
      portfolio?.status,
    ],
  );

  const previewPortfolio = useMemo(
    () => ({
      fullName: name.trim() || "Your Name",
      professionalTitle:
        title.trim() || "Creative Technologist",
      tagline: tagline.trim(),
      bio: bio.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      website: website.trim(),
      projects: projects.map((item, index) => ({
        id: item.id || `project-${index}`,
        title: item.title.trim() || "Untitled project",
        description: item.description.trim(),
        shortDescription: item.description.trim(),
        role: item.role.trim(),
        technologies: item.technologies,
        githubUrl: item.githubUrl.trim(),
        liveUrl: item.liveUrl.trim(),
        projectUrl: item.liveUrl.trim(),
        startDate: item.startDate,
        endDate: item.endDate,
        featured: item.featured,
      })),
      experiences: experiences.map((item, index) => ({
        id: item.id || `experience-${index}`,
        company: item.company.trim(),
        position: item.position.trim(),
        employmentType: item.employmentType,
        type: item.employmentType,
        location: item.location.trim(),
        startDate: item.startDate,
        endDate: item.endDate,
        currentlyWorking: item.currentlyWorking,
        current: item.currentlyWorking,
        description: item.description.trim(),
        responsibilities: item.responsibilities,
        achievements: item.achievements,
      })),
      education: education.map((item, index) => ({
        id: item.id || `education-${index}`,
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        field: item.field.trim(),
        fieldOfStudy: item.field.trim(),
        location: item.location.trim(),
        startDate: item.startDate,
        endDate: item.endDate,
        currentlyStudying: item.currentlyStudying,
        current: item.currentlyStudying,
        grade: item.grade.trim(),
        coursework: item.coursework,
        achievements: item.achievements,
      })),
      skills: skills.map((item, index) => ({
        id: item.id || `skill-${index}`,
        name: item.name.trim(),
        category: item.category,
        level: item.level,
        yearsOfExperience: item.yearsOfExperience,
        yearsOfUse: item.yearsOfExperience,
      })),
      socialLinks: socialLinks.map((item, index) => ({
        id: item.id || `social-${index}`,
        platform: item.platform,
        label: item.label.trim() || item.platform,
        url: item.url.trim(),
      })),
    }),
    [
      name,
      title,
      tagline,
      bio,
      email,
      phone,
      location,
      website,
      projects,
      experiences,
      education,
      skills,
      socialLinks,
    ],
  );

  const validateAll = useCallback(() => {
    if (name.trim().length < 2) {
      return "Please enter your full name.";
    }

    const cleanUsername =
      slugify(username);

    if (cleanUsername.length < 3) {
      return "Your public username must contain at least 3 characters.";
    }

    if (!title.trim()) {
      return "Please enter your professional title.";
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim(),
      )
    ) {
      return "Please enter a valid email address.";
    }

    const urls = [
      website,
      ...projects.flatMap((project) => [
        project.githubUrl,
        project.liveUrl,
      ]),
      ...certifications.map(
        (item) =>
          item.credentialUrl,
      ),
      ...achievements.map(
        (item) =>
          item.credentialUrl,
      ),
      ...socialLinks.map(
        (item) => item.url,
      ),
    ];

    const invalidUrl =
      urls.find(
        (value) =>
          value.trim() &&
          !validUrl(value),
      );

    if (invalidUrl) {
      return `This URL is invalid: ${invalidUrl}. Use a website/profile URL such as https://linkedin.com/in/yourname or www.linkedin.com/in/yourname.`;
    }

    return "";
  }, [
    name,
    username,
    title,
    email,
    website,
    projects,
    certifications,
    achievements,
    socialLinks,
  ]);

  const save = useCallback(
    async (
      shouldPublish = false,
    ) => {
      const validation =
        validateAll();

      if (validation) {
        setError(validation);
        setMessage("");
        return;
      }

      try {
        if (shouldPublish) {
          setPublishing(true);
        } else {
          setSaving(true);
        }

        setError("");
        setMessage("");

        if (shouldPublish) {
          const saved =
            await updatePortfolio(
              portfolioId,
              payload,
            );

          if (saved?.portfolio) {
            setPortfolio(
              saved.portfolio,
            );
          }

          const published =
            await publishPortfolio(
              portfolioId,
            );

          if (
            published?.portfolio
          ) {
            setPortfolio(
              published.portfolio,
            );
          }

          setMessage(
            "Portfolio published successfully.",
          );
        } else {
          const response =
            await updatePortfolio(
              portfolioId,
              payload,
            );

          if (response?.portfolio) {
            setPortfolio(
              response.portfolio,
            );
          }

          setMessage(
            "Changes saved.",
          );
        }

        setDirty(false);

        if (
          shouldPublish
        ) {
          window.setTimeout(() => {
            window.location.href =
              `/p/${encodeURIComponent(
                slugify(username),
              )}`;
          }, 700);
        }
      } catch (err: any) {
        console.error(
          "Portfolio save error:",
          err,
        );

        if (
          err?.response?.status === 401
        ) {
          router.replace(
            `/login?redirect=${encodeURIComponent(
              `/portfolio/edit/${portfolioId}`,
            )}`,
          );

          return;
        }

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Unable to save your portfolio.",
        );
      } finally {
        setSaving(false);
        setPublishing(false);
      }
    },
    [
      validateAll,
      portfolioId,
      payload,
      username,
      router,
    ],
  );

  const updateProject = (
    index: number,
    patch: Partial<ProjectForm>,
  ) => {
    setProjects((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  const updateExperience = (
    index: number,
    patch: Partial<ExperienceForm>,
  ) => {
    setExperiences((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  const updateEducation = (
    index: number,
    patch: Partial<EducationForm>,
  ) => {
    setEducation((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  const updateSkill = (
    index: number,
    patch: Partial<SkillForm>,
  ) => {
    setSkills((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  const updateCertification = (
    index: number,
    patch: Partial<CertificationForm>,
  ) => {
    setCertifications((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  const updateAchievement = (
    index: number,
    patch: Partial<AchievementForm>,
  ) => {
    setAchievements((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  const updateSocial = (
    index: number,
    patch: Partial<SocialForm>,
  ) => {
    setSocialLinks((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? { ...item, ...patch }
            : item,
      ),
    );

    markDirty();
  };

  if (loading) {
    return (
      <main className={styles.loadingScreen}>
        <div className={styles.loadingBox}>
          <Loader2
            size={24}
            className={styles.spin}
          />

          <span>
            Loading your portfolioâ€¦
          </span>
        </div>
      </main>
    );
  }

  if (!portfolio) {
    return (
      <main className={styles.loadingScreen}>
        <div className={styles.errorScreen}>
          <span>
            PLUTEN / PORTFOLIO
          </span>

          <h1>
            Portfolio unavailable.
          </h1>

          <p>
            {error ||
              "This portfolio could not be loaded."}
          </p>

          <Link
            href="/portfolio"
            className={styles.darkButton}
          >
            Back to portfolios
            <ArrowLeft size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const isPublished =
    portfolio.status ===
    "PUBLISHED";

  return (
    <main className={styles.page}>
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <Link
            href="/portfolio"
            className={styles.backButton}
          >
            <ArrowLeft size={17} />
          </Link>

          <div>
            <div className={styles.brandLabel}>
              PLUTEN / PORTFOLIO
            </div>

            <div className={styles.headerName}>
              {name || "Untitled portfolio"}
            </div>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <span
            className={
              dirty
                ? styles.saveStateDirty
                : styles.saveState
            }
          >
            {dirty
              ? "Unsaved changes"
              : message ||
                "All changes saved"}
          </span>
        </div>

        <div className={styles.headerActions}>
          {isPublished && (
            <Link
              href={`/p/${encodeURIComponent(
                username,
              )}`}
              target="_blank"
              rel="noreferrer"
              className={styles.outlineButton}
            >
              <ExternalLink size={15} />
              View live
            </Link>
          )}

          <button
            type="button"
            className={styles.outlineButton}
            disabled={
              saving ||
              publishing
            }
            onClick={() =>
              void save(false)
            }
          >
            {saving ? (
              <Loader2
                size={15}
                className={styles.spin}
              />
            ) : (
              <Save size={15} />
            )}

            Save
          </button>

          <button
            type="button"
            className={
              styles.publishButton
            }
            disabled={
              saving ||
              publishing
            }
            onClick={() =>
              void save(true)
            }
          >
            {publishing ? (
              <Loader2
                size={15}
                className={styles.spin}
              />
            ) : (
              <Sparkles size={15} />
            )}

            {isPublished
              ? "Update & publish"
              : "Publish"}
          </button>
        </div>
      </header>

      <div className={styles.editorLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarIntro}>
            <span>
              BUILD YOUR PORTFOLIO
            </span>

            <p>
              Add the information that should appear
              on your public website.
            </p>
          </div>

          <nav className={styles.sectionNav}>
            {SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const active =
                activeSection ===
                section.id;

              return (
                <button
                  type="button"
                  key={section.id}
                  className={
                    active
                      ? styles.sectionButtonActive
                      : styles.sectionButton
                  }
                  onClick={() =>
                    setActiveSection(
                      section.id,
                    )
                  }
                >
                  <span
                    className={
                      styles.sectionNumber
                    }
                  >
                    {String(
                      index + 1,
                    ).padStart(2, "0")}
                  </span>

                  <Icon
                    size={16}
                    strokeWidth={1.7}
                  />

                  <span
                    className={
                      styles.sectionButtonText
                    }
                  >
                    <strong>
                      {section.label}
                    </strong>

                    <small>
                      {section.description}
                    </small>
                  </span>

                  {active && (
                    <ArrowRight
                      size={15}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className={styles.formArea}>
          {error && (
            <div className={styles.errorBanner}>
              <div>
                <strong>
                  Couldn't save those changes.
                </strong>

                <span>
                  {error}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activeSection ===
            "profile" && (
            <ProfileSection
              name={name}
              setName={(value) => {
                setName(value);
                markDirty();
              }}
              username={username}
              setUsername={(value) => {
                setUsername(
                  slugify(value),
                );
                markDirty();
              }}
              title={title}
              setTitle={(value) => {
                setTitle(value);
                markDirty();
              }}
              email={email}
              setEmail={(value) => {
                setEmail(value);
                markDirty();
              }}
              website={website}
              setWebsite={(value) => {
                setWebsite(value);
                markDirty();
              }}
              location={location}
              setLocation={(value) => {
                setLocation(value);
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "about" && (
            <AboutSection
              tagline={tagline}
              setTagline={(value) => {
                setTagline(value);
                markDirty();
              }}
              bio={bio}
              setBio={(value) => {
                setBio(value);
                markDirty();
              }}
              phone={phone}
              setPhone={(value) => {
                setPhone(value);
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "projects" && (
            <ProjectsSection
              projects={projects}
              updateProject={
                updateProject
              }
              addProject={() => {
                setProjects((current) => [
                  ...current,
                  emptyProject(),
                ]);
                markDirty();
              }}
              removeProject={(index) => {
                setProjects(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "experience" && (
            <ExperienceSection
              experiences={
                experiences
              }
              updateExperience={
                updateExperience
              }
              addExperience={() => {
                setExperiences(
                  (current) => [
                    ...current,
                    emptyExperience(),
                  ],
                );
                markDirty();
              }}
              removeExperience={(
                index,
              ) => {
                setExperiences(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "education" && (
            <EducationSection
              education={education}
              updateEducation={
                updateEducation
              }
              addEducation={() => {
                setEducation(
                  (current) => [
                    ...current,
                    emptyEducation(),
                  ],
                );
                markDirty();
              }}
              removeEducation={(
                index,
              ) => {
                setEducation(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "skills" && (
            <SkillsSection
              skills={skills}
              updateSkill={
                updateSkill
              }
              addSkill={() => {
                setSkills((current) => [
                  ...current,
                  emptySkill(),
                ]);
                markDirty();
              }}
              removeSkill={(index) => {
                setSkills(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "certifications" && (
            <CertificationsSection
              certifications={
                certifications
              }
              updateCertification={
                updateCertification
              }
              addCertification={() => {
                setCertifications(
                  (current) => [
                    ...current,
                    emptyCertification(),
                  ],
                );
                markDirty();
              }}
              removeCertification={(
                index,
              ) => {
                setCertifications(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "achievements" && (
            <AchievementsSection
              achievements={
                achievements
              }
              updateAchievement={
                updateAchievement
              }
              addAchievement={() => {
                setAchievements(
                  (current) => [
                    ...current,
                    emptyAchievement(),
                  ],
                );
                markDirty();
              }}
              removeAchievement={(
                index,
              ) => {
                setAchievements(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
            "social" && (
            <SocialSection
              socialLinks={
                socialLinks
              }
              updateSocial={
                updateSocial
              }
              addSocial={() => {
                setSocialLinks(
                  (current) => [
                    ...current,
                    emptySocial(),
                  ],
                );
                markDirty();
              }}
              removeSocial={(index) => {
                setSocialLinks(
                  (current) =>
                    current.filter(
                      (_, itemIndex) =>
                        itemIndex !==
                        index,
                    ),
                );
                markDirty();
              }}
            />
          )}

          {activeSection ===
  "template" && (
  <div
    className={
      styles.templateSelection
    }
  >
    <PortfolioTemplateSelector
      selected={
        selectedTemplate
      }
      portfolio={
        previewPortfolio
      }
      onChange={(
        template,
      ) => {
        setSelectedTemplate(
          template,
        );
        markDirty();
      }}
    />
  </div>
)}

          {activeSection ===
            "review" && (
            <ReviewSection
              name={name}
              username={
                slugify(username)
              }
              title={title}
              tagline={tagline}
              website={website}
              projects={
                projects
              }
              experiences={
                experiences
              }
              education={
                education
              }
              skills={skills}
              certifications={
                certifications
              }
              achievements={
                achievements
              }
              socialLinks={
                socialLinks
              }
              onPublish={() =>
                void save(true)
              }
              publishing={
                publishing
              }
              ready={
                validateAll() === ""
              }
            />
          )}
        </section>

        {selectedTemplate ===
"orbit" ? (
  <aside
    className={
      styles.orbitPreviewPanel
    }
  >
    <div
      className={
        styles.previewHeader
      }
    >
      <div>
        <span>
          LIVE PREVIEW
        </span>

        <strong>
          Orbit
        </strong>
      </div>

      <span
        className={
          styles.liveDot
        }
      >
        LIVE
      </span>
    </div>

    <div
      className={
        styles.orbitPreviewStage
      }
    >
      <OrbitTemplatePreview
  portfolio={previewPortfolio}
/>

    </div>
  </aside>
) : (
  <PreviewPanel
    name={name}
    username={slugify(
      username,
    )}
    title={title}
    tagline={tagline}
    bio={bio}
    location={location}
    email={email}
    projects={
      projects
    }
    experiences={
      experiences
    }
    skills={skills}
    socialLinks={
      socialLinks
    }
  />
)}
      </div>
    </main>
  );
}

function ProfileSection({
  name,
  setName,
  username,
  setUsername,
  title,
  setTitle,
  email,
  setEmail,
  website,
  setWebsite,
  location,
  setLocation,
}: {
  name: string;
  setName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  website: string;
  setWebsite: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
}) {
  return (
    <EditorSection
      number="01"
      title="Build your identity."
      description="These details form the first impression people get when they open your portfolio."
    >
      <div className={styles.formGrid}>
        <Field
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Your full name"
          required
        />

        <Field
          label="Professional title"
          value={title}
          onChange={setTitle}
          placeholder="Full Stack Developer"
          required
        />

        <div
          className={styles.fullWidth}
        >
          <label className={styles.fieldLabel}>
            <span>
              Public username
            </span>

            <div
              className={
                styles.usernameField
              }
            >
              <span>
                pluten.site/p/
              </span>

              <input
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target
                      .value,
                  )
                }
                placeholder="yourname"
                autoComplete="off"
              />
            </div>

            <small>
              Letters, numbers and hyphens.
              This becomes your public URL.
            </small>
          </label>
        </div>

        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
        />

        <Field
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="Hyderabad, India"
        />

        <Field
          label="Website"
          value={website}
          onChange={setWebsite}
          placeholder="https://example.com"
          type="url"
        />
      </div>
    </EditorSection>
  );
}

function AboutSection({
  tagline,
  setTagline,
  bio,
  setBio,
  phone,
  setPhone,
}: {
  tagline: string;
  setTagline: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
}) {
  return (
    <EditorSection
      number="02"
      title="Tell your story."
      description="Give visitors enough context to understand who you are and what you bring to the table."
    >
      <div className={styles.formStack}>
        <Field
          label="Tagline"
          value={tagline}
          onChange={setTagline}
          placeholder="I build modern digital products."
        />

        <TextareaField
          label="About you"
          value={bio}
          onChange={setBio}
          placeholder="Write a concise professional introduction..."
          rows={9}
        />

        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+91 98765 43210"
          type="tel"
        />
      </div>
    </EditorSection>
  );
}

function ProjectsSection({
  projects,
  updateProject,
  addProject,
  removeProject,
}: {
  projects: ProjectForm[];
  updateProject: (
    index: number,
    patch: Partial<ProjectForm>,
  ) => void;
  addProject: () => void;
  removeProject: (index: number) => void;
}) {
  return (
    <EditorSection
      number="03"
      title="Show the work."
      description="Projects are the strongest proof of what you can actually build."
      actionLabel="Add project"
      onAction={addProject}
    >
      {projects.length === 0 ? (
        <EmptySection
          title="No projects yet."
          description="Add your strongest projects. You can include GitHub and live URLs."
          actionLabel="Add your first project"
          onAction={addProject}
        />
      ) : (
        <div className={styles.repeatableList}>
          {projects.map(
            (project, index) => (
              <article
                key={
                  project.id ||
                  `project-${index}`
                }
                className={
                  styles.repeatableCard
                }
              >
                <div
                  className={
                    styles.repeatableHeader
                  }
                >
                  <div>
                    <span>
                      PROJECT{" "}
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <strong>
                      {project.title ||
                        "Untitled project"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconDanger
                    }
                    onClick={() =>
                      removeProject(
                        index,
                      )
                    }
                    aria-label="Remove project"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <Field
                    label="Project title"
                    value={
                      project.title
                    }
                    onChange={(value) =>
                      updateProject(
                        index,
                        {
                          title:
                            value,
                        },
                      )
                    }
                    placeholder="X-Airlines"
                    required
                  />

                  <Field
                    label="Your role"
                    value={
                      project.role
                    }
                    onChange={(value) =>
                      updateProject(
                        index,
                        {
                          role:
                            value,
                        },
                      )
                    }
                    placeholder="Lead Developer"
                  />

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Description"
                      value={
                        project.description
                      }
                      onChange={(
                        value,
                      ) =>
                        updateProject(
                          index,
                          {
                            description:
                              value,
                          },
                        )
                      }
                      placeholder="What did you build? What problem did it solve?"
                      rows={5}
                    />
                  </div>

                  <TagInput
                    label="Technologies"
                    values={
                      project.technologies
                    }
                    onChange={(
                      values,
                    ) =>
                      updateProject(
                        index,
                        {
                          technologies:
                            values,
                        },
                      )
                    }
                    placeholder="React"
                  />

                  <Field
                    label="GitHub URL"
                    value={
                      project.githubUrl
                    }
                    onChange={(
                      value,
                    ) =>
                      updateProject(
                        index,
                        {
                          githubUrl:
                            value,
                        },
                      )
                    }
                    placeholder="https://github.com/..."
                    type="url"
                  />

                  <Field
                    label="Live project URL"
                    value={
                      project.liveUrl
                    }
                    onChange={(
                      value,
                    ) =>
                      updateProject(
                        index,
                        {
                          liveUrl:
                            value,
                        },
                      )
                    }
                    placeholder="https://..."
                    type="url"
                  />

                  <Field
                    label="Start date"
                    value={
                      project.startDate
                    }
                    onChange={(
                      value,
                    ) =>
                      updateProject(
                        index,
                        {
                          startDate:
                            value,
                        },
                      )
                    }
                    type="date"
                  />

                  <Field
                    label="End date"
                    value={
                      project.endDate
                    }
                    onChange={(
                      value,
                    ) =>
                      updateProject(
                        index,
                        {
                          endDate:
                            value,
                        },
                      )
                    }
                    type="date"
                  />
                </div>

                <Toggle
                  label="Featured project"
                  description="Give this project priority in your public portfolio."
                  checked={
                    project.featured
                  }
                  onChange={(
                    checked,
                  ) =>
                    updateProject(
                      index,
                      {
                        featured:
                          checked,
                      },
                    )
                  }
                />
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function ExperienceSection({
  experiences,
  updateExperience,
  addExperience,
  removeExperience,
}: {
  experiences: ExperienceForm[];
  updateExperience: (
    index: number,
    patch: Partial<ExperienceForm>,
  ) => void;
  addExperience: () => void;
  removeExperience: (index: number) => void;
}) {
  return (
    <EditorSection
      number="04"
      title="Add your experience."
      description="Show recruiters and clients where you've applied your skills."
      actionLabel="Add experience"
      onAction={addExperience}
    >
      {experiences.length === 0 ? (
        <EmptySection
          title="No experience added."
          description="Add internships, jobs, freelance roles or other professional work."
          actionLabel="Add experience"
          onAction={addExperience}
        />
      ) : (
        <div className={styles.repeatableList}>
          {experiences.map(
            (item, index) => (
              <article
                key={
                  item.id ||
                  `experience-${index}`
                }
                className={
                  styles.repeatableCard
                }
              >
                <div
                  className={
                    styles.repeatableHeader
                  }
                >
                  <div>
                    <span>
                      EXPERIENCE{" "}
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <strong>
                      {item.position ||
                        "Untitled role"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconDanger
                    }
                    onClick={() =>
                      removeExperience(
                        index,
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <Field
                    label="Company"
                    value={
                      item.company
                    }
                    onChange={(value) =>
                      updateExperience(
                        index,
                        {
                          company:
                            value,
                        },
                      )
                    }
                    placeholder="Company name"
                    required
                  />

                  <Field
                    label="Position"
                    value={
                      item.position
                    }
                    onChange={(value) =>
                      updateExperience(
                        index,
                        {
                          position:
                            value,
                        },
                      )
                    }
                    placeholder="Software Engineer"
                    required
                  />

                  <SelectField
                    label="Employment type"
                    value={
                      item.employmentType
                    }
                    onChange={(value) =>
                      updateExperience(
                        index,
                        {
                          employmentType:
                            value,
                        },
                      )
                    }
                    options={EMPLOYMENT_TYPES.map(
                      (value) => ({
                        value,
                        label:
                          value.replace(
                            /_/g,
                            " ",
                          ),
                      }),
                    )}
                  />

                  <Field
                    label="Location"
                    value={
                      item.location
                    }
                    onChange={(value) =>
                      updateExperience(
                        index,
                        {
                          location:
                            value,
                        },
                      )
                    }
                    placeholder="Hyderabad, India"
                  />

                  <Field
                    label="Start date"
                    value={
                      item.startDate
                    }
                    onChange={(value) =>
                      updateExperience(
                        index,
                        {
                          startDate:
                            value,
                        },
                      )
                    }
                    type="date"
                  />

                  {!item.currentlyWorking && (
                    <Field
                      label="End date"
                      value={
                        item.endDate
                      }
                      onChange={(
                        value,
                      ) =>
                        updateExperience(
                          index,
                          {
                            endDate:
                              value,
                          },
                        )
                      }
                      type="date"
                    />
                  )}

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Role summary"
                      value={
                        item.description
                      }
                      onChange={(
                        value,
                      ) =>
                        updateExperience(
                          index,
                          {
                            description:
                              value,
                          },
                        )
                      }
                      placeholder="Describe what you worked on..."
                      rows={4}
                    />
                  </div>

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Responsibilities"
                      value={joinLines(
                        item.responsibilities,
                      )}
                      onChange={(
                        value,
                      ) =>
                        updateExperience(
                          index,
                          {
                            responsibilities:
                              splitLines(
                                value,
                              ),
                          },
                        )
                      }
                      placeholder="One responsibility per line"
                      rows={5}
                    />
                  </div>

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Achievements"
                      value={joinLines(
                        item.achievements,
                      )}
                      onChange={(
                        value,
                      ) =>
                        updateExperience(
                          index,
                          {
                            achievements:
                              splitLines(
                                value,
                              ),
                          },
                        )
                      }
                      placeholder="One achievement per line"
                      rows={5}
                    />
                  </div>
                </div>

                <Toggle
                  label="Currently working here"
                  description="Hide the end date from the public portfolio."
                  checked={
                    item.currentlyWorking
                  }
                  onChange={(
                    checked,
                  ) =>
                    updateExperience(
                      index,
                      {
                        currentlyWorking:
                          checked,
                      },
                    )
                  }
                />
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function EducationSection({
  education,
  updateEducation,
  addEducation,
  removeEducation,
}: {
  education: EducationForm[];
  updateEducation: (
    index: number,
    patch: Partial<EducationForm>,
  ) => void;
  addEducation: () => void;
  removeEducation: (index: number) => void;
}) {
  return (
    <EditorSection
      number="05"
      title="Show your foundation."
      description="Education, degrees and academic milestones help provide professional context."
      actionLabel="Add education"
      onAction={addEducation}
    >
      {education.length === 0 ? (
        <EmptySection
          title="No education added."
          description="Add your university, degree, field and academic highlights."
          actionLabel="Add education"
          onAction={addEducation}
        />
      ) : (
        <div className={styles.repeatableList}>
          {education.map(
            (item, index) => (
              <article
                key={
                  item.id ||
                  `education-${index}`
                }
                className={
                  styles.repeatableCard
                }
              >
                <div
                  className={
                    styles.repeatableHeader
                  }
                >
                  <div>
                    <span>
                      EDUCATION{" "}
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <strong>
                      {item.degree ||
                        "Untitled education"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconDanger
                    }
                    onClick={() =>
                      removeEducation(
                        index,
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <Field
                    label="Institution"
                    value={
                      item.institution
                    }
                    onChange={(value) =>
                      updateEducation(
                        index,
                        {
                          institution:
                            value,
                        },
                      )
                    }
                    placeholder="KLH University"
                    required
                  />

                  <Field
                    label="Degree"
                    value={
                      item.degree
                    }
                    onChange={(value) =>
                      updateEducation(
                        index,
                        {
                          degree:
                            value,
                        },
                      )
                    }
                    placeholder="B.Tech CSE"
                    required
                  />

                  <Field
                    label="Field of study"
                    value={
                      item.field
                    }
                    onChange={(value) =>
                      updateEducation(
                        index,
                        {
                          field:
                            value,
                        },
                      )
                    }
                    placeholder="Computer Science"
                  />

                  <Field
                    label="Location"
                    value={
                      item.location
                    }
                    onChange={(value) =>
                      updateEducation(
                        index,
                        {
                          location:
                            value,
                        },
                      )
                    }
                    placeholder="Hyderabad, India"
                  />

                  <Field
                    label="Start date"
                    value={
                      item.startDate
                    }
                    onChange={(value) =>
                      updateEducation(
                        index,
                        {
                          startDate:
                            value,
                        },
                      )
                    }
                    type="date"
                  />

                  {!item.currentlyStudying && (
                    <Field
                      label="End date"
                      value={
                        item.endDate
                      }
                      onChange={(
                        value,
                      ) =>
                        updateEducation(
                          index,
                          {
                            endDate:
                              value,
                          },
                        )
                      }
                      type="date"
                    />
                  )}

                  <Field
                    label="Grade / CGPA"
                    value={
                      item.grade
                    }
                    onChange={(value) =>
                      updateEducation(
                        index,
                        {
                          grade:
                            value,
                        },
                      )
                    }
                    placeholder="9.14"
                  />

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Coursework"
                      value={joinLines(
                        item.coursework,
                      )}
                      onChange={(
                        value,
                      ) =>
                        updateEducation(
                          index,
                          {
                            coursework:
                              splitLines(
                                value,
                              ),
                          },
                        )
                      }
                      placeholder="One subject per line"
                      rows={4}
                    />
                  </div>

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Academic achievements"
                      value={joinLines(
                        item.achievements,
                      )}
                      onChange={(
                        value,
                      ) =>
                        updateEducation(
                          index,
                          {
                            achievements:
                              splitLines(
                                value,
                              ),
                          },
                        )
                      }
                      placeholder="One achievement per line"
                      rows={4}
                    />
                  </div>
                </div>

                <Toggle
                  label="Currently studying"
                  description="Keep this education entry open-ended."
                  checked={
                    item.currentlyStudying
                  }
                  onChange={(
                    checked,
                  ) =>
                    updateEducation(
                      index,
                      {
                        currentlyStudying:
                          checked,
                      },
                    )
                  }
                />
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function SkillsSection({
  skills,
  updateSkill,
  addSkill,
  removeSkill,
}: {
  skills: SkillForm[];
  updateSkill: (
    index: number,
    patch: Partial<SkillForm>,
  ) => void;
  addSkill: () => void;
  removeSkill: (index: number) => void;
}) {
  return (
    <EditorSection
      number="06"
      title="Show what you know."
      description="Group the technologies you actually use. Avoid filling the portfolio with every technology you've ever touched."
      actionLabel="Add skill"
      onAction={addSkill}
    >
      {skills.length === 0 ? (
        <EmptySection
          title="No skills added."
          description="Add languages, frameworks, databases, cloud tools and other capabilities."
          actionLabel="Add a skill"
          onAction={addSkill}
        />
      ) : (
        <div className={styles.repeatableList}>
          {skills.map(
            (skill, index) => (
              <article
                key={
                  skill.id ||
                  `skill-${index}`
                }
                className={
                  styles.skillCard
                }
              >
                <div
                  className={
                    styles.skillIndex
                  }
                >
                  {String(
                    index + 1,
                  ).padStart(
                    2,
                    "0",
                  )}
                </div>

                <div
                  className={
                    styles.skillForm
                  }
                >
                  <Field
                    label="Skill"
                    value={
                      skill.name
                    }
                    onChange={(value) =>
                      updateSkill(
                        index,
                        {
                          name:
                            value,
                        },
                      )
                    }
                    placeholder="React"
                  />

                  <SelectField
                    label="Category"
                    value={
                      skill.category
                    }
                    onChange={(value) =>
                      updateSkill(
                        index,
                        {
                          category:
                            value,
                        },
                      )
                    }
                    options={SKILL_CATEGORIES.map(
                      (value) => ({
                        value,
                        label:
                          value.replace(
                            /_/g,
                            " ",
                          ),
                      }),
                    )}
                  />

                  <Field
                    label="Level"
                    value={
                      skill.level ===
                      null
                        ? ""
                        : String(
                            skill.level,
                          )
                    }
                    onChange={(value) =>
                      updateSkill(
                        index,
                        {
                          level:
                            value
                              ? Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(
                                      value,
                                    ),
                                  ),
                                )
                              : null,
                        },
                      )
                    }
                    type="number"
                    placeholder="90"
                  />

                  <Field
                    label="Years"
                    value={
                      skill.yearsOfExperience ===
                      null
                        ? ""
                        : String(
                            skill.yearsOfExperience,
                          )
                    }
                    onChange={(value) =>
                      updateSkill(
                        index,
                        {
                          yearsOfExperience:
                            value
                              ? Number(
                                  value,
                                )
                              : null,
                        },
                      )
                    }
                    type="number"
                    placeholder="2"
                  />
                </div>

                <button
                  type="button"
                  className={
                    styles.iconDanger
                  }
                  onClick={() =>
                    removeSkill(
                      index,
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function CertificationsSection({
  certifications,
  updateCertification,
  addCertification,
  removeCertification,
}: {
  certifications: CertificationForm[];
  updateCertification: (
    index: number,
    patch: Partial<CertificationForm>,
  ) => void;
  addCertification: () => void;
  removeCertification: (index: number) => void;
}) {
  return (
    <EditorSection
      number="07"
      title="Add credibility."
      description="Credentials can reinforce your skills when they're relevant to the work you want."
      actionLabel="Add certificate"
      onAction={addCertification}
    >
      {certifications.length ===
      0 ? (
        <EmptySection
          title="No certifications added."
          description="Add certificates, courses or professional credentials."
          actionLabel="Add certification"
          onAction={addCertification}
        />
      ) : (
        <div className={styles.repeatableList}>
          {certifications.map(
            (
              item,
              index,
            ) => (
              <article
                key={
                  item.id ||
                  `cert-${index}`
                }
                className={
                  styles.repeatableCard
                }
              >
                <div
                  className={
                    styles.repeatableHeader
                  }
                >
                  <div>
                    <span>
                      CERTIFICATION{" "}
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <strong>
                      {item.name ||
                        "Untitled certification"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconDanger
                    }
                    onClick={() =>
                      removeCertification(
                        index,
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <Field
                    label="Certification"
                    value={
                      item.name
                    }
                    onChange={(value) =>
                      updateCertification(
                        index,
                        {
                          name:
                            value,
                        },
                      )
                    }
                    placeholder="AWS Certified Developer"
                  />

                  <Field
                    label="Issuer"
                    value={
                      item.issuer
                    }
                    onChange={(value) =>
                      updateCertification(
                        index,
                        {
                          issuer:
                            value,
                        },
                      )
                    }
                    placeholder="Amazon Web Services"
                  />

                  <Field
                    label="Issue date"
                    value={
                      item.issueDate
                    }
                    onChange={(value) =>
                      updateCertification(
                        index,
                        {
                          issueDate:
                            value,
                        },
                      )
                    }
                    type="date"
                  />

                  <Field
                    label="Expiry date"
                    value={
                      item.expiryDate
                    }
                    onChange={(value) =>
                      updateCertification(
                        index,
                        {
                          expiryDate:
                            value,
                        },
                      )
                    }
                    type="date"
                  />

                  <Field
                    label="Credential ID"
                    value={
                      item.credentialId
                    }
                    onChange={(value) =>
                      updateCertification(
                        index,
                        {
                          credentialId:
                            value,
                        },
                      )
                    }
                    placeholder="Credential ID"
                  />

                  <Field
                    label="Credential URL"
                    value={
                      item.credentialUrl
                    }
                    onChange={(value) =>
                      updateCertification(
                        index,
                        {
                          credentialUrl:
                            value,
                        },
                      )
                    }
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function AchievementsSection({
  achievements,
  updateAchievement,
  addAchievement,
  removeAchievement,
}: {
  achievements: AchievementForm[];
  updateAchievement: (
    index: number,
    patch: Partial<AchievementForm>,
  ) => void;
  addAchievement: () => void;
  removeAchievement: (index: number) => void;
}) {
  return (
    <EditorSection
      number="08"
      title="Show the milestones."
      description="Awards, competitions, publications and meaningful achievements can add strong context."
      actionLabel="Add achievement"
      onAction={addAchievement}
    >
      {achievements.length ===
      0 ? (
        <EmptySection
          title="No achievements added."
          description="You can leave this section empty if it doesn't strengthen your story."
          actionLabel="Add achievement"
          onAction={addAchievement}
        />
      ) : (
        <div className={styles.repeatableList}>
          {achievements.map(
            (
              item,
              index,
            ) => (
              <article
                key={
                  item.id ||
                  `achievement-${index}`
                }
                className={
                  styles.repeatableCard
                }
              >
                <div
                  className={
                    styles.repeatableHeader
                  }
                >
                  <div>
                    <span>
                      ACHIEVEMENT{" "}
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <strong>
                      {item.title ||
                        "Untitled achievement"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconDanger
                    }
                    onClick={() =>
                      removeAchievement(
                        index,
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <Field
                    label="Title"
                    value={
                      item.title
                    }
                    onChange={(value) =>
                      updateAchievement(
                        index,
                        {
                          title:
                            value,
                        },
                      )
                    }
                    placeholder="Winner — Hackathon"
                  />

                  <Field
                    label="Organization"
                    value={
                      item.organization
                    }
                    onChange={(value) =>
                      updateAchievement(
                        index,
                        {
                          organization:
                            value,
                        },
                      )
                    }
                    placeholder="Organization"
                  />

                  <Field
                    label="Date"
                    value={
                      item.date
                    }
                    onChange={(value) =>
                      updateAchievement(
                        index,
                        {
                          date:
                            value,
                        },
                      )
                    }
                    type="date"
                  />

                  <Field
                    label="Supporting URL"
                    value={
                      item.credentialUrl
                    }
                    onChange={(value) =>
                      updateAchievement(
                        index,
                        {
                          credentialUrl:
                            value,
                        },
                      )
                    }
                    placeholder="https://..."
                    type="url"
                  />

                  <div
                    className={
                      styles.fullWidth
                    }
                  >
                    <TextareaField
                      label="Description"
                      value={
                        item.description
                      }
                      onChange={(
                        value,
                      ) =>
                        updateAchievement(
                          index,
                          {
                            description:
                              value,
                          },
                        )
                      }
                      placeholder="Explain why this achievement matters."
                      rows={5}
                    />
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function SocialSection({
  socialLinks,
  updateSocial,
  addSocial,
  removeSocial,
}: {
  socialLinks: SocialForm[];
  updateSocial: (
    index: number,
    patch: Partial<SocialForm>,
  ) => void;
  addSocial: () => void;
  removeSocial: (index: number) => void;
}) {
  return (
    <EditorSection
      number="09"
      title="Connect the dots."
      description="Give visitors a direct path to your professional profiles and communities."
      actionLabel="Add social link"
      onAction={addSocial}
    >
      {socialLinks.length === 0 ? (
        <EmptySection
          title="No links added."
          description="GitHub and LinkedIn are great starting points."
          actionLabel="Add a social link"
          onAction={addSocial}
        />
      ) : (
        <div className={styles.repeatableList}>
          {socialLinks.map(
            (item, index) => (
              <article
                key={
                  item.id ||
                  `social-${index}`
                }
                className={
                  styles.skillCard
                }
              >
                <div
                  className={
                    styles.skillIndex
                  }
                >
                  {String(
                    index + 1,
                  ).padStart(
                    2,
                    "0",
                  )}
                </div>

                <div
                  className={
                    styles.skillForm
                  }
                >
                  <SelectField
                    label="Platform"
                    value={
                      item.platform
                    }
                    onChange={(value) =>
                      updateSocial(
                        index,
                        {
                          platform:
                            value,
                          label:
                            value.replace(
                              /_/g,
                              " ",
                            ),
                        },
                      )
                    }
                    options={SOCIAL_PLATFORMS.map(
                      (value) => ({
                        value,
                        label:
                          value.replace(
                            /_/g,
                            " ",
                          ),
                      }),
                    )}
                  />

                  <Field
                    label="Label"
                    value={
                      item.label
                    }
                    onChange={(value) =>
                      updateSocial(
                        index,
                        {
                          label:
                            value,
                        },
                      )
                    }
                    placeholder="GitHub"
                  />

                  <div
                    className={
                      styles.socialUrlField
                    }
                  >
                    <Field
                      label="URL"
                      value={
                        item.url
                      }
                      onChange={(value) =>
                        updateSocial(
                          index,
                          {
                            url:
                              value,
                          },
                        )
                      }
                      placeholder="https://github.com/username"
                      type="url"
                    />

                    {item.url &&
  validUrl(item.url) && (
    <a
      href={normalizeUrl(item.url)}
      target="_blank"
      rel="noreferrer"
      className={
        styles.urlPreview
      }
    >
      Open
      <ExternalLink
        size={13}
      />
    </a>
  )}
                  </div>
                </div>

                <button
                  type="button"
                  className={
                    styles.iconDanger
                  }
                  onClick={() =>
                    removeSocial(
                      index,
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ),
          )}
        </div>
      )}
    </EditorSection>
  );
}

function ReviewSection({
  name,
  username,
  title,
  tagline,
  website,
  projects,
  experiences,
  education,
  skills,
  certifications,
  achievements,
  socialLinks,
  onPublish,
  publishing,
  ready,
}: {
  name: string;
  username: string;
  title: string;
  tagline: string;
  website: string;
  projects: ProjectForm[];
  experiences: ExperienceForm[];
  education: EducationForm[];
  skills: SkillForm[];
  certifications: CertificationForm[];
  achievements: AchievementForm[];
  socialLinks: SocialForm[];
  onPublish: () => void;
  publishing: boolean;
  ready: boolean;
}) {
    const allUrls = [
  website,
  ...projects.flatMap(
    (project) => [
      project.githubUrl,
      project.liveUrl,
    ],
  ),

  ...certifications.map(
    (item) =>
      item.credentialUrl,
  ),

  ...achievements.map(
    (item) =>
      item.credentialUrl,
  ),

  ...socialLinks.map(
    (item) => item.url,
  ),
].filter(Boolean);

const urlsValid = allUrls.every(
  (url) =>
    !url ||
    validUrl(url),
);
  const checks = [
  {
    label: "Full name",
    complete:
      name.trim().length >= 2,
  },
  {
    label: "Public username",
    complete:
      username.length >= 3,
  },
  {
    label: "Professional title",
    complete:
      Boolean(title.trim()),
  },
  {
    label: "Introduction",
    complete:
      Boolean(tagline.trim()),
  },
  {
    label: "At least one project",
    complete:
      projects.length > 0,
  },
  {
    label: "Professional history",
    complete:
      experiences.length > 0 ||
      education.length > 0,
  },
  {
    label: "Skills",
    complete:
      skills.length > 0,
  },
  {
    label: "Professional links",
    complete:
      (socialLinks.some(
        (item) => item.url.trim(),
      ) ||
        website.trim().length > 0) &&
      urlsValid,
  },
  {
    label: "All URLs valid",
    complete:
      urlsValid,
  },
];

  const complete =
    checks.filter(
      (item) => item.complete,
    ).length;

  return (
    <EditorSection
      number="10"
      title="Review before publishing."
      description="A strong portfolio doesn't need everything. It needs the right information presented clearly."
    >
      <div
        className={
          styles.reviewHero
        }
      >
        <div>
          <span>
            READY TO PUBLISH
          </span>

          <h2>
            {complete}/{checks.length}
          </h2>

          <p>
            Important pieces are complete.
          </p>
        </div>

        <div
          className={
            complete ===
            checks.length
              ? styles.readyIndicator
              : styles.incompleteIndicator
          }
        >
          {complete ===
          checks.length ? (
            <>
              <CheckCircle2
                size={17}
              />
              Ready
            </>
          ) : (
            <>
              <Sparkles size={17} />
              Almost there
            </>
          )}
        </div>
      </div>

      <div className={styles.reviewList}>
        {checks.map(
          (item) => (
            <div
              key={item.label}
              className={
                styles.reviewItem
              }
            >
              <span>
                {item.complete ? (
                  <CheckCircle2
                    size={17}
                  />
                ) : (
                  <div
                    className={
                      styles.emptyCheck
                    }
                  />
                )}
              </span>

              <strong>
                {item.label}
              </strong>

              <small>
                {item.complete
                  ? "Complete"
                  : "Recommended"}
              </small>
            </div>
          ),
        )}
      </div>

      <div
        className={
          styles.publishBox
        }
      >
        <div>
          <span>
            PUBLIC URL
          </span>

          <strong>
            pluten.site/p/
            {username ||
              "yourname"}
          </strong>
        </div>

        <button
          type="button"
          className={
            styles.publishButtonLarge
          }
          disabled={
            publishing ||
            !ready
          }
          onClick={
            onPublish
          }
        >
          {publishing ? (
            <Loader2
              size={17}
              className={
                styles.spin
              }
            />
          ) : (
            <Sparkles
              size={17}
            />
          )}

          Publish portfolio
        </button>
      </div>
    </EditorSection>
  );
}

function EditorSection({
  number,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  number: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        styles.sectionContent
      }
    >
      <div
        className={
          styles.sectionHeading
        }
      >
        <div>
          <span>
            {number} / PORTFOLIO
          </span>

          <h1>{title}</h1>

          <p>
            {description}
          </p>
        </div>

        {actionLabel &&
          onAction && (
            <button
              type="button"
              className={
                styles.addButton
              }
              onClick={onAction}
            >
              <Plus size={16} />
              {actionLabel}
            </button>
          )}
      </div>

      {children}
    </section>
  );
}

function EmptySection({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={
        styles.emptySection
      }
    >
      <div
        className={
          styles.emptyIcon
        }
      >
        <Plus
          size={22}
        />
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <button
        type="button"
        className={
          styles.primarySmall
        }
        onClick={onAction}
      >
        <Plus size={15} />
        {actionLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={styles.fieldLabel}>
      <span>
        {label}
        {required && (
          <b> *</b>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className={styles.fieldLabel}>
      <span>
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        rows={rows}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className={styles.fieldLabel}>
      <span>
        {label}
      </span>

      <div
        className={
          styles.selectWrap
        }
      >
        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
        >
          {options.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            ),
          )}
        </select>

        <ChevronDown
          size={16}
        />
      </div>
    </label>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (
    values: string[],
  ) => void;
  placeholder?: string;
}) {
  const [
    input,
    setInput,
  ] = useState("");

  const add = () => {
    const value =
      input.trim();

    if (
      !value ||
      values.some(
        (item) =>
          item.toLowerCase() ===
          value.toLowerCase(),
      )
    ) {
      return;
    }

    onChange([
      ...values,
      value,
    ]);

    setInput("");
  };

  return (
    <div
      className={
        styles.fullWidth
      }
    >
      <label
        className={
          styles.fieldLabel
        }
      >
        <span>
          {label}
        </span>

        <div
          className={
            styles.tagField
          }
        >
          <div
            className={
              styles.tagList
            }
          >
            {values.map(
              (value) => (
                <span
                  key={value}
                  className={
                    styles.tag
                  }
                >
                  {value}

                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        values.filter(
                          (
                            item,
                          ) =>
                            item !==
                            value,
                        ),
                      )
                    }
                    aria-label={`Remove ${value}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ),
            )}
          </div>

          <input
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                add();
              }
            }}
            placeholder={
              placeholder ||
              "Type and press Enter"
            }
          />

          <button
            type="button"
            className={
              styles.tagAddButton
            }
            onClick={add}
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </label>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <button
      type="button"
      className={
        styles.toggleRow
      }
      onClick={() =>
        onChange(!checked)
      }
    >
      <div>
        <strong>
          {label}
        </strong>

        <span>
          {description}
        </span>
      </div>

      <span
        className={
          checked
            ? styles.toggleOn
            : styles.toggleOff
        }
      >
        <span />
      </span>
    </button>
  );
}

function PreviewPanel({
  name,
  username,
  title,
  tagline,
  bio,
  location,
  email,
  projects,
  experiences,
  skills,
  socialLinks,
}: {
  name: string;
  username: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  projects: ProjectForm[];
  experiences: ExperienceForm[];
  skills: SkillForm[];
  socialLinks: SocialForm[];
}) {
  const previewProjects =
    projects.filter(
      (item) =>
        item.title.trim(),
    );

  const previewSkills =
    skills.filter(
      (item) =>
        item.name.trim(),
    );

  return (
    <aside
      className={
        styles.previewPanel
      }
    >
      <div
        className={
          styles.previewHeader
        }
      >
        <div>
          <span>
            LIVE PREVIEW
          </span>

          <strong>
            Changes appear instantly
          </strong>
        </div>

        <span
          className={
            styles.liveDot
          }
        >
          LIVE
        </span>
      </div>

      <div
        className={
          styles.previewBrowser
        }
      >
        <div
          className={
            styles.previewBrowserTop
          }
        >
          <div
            className={
              styles.previewDots
            }
          >
            <span />
            <span />
            <span />
          </div>

          <div
            className={
              styles.previewUrl
            }
          >
            pluten.site/p/
            {username ||
              "yourname"}
          </div>
        </div>

        <div
          className={
            styles.previewPage
          }
        >
          <div
            className={
              styles.previewNav
            }
          >
            <div
              className={
                styles.previewAvatar
              }
            >
              {initials(name)}
            </div>

            <div>
              <strong>
                {name ||
                  "Your Name"}
              </strong>

              <span>
                PORTFOLIO
              </span>
            </div>
          </div>

          <div
            className={
              styles.previewHero
            }
          >
            <span>
              HELLO, I'M
            </span>

            <h2>
              {name ||
                "Your Name"}
              <i>.</i>
            </h2>

            <h3>
              {title ||
                "Professional Title"}
            </h3>

            <p>
              {tagline ||
                "Your professional introduction will appear here."}
            </p>

            <div
              className={
                styles.previewActions
              }
            >
              <span>
                VIEW MY WORK
              </span>

              <span>
                CONTACT
              </span>
            </div>
          </div>

          <div
            className={
              styles.previewMeta
            }
          >
            <div>
              <strong>
                {previewProjects.length}
              </strong>

              <span>
                PROJECTS
              </span>
            </div>

            <div>
              <strong>
                {previewSkills.length}
              </strong>

              <span>
                SKILLS
              </span>
            </div>

            <div>
              <strong>
                {experiences.length}
              </strong>

              <span>
                ROLES
              </span>
            </div>
          </div>

          {(bio.trim() ||
            location.trim() ||
            email.trim()) && (
            <div
              className={
                styles.previewAbout
              }
            >
              <span>
                ABOUT
              </span>

              <h3>
                A little more
                about the person
                behind the work.
              </h3>

              {bio.trim() && (
                <p>
                  {bio}
                </p>
              )}

              <div
                className={
                  styles.previewContact
                }
              >
                {location.trim() && (
                  <span>
                    {location}
                  </span>
                )}

                {email.trim() && (
                  <span>
                    {email}
                  </span>
                )}
              </div>
            </div>
          )}

          {previewProjects.length >
            0 && (
            <div
              className={
                styles.previewWork
              }
            >
              <div
                className={
                  styles.previewSectionHeading
                }
              >
                <span>
                  SELECTED WORK
                </span>

                <strong>
                  Things I've built.
                </strong>
              </div>

              {previewProjects
                .slice(0, 3)
                .map(
                  (
                    project,
                    index,
                  ) => (
                    <div
                      key={
                        project.id ||
                        index
                      }
                      className={
                        styles.previewProject
                      }
                    >
                      <span>
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <div>
                        <strong>
                          {
                            project.title
                          }
                        </strong>

                        <small>
                          {
                            project.description ||
                            "Project description"
                          }
                        </small>
                      </div>

                      <ArrowRight
                        size={14}
                      />
                    </div>
                  ),
                )}
            </div>
          )}

          {previewSkills.length >
            0 && (
            <div
              className={
                styles.previewSkills
              }
            >
              <span>
                SKILLS
              </span>

              <div>
                {previewSkills
                  .slice(0, 8)
                  .map(
                    (skill) => (
                      <span
                        key={
                          skill.id ||
                          skill.name
                        }
                      >
                        {
                          skill.name
                        }
                      </span>
                    ),
                  )}
              </div>
            </div>
          )}

          {socialLinks.length >
            0 && (
            <div
              className={
                styles.previewSocial
              }
            >
              {socialLinks
                .filter(
                  (item) =>
                    item.url.trim(),
                )
                .slice(0, 4)
                .map(
                  (item) => (
                    <span
                      key={
                        item.id ||
                        item.url
                      }
                    >
                      {
                        item.label
                      }
                    </span>
                  ),
                )}
            </div>
          )}

          <div
            className={
              styles.previewFooter
            }
          >
            <span>
              {name ||
                "YOUR NAME"}
            </span>

            <span>
              BUILT WITH PLUTEN
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
