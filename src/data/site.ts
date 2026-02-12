export const siteConfig = {
  /** Owner's full name */
  name: 'Patryk Golabek',
  /** Professional title for structured data */
  jobTitle: 'Cloud-Native Software Architect',
  /** One-line description for meta tags and JSON-LD */
  description:
    'Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps',
  /** Hero tagline shown below the name */
  tagline:
    'Architecting resilient cloud-native systems and AI-powered platforms with 17+ years of hands-on engineering.',
  /** Roles for the typing animation */
  roles: [
    'Cloud-Native Architect',
    'Systems Engineer',
    'AI/ML Engineer',
    'Platform Builder',
  ] as const,
  /** Canonical site URL */
  url: 'https://patrykgolabek.dev',
} as const;

export type SiteConfig = typeof siteConfig;
