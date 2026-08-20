const colors = {
    blue: {
        400: '#2589FE',
        500: '#0070F3',
        600: '#2F6FEB',
    },

    primary: '#F4F1ED',
    secondary: '#EAE6DF',
    tertiary: '#D9D4CB',
    foreground: '#3A3530',
    muted: '#6B655C',

    accent: {
        primary: {
            DEFAULT: '#4A6580',
            light: '#6B8299',
            dark: '#354A5E',
        },
        secondary: '#7A6352',
        tertiary: '#5C7A6E',
    },

    status: {
        success: '#5C7A6E',
        warning: '#A87D45',
        danger: '#9E5050',
    },

    badge: {
        primary: {
            bg: '#D8E3ED',
            text: '#2D4A60',
        },
        secondary: {
            bg: '#F0E3D5',
            text: '#6B4530',
        },
        tertiary: {
            bg: '#DCE9E4',
            text: '#3A5E52',
        },
        muted: {
            bg: '#D9D4CB',
            text: '#6B655C',
        },
    },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{ts,tsx,jsx,js}',
    ],
    theme: {
        extend: {
            gridTemplateColumns: {
                '13': 'repeat(13, minmax(0, 1fr))',
            },
            colors,
            keyframes: {
                shimmer: {
                    '100%': {
                        transform: 'translateX(100%)',
                    },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
