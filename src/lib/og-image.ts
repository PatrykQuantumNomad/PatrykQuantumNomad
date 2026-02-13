import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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

async function loadCoverImage(coverImage: string): Promise<string | null> {
  try {
    const filePath = join('./public', coverImage);
    const buffer = await readFile(filePath);
    const resized = await sharp(buffer)
      .resize(460, 360, { fit: 'cover' })
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

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#faf8f5',
          position: 'relative',
          fontFamily: 'Inter',
        },
        children: [
          // Accent bar at top
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1200px',
                height: '6px',
                backgroundImage: 'linear-gradient(to right, #c44b20, #e8734a)',
              },
            },
          },
          // Main content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'row',
                flexGrow: 1,
                padding: '50px 56px 40px',
                gap: '40px',
              },
              children: [
                // Left side: text content
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: hasCover ? '1 1 55%' : '1 1 100%',
                    },
                    children: [
                      // Top: title + description
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
                                  fontSize: hasCover ? '40px' : '48px',
                                  color: '#1a1a2e',
                                  lineHeight: 1.2,
                                },
                                children: displayTitle,
                              },
                            },
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '20px',
                                  color: '#555566',
                                  lineHeight: 1.6,
                                  marginTop: '16px',
                                },
                                children: displayDescription,
                              },
                            },
                          ],
                        },
                      },
                      // Bottom: tags + branding
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
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
                                      color: '#c44b20',
                                      backgroundColor: 'rgba(196,75,32,0.1)',
                                      borderRadius: '20px',
                                      padding: '4px 14px',
                                    },
                                    children: tag,
                                  },
                                })),
                              },
                            },
                            // Branding line
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                },
                                children: [
                                  // PG mark
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
                                      style: {
                                        fontSize: '16px',
                                        color: '#888899',
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
                // Right side: cover image (if available)
                ...(hasCover
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: '0 0 420px',
                          },
                          children: [
                            {
                              type: 'img',
                              props: {
                                src: coverDataUri,
                                width: 420,
                                height: 340,
                                style: {
                                  borderRadius: '12px',
                                  border: '1px solid #e0ddd8',
                                  objectFit: 'cover',
                                },
                              },
                            },
                          ],
                        },
                      },
                    ]
                  : []),
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
