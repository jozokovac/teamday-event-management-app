import { useEffect, useState } from 'react';
import { api } from '../api/client.ts';
import type { Event } from '../types.ts';
import EventCard from '../components/EventCard.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

export default function PublicPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.events
      .listPublished()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700">
        <p className="font-medium">Failed to load events</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
        <p className="text-gray-500 mt-1">Browse and register for our upcoming events.</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No upcoming events</p>
          <p className="text-sm mt-1">Check back soon for new events.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
