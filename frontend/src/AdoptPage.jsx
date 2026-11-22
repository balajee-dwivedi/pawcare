import { useEffect, useState } from 'react';
import { api } from './client.js';
import { Alert, EmptyState, Loading, PageIntro, PhotoPlaceholder } from './UI.jsx';

const animalIcon = (type = '') => /cat/i.test(type) ? '🐈' : /bird/i.test(type) ? '🕊' : '🐕';

export default function AdoptPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.adoptions().then((result) => setItems(result.adoptions || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const shown = filter === 'All' ? items : items.filter((item) => item.animalType.toLowerCase().includes(filter.toLowerCase()));
  return <main className="page-shell"><PageIntro eyebrow="ADOPTION STORIES" title="A new beginning, together." description="Meet animals in the care of local shelters and find the right companion for your home and your life."/><div className="container page-body">
    {error && <div style={{ marginBottom: 16 }}><Alert kind="error">{error}</Alert></div>}
    <div className="list-toolbar"><div className="filter-row">{['All', 'Dog', 'Cat'].map((item) => <button key={item} className={`filter-chip ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item === 'All' ? 'All animals' : item + 's'}</button>)}</div><span className="form-hint">Listings are managed by verified shelter accounts.</span></div>
    {loading ? <Loading label="Finding animals looking for a home…"/> : shown.length ? <div className="animal-grid">{shown.map((item) => <article className="animal-card" key={item._id}><PhotoPlaceholder src={item.photo} animal={animalIcon(item.animalType)}/><div className="animal-card-body"><h3>{item.animalType}</h3><div className="animal-meta">{item.age} · {item.gender}</div><p>{item.description}</p><div className="animal-card-foot"><span>{item.shelterId?.name || 'PawCare shelter'}</span><a className="button button-outline button-small" href={item.shelterId?.email ? `mailto:${item.shelterId.email}` : '/contact'}>Ask about me</a></div></div></article>)}</div> : <EmptyState title="No matching friends just yet" text={error ? 'Connect the API to see active adoption records.' : 'Try another filter, or check back as shelters add new listings.'}/>}<div style={{ marginTop: 24 }} className="notice-band">Every animal deserves a thoughtful match. Contact the shelter to ask about health, care needs, and a meet-and-greet.</div>
  </div></main>;
}
