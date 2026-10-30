import type { ThemeTypes } from '@/types/themeTypes/ThemeType';

// Warm dark counterpart of the caramel/paper light theme. Brown-black canvas,
// lifted warm surfaces, and a lighter caramel accent for contrast.
const PurpleThemeDark: ThemeTypes = {
  name: 'PurpleThemeDark',
  dark: true,
  variables: {
    'border-color': '#d08a5a',
    'carousel-control-size': 10
  },
  colors: {
    primary: '#d08a5a',
    secondary: '#b9a892',
    info: '#93a6ad',
    success: '#6bbd86',
    accent: '#e0b07c',
    warning: '#d8ab45',
    error: '#d66a6a',
    lightprimary: '#3a2a20',
    lightsecondary: '#332b24',
    lightsuccess: '#24382c',
    lighterror: '#3d2727',
    lightwarning: '#3d3422',
    primaryText: '#f2e9dd',
    secondaryText: 'rgba(242, 233, 221, 0.72)',
    darkprimary: '#b86b3b',
    darksecondary: '#8f7f6c',
    borderLight: 'rgba(242, 233, 221, 0.12)',
    border: 'rgba(242, 233, 221, 0.2)',
    inputBorder: '#8d7f70',
    containerBg: '#211b16',
    surface: '#2a231d',
    'surface-variant': '#332a23',
    'on-surface': '#f2e9dd',
    'on-surface-variant': '#c9bcae',
    'on-background': '#f2e9dd',
    'on-primary': '#1b1410',
    background: '#1d1813',
    overlay: 'rgba(10, 8, 6, 0.58)',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#2a231d',
    primary200: '#e0b07c',
    secondary200: '#8f7f6c',
    codeBg: '#2f2721',
    preBg: '#241e19',
    code: '#f2e9dd',
    chatMessageBubble: '#3a3028',
    mcpCardBg: '#2f2721'
  }
};

export { PurpleThemeDark };
