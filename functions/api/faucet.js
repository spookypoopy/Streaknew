export default {
  async fetch(request) {
    const { token } = await request.json();
    if (!token) return new Response('Unauthorized', { status: 401 });
    return new Response(JSON.stringify({ amount: 5.00 }), { status: 200 });
  }
};
