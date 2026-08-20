import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
],
  theme: {
    extend: {
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      colors: {
        blue: {
          400: '#2589FE',
          500: '#0070F3',
          600: '#2F6FEB',
        },

        // ── Base ──────────────────────────────────────
        
          primary:    '#F4F1ED', // ページ背景
          secondary:  '#EAE6DF', // サーフェス
          tertiary:   '#D9D4CB', // ボーダー
          foreground: '#3A3530', // 本文テキスト
          muted:      '#6B655C', // 補足テキスト
        

        // ── Accent ───────────────────────────────────
        accent: {
          primary: {
            DEFAULT: '#4A6580', // メインアクション
            light:   '#6B8299', // ホバー
            dark:    '#354A5E', // 押下・強調
          },
          secondary: '#7A6352', // 特別アクション
          tertiary:  '#5C7A6E', // 情報・補助
        },

        // ── Status ───────────────────────────────────
        status: {
          success: '#5C7A6E',
          warning: '#A87D45',
          danger:  '#9E5050',
        },

        // ── Badge ────────────────────────────────────
        badge: {
          primary: {
            bg:   '#D8E3ED',
            text: '#2D4A60',
          },
          secondary: {
            bg:   '#F0E3D5',
            text: '#6B4530',
          },
          tertiary: {
            bg:   '#DCE9E4',
            text: '#3A5E52',
          },
          muted: {
            bg:   '#D9D4CB',
            text: '#6B655C',
          },
        },
      },
    },
    keyframes: {
      shimmer: {
        '100%': {
          transform: 'translateX(100%)',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
export default config;