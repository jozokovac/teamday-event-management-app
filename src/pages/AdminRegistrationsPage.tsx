import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import type { Event, Registration } from '../types.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

export default function AdminRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([api.events.get(id), api.registrations.list(id)])
      .then(([ev, regs]) => {
        setEvent(ev);
        setRegistrations(regs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !event) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700">
        <p className="font-medium">{error || 'Event not found'}</p>
        <Link to="/admin" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
        ← Back to admin
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
        <p className="text-gray-500 mt-1">
          {event.title} &mdash;{' '}
          {new Date(event.date).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
        <span>
          <strong className="text-gray-800">{registrations.length}</strong> registered
        </span>
        <span>
          <strong className="text-gray-800">{event.capacity - registrations.length}</strong> spots
          remaining
        </span>
        <span>
          Capacity: <strong className="text-gray-800">{event.capacity}</strong>
        </span>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="font-medium">No registrations yet</p>
          <p className="text-sm mt-1">Registrations will appear here once people sign up.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 hidden sm:table-cell">Registered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map((reg, idx) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{reg.name}</td>
                  <td className="px-4 py-3 text-gray-500">{reg.email}</td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {new Date(reg.created_at).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
