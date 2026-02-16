import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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

async function loadCoverImage(coverImage: string): Promise<string | null> {
  try {
    const filePath = join('./public', coverImage);
    const buffer = await readFile(filePath);
    const resized = await sharp(buffer)
      .resize(1088, 400, { fit: 'contain', background: { r: 250, g: 248, b: 245, alpha: 1 } })
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
