export interface TourStep {
  nodeId: string;
  narrative: string;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
}

export const TOURS: Tour[] = [
  {
    id: 'the-big-picture',
    title: 'The Big Picture',
    description: 'See how the entire AI landscape fits together, from broad AI to specialized applications.',
    steps: [
      {
        nodeId: 'artificial-intelligence',
        narrative: 'Everything starts here. AI is the broad field of making machines perform tasks that normally require human intelligence.',
      },
      {
        nodeId: 'machine-learning',
        narrative: 'ML is a subset of AI where systems learn from data instead of following explicit rules.',
      },
      {
        nodeId: 'neural-networks',
        narrative: 'Neural networks are computing systems inspired by biological brains, learning to recognize patterns through interconnected layers of nodes.',
      },
      {
        nodeId: 'deep-learning',
        narrative: 'Deep learning uses many layers of neural networks to automatically discover representations needed for complex tasks like image recognition and language understanding.',
      },
      {
        nodeId: 'generative-ai',
        narrative: 'Generative AI creates new content -- text, images, code, music -- rather than just classifying or predicting from existing data.',
      },
      {
        nodeId: 'large-language-models',
        narrative: 'LLMs like GPT-4 and Claude are the engines behind modern AI assistants, trained on vast text corpora to understand and generate human language.',
      },
      {
        nodeId: 'agentic-ai',
        narrative: 'Agentic AI can plan, reason, use tools, and take autonomous actions -- representing the cutting edge of what AI systems can do.',
      },
    ],
  },
  {
    id: 'how-chatgpt-works',
    title: 'How ChatGPT Works',
    description: 'Trace the technology stack that powers ChatGPT and modern AI assistants.',
    steps: [
      {
        nodeId: 'artificial-intelligence',
        narrative: 'ChatGPT is an AI system -- a machine designed to perform tasks that require intelligence, specifically understanding and generating human language.',
      },
      {
        nodeId: 'machine-learning',
        narrative: 'Rather than being programmed with language rules, ChatGPT learned language patterns from massive datasets through machine learning.',
      },
      {
        nodeId: 'neural-networks',
        narrative: 'At its core, ChatGPT is a neural network -- layers of mathematical functions that process input and produce output, loosely inspired by the brain.',
      },
      {
        nodeId: 'deep-learning',
        narrative: 'ChatGPT uses deep learning with billions of parameters spread across many layers, enabling it to capture subtle patterns in language.',
      },
      {
        nodeId: 'transformers',
        narrative: 'The "T" in GPT stands for Transformer, the architecture that revolutionized NLP by processing all words in parallel using self-attention mechanisms.',
      },
      {
        nodeId: 'foundation-models',
        narrative: 'GPT is a foundation model -- pre-trained on enormous datasets, then adapted for specific tasks like conversation, coding, and analysis.',
      },
      {
        nodeId: 'large-language-models',
        narrative: 'As a large language model, GPT-4 has hundreds of billions of parameters that encode knowledge about language, facts, and reasoning.',
      },
      {
        nodeId: 'prompt-engineering',
        narrative: 'How you phrase your prompt dramatically affects ChatGPT\'s output. Prompt engineering is the art of crafting inputs that produce the best results.',
      },
      {
        nodeId: 'context-windows',
        narrative: 'ChatGPT can only "see" a limited amount of text at once -- its context window. Larger windows allow longer conversations and more complex reasoning.',
      },
      {
        nodeId: 'rlhf-dpo',
        narrative: 'ChatGPT was fine-tuned using RLHF (Reinforcement Learning from Human Feedback) to be helpful, harmless, and honest -- this is what makes it conversational.',
      },
    ],
  },
  {
    id: 'what-is-agentic-ai',
    title: 'What is Agentic AI',
    description: 'Follow the path from basic AI to autonomous agents that can plan, reason, and use tools.',
    steps: [
      {
        nodeId: 'artificial-intelligence',
        narrative: 'Agentic AI builds on decades of AI research, starting from the fundamental goal of creating intelligent machines.',
      },
      {
        nodeId: 'machine-learning',
        narrative: 'Machine learning gave AI the ability to improve from experience, a prerequisite for agents that adapt to new situations.',
      },
      {
        nodeId: 'reinforcement-learning',
        narrative: 'Reinforcement learning teaches agents through trial and error -- receiving rewards for good actions and penalties for bad ones, just like training a pet.',
      },
      {
        nodeId: 'foundation-models',
        narrative: 'Foundation models provide the broad knowledge base that agents need to understand the world and reason about tasks.',
      },
      {
        nodeId: 'reasoning-models',
        narrative: 'Reasoning models like o1 and o3 can break down complex problems into steps, a critical capability for autonomous agents.',
      },
      {
        nodeId: 'agentic-ai',
        narrative: 'Agentic AI combines all these capabilities into systems that can independently plan, decide, and act to achieve goals.',
      },
      {
        nodeId: 'autonomy',
        narrative: 'Autonomy is the defining trait -- agentic systems operate with minimal human oversight, making decisions on their own.',
      },
      {
        nodeId: 'tool-use',
        narrative: 'Agents extend their capabilities by using external tools -- searching the web, running code, calling APIs, and interacting with software.',
      },
      {
        nodeId: 'model-context-protocol',
        narrative: 'MCP is an open standard that lets AI agents connect to external tools and data sources in a standardized way, like USB for AI.',
      },
    ],
  },
];
