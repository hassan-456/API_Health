import express from 'express';
import cors from 'cors';
import endpointRoutes from './routes/endpoint.routes';
import healthcheckRoutes from './routes/healthcheck.routes';
import dashboardRoutes from './routes/dashboard.routes';
import incidentRoutes from './routes/incident.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/endpoints', endpointRoutes);
app.use('/api/endpoints', healthcheckRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/incidents', incidentRoutes);

// Health check for the server itself
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
