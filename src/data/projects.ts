export interface Project {
  name: string;
  description: string;
  url: string;
  liveUrl?: string;
  language: string;
  category: Category;
  fork?: boolean;
  technologies: string[];
  status: 'active' | 'archived' | 'experimental';
  gridSize: 'large' | 'medium' | 'small';
}

export const categories = [
  'Kubert Kubernetes Platform',
  'AI & Intelligent Agents',
  'Open Source Tools',
] as const;

export type Category = (typeof categories)[number];

export const projects: Project[] = [
  // Kubert Kubernetes Platform
  {
    name: 'kps-cluster-deployment',
    description:
      'GKE cluster provisioning with Terraform — Calico networking, Cert Manager, NGINX Ingress, and External DNS out of the box',
    url: 'https://github.com/PatrykQuantumNomad/kps-cluster-deployment',
    language: 'HCL',
    category: 'Kubert Kubernetes Platform',
    technologies: ['Terraform', 'GKE', 'Kubernetes', 'Calico', 'NGINX'],
    status: 'active',
    gridSize: 'large',
  },
  {
    name: 'kps-infra-management',
    description:
      'Cloud foundation using Terraform and Terragrunt — VPC, Bastion Host, Atlantis for plan automation, and InfraCost for cost tracking',
    url: 'https://github.com/PatrykQuantumNomad/kps-infra-management',
    language: 'HCL',
    category: 'Kubert Kubernetes Platform',
    technologies: ['Terraform', 'Terragrunt', 'GCP', 'Atlantis', 'InfraCost'],
    status: 'active',
    gridSize: 'medium',
  },
  {
    name: 'kps-observability-package',
    description:
      'Full observability stack — Grafana dashboards, Loki log aggregation, Prometheus metrics, Headlamp UI, AlertManager, Popeye audits, and OpenCost tracking',
    url: 'https://github.com/PatrykQuantumNomad/kps-observability-package',
    language: 'HCL',
    category: 'Kubert Kubernetes Platform',
    technologies: ['Terraform', 'Grafana', 'Prometheus', 'Loki', 'OpenCost'],
    status: 'active',
    gridSize: 'large',
  },
  {
    name: 'kps-charts',
    description:
      'Helm chart repository for Kubert platform services, published to GCP Artifact Registry with automated CI/CD',
    url: 'https://github.com/PatrykQuantumNomad/kps-charts',
    language: 'Go Template',
    category: 'Kubert Kubernetes Platform',
    technologies: ['Helm', 'Go Template', 'Kubernetes', 'GCP'],
    status: 'active',
    gridSize: 'medium',
  },
  {
    name: 'kps-basic-package',
    description:
      'Base Terraform modules for bootstrapping Kubernetes cluster resources — the foundational building blocks of the Kubert platform',
    url: 'https://github.com/PatrykQuantumNomad/kps-basic-package',
    language: 'HCL',
    category: 'Kubert Kubernetes Platform',
    technologies: ['Terraform', 'Kubernetes', 'HCL'],
    status: 'active',
    gridSize: 'small',
  },
  {
    name: 'kps-images',
    description:
      'Container image definitions and build pipelines for Kubert platform components',
    url: 'https://github.com/PatrykQuantumNomad/kps-images',
    language: 'Dockerfile',
    category: 'Kubert Kubernetes Platform',
    technologies: ['Docker', 'CI/CD', 'Shell', 'GCP'],
    status: 'active',
    gridSize: 'small',
  },

  // AI & Intelligent Agents
  {
    name: 'kps-graph-agent',
    description:
      'Knowledge graph agent on Kubernetes using LangGraph with DevSpace for local development',
    url: 'https://github.com/PatrykQuantumNomad/kps-graph-agent',
    language: 'Python',
    category: 'AI & Intelligent Agents',
    technologies: ['Python', 'LangGraph', 'Kubernetes', 'DevSpace'],
    status: 'active',
    gridSize: 'medium',
  },
  {
    name: 'kps-assistant',
    description:
      'AI assistant deployment and orchestration platform on Kubernetes',
    url: 'https://github.com/PatrykQuantumNomad/kps-assistant',
    language: 'Python',
    category: 'AI & Intelligent Agents',
    technologies: ['Python', 'LLM', 'FastAPI', 'Kubernetes'],
    status: 'active',
    gridSize: 'medium',
  },
  {
    name: 'kps-assistant-support',
    description:
      'Terraform and Terragrunt IaC for provisioning the KPS AI assistant infrastructure',
    url: 'https://github.com/PatrykQuantumNomad/kps-assistant-support',
    language: 'HCL',
    category: 'AI & Intelligent Agents',
    technologies: ['Terraform', 'Terragrunt', 'Kubernetes', 'GCP'],
    status: 'active',
    gridSize: 'small',
  },
  {
    name: 'kubert-langflow',
    description:
      'Langflow fork customized for Kubert — visual drag-and-drop AI workflow builder',
    url: 'https://github.com/PatrykQuantumNomad/kubert-langflow',
    language: 'Python',
    category: 'AI & Intelligent Agents',
    fork: true,
    technologies: ['Python', 'Langflow', 'LLM', 'React'],
    status: 'active',
    gridSize: 'medium',
  },
  {
    name: 'kps-langflow',
    description:
      'Terraform and Terragrunt deployment of Langflow on Kubernetes with production-grade configuration',
    url: 'https://github.com/PatrykQuantumNomad/kps-langflow',
    language: 'HCL',
    category: 'AI & Intelligent Agents',
    technologies: ['Terraform', 'Terragrunt', 'Kubernetes', 'HCL'],
    status: 'active',
    gridSize: 'small',
  },
  {
    name: 'tekstack-assistant-library',
    description:
      'Python SDK for building AI assistant tools and integrations',
    url: 'https://github.com/PatrykQuantumNomad/tekstack-assistant-library',
    language: 'Python',
    category: 'AI & Intelligent Agents',
    technologies: ['Python', 'SDK', 'LLM', 'API'],
    status: 'active',
    gridSize: 'medium',
  },
  {
    name: 'kps-lobe-chat',
    description:
      'Self-hosted LobeChat on Kubernetes — multi-model AI chat supporting OpenAI, Claude, Gemini, and Ollama',
    url: 'https://github.com/PatrykQuantumNomad/kps-lobe-chat',
    language: 'TypeScript',
    category: 'AI & Intelligent Agents',
    fork: true,
    technologies: ['TypeScript', 'Next.js', 'Kubernetes', 'Docker'],
    status: 'active',
    gridSize: 'medium',
  },

  // Open Source Tools
  {
    name: 'financial-data-extractor',
    description:
      'Full-stack financial statement extraction — FastAPI backend, Next.js 15 frontend, and LLM-powered PDF parsing targeting European companies',
    url: 'https://github.com/PatrykQuantumNomad/financial-data-extractor',
    liveUrl: 'https://financial-data-extractor.patrykgolabek.dev',
    language: 'Python',
    category: 'Open Source Tools',
    technologies: ['Python', 'FastAPI', 'Next.js', 'LLM', 'PostgreSQL'],
    status: 'active',
    gridSize: 'large',
  },
  {
    name: 'JobFlow',
    description:
      'Multi-platform job scraper with intelligent scoring, human-in-the-loop applications, and FastAPI dashboard (544 tests)',
    url: 'https://github.com/PatrykQuantumNomad/jobs',
    liveUrl: 'https://jobflow.patrykgolabek.dev',
    language: 'Python',
    category: 'Open Source Tools',
    technologies: ['Python', 'FastAPI', 'Playwright', 'SQLite'],
    status: 'active',
    gridSize: 'large',
  },
  {
    name: 'networking-tools',
    description:
      'Pentesting learning lab — 17 security tools (Nmap, Metasploit, SQLMap), 28 scripts, and Docker-based targets (DVWA, Juice Shop, WebGoat)',
    url: 'https://github.com/PatrykQuantumNomad/networking-tools',
    liveUrl: 'https://networking-tools.patrykgolabek.dev/',
    language: 'Shell',
    category: 'Open Source Tools',
    technologies: ['Shell', 'Docker', 'Nmap', 'Metasploit', 'Security'],
    status: 'active',
    gridSize: 'large',
  },
];
