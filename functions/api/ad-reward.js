export default {
  async fetch(request) {
    const url = new URL(request.url);
    const minutes = new Date().getMinutes();
    const isEvenMinute = minutes % 2 === 0;
    if (isEvenMinute) {
      return new Response(JSON.stringify({ reward: 100 }), { status: 200 });
    }
    return new Response(JSON.stringify({ reward: 0 }), { status: 200 });
  }
};
