const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// Import routes
const historyRoutes = require('./routes/history');
const narrationRoutes = require('./routes/narration');

// Import monitoring
const { performanceMonitor, errorTracker, healthChecker } = require('./middleware/monitoring');

// Monitoring middleware
app.use(performanceMonitor.middleware());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// CORS configuration - more permissive for development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for audio files
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// API Routes
app.use('/api', historyRoutes);
app.use('/api', narrationRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthChecker.runAllChecks();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json({
      ...healthStatus,
      version: '1.0.0',
      services: {
        openai: !!process.env.OPENAI_API_KEY,
        elevenlabs: !!process.env.ELEVENLABS_API_KEY
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  const errorStats = errorTracker.getErrorStats();
  
  res.json({
    performance: metrics,
    errors: errorStats,
    timestamp: new Date().toISOString()
  });
});

// Recent errors endpoint (for debugging)
app.get('/errors', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const errors = errorTracker.getRecentErrors(limit);
  
  res.json({
    errors,
    count: errors.length,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'History Rewriter Live API',
    version: '1.0.0',
    status: 'running',
    message: 'Backend server is running. Frontend should be on port 3000.',
    endpoints: {
      'POST /api/rewrite-history': 'Generate alternate history scenario',
      'POST /api/narrate': 'Generate audio narration',
      'GET /health': 'Health check',
      'GET /metrics': 'Performance metrics',
      'GET /errors': 'Recent errors'
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'History Rewriter Live API',
    version: '1.0.0',
    endpoints: {
      'POST /api/rewrite-history': 'Generate alternate history scenario',
      'POST /api/narrate': 'Generate audio narration',
      'GET /health': 'Health check',
      'GET /api': 'API documentation'
    }
  });
});

// Error tracking middleware
app.use(errorTracker.middleware());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: err.message 
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API credentials' 
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 History Rewriter Live server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  
  // Check for required environment variables
  const requiredEnvVars = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('   Some features may not work properly');
  } else {
    console.log('✅ All required environment variables are set');
  }
});