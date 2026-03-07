"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("GLOBAL APP ERROR:", error);
    }, [error]);

    return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-red-950 text-red-100">
            <div className="max-w-xl space-y-4">
                <h2 className="text-2xl font-bold">Un crash inattendu s&apos;est produit !</h2>
                <div className="p-4 bg-black rounded-lg overflow-auto text-sm border border-red-500 font-mono">
                    <p className="font-bold mb-2">{error.name}: {error.message}</p>
                    <pre>{error.stack}</pre>
                </div>
                <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-medium"
                    onClick={() => reset()}
                >
                    Réessayer
                </button>
            </div>
        </div>
    );
}
