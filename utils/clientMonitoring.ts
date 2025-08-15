/**
 * Client-side monitoring and error tracking utilities
 */

export interface ClientError {
  id: string;
  message: string;
  stack?: string;
  url: string;
  timestamp: Date;
  userAgent: string;
  userId?: string;
  context?: Record<string, any>;
  line?: number;
  column?: number;
  type?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  context?: Record<string, any>;
}

class ClientMonitor {
  private errors: ClientError[] = [];
  private metrics: PerformanceMetric[] = [];
  private maxStoredItems = 100;
  private reportingEndpoint = '/api/client-errors';

  constructor() {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      this.setupErrorHandlers();
      this.setupPerformanceMonitoring();
    }
  }

  private setupErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        type: 'promise-rejection'
      });
    });

    // React error boundary integration
    (window as any).__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
      onBuildError: (error: Error) => {
        this.trackError({
          message: error.message,
          stack: error.stack,
          url: window.location.href,
          type: 'build-error'
        });
      }
    };
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.trackMetric('page-load-time', navigation.loadEventEnd - navigation.fetchStart);
          this.trackMetric('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          this.trackMetric('first-paint', this.getFirstPaint());
          this.trackMetric('first-contentful-paint', this.getFirstContentfulPaint());
        }
      }, 0);
    });

    // Monitor resource loading
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            if (resource.duration > 1000) { // Track slow resources (>1s)
              this.trackMetric('slow-resource', resource.duration, {
                name: resource.name,
                type: resource.initiatorType
              });
            }
          }
        }
      });

      if ('observe' in observer) {
        observer.observe({ entryTypes: ['resource'] });
      }
    }
  }

  private getFirstPaint(): number {
    if (typeof performance === 'undefined') return 0;
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    if (typeof performance === 'undefined') return 0;
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  trackError(errorData: Partial<ClientError>) {
    const error: ClientError = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      context: errorData.context
    };

    this.errors.unshift(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxStoredItems) {
      this.errors = this.errors.slice(0, this.maxStoredItems);
    }

    // Report to server (debounced)
    this.reportErrorToServer(error);

    console.error('Client Error Tracked:', error);
  }

  trackMetric(name: string, value: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      context
    };

    this.metrics.unshift(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxStoredItems) {
      this.metrics = this.metrics.slice(0, this.maxStoredItems);
    }

    console.log('Performance Metric:', metric);
  }

  trackUserAction(action: string, context?: Record<string, any>) {
    this.trackMetric('user-action', Date.now(), {
      action,
      ...context
    });
  }

  trackAPICall(endpoint: string, duration: number, success: boolean) {
    this.trackMetric('api-call', duration, {
      endpoint,
      success,
      timestamp: Date.now()
    });
  }

  trackComponentRender(componentName: string, renderTime: number) {
    this.trackMetric('component-render', renderTime, {
      component: componentName
    });
  }

  private async reportErrorToServer(error: ClientError) {
    if (typeof fetch === 'undefined') return;
    
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (reportingError) {
      console.warn('Failed to report error to server:', reportingError);
    }
  }

  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(error => 
      error.timestamp.getTime() > oneHourAgo
    );

    const errorsByType = this.errors.reduce((acc, error) => {
      const type = error.context?.type || 'javascript';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      byType: errorsByType,
      mostRecent: this.errors[0] || null
    };
  }

  getPerformanceStats() {
    const loadTimeMetrics = this.metrics.filter(m => 
      ['page-load-time', 'dom-content-loaded', 'first-paint', 'first-contentful-paint'].includes(m.name)
    );

    const apiCallMetrics = this.metrics.filter(m => m.name === 'api-call');
    const slowResources = this.metrics.filter(m => m.name === 'slow-resource');

    return {
      pageLoad: loadTimeMetrics.reduce((acc, metric) => {
        acc[metric.name] = metric.value;
        return acc;
      }, {} as Record<string, number>),
      apiCalls: {
        count: apiCallMetrics.length,
        averageTime: apiCallMetrics.length > 0 
          ? apiCallMetrics.reduce((sum, m) => sum + m.value, 0) / apiCallMetrics.length 
          : 0
      },
      slowResources: slowResources.length,
      memoryUsage: this.getMemoryUsage()
    };
  }

  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
      };
    }
    return null;
  }

  exportData() {
    return {
      errors: this.errors,
      metrics: this.metrics,
      stats: {
        errors: this.getErrorStats(),
        performance: this.getPerformanceStats()
      },
      timestamp: new Date().toISOString()
    };
  }

  clearData() {
    this.errors = [];
    this.metrics = [];
  }
}

// Create singleton instance
const clientMonitor = new ClientMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const trackRender = (renderTime: number) => {
    clientMonitor.trackComponentRender(componentName, renderTime);
  };

  const trackUserAction = (action: string, context?: Record<string, any>) => {
    clientMonitor.trackUserAction(`${componentName}:${action}`, context);
  };

  return { trackRender, trackUserAction };
}

// React hook for API call tracking
export function useAPITracking() {
  const trackAPICall = async <T>(
    endpoint: string, 
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      clientMonitor.trackError({
        message: `API call failed: ${endpoint}`,
        stack: error instanceof Error ? error.stack : undefined,
        context: { endpoint, type: 'api-error' }
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      clientMonitor.trackAPICall(endpoint, duration, success);
    }
  };

  return { trackAPICall };
}

export default clientMonitor;