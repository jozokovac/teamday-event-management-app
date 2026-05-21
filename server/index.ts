import express from 'express';
import cors from 'cors';
import path from 'path';
import eventsRouter from './routes/events.js';
import registrationsRouter from './routes/registrations.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventsRouter);
app.use('/api/events/:id/registrations', registrationsRouter);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Frontend dev server: http://localhost:5173');
  }
});
