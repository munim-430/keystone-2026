export const BRAND_IDENTITY = {
  name: 'Keystone Global',
  legalName: 'Keystone Global Education, Manpower & Trade Ltd.',
  tagline: 'Leading Cross-Border Opportunities with 100% Trust',
  contact: {
    email: 'info@keystoneeducations.com',
    phone: '+880 1941-646278',
    whatsapp: 'https://wa.me/8801941646278',
    offices: ['Gazipur, Dhaka', 'Narsingdi, Dhaka'],
  },
} as const;

export const COLOR_TOKENS = {
  navy: {
    default: '#0C4079',
    dark: '#072448',
    light: '#1A5AA3',
  },
  coral: {
    default: '#EA333F',
    light: '#FF5E6D',
    dark: '#C71D29',
  },
  charcoal: '#202020',
  corridors: {
    education: '#F598F2',
    manpower: '#F59E0B',
    exportImport: '#10B981',
  },
} as const;

export const TYPOGRAPHY_TOKENS = {
  display: 'Figtree, Montserrat, system-ui, sans-serif',
  body: 'Inter, Plus Jakarta Sans, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
} as const;

export type BrandColorKey = keyof typeof COLOR_TOKENS;
