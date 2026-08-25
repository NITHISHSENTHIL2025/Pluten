import apiClient from "@/lib/apiClient";

/* =========================================================
   PROJECT
========================================================= */

export interface PortfolioProject {
  id?: string;

  title: string;
  description: string;

  shortDescription?: string | null;
  role?: string | null;

  technologies: string[];

  imageUrl?: string | null;
  videoUrl?: string | null;

  githubUrl?: string | null;
  liveUrl?: string | null;
  projectUrl?: string | null;

  status?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  featured?: boolean;
  visibility?: string | null;

  sortOrder?: number;

  /*
   * Optional here because these objects are also used
   * inside create/update payloads before persistence.
   */
  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   EXPERIENCE
========================================================= */

export interface PortfolioExperience {
  id?: string;

  company: string;
  position: string;

  employmentType?: string | null;
  type?: string | null;

  location?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  currentlyWorking?: boolean;
  current?: boolean;

  description?: string | null;

  responsibilities?: string[];
  achievements?: string[];

  companyLogo?: string | null;
  companyUrl?: string | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   EDUCATION
========================================================= */

export interface PortfolioEducation {
  id?: string;

  institution: string;

  degree: string;

  field?: string | null;

  fieldOfStudy?: string | null;

  location?: string | null;

  startDate?: string | null;

  endDate?: string | null;

  currentlyStudying?: boolean;

  current?: boolean;

  grade?: string | null;

  coursework?: string[];

  achievements?: string[];

  institutionLogo?: string | null;

  institutionUrl?: string | null;

  sortOrder?: number;
}

/* =========================================================
   SKILL
========================================================= */

export interface PortfolioSkill {
  id?: string;

  name: string;
  category: string;

  level?: number | null;

  icon?: string | null;

  yearsOfExperience?: number | null;
  yearsOfUse?: number | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   CERTIFICATION
========================================================= */

export interface PortfolioCertification {
  id?: string;

  name: string;
  issuer?: string | null;

  issueDate?: string | null;
  expiryDate?: string | null;

  credentialId?: string | null;
  credentialUrl?: string | null;

  certificateImage?: string | null;

  description?: string | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   ACHIEVEMENT
========================================================= */

export interface PortfolioAchievement {
  id?: string;

  title: string;

  description?: string | null;

  organization?: string | null;

  date?: string | null;

  imageUrl?: string | null;

  url?: string | null;
  credentialUrl?: string | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   SOCIAL LINK
========================================================= */

export interface PortfolioSocialLink {
  id?: string;

  platform: string;

  label?: string | null;

  url: string;

  icon?: string | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   SEO
========================================================= */

export interface PortfolioSEO {
  title?: string | null;

  description?: string | null;

  keywords?: string[];

  ogTitle?: string | null;
  ogDescription?: string | null;

  ogImage?: string | null;

  twitterCard?: string | null;

  canonicalUrl?: string | null;

  noIndex?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   SETTINGS
========================================================= */

export interface PortfolioSettings {
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;

  showProjects?: boolean;
  showExperience?: boolean;
  showEducation?: boolean;
  showSkills?: boolean;

  showCertifications?: boolean;
  showAchievements?: boolean;
  showSocialLinks?: boolean;

  showBranding?: boolean;

  contactEnabled?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   PORTFOLIO
========================================================= */

export interface Portfolio {
  id: string;

  username: string;
  slug: string;

  status?:
    | "DRAFT"
    | "PUBLISHED"
    | "UNPUBLISHED"
    | "ARCHIVED"
    | "SUSPENDED"
    | "DELETED"
    | string;

  visibility:
    | "PUBLIC"
    | "PRIVATE"
    | string;

  /*
   * Kept for compatibility with older API responses.
   */
  published?: boolean;

  /* -------------------------------------------------------
     Profile
  ------------------------------------------------------- */

  fullName: string;

  professionalTitle?: string | null;

  tagline?: string | null;

  profileImage?: string | null;

  bio?: string | null;

  email?: string | null;

  phone?: string | null;

  location?: string | null;

  website?: string | null;

  availability?: string | null;

  yearsOfExperience?: number | null;

  /* -------------------------------------------------------
     Template
  ------------------------------------------------------- */

  template?: string | null;

  templateVersion?: number | null;

  /* -------------------------------------------------------
     Publishing
  ------------------------------------------------------- */

  publishedAt?: string | null;

  lastPublishedAt?: string | null;

  /* -------------------------------------------------------
     Timestamps
     
     IMPORTANT:
     These are required because Portfolio represents
     an actual persisted portfolio returned from the API.
  ------------------------------------------------------- */

  createdAt: string;

  updatedAt: string;

  /* -------------------------------------------------------
     Sections
  ------------------------------------------------------- */

  projects: PortfolioProject[];

  experiences: PortfolioExperience[];

  education: PortfolioEducation[];

  skills: PortfolioSkill[];

  certifications: PortfolioCertification[];

  achievements: PortfolioAchievement[];

  socialLinks: PortfolioSocialLink[];

  /* -------------------------------------------------------
     Configuration
  ------------------------------------------------------- */

  seo?: PortfolioSEO | null;

  settings?: PortfolioSettings | null;
}

/* =========================================================
   CREATE / UPDATE PAYLOAD
========================================================= */

export interface CreatePortfolioPayload {
  portfolioId?: string;

  publish?: boolean;

  username: string;

  fullName: string;

  professionalTitle?: string;

  tagline?: string;

  profileImage?: string;

  bio?: string;

  email?: string;

  phone?: string;

  location?: string;

  website?: string;

  availability?: string;

  yearsOfExperience?: number | null;

  projects?: PortfolioProject[];

  experiences?: PortfolioExperience[];

  education?: PortfolioEducation[];

  skills?: PortfolioSkill[];

  certifications?: PortfolioCertification[];

  achievements?: PortfolioAchievement[];

  socialLinks?: PortfolioSocialLink[];

  template?: string;

  templateVersion?: number;

  seo?: Partial<PortfolioSEO>;

  settings?: Partial<PortfolioSettings>;
}

/* =========================================================
   RESPONSES
========================================================= */

export interface PortfolioListResponse {
  success: boolean;

  portfolios: Portfolio[];
}

export interface PortfolioResponse {
  success: boolean;

  portfolio: Portfolio;
}

export interface CreatePortfolioResponse
  extends PortfolioResponse {
  created?: boolean;

  portfolioId?: string;

  username?: string;

  published?: boolean;

  url?: string | null;

  portfolioLimitWarning?: string | null;
}

export interface PublishPortfolioResponse
  extends PortfolioResponse {
  url?: string | null;
}

/* =========================================================
   GET ALL PORTFOLIOS
========================================================= */

export async function getPortfolios(): Promise<PortfolioListResponse> {
  const response =
    await apiClient.get<PortfolioListResponse>(
      "/portfolio",
    );

  return response.data;
}

/* =========================================================
   GET SINGLE PORTFOLIO
========================================================= */

export async function getPortfolio(
  portfolioId: string,
): Promise<PortfolioResponse> {
  const cleanId = portfolioId.trim();

  if (!cleanId) {
    throw new Error(
      "Portfolio ID is required.",
    );
  }

  const response =
    await apiClient.get<PortfolioResponse>(
      `/portfolio/${encodeURIComponent(cleanId)}`,
    );

  return response.data;
}

/* =========================================================
   CREATE PORTFOLIO
========================================================= */

export async function createPortfolio(
  payload: CreatePortfolioPayload,
): Promise<CreatePortfolioResponse> {
  const response =
    await apiClient.post<CreatePortfolioResponse>(
      "/portfolio",
      payload,
    );

  return response.data;
}

/* =========================================================
   UPDATE PORTFOLIO
========================================================= */

export async function updatePortfolio(
  portfolioId: string,
  payload: CreatePortfolioPayload,
): Promise<CreatePortfolioResponse> {
  const cleanId = portfolioId.trim();

  if (!cleanId) {
    throw new Error(
      "Portfolio ID is required.",
    );
  }

  const response =
    await apiClient.put<CreatePortfolioResponse>(
      `/portfolio/${encodeURIComponent(cleanId)}`,
      payload,
    );

  return response.data;
}

/* =========================================================
   DELETE PORTFOLIO
========================================================= */

export async function deletePortfolio(
  portfolioId: string,
): Promise<{
  success: boolean;
  deleted: boolean;
}> {
  const cleanId = portfolioId.trim();

  if (!cleanId) {
    throw new Error(
      "Portfolio ID is required.",
    );
  }

  const response =
    await apiClient.delete<{
      success: boolean;
      deleted: boolean;
    }>(
      `/portfolio/${encodeURIComponent(cleanId)}`,
    );

  return response.data;
}

/* =========================================================
   PUBLISH PORTFOLIO
========================================================= */

export async function publishPortfolio(
  portfolioId: string,
): Promise<PublishPortfolioResponse> {
  const cleanId = portfolioId.trim();

  if (!cleanId) {
    throw new Error(
      "Portfolio ID is required.",
    );
  }

  const response =
    await apiClient.post<PublishPortfolioResponse>(
      `/portfolio/${encodeURIComponent(cleanId)}/publish`,
    );

  return response.data;
}

/* =========================================================
   UNPUBLISH PORTFOLIO
========================================================= */

export async function unpublishPortfolio(
  portfolioId: string,
): Promise<PortfolioResponse> {
  const cleanId = portfolioId.trim();

  if (!cleanId) {
    throw new Error(
      "Portfolio ID is required.",
    );
  }

  const response =
    await apiClient.post<PortfolioResponse>(
      `/portfolio/${encodeURIComponent(cleanId)}/unpublish`,
    );

  return response.data;
}

/* =========================================================
   GET PUBLIC PORTFOLIO
========================================================= */

export async function getPublicPortfolio(
  username: string,
): Promise<PortfolioResponse> {
  const cleanUsername =
    username.trim().toLowerCase();

  if (!cleanUsername) {
    throw new Error(
      "Username is required.",
    );
  }

  const response =
    await apiClient.get<PortfolioResponse>(
      `/portfolio/public/${encodeURIComponent(
        cleanUsername,
      )}`,
    );

  return response.data;
}