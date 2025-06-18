import type { UserConfig } from '~/types'

export const userConfig: Partial<UserConfig> = {
  site: {
    title: 'Notes and Ideas',
    subtitle: 'A web blog',
    author: 'Anshuman',
    description: '',
    website: 'https://asquare.site',
    pageSize: 5,
    socialLinks: [
      { name: 'github', href: 'https://github.com/iemAnshuman' },
      { name: 'x', href: 'https://x.com/justhuman567' }, // 'x' matches the built‑in icon set
    ],
    navLinks: [
      { name: 'Posts', href: '/' },
      { name: 'Archive', href: '/archive' },
      { name: 'About', href: '/about' },
    ],
    footer: [
      '© %year <a target="_blank" href="%website">%author</a>',
    ],
  },

  appearance: {
    theme: 'system',
    locale: 'en-us',
    colorsLight: {
      primary: '#2e405b',
      background: '#ffffff',
    },
    colorsDark: {
      primary: '#ffffff',
      background: '#232222',
    },
    fonts: {
      header:
        '"HiraMinProN-W6","Source Han Serif CN","Source Han Serif SC","Source Han Serif TC",serif',
      ui: '"Source Sans Pro","Roboto","Helvetica","Helvetica Neue","Source Han Sans SC","Source Han Sans TC","PingFang SC","PingFang HK","PingFang TC",sans-serif',
    },
  },

  seo: {
    twitter: '@justhuman567',
    meta: [],
    link: [],
  },

  rss: { fullText: true },

  comment: {
    // disqus: { shortname: 'typography-astro' },
  },

  analytics: {
    googleAnalyticsId: '',
    umamiAnalyticsId: '',
  },

  latex: { katex: true },
}
