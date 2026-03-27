export interface ComparisonPair {
  slug: string;
  concept1: string;
  concept2: string;
  question: string;
  summary: string;
}

/**
 * Creates a canonical comparison slug from two concept slugs.
 * Always alphabetical order to prevent duplicates.
 */
export function comparisonSlug(slug1: string, slug2: string): string {
  const sorted = [slug1, slug2].sort();
  return `${sorted[0]}-vs-${sorted[1]}`;
}

export const POPULAR_COMPARISONS: ComparisonPair[] = [
  {
    slug: 'artificial-intelligence-vs-machine-learning',
    concept1: 'artificial-intelligence',
    concept2: 'machine-learning',
    question: 'AI vs Machine Learning: What\'s the Difference?',
    summary: 'Artificial intelligence is the broad goal of creating intelligent machines, while machine learning is a specific approach that lets machines learn from data. All ML is AI, but not all AI is ML.',
  },
  {
    slug: 'deep-learning-vs-machine-learning',
    concept1: 'deep-learning',
    concept2: 'machine-learning',
    question: 'Deep Learning vs Machine Learning: What\'s the Difference?',
    summary: 'Machine learning is the broader field of algorithms that learn from data, while deep learning is a subset that uses multi-layered neural networks. Deep learning excels at unstructured data like images and text but requires more compute.',
  },
  {
    slug: 'deep-learning-vs-neural-networks',
    concept1: 'deep-learning',
    concept2: 'neural-networks',
    question: 'Deep Learning vs Neural Networks: What\'s the Difference?',
    summary: 'Neural networks are computing systems with interconnected nodes, while deep learning refers specifically to neural networks with many layers. A shallow neural network has one or two hidden layers; deep learning uses dozens or more.',
  },
  {
    slug: 'supervised-learning-vs-unsupervised-learning',
    concept1: 'supervised-learning',
    concept2: 'unsupervised-learning',
    question: 'Supervised vs Unsupervised Learning: What\'s the Difference?',
    summary: 'Supervised learning trains on labeled data with known correct answers, while unsupervised learning finds patterns in unlabeled data. Supervised learning is used for prediction tasks; unsupervised learning for clustering and dimensionality reduction.',
  },
  {
    slug: 'generative-ai-vs-large-language-models',
    concept1: 'generative-ai',
    concept2: 'large-language-models',
    question: 'Generative AI vs LLMs: What\'s the Difference?',
    summary: 'Generative AI is the broad category of AI that creates new content, while large language models are a specific type of generative AI focused on text. LLMs like GPT-4 are generative AI, but so are image generators like DALL-E and Midjourney.',
  },
  {
    slug: 'fine-tuning-vs-prompt-engineering',
    concept1: 'fine-tuning',
    concept2: 'prompt-engineering',
    question: 'Fine-Tuning vs Prompt Engineering: What\'s the Difference?',
    summary: 'Prompt engineering crafts better inputs to get better outputs from an existing model, while fine-tuning actually modifies the model\'s weights with new training data. Prompt engineering is faster and cheaper; fine-tuning produces more specialized results.',
  },
  {
    slug: 'fine-tuning-vs-retrieval-augmented-generation',
    concept1: 'fine-tuning',
    concept2: 'retrieval-augmented-generation',
    question: 'Fine-Tuning vs RAG: What\'s the Difference?',
    summary: 'Fine-tuning permanently bakes new knowledge into a model by retraining it, while RAG retrieves relevant documents at query time and feeds them to the model. RAG keeps knowledge current without retraining; fine-tuning changes model behavior more deeply.',
  },
  {
    slug: 'convolutional-neural-networks-vs-transformers',
    concept1: 'convolutional-neural-networks',
    concept2: 'transformers',
    question: 'CNNs vs Transformers: What\'s the Difference?',
    summary: 'CNNs process data through spatial filters and excel at image recognition, while transformers use self-attention to process sequences in parallel and dominate NLP. Transformers are increasingly used for vision tasks too, blurring the boundary.',
  },
  {
    slug: 'diffusion-models-vs-generative-adversarial-networks',
    concept1: 'diffusion-models',
    concept2: 'generative-adversarial-networks',
    question: 'Diffusion Models vs GANs: What\'s the Difference?',
    summary: 'GANs use two competing networks (generator and discriminator) to create realistic outputs, while diffusion models gradually remove noise to generate data. Diffusion models produce higher-quality images and are more stable to train, largely replacing GANs.',
  },
  {
    slug: 'agentic-ai-vs-large-language-models',
    concept1: 'agentic-ai',
    concept2: 'large-language-models',
    question: 'Agentic AI vs LLMs: What\'s the Difference?',
    summary: 'LLMs generate text responses to prompts, while agentic AI systems use LLMs as a reasoning engine to plan, make decisions, and take autonomous actions. An LLM answers questions; an agent uses an LLM to accomplish multi-step goals.',
  },
  {
    slug: 'artificial-general-intelligence-vs-artificial-narrow-intelligence',
    concept1: 'artificial-general-intelligence',
    concept2: 'artificial-narrow-intelligence',
    question: 'AGI vs ANI: What\'s the Difference?',
    summary: 'ANI (narrow AI) excels at specific tasks like chess or image recognition, while AGI (general AI) would match human-level intelligence across all cognitive tasks. All current AI systems are ANI; AGI remains a theoretical goal.',
  },
  {
    slug: 'computer-vision-vs-natural-language-processing',
    concept1: 'computer-vision',
    concept2: 'natural-language-processing',
    question: 'Computer Vision vs NLP: What\'s the Difference?',
    summary: 'Computer vision enables machines to interpret visual information like images and video, while NLP enables machines to understand and generate human language. Both are major AI application domains, increasingly unified through multimodal models.',
  },
];
