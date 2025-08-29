export async function onRequestPost({ request, env }) {
  const { token, adType } = await request.json(); // "15" or "30"
  const username = await env.USERS_KV.get(`sess:${token}`);
  if (!username) return json({ error:"unauth" }, 401);

  const userKey = `user:${username}`;
  const user = await env.USERS_KV.get(userKey, "json");
  if (!user) return json({ error:"not_found" }, 404);

  const now = Date.now();
  const limKey = `ad:${username}:${adType}`;
  const last = await env.USERS_KV.get(limKey);
  const gap = Number(env.AD_RATE_LIMIT_SECONDS || 300) * 1000;
  if (last && (now - Number(last)) < gap) {
    return json({ ok:false, wait: gap - (now - Number(last)) });
  }
  const dayKey = `addaily:${username}:${new Date().toISOString().slice(0,10)}`;
  const count = Number(await env.USERS_KV.get(dayKey) || 0);
  const cap = Number(env.AD_DAILY_CAP || 10);
  if (count >= cap) return json({ ok:false, cap:true });

  const reward = adType === "30" ? Number(env.AD_REWARD_30 || 2) : Number(env.AD_REWARD_15 || 1);
  user.balance = (user.balance || 0) + reward;

  await env.USERS_KV.put(userKey, JSON.stringify(user));
  await env.USERS_KV.put(limKey, String(now), { expirationTtl: 60*10 });
  await env.USERS_KV.put(dayKey, String(count+1), { expirationTtl: 60*60*26 });

  return json({ ok:true, reward, balance:user.balance });
}
function json(o,s=200){ return new Response(JSON.stringify(o), { status:s, headers:{ "content-type":"application/json" }}); }
