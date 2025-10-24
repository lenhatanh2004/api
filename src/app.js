// server.js (hoặc src/server.js)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.js';
import connectDB from './config/database.js';

import userRoutes from './routes/User-routes.js';
import SurveyRoutes from './routes/Survey-routes.js';
import HabitRoutes from './routes/Habit-routes.js';
import sleepRoutes from './routes/Sleep-routes.js';
import sleepContentRoutes from './routes/SleepContent-routes.js';
import aiRoutes from './routes/AI-routes.js';
import aiHabit_routes from './routes/aiHabit_routes.js';

const app = express();

// ---------- CORS (an toàn cho RN + web) ----------
const allowlist = (process.env.CORS_ALLOWLIST || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // RN native, Postman… thường không có Origin → cho phép
    if (!origin) return cb(null, true);
    if (allowlist.length === 0) return cb(null, true); // không cấu hình thì mở (tùy bạn)
    if (allowlist.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// ---------- Routes ----------
app.get('/health', (_req, res) => res.send('ok')); // để Render/FE kiểm tra nhanh
app.use('/api/users', userRoutes);
app.use('/api/survey', SurveyRoutes);
app.use('/api/habits', HabitRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/sleep-content', sleepContentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-habits', aiHabit_routes);

// ---------- Error handler ----------
app.use(errorHandler);

// ---------- Start server sau khi DB OK ----------
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

(async () => {
  try {
    await connectDB(); // đảm bảo connectDB() throw khi lỗi và log rõ ràng
    app.listen(PORT, HOST, () => {
      const env = process.env.NODE_ENV || 'development';
      console.log(`✅ API started | env=${env} | port=${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server (DB connection error):', err);
    process.exit(1);
  }
})();

// Để log nguyên nhân nếu có lỗi không bắt
process.on('unhandledRejection', (r) => console.error('UNHANDLED:', r));
process.on('uncaughtException', (e) => console.error('UNCAUGHT:', e));

export default app; // (tùy) hữu ích cho test/serverless
