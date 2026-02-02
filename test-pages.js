
(async () => {
    try {
        const fetch = (url, options) => {
            console.log(`Mock Fetch: ${url}`, options);
            if (url === "/api/pages" && options?.method === "POST") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: "test-page-id",
                        title: "Test Page",
                        type: "note",
                        icon: "📄"
                    })
                });
            }
            if (url === "/api/pages") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                });
            }
            return Promise.resolve({ ok: false });
        };

        // Simulate addPage
        const res = await fetch("/api/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Test", type: "note" })
        });

        if (res.ok) {
            console.log("Page created successfully");
        } else {
            console.error("Failed to create page");
        }

    } catch (e) {
        console.error(e);
    }
})();
