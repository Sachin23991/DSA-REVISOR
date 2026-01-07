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
                // Primary Brand Colors - Now Royal Green based as per user request
                royal: {
                    50: '#f2fcf5',
                    100: '#e1f8e8',
                    200: '#c5eed4',
                    300: '#96deb6',
                    400: '#5cc493',
                    500: '#34a876',
                    600: '#24875c', // Primary Royal Green
                    700: '#1e6c4b',
                    800: '#1a563d',
                    900: '#164734',
                    950: '#0b261e',
                },
                gold: {
                    50: '#fffbea',
                    100: '#fff1c5',
                    200: '#ffe285',
                    300: '#ffcf46',
                    400: '#ffbf1a', // Rich Gold
                    500: '#e6a200',
                    600: '#c27e00',
                    700: '#9b5d00',
                    800: '#7e4808',
                    900: '#683b0d',
                    950: '#3e1f03',
                },
                yellow: {
                    50: '#fefce8',
                    100: '#fef9c3',
                    200: '#fef08a',
                    300: '#fde047',
                    400: '#facc15',
                    500: '#eab308',
                    600: '#ca8a04',
                    700: '#a16207',
                    800: '#854d0e',
                    900: '#713f12',
                    950: '#422006',
                },
                // Dark Mode Special Palette - Deep Green/Gold Tint
                dark: {
                    bg: '#051a12',      // Deepest Green Black
                    surface: '#0b261e',  // Dark Green Surface
                    border: '#1a563d',   // Green Border
                    text: '#ecfdf5',     // Light Greenish White
                    muted: '#6ee7b7',    // Muted Green
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Merriweather', 'Georgia', 'serif'],
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
