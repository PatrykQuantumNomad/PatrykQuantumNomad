import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

let interFont: Buffer | undefined;
let spaceGroteskFont: Buffer | undefined;

async function loadFonts() {
  if (!interFont) {
    interFont = await readFile('./src/assets/fonts/Inter-Regular.woff');
  }
  if (!spaceGroteskFont) {
    spaceGroteskFont = await readFile('./src/assets/fonts/SpaceGrotesk-Bold.woff');
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '\u2026';
}

export async function generateOgImage(
  title: string,
  description: string,
  tags: string[] = [],
): Promise<Buffer> {
  await loadFonts();

  const displayTitle = truncate(title, 80);
  const displayDescription = truncate(description, 120);
  const displayTags = tags.slice(0, 5);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a1a',
          position: 'relative',
        },
        children: [
          // Accent gradient line at top
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1200px',
                height: '4px',
                backgroundImage: 'linear-gradient(to right, #7c73ff, #a78bfa)',
              },
            },
          },
          // Main content area
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '60px',
                flexGrow: 1,
              },
              children: [
                // Top section: title + description
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontFamily: 'Space Grotesk',
                            fontWeight: 700,
                            fontSize: '48px',
                            color: '#e8e8f0',
                            lineHeight: 1.2,
                          },
                          children: displayTitle,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontFamily: 'Inter',
                            fontWeight: 400,
                            fontSize: '22px',
                            color: '#9898b8',
                            lineHeight: 1.5,
                            marginTop: '16px',
                          },
                          children: displayDescription,
                        },
                      },
                    ],
                  },
                },
                // Bottom section: tags + branding
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    },
                    children: [
                      // Tags
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                          },
                          children: displayTags.map((tag) => ({
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '14px',
                                color: '#7c73ff',
                                backgroundColor: 'rgba(124,115,255,0.15)',
                                borderRadius: '20px',
                                padding: '4px 12px',
                              },
                              children: tag,
                            },
                          })),
                        },
                      },
                      // Branding
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontFamily: 'Inter',
                            fontWeight: 400,
                            fontSize: '18px',
                            color: '#6868a0',
                          },
                          children: 'patrykgolabek.dev',
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
    {
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
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png;
}
