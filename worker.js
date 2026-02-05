/**
 * Cloudflare Worker for Canvas Game
 * Serves static assets from the public directory
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Handle root path - serve index.html
      if (url.pathname === '/') {
        const indexRequest = new Request(
          new URL('/index.html', request.url),
          request
        );
        return await env.ASSETS.fetch(indexRequest);
      }
      
      // Serve other static assets
      return await env.ASSETS.fetch(request);
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  }
}
