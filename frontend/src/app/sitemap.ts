import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://11flow.ai"; // Replace with actual domain

    // Fetch top generations from backend
    // Since this runs at build time or on demand on server, we use localhost directly
    // This avoids issues with relative paths (like /api) in NEXT_PUBLIC_API_URL
    const backendUrl = "http://localhost:8000";

    try {
        const response = await fetch(`${backendUrl}/api/generations/sitemap?limit=5000`);
        if (!response.ok) {
            console.error("Failed to fetch sitemap data");
            return [];
        }

        const generations = await response.json();

        const sitemapEntries: MetadataRoute.Sitemap = generations.map((gen: any) => ({
            url: `${baseUrl}/explore/${gen.slug}`,
            lastModified: new Date(gen.created_at),
            changeFrequency: "monthly",
            priority: 0.7,
        }));

        // Add static pages
        const staticPages: MetadataRoute.Sitemap = [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 1,
            },
            {
                url: `${baseUrl}/explore`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.9,
            },
        ];

        return [...staticPages, ...sitemapEntries];
    } catch (error) {
        console.error("Error generating sitemap:", error);
        return [];
    }
}
