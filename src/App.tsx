import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import PublicPage from './pages/PublicPage.tsx';
import EventDetailPage from './pages/EventDetailPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import AdminEventFormPage from './pages/AdminEventFormPage.tsx';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-indigo-600 tracking-tight">
              EventsApp
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                }
              >
                Events
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                }
              >
                Admin
              </NavLink>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<PublicPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/events/new" element={<AdminEventFormPage />} />
            <Route path="/admin/events/:id/edit" element={<AdminEventFormPage />} />
            <Route path="/admin/events/:id/registrations" element={<AdminRegistrationsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
