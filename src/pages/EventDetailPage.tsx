import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import type { Event, Registration } from '../types.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

type FormState = { name: string; email: string };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState<Registration | null>(null);

  useEffect(() => {
    if (!id) return;
    api.events
      .get(id)
      .then(setEvent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !event) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700">
        <p className="font-medium">{error || 'Event not found'}</p>
        <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registration_count;
  const isFull = spotsLeft <= 0;
  const canRegister = event.status === 'published' && !isFull;

  function validate() {
    const errors: Partial<FormState> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email';
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitError('');
    setSubmitting(true);
    try {
      const reg = await api.registrations.register(event!.id, form);
      setConfirmation(reg);
      setEvent((ev) => ev ? { ...ev, registration_count: ev.registration_count + 1 } : ev);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
        ← Back to events
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{event.description}</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Date & Time</p>
            <p className="font-medium text-gray-800">
              {new Date(event.date).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Availability</p>
            <p className={`font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
              {isFull
                ? 'Fully booked'
                : `${spotsLeft} of ${event.capacity} spots remaining`}
            </p>
          </div>
        </div>
      </div>

      {event.status !== 'published' && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-4 text-yellow-800 text-sm text-center">
          This event is not currently open for registration.
        </div>
      )}

      {canRegister && !confirmation && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Register for this event</h2>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Field label="Full Name" error={fieldErrors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="input"
              />
            </Field>
            <Field label="Email Address" error={fieldErrors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
                className="input"
              />
            </Field>
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering…' : 'Complete Registration'}
            </button>
          </form>
        </div>
      )}

      {isFull && event.status === 'published' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700 text-sm text-center">
          This event is fully booked.
        </div>
      )}

      {confirmation && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">You're registered!</h2>
          <p className="text-green-700 text-sm">
            <strong>{confirmation.name}</strong>, a confirmation has been sent to{' '}
            <strong>{confirmation.email}</strong>.
          </p>
          <p className="text-green-700 text-sm mt-1">See you at <strong>{event.title}</strong>!</p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: Event['status'] }) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
