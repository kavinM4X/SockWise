import client from 'prom-client';

// Enable collection of default Node.js process & system metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({
  prefix: 'sockwise_',
});

// Custom Application Metric 1: Total HTTP requests counter
export const httpRequestsTotal = new client.Counter({
  name: 'sockwise_http_requests_total',
  help: 'Total number of HTTP requests processed by SockWise',
  labelNames: ['method', 'route', 'status_code'],
});

// Custom Application Metric 2: HTTP request duration histogram in seconds
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'sockwise_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * Normalizes request paths to avoid high-cardinality label explosions
 * e.g., /api/products/64df93b84... -> /api/products/:id
 */
const normalizeRoute = (req) => {
  if (req.route && req.route.path) {
    const base = req.baseUrl || '';
    const path = req.route.path === '/' ? '' : req.route.path;
    return `${base}${path}` || '/';
  }

  let rawPath = req.path || req.baseUrl || req.url || 'unknown';

  // Strip query string if present
  rawPath = rawPath.split('?')[0];

  // Replace 24-character MongoDB ObjectIDs or UUIDs with :id
  let normalized = rawPath
    .replace(/[0-9a-fA-F]{24}/g, ':id')
    .replace(/[0-9a-fA-F-]{36}/g, ':id')
    .replace(/\/\d+/g, '/:id');

  return normalized || '/';
};

/**
 * Express middleware to track HTTP metrics per request
 */
export const metricsMiddleware = (req, res, next) => {
  // Skip recording the /metrics endpoint itself to prevent scraper feedback loops
  if (req.path === '/metrics') {
    return next();
  }

  const startTime = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationSeconds = diff[0] + diff[1] / 1e9;

    const method = req.method;
    const route = normalizeRoute(req);
    const statusCode = res.statusCode ? res.statusCode.toString() : 'unknown';

    const labels = {
      method,
      route,
      status_code: statusCode,
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
};

export const register = client.register;
