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
    'Building resilient cloud-native systems and AI-powered solutions for 17+ years. Pre-1.0 Kubernetes adopter. Ontario, Canada.',
  /** Roles for the typing animation */
  roles: [
    'Cloud-Native Architect',
    'Kubernetes Pioneer',
    'AI/ML Engineer',
    'Platform Builder',
  ] as const,
  /** Canonical site URL */
  url: 'https://patrykgolabek.dev',
} as const;

export type SiteConfig = typeof siteConfig;
