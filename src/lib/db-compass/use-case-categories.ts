/**
 * use-case-categories.ts -- Maps the 58 raw use-case strings from models.json
 * into 10 high-level filter categories for the overview page filter UI.
 * Every raw use-case string must belong to at least one category.
 */

/** A high-level use-case filter category */
export interface UseCaseCategory {
  id: string;
  label: string;
  /** Raw use-case strings from models.json that belong to this category */
  useCases: string[];
}

export const USE_CASE_CATEGORIES: UseCaseCategory[] = [
  {
    id: 'caching',
    label: 'Caching',
    useCases: [
      'Caching',
      'Application caching',
      'Session storage',
      'Session management',
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    useCases: [
      'Real-time analytics',
      'Financial analytics',
      'Business intelligence',
      'Log analytics',
      'Security analytics',
      'Application metrics',
      'Scientific modeling',
    ],
  },
  {
    id: 'oltp',
    label: 'OLTP',
    useCases: [
      'Enterprise applications',
      'Financial systems',
      'Financial transaction processing',
      'SaaS applications',
      'Global SaaS platforms',
      'E-commerce platforms',
      'Multi-region e-commerce',
      'Healthcare applications',
    ],
  },
  {
    id: 'search',
    label: 'Search',
    useCases: [
      'Full-text search',
      'E-commerce search',
      'Content discovery',
      'Semantic search',
    ],
  },
  {
    id: 'iot',
    label: 'IoT & Time-Series',
    useCases: [
      'IoT telemetry',
      'Infrastructure monitoring',
      'Energy grid monitoring',
      'Time-series at scale',
      'IoT with diverse access patterns',
    ],
  },
  {
    id: 'ai-ml',
    label: 'AI / ML',
    useCases: [
      'RAG pipelines',
      'Recommendation engines',
      'Recommendation systems',
      'Image similarity',
      'Anomaly detection',
      'Fraud detection',
    ],
  },
  {
    id: 'content',
    label: 'Content & CMS',
    useCases: [
      'Content management',
      'Content management systems',
      'Product catalogs',
      'User profiles',
      'Mobile app backends',
      'CAD/CAM systems',
      'Rapid prototyping',
    ],
  },
  {
    id: 'graph',
    label: 'Graph & Network',
    useCases: [
      'Social networks',
      'Knowledge graphs',
      'Network analysis',
      'Telecom networks',
    ],
  },
  {
    id: 'realtime',
    label: 'Real-Time',
    useCases: [
      'Real-time counters',
      'Real-time collaboration',
      'Message brokering',
      'Messaging platforms',
      'Low-latency trading systems',
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    useCases: [
      'Configuration management',
      'Feature flags',
      'Rate limiting',
      'Cloud-native migrations',
      'Event logging',
      'Global distribution',
      'Mixed-model applications',
      'Polyglot persistence replacement',
    ],
  },
];

/**
 * Returns which category IDs a model belongs to, based on its useCases array.
 * A model belongs to a category if ANY of its use cases appear in that category.
 */
export function modelCategories(modelUseCases: string[]): string[] {
  return USE_CASE_CATEGORIES.filter((cat) =>
    cat.useCases.some((uc) => modelUseCases.includes(uc)),
  ).map((cat) => cat.id);
}
