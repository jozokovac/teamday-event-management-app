import fs from 'fs';
import path from 'path';

type EventRow = {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type RegistrationRow = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  created_at: string;
};

type Store = {
  events: EventRow[];
  registrations: RegistrationRow[];
};

const dataPath = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'events.json');
const dataDir = path.dirname(dataPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function now() {
  return new Date().toISOString();
}

function readStore(): Store {
  if (!fs.existsSync(dataPath)) return { events: [], registrations: [] };
  const raw = fs.readFileSync(dataPath, 'utf8').trim();
  if (!raw) return { events: [], registrations: [] };
  const parsed = JSON.parse(raw) as Partial<Store>;
  return {
    events: Array.isArray(parsed.events) ? parsed.events : [],
    registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
  };
}

function writeStore(store: Store) {
  const tmp = `${dataPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, dataPath);
}

function withRegistrationCount(event: EventRow, store: Store) {
  return {
    ...event,
    registration_count: store.registrations.filter((registration) => registration.event_id === event.id).length,
  };
}

function byDateAsc(a: EventRow, b: EventRow) {
  return a.date.localeCompare(b.date);
}

function byCreatedDesc(a: EventRow, b: EventRow) {
  return b.created_at.localeCompare(a.created_at);
}

function uniqueConstraintError() {
  const err = new Error('UNIQUE constraint failed: registrations.event_id, registrations.email') as NodeJS.ErrnoException;
  err.code = 'SQLITE_CONSTRAINT_UNIQUE';
  return err;
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

const db = {
  prepare(sql: string) {
    const normalized = normalizeSql(sql);

    return {
      all(...params: unknown[]) {
        const store = readStore();

        if (normalized.includes('from events e') && normalized.includes("where e.status = 'published'")) {
          return store.events
            .filter((event) => event.status === 'published')
            .sort(byDateAsc)
            .map((event) => withRegistrationCount(event, store));
        }

        if (normalized.includes('from events e') && normalized.includes('group by e.id')) {
          return [...store.events].sort(byCreatedDesc).map((event) => withRegistrationCount(event, store));
        }

        if (normalized.startsWith('select * from registrations where event_id = ?')) {
          const [eventId] = params;
          return store.registrations
            .filter((registration) => registration.event_id === eventId)
            .sort((a, b) => a.created_at.localeCompare(b.created_at));
        }

        throw new Error(`Unsupported query: ${sql}`);
      },

      get(...params: unknown[]) {
        const store = readStore();

        if (normalized.includes('from events e') && normalized.includes('where e.id = ?')) {
          const [eventId] = params;
          const event = store.events.find((item) => item.id === eventId);
          return event ? withRegistrationCount(event, store) : undefined;
        }

        if (normalized.startsWith('select * from events where id = ?')) {
          const [eventId] = params;
          return store.events.find((item) => item.id === eventId);
        }

        if (normalized.startsWith('select id from events where id = ?')) {
          const [eventId] = params;
          const event = store.events.find((item) => item.id === eventId);
          return event ? { id: event.id } : undefined;
        }

        if (normalized.startsWith('select * from registrations where id = ?')) {
          const [registrationId] = params;
          return store.registrations.find((item) => item.id === registrationId);
        }

        throw new Error(`Unsupported query: ${sql}`);
      },

      run(...params: unknown[]) {
        const store = readStore();

        if (normalized.startsWith('insert into events')) {
          const [id, title, description, date, capacity, status] = params;
          const timestamp = now();
          store.events.push({
            id: String(id),
            title: String(title),
            description: String(description),
            date: String(date),
            capacity: Number(capacity),
            status: String(status),
            created_at: timestamp,
            updated_at: timestamp,
          });
          writeStore(store);
          return { changes: 1 };
        }

        if (normalized.startsWith('update events')) {
          const [title, description, date, capacity, status, id] = params;
          const event = store.events.find((item) => item.id === id);
          if (!event) return { changes: 0 };
          event.title = String(title);
          event.description = String(description);
          event.date = String(date);
          event.capacity = Number(capacity);
          event.status = String(status);
          event.updated_at = now();
          writeStore(store);
          return { changes: 1 };
        }

        if (normalized.startsWith('delete from events where id = ?')) {
          const [id] = params;
          const before = store.events.length;
          store.events = store.events.filter((event) => event.id !== id);
          store.registrations = store.registrations.filter((registration) => registration.event_id !== id);
          writeStore(store);
          return { changes: before - store.events.length };
        }

        if (normalized.startsWith('insert into registrations')) {
          const [id, eventId, name, email] = params;
          const normalizedEmail = String(email);
          if (store.registrations.some((item) => item.event_id === eventId && item.email === normalizedEmail)) {
            throw uniqueConstraintError();
          }
          store.registrations.push({
            id: String(id),
            event_id: String(eventId),
            name: String(name),
            email: normalizedEmail,
            created_at: now(),
          });
          writeStore(store);
          return { changes: 1 };
        }

        throw new Error(`Unsupported query: ${sql}`);
      },
    };
  },
};

export default db;
