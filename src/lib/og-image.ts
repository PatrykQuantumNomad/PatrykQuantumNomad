import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateRadarSvgString } from './beauty-index/radar-math';
import { getTierColor, DIMENSION_COLORS } from './beauty-index/tiers';
import { DIMENSIONS } from './beauty-index/dimensions';
import { totalScore, dimensionScores, type Language } from './beauty-index/schema';

let interFont: Buffer | undefined;
let spaceGroteskFont: Buffer | undefined;

async function loadFonts() {
  interFont ??= await readFile('./src/assets/fonts/Inter-Regular.woff');
  spaceGroteskFont ??= await readFile('./src/assets/fonts/SpaceGrotesk-Bold.woff');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '\u2026';
}

async function loadCoverImage(
  coverImage: string,
  fit: 'contain' | 'cover' = 'contain',
): Promise<string | null> {
  try {
    const filePath = join('./public', coverImage);
    const buffer = await readFile(filePath);
    const resized = await sharp(buffer)
      .resize(1088, 400, { fit, background: { r: 250, g: 248, b: 245, alpha: 1 } })
      .png()
      .toBuffer();
    return `data:image/png;base64,${resized.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function generateOgImage(
  title: string,
  description: string,
  tags: string[] = [],
  coverImage?: string,
): Promise<Buffer> {
  await loadFonts();

  const displayTitle = truncate(title, 80);
  const displayDescription = truncate(description, 140);
  const displayTags = tags.slice(0, 5);

  const coverDataUri = coverImage ? await loadCoverImage(coverImage) : null;
  const hasCover = !!coverDataUri;

  const brandingRow = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: '16px',
              color: '#ffffff',
              backgroundColor: '#c44b20',
              borderRadius: '6px',
              padding: '2px 8px',
            },
            children: 'PG',
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: '16px', color: '#888899' },
            children: 'patrykgolabek.dev',
          },
        },
      ],
    },
  };

  const tagsRow = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: hasCover ? '8px' : '10px',
      },
      children: displayTags.map((tag) => ({
        type: 'div',
        props: {
          style: {
            fontSize: hasCover ? '14px' : '15px',
            color: '#c44b20',
            backgroundColor: 'rgba(196,75,32,0.1)',
            borderRadius: '20px',
            padding: hasCover ? '4px 14px' : '6px 18px',
          },
          children: tag,
        },
      })),
    },
  };

  const coverLayout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#faf8f5',
        position: 'relative' as const,
        fontFamily: 'Inter',
      },
      children: [
        // Accent bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '1200px',
              height: '6px',
              backgroundImage: 'linear-gradient(to right, #c44b20, #e8734a)',
            },
          },
        },
        // Cover image across the top
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'center',
              padding: '60px 56px 0px',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: coverDataUri!,
                  width: 1088,
                  height: 400,
                  style: {
                    borderRadius: '12px',
                    border: '1px solid #e0ddd8',
                  },
                },
              },
            ],
          },
        },
        // Bottom section: title, tags, branding
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'flex-end',
              flexGrow: 1,
              padding: '16px 56px 28px',
              gap: '10px',
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: '32px',
                    color: '#1a1a2e',
                    lineHeight: 1.25,
                  },
                  children: displayTitle,
                },
              },
              // Tags + branding row
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row' as const,
                    alignItems: 'center',
                    gap: '16px',
                  },
                  children: [
                    tagsRow,
                    // Separator dot
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: '#bbb',
                          flexShrink: 0,
                        },
                      },
                    },
                    brandingRow,
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };

  const noCoverLayout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#faf8f5',
        position: 'relative' as const,
        fontFamily: 'Inter',
      },
      children: [
        // Accent bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '1200px',
              height: '6px',
              backgroundImage: 'linear-gradient(to right, #c44b20, #e8734a)',
            },
          },
        },
        // Main two-column row
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row' as const,
              width: '1200px',
              height: '630px',
            },
            children: [
              // Left column: text content
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'center',
                    width: '620px',
                    padding: '40px 0px 60px 56px',
                    gap: '24px',
                  },
                  children: [
                    // Title
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Space Grotesk',
                          fontWeight: 700,
                          fontSize: '56px',
                          color: '#1a1a2e',
                          lineHeight: 1.15,
                        },
                        children: displayTitle,
                      },
                    },
                    // Description
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '22px',
                          color: '#555566',
                          lineHeight: 1.5,
                        },
                        children: displayDescription,
                      },
                    },
                    // Tags
                    tagsRow,
                  ],
                },
              },
              // Right column: decorative monogram
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '350px',
                    height: '630px',
                  },
                  children: [
                    // Outer ring
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '240px',
                          height: '240px',
                          borderRadius: '50%',
                          border: '3px solid rgba(196,75,32,0.15)',
                        },
                        children: [
                          // Inner filled circle
                          {
                            type: 'div',
                            props: {
                              style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '190px',
                                height: '190px',
                                borderRadius: '50%',
                                backgroundImage:
                                  'linear-gradient(145deg, rgba(196,75,32,0.12), rgba(196,75,32,0.04))',
                              },
                              children: [
                                {
                                  type: 'div',
                                  props: {
                                    style: {
                                      display: 'flex',
                                      alignItems: 'baseline',
                                      fontFamily: 'Space Grotesk',
                                      fontWeight: 700,
                                      fontSize: '80px',
                                      letterSpacing: '-2px',
                                    },
                                    children: [
                                      {
                                        type: 'span',
                                        props: {
                                          style: { color: 'rgba(196,75,32,0.3)' },
                                          children: 'PG',
                                        },
                                      },
                                      {
                                        type: 'span',
                                        props: {
                                          style: { color: 'rgba(0,109,109,0.3)' },
                                          children: '_',
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Branding pinned to bottom-left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              bottom: '24px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#ffffff',
                    backgroundColor: '#c44b20',
                    borderRadius: '6px',
                    padding: '2px 8px',
                  },
                  children: 'PG',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '16px', color: '#888899' },
                  children: 'patrykgolabek.dev',
                },
              },
            ],
          },
        },
      ],
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Satori accepts plain object VNodes at runtime
  const svg = await satori((hasCover ? coverLayout : noCoverLayout) as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: interFont!,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Space Grotesk',
        data: spaceGroteskFont!,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png;
}

/** Shared Satori render helper — avoids duplicating font config */
async function renderOgPng(layout: Record<string, unknown>): Promise<Buffer> {
  await loadFonts();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Satori accepts plain object VNodes at runtime
  const svg = await satori(layout as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interFont!, weight: 400, style: 'normal' as const },
      { name: 'Space Grotesk', data: spaceGroteskFont!, weight: 700, style: 'normal' as const },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Reusable branding row (PG badge + patrykgolabek.dev) */
function brandingRow() {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: '16px',
              color: '#ffffff',
              backgroundColor: '#c44b20',
              borderRadius: '6px',
              padding: '2px 8px',
            },
            children: 'PG',
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: '16px', color: '#888899' },
            children: 'patrykgolabek.dev',
          },
        },
      ],
    },
  };
}

/** Accent bar used at top of all OG images */
function accentBar() {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '1200px',
        height: '6px',
        backgroundImage: 'linear-gradient(to right, #c44b20, #e8734a)',
      },
    },
  };
}

/**
 * Generates a branded OG image for the Beauty Index overview page.
 * Cover-image layout with golden ratio SVG, title, dimension pills, and PG branding.
 */
export async function generateOverviewOgImage(): Promise<Buffer> {
  const coverDataUri = await loadCoverImage('/images/beauty-index-golden-ratio-light.svg');
  const dimensionNames = ['Geometry', 'Elegance', 'Clarity', 'Happiness', 'Habitability', 'Integrity'];

  const dimensionPills = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '8px',
      },
      children: dimensionNames.map((name) => ({
        type: 'div',
        props: {
          style: {
            fontSize: '14px',
            color: '#c44b20',
            backgroundColor: 'rgba(196,75,32,0.1)',
            borderRadius: '20px',
            padding: '4px 14px',
          },
          children: name,
        },
      })),
    },
  };

  const layout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'row' as const,
        backgroundColor: '#faf8f5',
        position: 'relative' as const,
        fontFamily: 'Inter',
      },
      children: [
        accentBar(),
        // Left column: text
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              width: '620px',
              padding: '40px 0px 60px 56px',
              gap: '20px',
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: '56px',
                    color: '#1a1a2e',
                    lineHeight: 1.15,
                  },
                  children: 'The Beauty Index',
                },
              },
              // Subtitle
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '22px',
                    color: '#555566',
                    lineHeight: 1.5,
                  },
                  children: 'Ranking 25 programming languages across 6 aesthetic dimensions',
                },
              },
              // Dimension pills
              dimensionPills,
            ],
          },
        },
        // Right column: golden ratio logo
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '580px',
              height: '630px',
            },
            children: coverDataUri
              ? [
                  {
                    type: 'img',
                    props: {
                      src: coverDataUri,
                      width: 500,
                      height: 184,
                    },
                  },
                ]
              : [],
          },
        },
        // Bottom-left branding
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              bottom: '24px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            },
            children: brandingRow().props.children,
          },
        },
      ],
    },
  };

  return renderOgPng(layout);
}

/**
 * Generates a branded OG image for a single Beauty Index language page.
 * Two-column layout with language details on the left and radar chart on the right.
 */
export async function generateLanguageOgImage(language: Language): Promise<Buffer> {
  const tierColor = getTierColor(language.tier);
  const scores = dimensionScores(language);
  const total = totalScore(language);
  const labels = DIMENSIONS.map((d) => d.symbol + ' ' + d.shortName);
  const labelColors = DIMENSIONS.map((d) => DIMENSION_COLORS[d.key] ?? '#666');
  const radarSvg = generateRadarSvgString(300, scores, tierColor, 0.35, labels, labelColors);
  const radarDataUri = `data:image/svg+xml;base64,${Buffer.from(radarSvg).toString('base64')}`;
  const tierLabel = language.tier.charAt(0).toUpperCase() + language.tier.slice(1);
  const sketch = truncate(language.characterSketch, 120);

  const layout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'row' as const,
        backgroundColor: '#faf8f5',
        position: 'relative' as const,
        fontFamily: 'Inter',
      },
      children: [
        accentBar(),
        // Left column (text)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              width: '700px',
              padding: '40px 0px 60px 56px',
              gap: '16px',
            },
            children: [
              // "The Beauty Index" label
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '18px',
                    color: '#c44b20',
                    fontWeight: 600,
                  },
                  children: 'The Beauty Index',
                },
              },
              // Language name
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: '56px',
                    color: '#1a1a2e',
                    lineHeight: 1.15,
                  },
                  children: language.name,
                },
              },
              // Score + Tier row
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  },
                  children: [
                    // Score
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Space Grotesk',
                          fontWeight: 700,
                          fontSize: '32px',
                          color: tierColor,
                        },
                        children: `${total}/60`,
                      },
                    },
                    // Tier pill
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '16px',
                          color: '#ffffff',
                          backgroundColor: tierColor,
                          borderRadius: '20px',
                          padding: '4px 16px',
                          fontWeight: 600,
                        },
                        children: tierLabel,
                      },
                    },
                  ],
                },
              },
              // Character sketch
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '18px',
                    color: '#555566',
                    lineHeight: 1.5,
                  },
                  children: sketch,
                },
              },
            ],
          },
        },
        // Right column (radar chart)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '500px',
              height: '630px',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: radarDataUri,
                  width: 360,
                  height: 360,
                },
              },
            ],
          },
        },
        // Bottom-left branding
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              bottom: '24px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            },
            children: brandingRow().props.children,
          },
        },
      ],
    },
  };

  return renderOgPng(layout);
}

/** Helper to build a language column for the vs OG image */
function vsLanguageColumn(language: Language, radarDataUri: string) {
  const tierColor = getTierColor(language.tier);
  const total = totalScore(language);
  const tierLabel = language.tier.charAt(0).toUpperCase() + language.tier.slice(1);

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        width: '530px',
        height: '580px',
        gap: '8px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: '36px',
              color: '#1a1a2e',
              lineHeight: 1.15,
            },
            children: language.name,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: '28px',
                    color: tierColor,
                  },
                  children: `${total}/60`,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: tierColor,
                    borderRadius: '20px',
                    padding: '3px 14px',
                    fontWeight: 600,
                  },
                  children: tierLabel,
                },
              },
            ],
          },
        },
        {
          type: 'img',
          props: {
            src: radarDataUri,
            width: 380,
            height: 380,
          },
        },
      ],
    },
  };
}

/**
 * Generates a branded OG image for a Beauty Index versus comparison page.
 * Side-by-side layout with two radar charts, language names, scores, and a "vs" divider.
 */
/** Fixed comparison palette — matches OverlayRadarChart.astro */
const VS_COLOR_A = '#4A90D9'; // blue
const VS_COLOR_B = '#E8734A'; // coral

export async function generateVsOgImage(langA: Language, langB: Language): Promise<Buffer> {
  const labels = DIMENSIONS.map((d) => d.symbol + ' ' + d.shortName);
  const labelColors = DIMENSIONS.map((d) => DIMENSION_COLORS[d.key] ?? '#666');

  const scoresA = dimensionScores(langA);
  const radarSvgA = generateRadarSvgString(400, scoresA, VS_COLOR_A, 0.35, labels, labelColors);
  const radarDataUriA = `data:image/svg+xml;base64,${Buffer.from(radarSvgA).toString('base64')}`;

  const scoresB = dimensionScores(langB);
  const radarSvgB = generateRadarSvgString(400, scoresB, VS_COLOR_B, 0.35, labels, labelColors);
  const radarDataUriB = `data:image/svg+xml;base64,${Buffer.from(radarSvgB).toString('base64')}`;

  const layout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#faf8f5',
        position: 'relative' as const,
        fontFamily: 'Inter',
      },
      children: [
        accentBar(),
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row' as const,
              alignItems: 'center',
              width: '1200px',
              height: '580px',
            },
            children: [
              vsLanguageColumn(langA, radarDataUriA),
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '140px',
                    height: '580px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Space Grotesk',
                          fontWeight: 700,
                          fontSize: '32px',
                          color: '#bbb',
                        },
                        children: 'vs',
                      },
                    },
                  ],
                },
              },
              vsLanguageColumn(langB, radarDataUriB),
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              bottom: '16px',
              left: '0px',
              width: '1200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '14px',
                    color: '#c44b20',
                    fontWeight: 600,
                  },
                  children: 'The Beauty Index',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#bbb',
                  },
                },
              },
              ...brandingRow().props.children,
            ],
          },
        },
      ],
    },
  };

  return renderOgPng(layout);
}
