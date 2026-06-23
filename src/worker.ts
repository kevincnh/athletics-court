export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Backend API route example
    if (url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({ message: "Hello from the athletics-court API!" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Serve static assets from the frontend build
    return env.ASSETS.fetch(request);
  },
};
