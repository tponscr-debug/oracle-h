import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ORACLE-H — Human-on-the-Loop Supervision",
    description:
        "Infrastructure de supervision HOTL pour agents autonomes. Validez les actions critiques des agents IA avant exécution.",
    keywords: ["HOTL", "human-on-the-loop", "AI agents", "supervision", "autonomous agents"],
    robots: "noindex,nofollow", // Dashboard interne — ne pas indexer
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1, // Prevent zoom on mobile buttons
    themeColor: "#0a0f1e",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="ORACLE-H" />
            </head>
            <body className="min-h-screen grid-bg" suppressHydrationWarning>
                <div className="noise-overlay" />
                <div className="relative z-10">{children}</div>
            </body>
        </html>
    );
}
