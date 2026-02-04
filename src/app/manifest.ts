import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Kurly Brains Dashboard",
        short_name: "KurlyBrains",
        description: "Internal staff management platform for Kurly Brains Agency",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
            {
                src: "/icon.png", // We should ensure we have this icon (usually 192x192 or 512x512)
                sizes: "192x192 512x512",
                type: "image/png",
            },
        ],
    };
}
