const csurf = require('csurf');

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  value: req => req.headers['x-xsrf-token'] || req.body._csrf || req.query._csrf
});

module.exports = {
  csrfProtection
};
