import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';

const router = Router();

const VALID_STATUSES = ['draft', 'published', 'cancelled'];

function withCount(rows: unknown[]) {
  return rows;
}

router.get('/', (_req: Request, res: Response) => {
  const events = db.prepare(`
    SELECT e.*, CAST(COUNT(r.id) AS INTEGER) as registration_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.status = 'published'
    GROUP BY e.id
    ORDER BY e.date ASC
  `).all();
  res.json(events);
});

router.get('/all', (_req: Request, res: Response) => {
  const events = db.prepare(`
    SELECT e.*, CAST(COUNT(r.id) AS INTEGER) as registration_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(events);
});

router.get('/:id', (req: Request, res: Response) => {
  const event = db.prepare(`
    SELECT e.*, CAST(COUNT(r.id) AS INTEGER) as registration_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.post('/', (req: Request, res: Response) => {
  const { title, description, date, capacity, status = 'draft' } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const cap = Number(capacity);
  if (!cap || cap < 1) return res.status(400).json({ error: 'Capacity must be at least 1' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const id = randomUUID();
  db.prepare(
    `INSERT INTO events (id, title, description, date, capacity, status) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, title.trim(), description.trim(), date, cap, status);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.status(201).json(event);
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { title, description, date, capacity, status } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const cap = Number(capacity);
  if (!cap || cap < 1) return res.status(400).json({ error: 'Capacity must be at least 1' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.prepare(`
    UPDATE events
    SET title = ?, description = ?, date = ?, capacity = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title.trim(), description.trim(), date, cap, status, req.params.id);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(event);
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
