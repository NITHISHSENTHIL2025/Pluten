const prisma = require('../lib/prisma');

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'app',
  'auth',
  'builder',
  'contact',
  'dashboard',
  'docs',
  'help',
  'home',
  'login',
  'logout',
  'me',
  'portfolio',
  'portfolios',
  'profile',
  'products',
  'product',
  'register',
  'root',
  'services',
  'settings',
  'signup',
  'support',
  'system',
  'user',
  'users',
  'www',
]);

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/[-_]{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 30);
}

function normalizeText(value, max = 5000) {
  if (value === undefined || value === null) return null;

  const result = String(value).trim();

  return result ? result.slice(0, max) : null;
}

function normalizeStringArray(value, maxItems = 50, maxLength = 300) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

function normalizeOptionalUrl(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) return null;

  let url;

  try {
    url = new URL(
      /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
    );
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${raw}`);
  }

  return url.toString();
}

function validateUsername(username) {
  if (!username) {
    throw new Error('Username is required.');
  }

  if (username.length < 3) {
    throw new Error('Username must contain at least 3 characters.');
  }

  if (!/^[a-z0-9][a-z0-9-_]{2,29}$/.test(username)) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  if (RESERVED_USERNAMES.has(username)) {
    throw new Error('That username is reserved.');
  }
}

function serializeProject(project) {
  return {
    id: project.id,
    title: project.title,
    shortDescription: project.shortDescription,
    description: project.description,
    role: project.role,
    technologies: project.technologies,
    projectUrl: project.projectUrl,
    githubUrl: project.githubUrl,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    featured: project.featured,
    sortOrder: project.sortOrder,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function serializePortfolio(portfolio) {
  return {
    id: portfolio.id,
    username: portfolio.username,
    slug: portfolio.slug,
    status: portfolio.status,
    visibility: portfolio.visibility,

    fullName: portfolio.fullName,
    professionalTitle: portfolio.professionalTitle,
    tagline: portfolio.tagline,
    bio: portfolio.bio,
    email: portfolio.email,
    phone: portfolio.phone,
    location: portfolio.location,
    website: portfolio.website,
    availability: portfolio.availability,
    yearsOfExperience: portfolio.yearsOfExperience,

    template: portfolio.template,
    templateVersion: portfolio.templateVersion,

    publishedAt: portfolio.publishedAt,
    lastPublishedAt: portfolio.lastPublishedAt,

    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,

    projects: portfolio.projects?.map(serializeProject) || [],

    experiences:
      portfolio.experiences?.map((item) => ({
        id: item.id,
        company: item.company,
        position: item.position,
        type: item.type,
        location: item.location,
        description: item.description,
        achievements: item.achievements,
        startDate: item.startDate,
        endDate: item.endDate,
        current: item.current,
        sortOrder: item.sortOrder,
      })) || [],

    education:
      portfolio.education?.map((item) => ({
        id: item.id,
        institution: item.institution,
        degree: item.degree,
        fieldOfStudy: item.fieldOfStudy,
        location: item.location,
        description: item.description,
        achievements: item.achievements,
        startDate: item.startDate,
        endDate: item.endDate,
        current: item.current,
        sortOrder: item.sortOrder,
      })) || [],

    skills:
      portfolio.skills?.map((item) => ({
        id: item.id,
        category: item.category,
        name: item.name,
        level: item.level,
        yearsOfUse: item.yearsOfUse,
        sortOrder: item.sortOrder,
      })) || [],

    certifications:
      portfolio.certifications?.map((item) => ({
        id: item.id,
        name: item.name,
        issuer: item.issuer,
        credentialId: item.credentialId,
        credentialUrl: item.credentialUrl,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
        description: item.description,
        sortOrder: item.sortOrder,
      })) || [],

    achievements:
      portfolio.achievements?.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        organization: item.organization,
        date: item.date,
        url: item.url,
        sortOrder: item.sortOrder,
      })) || [],

    socialLinks:
      portfolio.socialLinks?.map((item) => ({
        id: item.id,
        platform: item.platform,
        label: item.label,
        url: item.url,
        sortOrder: item.sortOrder,
      })) || [],

    seo: portfolio.seo
      ? {
          title: portfolio.seo.title,
          description: portfolio.seo.description,
          keywords: portfolio.seo.keywords,
          ogTitle: portfolio.seo.ogTitle,
          ogDescription: portfolio.seo.ogDescription,
          ogImage: portfolio.seo.ogImage,
          canonicalUrl: portfolio.seo.canonicalUrl,
          noIndex: portfolio.seo.noIndex,
        }
      : null,

    settings: portfolio.settings
      ? {
          showEmail: portfolio.settings.showEmail,
          showPhone: portfolio.settings.showPhone,
          showLocation: portfolio.settings.showLocation,
          showProjects: portfolio.settings.showProjects,
          showExperience: portfolio.settings.showExperience,
          showEducation: portfolio.settings.showEducation,
          showSkills: portfolio.settings.showSkills,
          showCertifications: portfolio.settings.showCertifications,
          showAchievements: portfolio.settings.showAchievements,
          showSocialLinks: portfolio.settings.showSocialLinks,
          showBranding: portfolio.settings.showBranding,
          contactEnabled: portfolio.settings.contactEnabled,
        }
      : null,
  };
}

function serializePublicPortfolio(portfolio) {
  const serialized = serializePortfolio(portfolio);
  const settings = portfolio.settings || {};

  if (
    settings.contactEnabled === false ||
    settings.showEmail === false
  ) {
    serialized.email = null;
  }

  if (
    settings.contactEnabled === false ||
    settings.showPhone === false
  ) {
    serialized.phone = null;
  }

  if (
    settings.contactEnabled === false ||
    settings.showLocation === false
  ) {
    serialized.location = null;
  }

  if (settings.contactEnabled === false) {
    serialized.website = null;
  }

  if (settings.showProjects === false) {
    serialized.projects = [];
  }

  if (settings.showExperience === false) {
    serialized.experiences = [];
  }

  if (settings.showEducation === false) {
    serialized.education = [];
  }

  if (settings.showSkills === false) {
    serialized.skills = [];
  }

  if (settings.showCertifications === false) {
    serialized.certifications = [];
  }

  if (settings.showAchievements === false) {
    serialized.achievements = [];
  }

  if (settings.showSocialLinks === false) {
    serialized.socialLinks = [];
  }

  return serialized;
}
const portfolioInclude = {
  projects: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  experiences: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  education: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  skills: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  certifications: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  achievements: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  socialLinks: {
    orderBy: {
      sortOrder: 'asc',
    },
  },

  seo: true,
  settings: true,
};

function normalizeProject(project, index) {
  const title = normalizeText(project.title, 160);

  if (!title) {
    throw new Error(`Project ${index + 1}: title is required.`);
  }

  const description =
    normalizeText(
      project.description || project.shortDescription,
      5000,
    );

  if (!description) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    title,
    shortDescription: normalizeText(
      project.shortDescription,
      500,
    ),
    description,
    role: normalizeText(project.role, 160),

    technologies: normalizeStringArray(
      project.technologies,
      30,
      80,
    ),

    projectUrl: normalizeOptionalUrl(
      project.projectUrl || project.liveUrl,
    ),

    githubUrl: normalizeOptionalUrl(
      project.githubUrl,
    ),

    status: project.status || 'COMPLETED',

    startDate: parseDate(project.startDate),
    endDate: parseDate(project.endDate),

    featured: Boolean(project.featured),
    sortOrder: index,
  };
}

function normalizeExperience(item, index) {
  const company = normalizeText(item.company, 200);
  const position = normalizeText(item.position, 200);

  if (!company) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  if (!position) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  const startDate = parseDate(item.startDate);

  if (!startDate) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    company,
    position,
    type: item.type || 'FULL_TIME',
    location: normalizeText(item.location, 200),
    description: normalizeText(item.description, 5000),
    achievements: normalizeStringArray(
      item.achievements,
      20,
      500,
    ),
    startDate,
    endDate: parseDate(item.endDate),
    current: Boolean(item.current),
    sortOrder: index,
  };
}

function normalizeEducation(item, index) {
  const institution = normalizeText(item.institution, 220);

  if (!institution) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    institution,
    degree: normalizeText(item.degree, 200),
    fieldOfStudy: normalizeText(item.fieldOfStudy, 200),
    location: normalizeText(item.location, 200),
    description: normalizeText(item.description, 5000),
    achievements: normalizeStringArray(
      item.achievements,
      20,
      500,
    ),
    startDate: parseDate(item.startDate),
    endDate: parseDate(item.endDate),
    current: Boolean(item.current),
    sortOrder: index,
  };
}

function normalizeSkill(item, index) {
  const name = normalizeText(item.name, 120);

  if (!name) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  const level =
    item.level === undefined ||
    item.level === null ||
    item.level === ''
      ? null
      : Number(item.level);

  if (
    level !== null &&
    (!Number.isInteger(level) || level < 0 || level > 100)
  ) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  const yearsOfUse =
    item.yearsOfUse === undefined ||
    item.yearsOfUse === null ||
    item.yearsOfUse === ''
      ? null
      : Number(item.yearsOfUse);

  if (
    yearsOfUse !== null &&
    (!Number.isFinite(yearsOfUse) || yearsOfUse < 0 || yearsOfUse > 100)
  ) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    category: normalizeText(item.category, 80) || 'Other',
    name,
    level,
    yearsOfUse,
    sortOrder: index,
  };
}

function normalizeCertification(item, index) {
  const name = normalizeText(item.name, 250);

  if (!name) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    name,
    issuer: normalizeText(item.issuer, 250),
    credentialId: normalizeText(item.credentialId, 200),
    credentialUrl: normalizeOptionalUrl(
      item.credentialUrl,
    ),
    issueDate: parseDate(item.issueDate),
    expiryDate: parseDate(item.expiryDate),
    description: normalizeText(item.description, 4000),
    sortOrder: index,
  };
}

function normalizeAchievement(item, index) {
  const title = normalizeText(item.title, 250);

  if (!title) {
   const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    title,
    description: normalizeText(item.description, 4000),
    organization: normalizeText(item.organization, 250),
    date: parseDate(item.date),
    url: normalizeOptionalUrl(item.url),
    sortOrder: index,
  };
}

function normalizeSocialLink(item, index) {
  const platform = normalizeText(item.platform, 80);

  if (!platform) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  const url = normalizeOptionalUrl(item.url);

  if (!url) {
    const error = new Error(
  `Project ${index + 1}: title is required.`,
);

error.statusCode = 422;

throw error;
  }

  return {
    platform,
    label: normalizeText(item.label, 100),
    url,
    sortOrder: index,
  };
}

function hasProjectContent(project) {
  if (!project || typeof project !== 'object') {
    return false;
  }

  return Boolean(
    String(project.title || '').trim() ||
    String(project.description || '').trim() ||
    String(project.shortDescription || '').trim() ||
    String(project.role || '').trim() ||
    String(project.projectUrl || '').trim() ||
    String(project.liveUrl || '').trim() ||
    String(project.githubUrl || '').trim() ||
    (Array.isArray(project.technologies) &&
      project.technologies.some(
        (item) =>
          String(item ?? '').trim(),
      )) ||
    project.startDate ||
    project.endDate,
  );
}

function isCompleteProject(project) {
  if (!project || typeof project !== 'object') {
    return false;
  }

  const title =
    String(project.title || '').trim();

  const description =
    String(
      project.description ||
        project.shortDescription ||
        '',
    ).trim();

  return Boolean(
    title &&
      description,
  );
}

function hasExperienceContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.company || '').trim() ||
    String(item.position || '').trim() ||
    String(item.location || '').trim() ||
    String(item.description || '').trim() ||
    (Array.isArray(item.achievements) &&
      item.achievements.some(
        (value) =>
          String(value ?? '').trim(),
      )) ||
    item.startDate ||
    item.endDate,
  );
}

function isCompleteExperience(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const company =
    String(item.company || '').trim();

  const position =
    String(item.position || '').trim();

  const startDate =
    String(item.startDate || '').trim();

  return Boolean(
    company &&
      position &&
      startDate,
  );
}

function hasEducationContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.institution || '').trim() ||
    String(item.degree || '').trim() ||
    String(item.field || '').trim() ||
    String(item.fieldOfStudy || '').trim() ||
    String(item.location || '').trim() ||
    String(item.description || '').trim() ||
    item.startDate ||
    item.endDate,
  );
}

function isCompleteEducation(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.institution || '').trim(),
  );
}

function hasSkillContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.name || '').trim() ||
    String(item.category || '').trim(),
  );
}

function isCompleteSkill(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.name || '').trim(),
  );
}

function hasCertificationContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.name || '').trim() ||
    String(item.issuer || '').trim() ||
    String(item.credentialId || '').trim() ||
    String(item.credentialUrl || '').trim() ||
    item.issueDate ||
    item.expiryDate,
  );
}

function isCompleteCertification(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.name || '').trim(),
  );
}

function hasAchievementContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.title || '').trim() ||
    String(item.description || '').trim() ||
    String(item.organization || '').trim() ||
    String(item.url || '').trim() ||
    item.date,
  );
}

function isCompleteAchievement(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.title || '').trim(),
  );
}

function hasSocialLinkContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.platform || '').trim() ||
    String(item.label || '').trim() ||
    String(item.url || '').trim(),
  );
}

function isCompleteSocialLink(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return Boolean(
    String(item.platform || '').trim() &&
      String(item.url || '').trim(),
  );
}

function preparePayload(body) {
  const username =
    normalizeUsername(body.username);

  validateUsername(username);

  const fullName =
    normalizeText(body.fullName, 200);

  if (!fullName) {
    const error = new Error(
      'Full name is required.',
    );

    error.statusCode = 422;

    throw error;
  }

  /*
   * -------------------------------------------------------
   * PROJECTS
   *
   * Drafts may contain:
   * - no projects
   * - an untouched empty row
   * - an incomplete row
   *
   * Database rows, however, require a title + description.
   * Therefore we completely ignore incomplete draft rows.
   *
   * Publishing performs the strict requirement check later.
   * -------------------------------------------------------
   */

  const projects = Array.isArray(body.projects)
    ? body.projects
        .slice(0, 30)
        .filter(hasProjectContent)
        .filter(isCompleteProject)
        .map(
          (project, index) =>
            normalizeProject(
              project,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * EXPERIENCE
   * -------------------------------------------------------
   */

  const experiences = Array.isArray(
    body.experiences,
  )
    ? body.experiences
        .slice(0, 20)
        .filter(hasExperienceContent)
        .filter(isCompleteExperience)
        .map(
          (item, index) =>
            normalizeExperience(
              item,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * EDUCATION
   * -------------------------------------------------------
   */

  const education = Array.isArray(
    body.education,
  )
    ? body.education
        .slice(0, 10)
        .filter(hasEducationContent)
        .filter(isCompleteEducation)
        .map(
          (item, index) =>
            normalizeEducation(
              item,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * SKILLS
   * -------------------------------------------------------
   */

  const skills = Array.isArray(
    body.skills,
  )
    ? body.skills
        .slice(0, 100)
        .filter(hasSkillContent)
        .filter(isCompleteSkill)
        .map(
          (item, index) =>
            normalizeSkill(
              item,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * CERTIFICATIONS
   * -------------------------------------------------------
   */

  const certifications = Array.isArray(
    body.certifications,
  )
    ? body.certifications
        .slice(0, 50)
        .filter(hasCertificationContent)
        .filter(isCompleteCertification)
        .map(
          (item, index) =>
            normalizeCertification(
              item,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * ACHIEVEMENTS
   * -------------------------------------------------------
   */

  const achievements = Array.isArray(
    body.achievements,
  )
    ? body.achievements
        .slice(0, 50)
        .filter(hasAchievementContent)
        .filter(isCompleteAchievement)
        .map(
          (item, index) =>
            normalizeAchievement(
              item,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * SOCIAL LINKS
   *
   * Only fully populated links are persisted.
   * -------------------------------------------------------
   */

  const socialLinks = Array.isArray(
    body.socialLinks,
  )
    ? body.socialLinks
        .slice(0, 25)
        .filter(hasSocialLinkContent)
        .filter(isCompleteSocialLink)
        .map(
          (item, index) =>
            normalizeSocialLink(
              item,
              index,
            ),
        )
    : [];

  /*
   * -------------------------------------------------------
   * YEARS OF EXPERIENCE
   * -------------------------------------------------------
   */

  let yearsOfExperience = null;

  if (
    body.yearsOfExperience !== undefined &&
    body.yearsOfExperience !== null &&
    body.yearsOfExperience !== ''
  ) {
    const numericYears =
      Number(body.yearsOfExperience);

    if (
      !Number.isFinite(numericYears) ||
      numericYears < 0 ||
      numericYears > 100
    ) {
      const error = new Error(
        'Years of experience must be between 0 and 100.',
      );

      error.statusCode = 422;

      throw error;
    }

    yearsOfExperience =
      numericYears;
  }

  /*
   * -------------------------------------------------------
   * FINAL NORMALIZED PAYLOAD
   * -------------------------------------------------------
   */

  return {
    username,

    fullName,

    professionalTitle:
      normalizeText(
        body.professionalTitle,
        200,
      ),

    tagline:
      normalizeText(
        body.tagline,
        1500,
      ),

    bio:
      normalizeText(
        body.bio,
        8000,
      ),

    email:
      normalizeText(
        body.email,
        320,
      ),

    phone:
      normalizeText(
        body.phone,
        60,
      ),

    location:
      normalizeText(
        body.location,
        200,
      ),

    website:
      normalizeOptionalUrl(
        body.website,
      ),

    availability:
      normalizeText(
        body.availability,
        160,
      ),

    yearsOfExperience,

    template:
      normalizeText(
        body.template,
        100,
      ) || 'premium-editorial',

    templateVersion:
      Number.isInteger(
        Number(
          body.templateVersion,
        ),
      )
        ? Number(
            body.templateVersion,
          )
        : 1,

    projects,

    experiences,

    education,

    skills,

    certifications,

    achievements,

    socialLinks,

    seo:
      body.seo &&
      typeof body.seo === 'object'
        ? body.seo
        : {},

    settings:
      body.settings &&
      typeof body.settings === 'object'
        ? body.settings
        : {},
  };
}

async function replaceChildren(tx, portfolioId, payload) {
  await tx.portfolioProject.deleteMany({
    where: { portfolioId },
  });

  await tx.portfolioExperience.deleteMany({
    where: { portfolioId },
  });

  await tx.portfolioEducation.deleteMany({
    where: { portfolioId },
  });

  await tx.portfolioSkill.deleteMany({
    where: { portfolioId },
  });

  await tx.portfolioCertification.deleteMany({
    where: { portfolioId },
  });

  await tx.portfolioAchievement.deleteMany({
    where: { portfolioId },
  });

  await tx.portfolioSocialLink.deleteMany({
    where: { portfolioId },
  });

  if (payload.projects.length) {
    await tx.portfolioProject.createMany({
      data: payload.projects.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }

  if (payload.experiences.length) {
    await tx.portfolioExperience.createMany({
      data: payload.experiences.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }

  if (payload.education.length) {
    await tx.portfolioEducation.createMany({
      data: payload.education.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }

  if (payload.skills.length) {
    await tx.portfolioSkill.createMany({
      data: payload.skills.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }

  if (payload.certifications.length) {
    await tx.portfolioCertification.createMany({
      data: payload.certifications.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }

  if (payload.achievements.length) {
    await tx.portfolioAchievement.createMany({
      data: payload.achievements.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }

  if (payload.socialLinks.length) {
    await tx.portfolioSocialLink.createMany({
      data: payload.socialLinks.map((item) => ({
        portfolioId,
        ...item,
      })),
    });
  }
}

function seoData(payload, username) {
  return {
    title:
      normalizeText(payload.seo.title, 200) ||
      `${payload.fullName} — ${payload.professionalTitle || 'Portfolio'}`,

    description:
      normalizeText(
        payload.seo.description,
        500,
      ) ||
      payload.tagline ||
      `${payload.fullName}'s professional portfolio.`,

    keywords: normalizeStringArray(
      payload.seo.keywords,
      40,
      80,
    ),

    ogTitle:
      normalizeText(
        payload.seo.ogTitle,
        200,
      ) || null,

    ogDescription:
      normalizeText(
        payload.seo.ogDescription,
        500,
      ) || null,

    ogImage:
      normalizeOptionalUrl(
        payload.seo.ogImage,
      ),

    canonicalUrl:
      normalizeOptionalUrl(
        payload.seo.canonicalUrl,
      ) || `https://pluten.site/p/${username}`,

    noIndex: true,
  };
}

function settingsData(input) {
  return {
    showEmail:
      input.showEmail !== undefined
        ? Boolean(input.showEmail)
        : true,

    showPhone:
      input.showPhone !== undefined
        ? Boolean(input.showPhone)
        : false,

    showLocation:
      input.showLocation !== undefined
        ? Boolean(input.showLocation)
        : true,

    showProjects:
      input.showProjects !== undefined
        ? Boolean(input.showProjects)
        : true,

    showExperience:
      input.showExperience !== undefined
        ? Boolean(input.showExperience)
        : true,

    showEducation:
      input.showEducation !== undefined
        ? Boolean(input.showEducation)
        : true,

    showSkills:
      input.showSkills !== undefined
        ? Boolean(input.showSkills)
        : true,

    showCertifications:
      input.showCertifications !== undefined
        ? Boolean(input.showCertifications)
        : true,

    showAchievements:
      input.showAchievements !== undefined
        ? Boolean(input.showAchievements)
        : true,

    showSocialLinks:
      input.showSocialLinks !== undefined
        ? Boolean(input.showSocialLinks)
        : true,

    showBranding:
      input.showBranding !== undefined
        ? Boolean(input.showBranding)
        : true,

    contactEnabled:
      input.contactEnabled !== undefined
        ? Boolean(input.contactEnabled)
        : true,
  };
}

async function getUserPortfolios(userId) {
  const portfolios = await prisma.portfolio.findMany({
    where: {
      userId,
      status: {
        not: 'DELETED',
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: portfolioInclude,
  });

  return portfolios.map(serializePortfolio);
}

async function getPortfolioForUser(userId, portfolioId) {
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
      status: {
        not: 'DELETED',
      },
    },
    include: portfolioInclude,
  });

  if (!portfolio) {
    const error = new Error('Portfolio not found.');
    error.statusCode = 404;
    throw error;
  }

  return serializePortfolio(portfolio);
}

async function createPortfolio(userId, body) {
  const payload = preparePayload(body);

  const existing = await prisma.portfolio.findFirst({
    where: {
      username: payload.username,
      status: {
        not: 'DELETED',
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    const error = new Error('That username is already taken.');
    error.statusCode = 409;
    throw error;
  }

  const existingUserCount = await prisma.portfolio.count({
    where: {
      userId,
      status: {
        not: 'DELETED',
      },
    },
  });

  const created = await prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.create({
      data: {
        userId,

        username: payload.username,
        slug: payload.username,

        status: 'DRAFT',
        visibility: 'PRIVATE',

        fullName: payload.fullName,
        professionalTitle: payload.professionalTitle,
        tagline: payload.tagline,
        bio: payload.bio,
        email: payload.email,
        phone: payload.phone,
        location: payload.location,
        website: payload.website,

        availability: payload.availability,
        yearsOfExperience: payload.yearsOfExperience,

        template: payload.template,
        templateVersion: payload.templateVersion,

        settings: {
          create: settingsData(payload.settings),
        },

        seo: {
          create: {
            ...seoData(
              payload,
              payload.username,
            ),
          },
        },
      },
    });

    await replaceChildren(
      tx,
      portfolio.id,
      payload,
    );

    return portfolio;
  });

  const result = await prisma.portfolio.findUnique({
    where: {
      id: created.id,
    },
    include: portfolioInclude,
  });

  return {
    portfolio: serializePortfolio(result),
    created: true,
    portfolioLimitWarning:
      existingUserCount >= 0
        ? null
        : null,
  };
}

async function updatePortfolio(userId, portfolioId, body) {
  const payload = preparePayload(body);

  const current = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
      status: {
        not: 'DELETED',
      },
    },
    select: {
      id: true,
      username: true,
      status: true,
    },
  });

  if (!current) {
    const error = new Error('Portfolio not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payload.username !== current.username) {
    const usernameOwner = await prisma.portfolio.findFirst({
      where: {
        username: payload.username,
        status: {
          not: 'DELETED',
        },
        NOT: {
          id: portfolioId,
        },
      },
      select: {
        id: true,
      },
    });

    if (usernameOwner) {
      const error = new Error('That username is already taken.');
      error.statusCode = 409;
      throw error;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.update({
      where: {
        id: portfolioId,
      },

      data: {
        username: payload.username,
        slug: payload.username,

        fullName: payload.fullName,
        professionalTitle: payload.professionalTitle,
        tagline: payload.tagline,
        bio: payload.bio,
        email: payload.email,
        phone: payload.phone,
        location: payload.location,
        website: payload.website,

        availability: payload.availability,
        yearsOfExperience: payload.yearsOfExperience,

        template: payload.template,
        templateVersion: payload.templateVersion,

        seo: {
          upsert: {
            create: {
              ...seoData(
                payload,
                payload.username,
              ),
            },

            update: {
              ...seoData(
                payload,
                payload.username,
              ),
            },
          },
        },

        settings: {
          upsert: {
            create: settingsData(
              payload.settings,
            ),

            update: settingsData(
              payload.settings,
            ),
          },
        },
      },
    });

    await replaceChildren(
      tx,
      portfolio.id,
      payload,
    );

    return portfolio;
  });

  const result = await prisma.portfolio.findUnique({
    where: {
      id: updated.id,
    },
    include: portfolioInclude,
  });

  return {
    portfolio: serializePortfolio(result),
    created: false,
  };
}

async function deletePortfolio(userId, portfolioId) {
  const existing = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
      status: {
        not: 'DELETED',
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    const error = new Error('Portfolio not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.portfolio.update({
    where: {
      id: portfolioId,
    },
    data: {
      status: 'DELETED',
      visibility: 'PRIVATE',
      deletedAt: new Date(),
    },
  });

  return {
    deleted: true,
  };
}

async function publishPortfolio(userId, portfolioId) {
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
      status: {
        not: 'DELETED',
      },
    },
    include: {
      projects: true,
      skills: true,
      experiences: true,
      education: true,
      socialLinks: true,
    },
  });

  if (!portfolio) {
    const error = new Error('Portfolio not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!portfolio.fullName?.trim()) {
    const error = new Error('Full name is required before publishing.');
    error.statusCode = 422;
    throw error;
  }

  if (!portfolio.professionalTitle?.trim()) {
    const error = new Error(
      'Professional title is required before publishing.',
    );
    error.statusCode = 422;
    throw error;
  }

  if (portfolio.projects.length === 0) {
    const error = new Error(
      'Add at least one project before publishing.',
    );
    error.statusCode = 422;
    throw error;
  }

  if (portfolio.skills.length === 0) {
    const error = new Error(
      'Add at least one skill before publishing.',
    );
    error.statusCode = 422;
    throw error;
  }

  const now = new Date();

  const updated = await prisma.portfolio.update({
    where: {
      id: portfolioId,
    },
    data: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      publishedAt: portfolio.publishedAt || now,
      lastPublishedAt: now,
      seo: {
        update: {
          noIndex: false,
        },
      },
    },
    include: portfolioInclude,
  });

  return {
    portfolio: serializePortfolio(updated),
    url: `https://pluten.site/p/${updated.username}`,
  };
}

async function unpublishPortfolio(userId, portfolioId) {
  const existing = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
      status: 'PUBLISHED',
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    const error = new Error('Published portfolio not found.');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.portfolio.update({
    where: {
      id: portfolioId,
    },
    data: {
      status: 'UNPUBLISHED',
      visibility: 'PRIVATE',

      seo: {
        update: {
          noIndex: true,
        },
      },
    },
    include: portfolioInclude,
  });

  return {
    portfolio: serializePortfolio(updated),
  };
}

async function getPublicPortfolio(username) {
  const normalized = normalizeUsername(username);

  validateUsername(normalized);

  const portfolio = await prisma.portfolio.findFirst({
    where: {
      username: normalized,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      deletedAt: null,
    },
    include: portfolioInclude,
  });

  if (!portfolio) {
    const error = new Error('Portfolio not found.');
    error.statusCode = 404;
    throw error;
  }

  return serializePublicPortfolio(portfolio);
}

module.exports = {
  normalizeUsername,
  validateUsername,
  getUserPortfolios,
  getPortfolioForUser,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
};