export default {
  async fetch(request) {
    const { token } = await request.json();
    if (!token) return new Response('Unauthorized', { status: 401 });
    return new Response(JSON.stringify({
      username: atob(token),
      balance: 100.00,
      stats: { wagered: 15420, profit: 2340, bets: 856 }
    }), { status: 200 });
  }
};
