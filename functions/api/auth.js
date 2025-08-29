// Cloudflare Function - Auth API
export default {
  async fetch(request) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }
    
    try {
      const { action, username, password, email } = await request.json();
      
      if (action === 'login') {
        if (username && password) {
          return new Response(JSON.stringify({ 
            success: true,
            token: btoa(username),
            username: username,
            balance: 100.00
          }), { status: 200, headers });
        }
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials' 
        }), { status: 400, headers });
      }
      
      if (action === 'register') {
        if (username && email && password) {
          return new Response(JSON.stringify({ 
            success: true,
            message: 'Registration successful'
          }), { status: 200, headers });
        }
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }), { status: 400, headers });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid action' 
      }), { status: 400, headers });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid request' 
      }), { status: 400, headers });
    }
  }
};
