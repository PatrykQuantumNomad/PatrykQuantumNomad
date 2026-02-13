export interface Project {
  name: string;
  description: string;
  url: string;
  liveUrl?: string;
  language: string;
  category: Category;
  fork?: boolean;
}

export const categories = [
  'AI/ML & LLM Agents',
  'Kubernetes & Infrastructure',
  'Platform & DevOps Tooling',
  'Security & Networking',
] as const;

export type Category = (typeof categories)[number];

export const projects: Project[] = [
  // AI/ML & LLM Agents
  {
    name: 'kps-graph-agent',
    description:
      'LLM-powered graph agent for intelligent query processing and knowledge retrieval',
    url: 'https://github.com/PatrykQuantumNomad/kps-graph-agent',
    language: 'Python',
    category: 'AI/ML & LLM Agents',
  },
  {
    name: 'kps-assistant',
    description:
      'AI assistant platform built with modern LLM orchestration patterns',
    url: 'https://github.com/PatrykQuantumNomad/kps-assistant',
    language: 'Python',
    category: 'AI/ML & LLM Agents',
  },
  {
    name: 'kps-assistant-support',
    description:
      'Infrastructure support layer for the KPS AI assistant platform',
    url: 'https://github.com/PatrykQuantumNomad/kps-assistant-support',
    language: 'HCL',
    category: 'AI/ML & LLM Agents',
  },
  {
    name: 'kubert-langflow',
    description:
      'Custom Langflow components and flows for the Kubert AI platform',
    url: 'https://github.com/PatrykQuantumNomad/kubert-langflow',
    language: 'Python',
    category: 'AI/ML & LLM Agents',
  },
  {
    name: 'kps-langflow',
    description:
      'Terraform deployment of Langflow on Kubernetes for AI workflow orchestration',
    url: 'https://github.com/PatrykQuantumNomad/kps-langflow',
    language: 'HCL',
    category: 'AI/ML & LLM Agents',
  },
  {
    name: 'tekstack-assistant-library',
    description:
      'Reusable assistant library for building AI-powered developer tools',
    url: 'https://github.com/PatrykQuantumNomad/tekstack-assistant-library',
    language: 'Python',
    category: 'AI/ML & LLM Agents',
  },
  {
    name: 'financial-data-extractor',
    description:
      'Production-grade financial data extraction system with structured output parsing',
    url: 'https://github.com/PatrykQuantumNomad/financial-data-extractor',
    language: 'Python',
    category: 'AI/ML & LLM Agents',
  },

  // Kubernetes & Infrastructure
  {
    name: 'kps-cluster-deployment',
    description:
      'Production Kubernetes cluster provisioning with Terraform and best-practice configurations',
    url: 'https://github.com/PatrykQuantumNomad/kps-cluster-deployment',
    language: 'HCL',
    category: 'Kubernetes & Infrastructure',
  },
  {
    name: 'kps-infra-management',
    description:
      'Infrastructure lifecycle management for multi-environment Kubernetes platforms',
    url: 'https://github.com/PatrykQuantumNomad/kps-infra-management',
    language: 'HCL',
    category: 'Kubernetes & Infrastructure',
  },
  {
    name: 'kps-basic-package',
    description:
      'Base Terraform package for bootstrapping Kubernetes cluster resources',
    url: 'https://github.com/PatrykQuantumNomad/kps-basic-package',
    language: 'HCL',
    category: 'Kubernetes & Infrastructure',
  },
  {
    name: 'kps-observability-package',
    description:
      'Full observability stack (metrics, logs, traces) deployed via Terraform on Kubernetes',
    url: 'https://github.com/PatrykQuantumNomad/kps-observability-package',
    language: 'HCL',
    category: 'Kubernetes & Infrastructure',
  },
  {
    name: 'kps-charts',
    description:
      'Custom Helm charts for deploying platform services on Kubernetes',
    url: 'https://github.com/PatrykQuantumNomad/kps-charts',
    language: 'Go Template',
    category: 'Kubernetes & Infrastructure',
  },
  {
    name: 'kps-images',
    description:
      'Container image build pipelines and registry management automation',
    url: 'https://github.com/PatrykQuantumNomad/kps-images',
    language: 'TSQL',
    category: 'Kubernetes & Infrastructure',
  },

  // Platform & DevOps Tooling
  {
    name: 'kps-lobe-chat',
    description:
      'Self-hosted LobeChat deployment on Kubernetes for team AI chat',
    url: 'https://github.com/PatrykQuantumNomad/kps-lobe-chat',
    language: 'TypeScript',
    category: 'Platform & DevOps Tooling',
  },
  {
    name: 'jobs',
    description:
      'Automated job scraper and tracking dashboard for the job search process',
    url: 'https://github.com/PatrykQuantumNomad/jobs',
    language: 'Python',
    category: 'Platform & DevOps Tooling',
  },

  // Security & Networking
  {
    name: 'networking-tools',
    description:
      'Pentesting learning lab with 17 security tools (Nmap, Metasploit, SQLMap, etc.), 28 use-case scripts, and Docker-based vulnerable targets',
    url: 'https://github.com/PatrykQuantumNomad/networking-tools',
    liveUrl: 'https://patrykquantumnomad.github.io/networking-tools/',
    language: 'Shell',
    category: 'Security & Networking',
  },
];
