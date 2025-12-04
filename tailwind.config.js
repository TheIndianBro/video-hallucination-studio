/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // Zinc 950
                surface: "#18181b", // Zinc 900
                primary: "#6366f1", // Indigo 500
                accent: "#8b5cf6", // Violet 500
                danger: "#ef4444", // Red 500
                text: "#f8fafc", // Slate 50
                muted: "#94a3b8", // Slate 400
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
