import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';

const router = Router({ mergeParams: true });

router.post('/', (req: Request, res: Response) => {
  const { id: eventId } = req.params as { id: string };
  const { name, email } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const event = db.prepare(`
    SELECT e.*, CAST(COUNT(r.id) AS INTEGER) as registration_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(eventId) as { status: string; capacity: number; registration_count: number } | undefined;

  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'published') {
    return res.status(400).json({ error: 'Event is not open for registration' });
  }
  if (event.registration_count >= event.capacity) {
    return res.status(409).json({ error: 'Event is fully booked' });
  }

  try {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO registrations (id, event_id, name, email) VALUES (?, ?, ?, ?)`
    ).run(id, eventId, name.trim(), email.trim().toLowerCase());

    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(id);
    res.status(201).json(registration);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'You are already registered for this event' });
    }
    throw err;
  }
});

router.get('/', (req: Request, res: Response) => {
  const { id: eventId } = req.params as { id: string };
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const registrations = db.prepare(
    `SELECT * FROM registrations WHERE event_id = ? ORDER BY created_at ASC`
  ).all(eventId);
  res.json(registrations);
});

export default router;
