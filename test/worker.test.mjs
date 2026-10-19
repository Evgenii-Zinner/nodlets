import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker.js";

test("worker.js Cloudflare Worker fetch handler", async (t) => {
	const SECURITY_HEADERS = {
		"Content-Security-Policy":
			"default-src 'self'; script-src 'self' https://pixijs.download; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
		"X-XSS-Protection": "1; mode=block",
	};

	await t.test(
		"serves index.html on root path with security headers",
		async () => {
			let fetchedUrl = null;
			const env = {
				ASSETS: {
					fetch: async (req) => {
						fetchedUrl = req.url;
						return new Response("index content", { status: 200 });
					},
				},
			};
			const req = new Request("https://example.com/");
			const res = await worker.fetch(req, env);

			assert.equal(res.status, 200);
			assert.equal(fetchedUrl, "https://example.com/index.html");

			const body = await res.text();
			assert.equal(body, "index content");

			// Verify security headers
			for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
				assert.equal(res.headers.get(key), value);
			}
		},
	);

	await t.test(
		"serves static assets on non-root paths with security headers",
		async () => {
			let fetchedUrl = null;
			const env = {
				ASSETS: {
					fetch: async (req) => {
						fetchedUrl = req.url;
						return new Response("css content", { status: 200 });
					},
				},
			};
			const req = new Request("https://example.com/style.css");
			const res = await worker.fetch(req, env);

			assert.equal(res.status, 200);
			assert.equal(fetchedUrl, "https://example.com/style.css");

			const body = await res.text();
			assert.equal(body, "css content");

			// Verify security headers
			for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
				assert.equal(res.headers.get(key), value);
			}
		},
	);

	await t.test(
		"returns 404 with security headers on asset fetch failure",
		async () => {
			const env = {
				ASSETS: {
					fetch: async (_req) => {
						throw new Error("Simulated asset fetch failure");
					},
				},
			};

			// Temporarily suppress console.error for clean test output
			const originalConsoleError = console.error;
			console.error = () => {};

			const req = new Request("https://example.com/missing.png");
			const res = await worker.fetch(req, env);

			console.error = originalConsoleError;

			assert.equal(res.status, 404);

			const body = await res.text();
			assert.equal(body, "Not Found");

			// Verify security headers
			for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
				assert.equal(res.headers.get(key), value);
			}
		},
	);
});
