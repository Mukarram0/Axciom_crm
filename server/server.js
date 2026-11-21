require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  AcxiomCRM Backend Server Online on Port ${PORT} `);
      console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Base API Endpoint: http://localhost:${PORT}/api  `);
      console.log(`=================================================`);
    });

    // Graceful Shutdown Handling
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server Bootstrap Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
