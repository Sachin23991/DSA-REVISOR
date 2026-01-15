/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Portfolio-style minimal black/white palette
                primary: {
                    DEFAULT: '#000000',
                    light: '#71717A',
                    muted: '#A1A1AA',
                },
                surface: {
                    DEFAULT: '#FFFFFF',
                    muted: '#FAFAFA',
                    border: '#000000',
                },
                // Dark mode palette (inverted)
                dark: {
                    bg: '#0a0a0a',
                    surface: '#171717',
                    border: '#262626',
                    text: '#fafafa',
                    muted: '#a1a1aa',
                }
            },
            fontFamily: {
                sora: ['Sora', 'sans-serif'],
                sans: ['Sora', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
