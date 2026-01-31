/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'system-ui', 'sans-serif'],
            },
            colors: {
                'skyjo-blue': '#00f2ff',
                'skybrick-cyan': '#00f2ff',
                'skybrick-purple': '#9d00ff',
            },
        },
    },
    plugins: [],
}
