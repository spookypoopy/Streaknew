export default {
  async fetch(request) {
    const { seed } = await request.json();
    if (!seed) return new Response('Bad Request', { status: 400 });
    return new Response(JSON.stringify({ verified: true }), { status: 200 });
  }
};
