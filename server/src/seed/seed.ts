import mongoose from 'mongoose';
import { env } from '../config/env';
import ApiEndpoint from '../models/ApiEndpoint';
import HealthCheck from '../models/HealthCheck';
import Incident from '../models/Incident';
import { incidentService } from '../services/incident.service';
import { HttpMethod } from '../types';

interface SeedApi {
  name: string;
  url: string;
  method: HttpMethod;
  threshold: number;
  isActive: boolean;
  // Seed data generation params
  baseResponseTime: number;
  responseTimeVariance: number;
  failureRate: number; // 0-1
  slowRate: number; // 0-1 (rate of checks that exceed threshold)
  checkCount: number;
}

const seedApis: SeedApi[] = [
  {
    name: 'User Service',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
    threshold: 500,
    isActive: true,
    baseResponseTime: 150,
    responseTimeVariance: 80,
    failureRate: 0.02,
    slowRate: 0.05,
    checkCount: 45,
  },
  {
    name: 'Auth Service',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    threshold: 300,
    isActive: true,
    baseResponseTime: 90,
    responseTimeVariance: 40,
    failureRate: 0.03,
    slowRate: 0.08,
    checkCount: 40,
  },
  {
    name: 'Order Service',
    url: 'https://jsonplaceholder.typicode.com/comments',
    method: 'GET',
    threshold: 500,
    isActive: true,
    baseResponseTime: 450,
    responseTimeVariance: 200,
    failureRate: 0.05,
    slowRate: 0.35,
    checkCount: 38,
  },
  {
    name: 'Payment Gateway',
    url: 'https://api.nonexistent-payment-service.com/health',
    method: 'POST',
    threshold: 400,
    isActive: true,
    baseResponseTime: 0,
    responseTimeVariance: 0,
    failureRate: 0.85,
    slowRate: 0,
    checkCount: 30,
  },
  {
    name: 'Inventory API',
    url: 'https://jsonplaceholder.typicode.com/todos',
    method: 'GET',
    threshold: 600,
    isActive: true,
    baseResponseTime: 200,
    responseTimeVariance: 100,
    failureRate: 0.01,
    slowRate: 0.03,
    checkCount: 42,
  },
  {
    name: 'Notification API',
    url: 'https://api.example-notifications.com/status',
    method: 'GET',
    threshold: 350,
    isActive: false,
    baseResponseTime: 180,
    responseTimeVariance: 60,
    failureRate: 0.1,
    slowRate: 0.15,
    checkCount: 15,
  },
  {
    name: 'Analytics API',
    url: 'https://jsonplaceholder.typicode.com/albums',
    method: 'GET',
    threshold: 400,
    isActive: true,
    baseResponseTime: 380,
    responseTimeVariance: 150,
    failureRate: 0.08,
    slowRate: 0.3,
    checkCount: 35,
  },
];

function generateResponseTime(base: number, variance: number): number {
  const randomFactor = (Math.random() - 0.5) * 2;
  return Math.max(10, Math.round(base + randomFactor * variance));
}

function generateTimestamp(index: number, total: number): Date {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const timeRange = now - sevenDaysAgo;
  const timestamp = sevenDaysAgo + (index / total) * timeRange;
  // Add some jitter
  const jitter = (Math.random() - 0.5) * 30 * 60 * 1000; // ±15 minutes
  return new Date(timestamp + jitter);
}

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await ApiEndpoint.deleteMany({});
    await HealthCheck.deleteMany({});
    await Incident.deleteMany({});
    console.log('Cleared existing data');

    for (const apiData of seedApis) {
      // Create the API endpoint
      const endpoint = await ApiEndpoint.create({
        name: apiData.name,
        url: apiData.url,
        method: apiData.method,
        threshold: apiData.threshold,
        isActive: apiData.isActive,
      });

      console.log(`Created: ${apiData.name}`);

      // Generate health checks
      const checks = [];
      for (let i = 0; i < apiData.checkCount; i++) {
        const timestamp = generateTimestamp(i, apiData.checkCount);
        const isFailed = Math.random() < apiData.failureRate;

        let httpStatus: number | undefined;
        let responseTime: number | undefined;
        let success: boolean;
        let thresholdExceeded = false;
        let error: string | undefined;

        if (isFailed) {
          success = false;
          const errors = [
            { status: 503, msg: 'Service Unavailable' },
            { status: 502, msg: 'Bad Gateway' },
            { status: 500, msg: 'Internal Server Error' },
            { status: undefined, msg: 'Connection refused' },
            { status: undefined, msg: 'Request timed out' },
            { status: undefined, msg: 'DNS resolution failed' },
          ];
          const errorChoice = errors[Math.floor(Math.random() * errors.length)];
          httpStatus = errorChoice.status;
          error = errorChoice.msg;
          if (httpStatus) {
            responseTime = generateResponseTime(apiData.baseResponseTime + 200, 100);
          }
        } else {
          const isSlow = Math.random() < apiData.slowRate;
          success = true;
          httpStatus = 200;

          if (isSlow) {
            responseTime = apiData.threshold + generateResponseTime(150, 200);
            thresholdExceeded = true;
          } else {
            responseTime = generateResponseTime(apiData.baseResponseTime, apiData.responseTimeVariance);
            thresholdExceeded = responseTime > apiData.threshold;
          }
        }

        checks.push({
          apiId: endpoint._id,
          timestamp,
          httpStatus,
          responseTime,
          success,
          thresholdExceeded,
          error,
        });
      }

      // Insert checks in chronological order and run each through the same
      // incident classification/lifecycle logic used by live health checks,
      // so seeded data produces realistic open/resolved incident history.
      checks.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      for (const checkData of checks) {
        const healthCheck = await HealthCheck.create(checkData);
        await incidentService.recordFromCheck(
          { _id: endpoint._id, name: endpoint.name },
          healthCheck
        );
      }
      console.log(`  → ${checks.length} health checks created`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log(`   ${seedApis.length} APIs created`);
    console.log(`   ${seedApis.reduce((sum, a) => sum + a.checkCount, 0)} health checks created`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
