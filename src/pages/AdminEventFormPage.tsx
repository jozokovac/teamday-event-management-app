import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import type { Event } from '../types.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

type FormValues = {
  title: string;
  description: string;
  date: string;
  capacity: string;
  status: Event['status'];
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  title: '',
  description: '',
  date: '',
  capacity: '',
  status: 'draft',
};

function toDatetimeLocal(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.events
      .get(id)
      .then((ev) => {
        setForm({
          title: ev.title,
          description: ev.description,
          date: toDatetimeLocal(ev.date),
          capacity: String(ev.capacity),
          status: ev.status,
        });
      })
      .catch((e) => setSubmitError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof FormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.date) errs.date = 'Date and time is required';
    const cap = Number(form.capacity);
    if (!form.capacity || isNaN(cap) || cap < 1) errs.capacity = 'Must be at least 1';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      capacity: Number(form.capacity),
      status: form.status,
    };
    try {
      if (isEdit && id) {
        await api.events.update(id, payload);
      } else {
        await api.events.create(payload);
      }
      navigate('/admin');
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Save failed');
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/admin" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
        ← Back to admin
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Event' : 'Create Event'}
        </h1>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Field label="Title" error={errors.title} required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Annual Conference 2025"
              className="input"
            />
          </Field>
          <Field label="Description" error={errors.description} required>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the event…"
              rows={4}
              className="input resize-none"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Date & Time" error={errors.date} required>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Capacity" error={errors.capacity} required>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="100"
                className="input"
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="input"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {submitError}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
            <Link
              to="/admin"
              className="px-6 py-2.5 text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
