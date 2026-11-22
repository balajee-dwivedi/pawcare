import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './client.js';
import { useAuth } from './AuthContext.jsx';
import AnimalMap from './AnimalMap.jsx';
import { Alert, EmptyState, Loading, PageIntro, PriorityBadge, StatusBadge } from './UI.jsx';

const rank = { Emergency: 0, Urgent: 1, Normal: 2 };

export default function AssistancePage() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await api.reports(); setReports((result.reports || []).sort((a, b) => rank[a.priority] - rank[b.priority])); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function accept(id) {
    setError(''); setSuccess('');
    try { await api.acceptReport(token, id); setSuccess('You accepted this request. The reporter’s contact details are now available in your volunteer dashboard.'); await refresh(); }
    catch (requestError) { setError(requestError.message); }
  }

  return <main className="page-shell"><PageIntro eyebrow="FIND ASSISTANCE" title="Care is closer than you think." description="Browse verified animal rescue requests and see where help is needed. Emergency cases appear first; OpenStreetMap helps volunteers understand the location." action={<Link to="/rescue" className="button button-orange">Request rescue</Link>}/><div className="container page-body">
    {error && <div style={{ marginBottom: 16 }}><Alert kind="error">{error}</Alert></div>}{success && <div style={{ marginBottom: 16 }}><Alert kind="success">{success}</Alert></div>}
    <div className="two-column"><div className="content-stack"><section className="surface"><div className="dashboard-section-head"><div><h2>Rescue map</h2><p>Verified open cases</p></div><span className="priority priority-emergency">Emergency first</span></div><AnimalMap reports={reports}/></section><section className="surface"><div className="dashboard-section-head"><div><h2>Requests near the community</h2><p>Sorted by urgency, then report time</p></div>{!user && <Link className="button button-outline button-small" to="/login">Sign in to help</Link>}</div>
      {loading ? <Loading label="Finding active rescue requests…"/> : reports.length ? <div className="content-stack">{reports.map((report) => <article className="surface" key={report._id}><div className="case-detail"><div><h3>{report.animalType} needs care</h3><p>{report.description}</p><div className="case-meta"><PriorityBadge value={report.priority}/><StatusBadge value={report.status}/><span className="form-hint">{report.location?.address || 'Location pinned'}</span></div></div></div>{user?.role === 'volunteer' && report.status === 'Pending' && !report.assignedVolunteerId && <div className="case-actions"><button className="button button-primary button-small" onClick={() => accept(report._id)}>Accept rescue request</button></div>}</article>)}</div> : error ? <EmptyState title="Requests aren’t available just now" text="The API or MongoDB may not be connected yet. Try again after setup." action={<button className="button button-outline button-small" onClick={refresh}>Try again</button>}/> : <EmptyState title="No verified requests yet" text="When a report is reviewed, it will appear here for the community to support." action={<Link className="button button-outline button-small" to="/report">Make a report</Link>}/>}</section></div>
      <aside className="content-stack"><div className="surface"><div className="surface-title">Help, at the right pace</div><p className="surface-copy">Emergency means severe injury or immediate danger. Urgent means sick or injured. Normal covers food, water, or temporary shelter.</p></div><div className="notice-band">Reporter phone and email stay private until a volunteer accepts an assignment. The assigned volunteer can then coordinate directly.</div></aside></div>
  </div></main>;
}
