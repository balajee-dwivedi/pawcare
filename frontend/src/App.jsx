import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { SiteFooter, SiteHeader } from './UI.jsx';
import HomePage from './HomePage.jsx';
import { ReportPage, RescuePage } from './ReportPages.jsx';
import AssistancePage from './AssistancePage.jsx';
import AdoptPage from './AdoptPage.jsx';
import SheltersPage from './SheltersPage.jsx';
import LostFoundPage from './LostFoundPage.jsx';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './AuthPages.jsx';
import UserDashboard from './UserDashboard.jsx';
import VolunteerDashboard from './VolunteerDashboard.jsx';
import ShelterDashboard from './ShelterDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import ContactPage from './ContactPage.jsx';

function NotFound() {
  return (
    <main className="container not-found">
      <div className="eyebrow">PAGE NOT FOUND</div>
      <h1>Let's find the right path.</h1>
      <p className="page-description" style={{ margin: '0 auto 20px' }}>
        That page isn't here, but there's always another way to help.
      </p>
      <a href="/" className="button button-primary">
        Back to PawCare
      </a>
    </main>
  );
}

function AuthRedirect({ children }) {
  const { user } = useAuth();
  return user ? (
    <Navigate
      to={
        { user: '/dashboard', volunteer: '/volunteer', shelter: '/shelter', admin: '/admin' }[
          user.role
        ]
      }
      replace
    />
  ) : (
    children
  );
}

export default function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/report"
          element={<ProtectedRoute roles={['user', 'volunteer', 'shelter', 'admin']} />}
        >
          <Route index element={<ReportPage />} />
        </Route>
        <Route
          path="/rescue"
          element={<ProtectedRoute roles={['user', 'volunteer', 'shelter', 'admin']} />}
        >
          <Route index element={<RescuePage />} />
        </Route>
        <Route path="/assistance" element={<AssistancePage />} />
        <Route path="/adopt" element={<AdoptPage />} />
        <Route path="/shelters" element={<SheltersPage />} />
        <Route path="/lost-found" element={<LostFoundPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthRedirect>
              <ForgotPasswordPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthRedirect>
              <ResetPasswordPage />
            </AuthRedirect>
          }
        />
        <Route element={<ProtectedRoute roles={['user']} />}>
          <Route path="/dashboard" element={<UserDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={['volunteer']} />}>
          <Route path="/volunteer" element={<VolunteerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={['shelter']} />}>
          <Route path="/shelter" element={<ShelterDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SiteFooter />
    </>
  );
}