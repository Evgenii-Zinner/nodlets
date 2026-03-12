/**
 * Cloudflare Worker for Canvas Game
 * Serves static assets from the public directory with security headers
 */

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://pixijs.download; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block'
};

function addSecurityHeaders(response) {
  const newResponse = new Response(response.body, response);
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    newResponse.headers.set(name, value);
  });
  return newResponse;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      let response;
      
      // Handle root path - serve index.html
      if (url.pathname === '/') {
        const indexRequest = new Request(
          new URL('/index.html', request.url),
          request
        );
        response = await env.ASSETS.fetch(indexRequest);
      } else {
        // Serve other static assets
        response = await env.ASSETS.fetch(request);
      }

      return addSecurityHeaders(response);
    } catch (error) {
      return addSecurityHeaders(new Response('Not Found', { status: 404 }));
    }
  }
}
