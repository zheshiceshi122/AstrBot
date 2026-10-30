import type { ThemeTypes } from '@/types/themeTypes/ThemeType';

// Warm paper palette: canvas, milled-paper surfaces and a caramel accent.
// These values mirror the `--color-*` tokens in scss/style.scss so custom
// components and Vuetify components stay on the same palette.
const PurpleTheme: ThemeTypes = {
  name: 'PurpleTheme',
  dark: false,
  variables: {
    'border-color': '#b86b3b',
    'carousel-control-size': 10
  },
  colors: {
    primary: '#b86b3b',
    secondary: '#7a6e61',
    info: '#6f7f86',
    success: '#3b8b5a',
    accent: '#d9a066',
    warning: '#b8860b',
    error: '#b83b3b',
    lightprimary: '#f3e6da',
    lightsecondary: '#efe8df',
    lightsuccess: '#e3efe7',
    lighterror: '#f7e2e1',
    lightwarning: '#f7efd7',
    primaryText: '#3c332a',
    secondaryText: 'rgba(60, 51, 42, 0.72)',
    darkprimary: '#9a542c',
    darksecondary: '#5f564c',
    borderLight: 'rgba(122, 110, 97, 0.15)',
    border: 'rgba(122, 110, 97, 0.3)',
    inputBorder: '#b3a493',
    containerBg: '#f7f4ed',
    surface: '#ffffff',
    'surface-variant': '#f0ebe1',
    'on-surface': '#3c332a',
    'on-surface-variant': '#7a6e61',
    'on-background': '#3c332a',
    'on-primary': '#ffffff',
    background: '#f7f4ed',
    overlay: 'rgba(60, 51, 42, 0.45)',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#f7f4ed',
    primary200: '#e2b48f',
    secondary200: '#cfc2b2',
    codeBg: '#efe7da',
    preBg: '#f4ede3',
    code: '#3c332a',
    chatMessageBubble: '#efe6d9',
    mcpCardBg: '#f5eee4'
  }
};

export { PurpleTheme };
