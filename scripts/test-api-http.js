const { SignJWT } = require('jose');
const crypto = require('crypto');

async function testApi() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
  
  const token = await new SignJWT({
    id: '38cc5b5e-d9de-4875-a2d9-4e568988bd38', // csefaculty3 ID
    email: 'csefaculty3@test.com',
    role: 'TEACHER',
    name: 'CSE Faculty 3'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(secret);

  try {
    const res = await fetch('http://localhost:3000/api/dashboard/stats', {
      headers: {
        'Cookie': `token=${token}`
      }
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testApi();
