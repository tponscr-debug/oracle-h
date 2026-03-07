/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
                mono: ["var(--font-space-grotesk)", "monospace"],
            },
            colors: {
                slate: {
                    950: "#0a0f1e",
                    900: "#0d1526",
                    800: "#111d35",
                    700: "#1a2744",
                },
                amber: {
                    400: "#fbbf24",
                    500: "#f59e0b",
                },
                emerald: { 400: "#34d399", 500: "#10b981" },
                rose: { 400: "#fb7185", 500: "#f43f5e" },
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-up": "slideUp 0.4s ease-out",
            },
            keyframes: {
                fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
                slideUp: {
                    "0%": { transform: "translateY(16px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};
