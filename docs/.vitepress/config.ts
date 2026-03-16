import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'OpenBooking Protocol',
  description: 'Open, federated booking protocol for the decentralized web',
  lang: 'en-US',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/overview' },
      { text: 'Federation', link: '/federation/overview' },
      { text: 'SDK', link: '/sdk/javascript' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is OBP?', link: '/guide/what-is-obp' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Concepts',
          items: [
            { text: 'Providers & Services', link: '/guide/providers' },
            { text: 'Slots & Bookings', link: '/guide/bookings' },
            { text: 'Federation', link: '/guide/federation' },
            { text: 'Authentication', link: '/guide/auth' },
          ],
        },
        {
          text: 'Self-Hosting',
          items: [
            { text: 'Self-Hosting Guide', link: '/guide/self-hosting' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Discovery', link: '/api/discovery' },
            { text: 'Services', link: '/api/services' },
            { text: 'Slots', link: '/api/slots' },
            { text: 'Bookings', link: '/api/bookings' },
            { text: 'Webhooks', link: '/api/webhooks' },
          ],
        },
      ],
      '/federation/': [
        {
          text: 'Federation',
          items: [
            { text: 'Overview', link: '/federation/overview' },
            { text: 'Discovery', link: '/federation/discovery' },
            { text: 'Security', link: '/federation/security' },
          ],
        },
      ],
      '/sdk/': [
        {
          text: 'SDKs',
          items: [
            { text: 'JavaScript / TypeScript', link: '/sdk/javascript' },
            { text: 'Python', link: '/sdk/python' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/openbooking-protocol/obp' },
    ],

    footer: {
      message: 'Released under the AGPL-3.0 License.',
      copyright: 'OpenBooking Protocol Contributors',
    },

    search: {
      provider: 'local',
    },
  },

  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
});
