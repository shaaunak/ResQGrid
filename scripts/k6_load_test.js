import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test Configuration for ResQGrid
// Simulates high-velocity disaster reporting and operator command queries
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent virtual users
    { duration: '1m', target: 150 },  // Spike to 150 VUs (triggers CPU threshold)
    { duration: '30s', target: 200 },  // Peak emergency surge (triggers ASG scale-out)
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://127.0.0.1:8000';

export default function () {
  // 1. Health check & Telemetry probe
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'system is healthy': (r) => r.json('status') === 'healthy',
  });

  // 2. High-frequency incident list query
  const listRes = http.get(`${BASE_URL}/api/v1/incidents`);
  check(listRes, {
    'incident list is 200': (r) => r.status === 200,
  });

  // 3. Operational summary query
  const summaryRes = http.get(`${BASE_URL}/api/v1/incidents/operational-summary`);
  check(summaryRes, {
    'summary is 200': (r) => r.status === 200,
  });

  // 4. Citizen emergency submission simulation
  const payload = JSON.stringify({
    title: 'Surge Water Overflow Near Hindmata Flyover',
    description: 'Rapid water accumulation, 1.2m depth. 8 pedestrians stranded.',
    category: 'FLOOD',
    latitude: 19.0080,
    longitude: 72.8420,
    address: 'Hindmata Junction, Dadar East, Mumbai',
    affected_people: 8,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const reportRes = http.post(`${BASE_URL}/api/v1/incidents`, payload, params);
  check(reportRes, {
    'report submission is 201': (r) => r.status === 201,
  });

  sleep(0.5);
}

