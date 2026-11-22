import { useEffect, useState } from 'react';
import { api } from './client.js';
import { Alert, EmptyState, Loading, PageIntro } from './UI.jsx';

export default function SheltersPage() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.shelters().then((result) => setShelters(result.shelters || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <main className="page-shell"><PageIntro eyebrow="SHELTERS & RESCUE CENTERS" title="The people behind the care." description="Find a local shelter, learn about its work, and connect directly with the team caring for animals between rescue and home."/><div className="container page-body">
    {error && <div style={{ marginBottom: 16 }}><Alert kind="error">{error}</Alert></div>}{loading ? <Loading label="Loading rescue centers…"/> : shelters.length ? <div className="shelter-grid">{shelters.map((shelter) => <article key={shelter._id} className="shelter-card"><div className="shelter-icon" aria-hidden="true">⌂</div><h3>{shelter.name}</h3><p>{shelter.description}</p><div className="shelter-details"><span>⌖ &nbsp;{shelter.address}{shelter.location?.address ? ` · ${shelter.location.address}` : ''}</span><a href={`tel:${shelter.phone}`}>☎ &nbsp;{shelter.phone}</a><a href={`mailto:${shelter.email}`}>✉ &nbsp;{shelter.email}</a></div></article>)}</div> : <EmptyState title="The shelter directory is quiet right now" text={error ? 'Connect the API and MongoDB to load shelter records.' : 'Shelter teams can add their information from a shelter account.'}/>}<div style={{ marginTop: 28 }} className="notice-band">Are you part of a shelter? Sign in with a shelter account and manage your profile, animals, and incoming assistance requests.</div>
  </div></main>;
}
