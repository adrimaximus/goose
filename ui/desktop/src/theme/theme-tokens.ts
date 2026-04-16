/**
 * Theme tokens — the single source of truth for all MCP semantic token values.
 *
 * Every key in McpUiStyleVariableKey must be present in both lightTokens and
 * darkTokens. The TypeScript compiler enforces this: if the SDK adds a new key,
 * the build breaks until both maps are updated.
 *
 * Values are applied to :root via style.setProperty() before first paint
 * (see renderer.tsx). main.css only registers the variable names for Tailwind
 * class generation — it does NOT define values.
 *
 * These tokens serve two purposes:
 *  1. Goose desktop — applied to :root per resolved theme.
 *  2. MCP apps — encoded as light-dark() in hostContext.styles.variables.
 */
import type {
  McpUiHostStyles,
  McpUiStyleVariableKey,
  McpUiStyles,
} from '@modelcontextprotocol/ext-apps/app-bridge';

type ThemeTokens = Record<McpUiStyleVariableKey, string>;

// Subset of keys that are the same across both themes.
type BaseTokenKey = Extract<
  McpUiStyleVariableKey,
  `--font-${string}` | `--border-radius-${string}` | `--border-width-${string}`
>;

type ColorTokenKey = Exclude<McpUiStyleVariableKey, BaseTokenKey>;

// ---------------------------------------------------------------------------
// Base tokens — shared across light and dark themes
// ---------------------------------------------------------------------------
const baseTokens: Pick<ThemeTokens, BaseTokenKey> = {
  // Typography — families
  '--font-sans': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  '--font-mono': "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",

  // Typography — weights
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--font-weight-bold': '700',

  // Typography — text sizes
  '--font-text-xs-size': '0.75rem',
  '--font-text-sm-size': '0.875rem',
  '--font-text-md-size': '1rem',
  '--font-text-lg-size': '1.125rem',

  // Typography — heading sizes
  '--font-heading-xs-size': '1rem',
  '--font-heading-sm-size': '1.125rem',
  '--font-heading-md-size': '1.25rem',
  '--font-heading-lg-size': '1.5rem',
  '--font-heading-xl-size': '1.875rem',
  '--font-heading-2xl-size': '2.25rem',
  '--font-heading-3xl-size': '3rem',

  // Typography — text line heights
  '--font-text-xs-line-height': '1rem',
  '--font-text-sm-line-height': '1.25rem',
  '--font-text-md-line-height': '1.5rem',
  '--font-text-lg-line-height': '1.75rem',

  // Typography — heading line heights
  '--font-heading-xs-line-height': '1.5rem',
  '--font-heading-sm-line-height': '1.75rem',
  '--font-heading-md-line-height': '1.75rem',
  '--font-heading-lg-line-height': '2rem',
  '--font-heading-xl-line-height': '2.25rem',
  '--font-heading-2xl-line-height': '2.5rem',
  '--font-heading-3xl-line-height': '3.5rem',

  // Border radius — pill-first system
  '--border-radius-xs': '6px',
  '--border-radius-sm': '8px',
  '--border-radius-md': '12px',
  '--border-radius-lg': '16px',
  '--border-radius-xl': '20px',
  '--border-radius-full': '9999px',

  // Border width
  '--border-width-regular': '1px',
};

// Theme-specific color/shadow tokens only.
type ColorTokens = Pick<ThemeTokens, ColorTokenKey>;

// ---------------------------------------------------------------------------
// Light theme — pure monochromatic palette
// ---------------------------------------------------------------------------
const lightColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#ffffff',
  '--color-background-secondary': '#f5f5f5',
  '--color-background-tertiary': '#f0f0f0',
  '--color-background-inverse': '#1a1a1a',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#5c98f9',
  '--color-background-danger': '#f94b4b',
  '--color-background-success': '#91cb80',
  '--color-background-warning': '#fbcd44',
  '--color-background-disabled': '#f0f0f0',

  // Text
  '--color-text-primary': '#1a1a1a',
  '--color-text-secondary': '#666666',
  '--color-text-tertiary': '#999999',
  '--color-text-inverse': '#ffffff',
  '--color-text-ghost': '#999999',
  '--color-text-info': '#5c98f9',
  '--color-text-danger': '#f94b4b',
  '--color-text-success': '#91cb80',
  '--color-text-warning': '#fbcd44',
  '--color-text-disabled': '#cccccc',

  // Borders
  '--color-border-primary': '#e8e8e8',
  '--color-border-secondary': '#e8e8e8',
  '--color-border-tertiary': '#cccccc',
  '--color-border-inverse': '#1a1a1a',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#5c98f9',
  '--color-border-danger': '#f94b4b',
  '--color-border-success': '#91cb80',
  '--color-border-warning': '#fbcd44',
  '--color-border-disabled': '#e8e8e8',

  // Rings
  '--color-ring-primary': '#e8e8e8',
  '--color-ring-secondary': '#cccccc',
  '--color-ring-inverse': '#ffffff',
  '--color-ring-info': '#5c98f9',
  '--color-ring-danger': '#f94b4b',
  '--color-ring-success': '#91cb80',
  '--color-ring-warning': '#fbcd44',

  // Shadows — 4-tier hierarchy
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.04)',
  '--shadow-sm': '0 2px 8px rgba(76, 76, 76, 0.15)',
  '--shadow-md': '0 3px 12px rgba(76, 76, 76, 0.22)',
  '--shadow-lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
};

// ---------------------------------------------------------------------------
// Dark theme — OLED-friendly pure blacks
// ---------------------------------------------------------------------------
const darkColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#000000',
  '--color-background-secondary': '#232323',
  '--color-background-tertiary': '#333333',
  '--color-background-inverse': '#f5f5f5',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#7cacff',
  '--color-background-danger': '#ff6b6b',
  '--color-background-success': '#a3d795',
  '--color-background-warning': '#ffd966',
  '--color-background-disabled': '#333333',

  // Text
  '--color-text-primary': '#ffffff',
  '--color-text-secondary': '#cccccc',
  '--color-text-tertiary': '#999999',
  '--color-text-inverse': '#1a1a1a',
  '--color-text-ghost': '#999999',
  '--color-text-info': '#7cacff',
  '--color-text-danger': '#ff6b6b',
  '--color-text-success': '#a3d795',
  '--color-text-warning': '#ffd966',
  '--color-text-disabled': '#666666',

  // Borders
  '--color-border-primary': '#333333',
  '--color-border-secondary': '#666666',
  '--color-border-tertiary': '#333333',
  '--color-border-inverse': '#ffffff',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#7cacff',
  '--color-border-danger': '#ff6b6b',
  '--color-border-success': '#a3d795',
  '--color-border-warning': '#ffd966',
  '--color-border-disabled': '#333333',

  // Rings
  '--color-ring-primary': '#666666',
  '--color-ring-secondary': '#333333',
  '--color-ring-inverse': '#1a1a1a',
  '--color-ring-info': '#7cacff',
  '--color-ring-danger': '#ff6b6b',
  '--color-ring-success': '#a3d795',
  '--color-ring-warning': '#ffd966',

  // Shadows — doubled intensity for dark backgrounds
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.3)',
  '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
  '--shadow-md': '0 3px 12px rgba(0, 0, 0, 0.5)',
  '--shadow-lg': '0 8px 30px rgba(0, 0, 0, 0.4)',
};

// ---------------------------------------------------------------------------
// Merged token maps — used by applyThemeTokens() and buildMcpHostStyles()
// ---------------------------------------------------------------------------
export const lightTokens: ThemeTokens = { ...baseTokens, ...lightColorTokens };
export const darkTokens: ThemeTokens = { ...baseTokens, ...darkColorTokens };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// @font-face rules passed to MCP apps so sandboxed iframes can load host fonts.
const HOST_FONT_CSS = `
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Light.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Light.woff) format('woff');
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Regular.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Regular.woff) format('woff');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Medium.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Medium.woff) format('woff');
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Bold.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Bold.woff) format('woff');
  font-weight: 700;
  font-style: normal;
}
`.trim();

/**
 * Build the McpUiHostStyles object for MCP apps.
 * Color keys use light-dark() so a single payload works for both themes.
 * Non-color keys (fonts, radii, shadows) use plain values from baseTokens
 * (or light as the default when values differ, e.g. shadows).
 * css.fonts provides @font-face rules so sandboxed apps can load host fonts.
 */
export function buildMcpHostStyles(): McpUiHostStyles {
  const variables: McpUiStyles = {} as McpUiStyles;
  for (const key of Object.keys(lightTokens) as McpUiStyleVariableKey[]) {
    const light = lightTokens[key];
    const dark = darkTokens[key];
    if (key.startsWith('--color-')) {
      variables[key] = `light-dark(${light}, ${dark})`;
    } else {
      variables[key] = light;
    }
  }
  return { variables, css: { fonts: HOST_FONT_CSS } };
}

/**
 * Resolve the current theme from localStorage / system preference.
 */
export function getResolvedTheme(): 'light' | 'dark' {
  const useSystem = localStorage.getItem('use_system_theme') !== 'false';
  if (useSystem) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Apply theme tokens to the document root as CSS custom properties.
 * When called without an argument, resolves the theme from localStorage.
 */
export function applyThemeTokens(theme?: 'light' | 'dark'): void {
  const resolved = theme ?? getResolvedTheme();
  const tokens = resolved === 'dark' ? darkTokens : lightTokens;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}
