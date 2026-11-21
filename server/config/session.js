const session = require('express-session');
const MongoStore = require('connect-mongo');

/**
 * Configure secure express-session using MongoDB store
 */
const configureSession = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';
  const maxAge = parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 24 * 60 * 60 * 1000; // 24 hours

  return session({
    name: 'acxiom_crm_sid',
    secret: process.env.SESSION_SECRET || 'acxiom_crm_secure_session_secret_default',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: maxAge / 1000,
      autoRemove: 'native',
    }),
    cookie: {
      httpOnly: true, // Prevents client-side JavaScript from reading the cookie (mitigates XSS)
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // CSRF mitigation
      maxAge,
    },
  });
};

module.exports = configureSession;
