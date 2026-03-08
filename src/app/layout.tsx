import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ORACLE-H — Human-on-the-Loop for AI Agents",
    description:
        "Mandatory human approval checkpoint for autonomous AI agents. Before any critical action — deletion, deployment, payment — a human approves via Telegram. MCP server, free forever.",
    keywords: ["human-in-the-loop", "human-on-the-loop", "AI agents", "MCP server", "autonomous agents", "AI safety", "approval workflow", "oracle-h"],
    robots: "index,follow",
    openGraph: {
        title: "ORACLE-H — Your agents act. You decide.",
        description: "Mandatory human checkpoint for autonomous AI agents. One tap to approve or reject any critical action.",
        url: "https://oracle-h.online",
        siteName: "ORACLE-H",
        type: "website",
    },
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
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
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
