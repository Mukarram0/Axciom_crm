const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const configureSession = require('./config/session');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/responseHandler');

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible integration for local dev and Chart.js
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS with Credentials (for express-session cookie exchange)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. HTTP Request Logging in non-test mode
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Secure Session Management with MongoDB
app.use(configureSession());

// 6. General API Rate Limiting
app.use('/api', apiRateLimiter);

// 7. Mount Application REST Routes
app.use('/api', routes);

// 8. Handle 404 Unmatched Routes
app.use((req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, null, 404);
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
