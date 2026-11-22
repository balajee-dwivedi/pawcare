import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const dashboards = { user: ['/dashboard', 'My reports'], volunteer: ['/volunteer', 'Volunteer work'], shelter: ['/shelter', 'Shelter space'], admin: ['/admin', 'Admin tools'] };

export default function DashboardLayout({ children, eyebrow = 'YOUR PAWCARE SPACE' }) {
  const { user } = useAuth();
  const [path, label] = dashboards[user?.role] || dashboards.user;
  return <main className="page-shell"><div className="container dashboard-head"><div className="eyebrow">{eyebrow}</div><h1 className="dashboard-title">{label}</h1><div className="dashboard-meta">Signed in as {user?.name} · {user?.role}</div></div><div className="container dashboard-layout"><nav className="dashboard-nav" aria-label="Dashboard navigation"><NavLink to={path}>Overview</NavLink>{user?.role === 'volunteer' && <NavLink to="/assistance">Find requests</NavLink>}{user?.role === 'shelter' && <NavLink to="/adopt">Public listings</NavLink>}{user?.role === 'admin' && <NavLink to="/shelters">Shelter directory</NavLink>}<NavLink to="/report">Report an animal</NavLink><NavLink to="/lost-found">Lost & found</NavLink></nav><div className="dashboard-content">{children}</div></div></main>;
}
