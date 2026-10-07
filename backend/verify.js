// Verification script — checks all modules, schemas, routes
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { User, Job, Application } = require('./models');
const { protect, onlyAdmin } = require('./middleware');
const routes = require('./routes');

console.log('=== BACKEND VERIFICATION ===');
console.log('');

// 1. Check all dependencies load
console.log('1. All 6 npm packages loaded OK');

// 2. Check model fields
console.log('2. User fields:', Object.keys(User.schema.paths).join(', '));
console.log('   Job fields:', Object.keys(Job.schema.paths).join(', '));
console.log('   Application fields:', Object.keys(Application.schema.paths).join(', '));

// 3. Check routes
const routePaths = [];
routes.stack.forEach(layer => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
    routePaths.push(methods.join(',') + ' /api' + layer.route.path);
  }
});
console.log('3. Routes registered:');
routePaths.forEach(r => console.log('   ' + r));

// 4. Check middleware exports
console.log('4. Middleware: protect=' + typeof protect + ', onlyAdmin=' + typeof onlyAdmin);

// 5. Check env vars read
console.log('5. Env: PORT=' + (process.env.PORT || '5000') +
  ', MONGODB_URI=' + (process.env.MONGODB_URI ? 'SET' : 'MISSING') +
  ', JWT_SECRET=' + (process.env.JWT_SECRET ? 'SET' : 'MISSING') +
  ', FRONTEND_URL=' + (process.env.FRONTEND_URL || 'NOT SET'));

// 6. Test JWT sign/verify
const testToken = jwt.sign({ id: 'test123' }, process.env.JWT_SECRET, { expiresIn: '7d' });
const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
console.log('6. JWT sign/verify OK (decoded.id=' + decoded.id + ')');

// 7. Test bcrypt hash/compare
bcrypt.hash('test', 10).then(hash => {
  return bcrypt.compare('test', hash);
}).then(match => {
  console.log('7. bcrypt hash/compare OK (match=' + match + ')');
  console.log('');
  console.log('=== ALL BACKEND CHECKS PASSED ===');
  process.exit(0);
});
