const fs = require('fs').promises;
const path = require('path');

/**
 * Performance monitoring middleware
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      apiCalls: {
        openai: { count: 0, errors: 0, totalTime: 0 },
        elevenlabs: { count: 0, errors: 0, totalTime: 0 }
      }
    };
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const self = this;
      
      // Track request
      this.metrics.requests++;
      
      // Override res.json to track response time
      const originalJson = res.json;
      res.json = function(data) {
        const responseTime = Date.now() - startTime;
        self.metrics.responseTime.push(responseTime);
        
        // Keep only last 1000 response times
        if (self.metrics.responseTime.length > 1000) {
          self.metrics.responseTime = self.metrics.responseTime.slice(-1000);
        }
        
        return originalJson.call(this, data);
      };
      
      // Track errors
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          self.metrics.errors++;
        }
      });
      
      next();
    };
  }

  trackAPICall(service, duration, error = false) {
    if (this.metrics.apiCalls[service]) {
      this.metrics.apiCalls[service].count++;
      this.metrics.apiCalls[service].totalTime += duration;
      if (error) {
        this.metrics.apiCalls[service].errors++;
      }
    }
  }

  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });
      
      // Keep only last 100 memory readings
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }
    }, 30000); // Every 30 seconds
  }

  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;

    const currentMemory = process.memoryUsage();
    
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      averageResponseTime: Math.round(avgResponseTime),
      currentMemory: {
        rss: Math.round(currentMemory.rss / 1024 / 1024), // MB
        heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024) // MB
      },
      apiCalls: Object.keys(this.metrics.apiCalls).reduce((acc, service) => {
        const api = this.metrics.apiCalls[service];
        acc[service] = {
          count: api.count,
          errors: api.errors,
          errorRate: api.count > 0 ? (api.errors / api.count) * 100 : 0,
          averageTime: api.count > 0 ? Math.round(api.totalTime / api.count) : 0
        };
        return acc;
      }, {}),
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }

  async saveMetricsToFile() {
    try {
      const metricsDir = path.join(__dirname, '../logs');
      await fs.mkdir(metricsDir, { recursive: true });
      
      const metricsFile = path.join(metricsDir, 'metrics.json');
      const metrics = this.getMetrics();
      
      await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }
}

/**
 * Error tracking middleware
 */
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 1000;
  }

  middleware() {
    return (err, req, res, next) => {
      // Track error
      this.trackError(err, req);
      
      // Log error
      console.error('Request Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      next(err);
    };
  }

  trackError(error, req = null) {
    const errorData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      request: req ? {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      } : null
    };
    
    this.errors.unshift(errorData);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Save to file for persistence
    this.saveErrorsToFile();
  }

  async saveErrorsToFile() {
    try {
      const logsDir = path.join(__dirname, '../logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const errorsFile = path.join(logsDir, 'errors.json');
      await fs.writeFile(errorsFile, JSON.stringify(this.errors.slice(0, 100), null, 2));
    } catch (error) {
      console.error('Failed to save errors:', error);
    }
  }

  getRecentErrors(limit = 50) {
    return this.errors.slice(0, limit);
  }

  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(err => 
      new Date(err.timestamp).getTime() > oneHourAgo
    );
    
    const dailyErrors = this.errors.filter(err => 
      new Date(err.timestamp).getTime() > oneDayAgo
    );
    
    // Group by error type
    const errorTypes = this.errors.reduce((acc, err) => {
      acc[err.name] = (acc[err.name] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      byType: errorTypes,
      mostRecent: this.errors[0] || null
    };
  }
}

/**
 * Health check utilities
 */
class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  registerDefaultChecks() {
    // Memory check
    this.checks.set('memory', () => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      const heapTotalMB = usage.heapTotal / 1024 / 1024;
      
      return {
        status: heapUsedMB < 500 ? 'healthy' : 'warning', // Warning if > 500MB
        details: {
          heapUsed: `${Math.round(heapUsedMB)}MB`,
          heapTotal: `${Math.round(heapTotalMB)}MB`,
          usage: `${Math.round((heapUsedMB / heapTotalMB) * 100)}%`
        }
      };
    });

    // Uptime check
    this.checks.set('uptime', () => {
      const uptime = process.uptime();
      return {
        status: 'healthy',
        details: {
          uptime: `${Math.round(uptime)}s`,
          started: new Date(Date.now() - uptime * 1000).toISOString()
        }
      };
    });

    // Environment check
    this.checks.set('environment', () => {
      const requiredEnvVars = ['OPENAI_API_KEY'];
      const missing = requiredEnvVars.filter(varName => !process.env[varName]);
      
      return {
        status: missing.length === 0 ? 'healthy' : 'unhealthy',
        details: {
          nodeEnv: process.env.NODE_ENV,
          missingVars: missing
        }
      };
    });
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runAllChecks() {
    const results = {};
    let overallStatus = 'healthy';
    
    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = result;
        
        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warning' && overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
}

// Create singleton instances
const performanceMonitor = new PerformanceMonitor();
const errorTracker = new ErrorTracker();
const healthChecker = new HealthChecker();

// Save metrics periodically
setInterval(() => {
  performanceMonitor.saveMetricsToFile();
}, 60000); // Every minute

module.exports = {
  performanceMonitor,
  errorTracker,
  healthChecker,
  PerformanceMonitor,
  ErrorTracker,
  HealthChecker
};