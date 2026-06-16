const jwt = require('jsonwebtoken');

const token = jwt.sign({
  id: 'a02fe192-35df-4235-901d-551eef30e692', // Replace with csefaculty2 id
  email: 'csefaculty2@test.com',
  role: 'TEACHER',
  name: 'CSE Faculty 2'
}, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

console.log(token);
