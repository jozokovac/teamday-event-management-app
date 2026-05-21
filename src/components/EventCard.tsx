import { Link } from 'react-router-dom';
import type { Event } from '../types.ts';

function spotsLeft(event: Event) {
  return event.capacity - event.registration_count;
}

export default function EventCard({ event }: { event: Event }) {
  const remaining = spotsLeft(event);
  const isFull = remaining <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 leading-snug">{event.title}</h3>
        {isFull && (
          <span className="shrink-0 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            Full
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-auto pt-2 border-t border-gray-100">
        <span>
          {new Date(event.date).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
        <span className={isFull ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
          {isFull ? 'No spots left' : `${remaining} spot${remaining === 1 ? '' : 's'} left`}
        </span>
      </div>
      <Link
        to={`/events/${event.id}`}
        className="mt-1 inline-flex items-center justify-center w-full py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        {isFull ? 'View Details' : 'Register Now'}
      </Link>
    </div>
  );
}
