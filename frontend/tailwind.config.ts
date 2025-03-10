import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6184FF',
          dark: '#4B6CD9',
        },
        secondary: '#F5F7FF',
        border: '#E5E7EB',
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
        }
      },
      boxShadow: {
        card: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'lg': '0.75rem',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            p: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            '[class~="lead"]': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            blockquote: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            ul: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            ol: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
          },
        },
      },
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config 