/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
  themes: ['github-dark', 'github-light'],
  themeCssSelector: (theme) => {
    if (theme.name === 'github-dark') return '.dark';
    if (theme.name === 'github-light') return ':root:not(.dark)';
    return undefined;
  },
  useDarkModeMediaQuery: false,
};
