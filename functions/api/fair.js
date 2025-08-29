export default {
  async fetch(request) {
    const seed = Math.random().toString(36).substr(2);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
    return new Response(JSON.stringify({ seed, hash: Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('') }), { status: 200 });
  }
};
