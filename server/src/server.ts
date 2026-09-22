import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`🚀 PulseWatch server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
