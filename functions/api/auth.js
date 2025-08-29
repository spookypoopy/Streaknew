export default {
  async fetch(request) {
    const { action, username, password, email } = await request.json();
    if (action === 'login') {
      if (username && password) {
        return new Response(JSON.stringify({ token: btoa(username) }), { status: 200 });
      }
      return new Response('Invalid', { status: 400 });
    }
    if (action === 'signup') {
      // mock signup
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response('Bad Request', { status: 400 });
  }
};
