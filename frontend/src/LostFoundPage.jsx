import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './client.js';
import { useAuth } from './AuthContext.jsx';
import AnimalMap from './AnimalMap.jsx';
import { Alert, EmptyState, Loading, PageIntro, StatusBadge } from './UI.jsx';

export default function LostFoundPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [type, setType] = useState('all');
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await api.lostFound(type === 'all' ? '' : type);
      setItems(result.items || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [type]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const node = event.currentTarget;
    const form = new FormData(node);
    const address = form.get('address')?.trim();
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng) || !address) {
      setError('Select the map location and add a nearby address.');
      setBusy(false);
      return;
    }
    form.set('location', JSON.stringify({ ...location, address }));
    try {
      await api.createLostFound(token, form);
      node.reset();
      setLocation({ lat: null, lng: null, address: '' });
      setNotice('Your community notice is live. Update its status when the pet is reunited.');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function markReunited(item) {
    setError('');
    try {
      await api.updateLostFound(token, item._id, 'Reunited');
      setNotice('The notice is marked as reunited. Thank you for closing the loop.');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="LOST & FOUND"
        title="Help a pet find its way home."
        description="Browse community notices or share a clear lost/found pet report with a location and contact details."
        action={
          user ? (
            <Link className="button button-orange" to="#post-a-notice">
              Post a notice
            </Link>
          ) : (
            <Link className="button button-outline" to="/login">
              Sign in to post
            </Link>
          )
        }
      />
      <div className="container page-body">
        {error && (
          <div style={{ marginBottom: 15 }}>
            <Alert kind="error">{error}</Alert>
          </div>
        )}
        {notice && (
          <div style={{ marginBottom: 15 }}>
            <Alert kind="success">{notice}</Alert>
          </div>
        )}
        <div className="two-column">
          <section className="content-stack">
            <div className="list-toolbar">
              <div className="filter-row">
                {[
                  ['all', 'All posts'],
                  ['lost', 'Lost'],
                  ['found', 'Found'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={`filter-chip ${type === key ? 'active' : ''}`}
                    onClick={() => setType(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <Loading label="Looking for open notices…" />
            ) : items.length ? (
              <div className="content-stack">
                {items.map((item) => (
                  <article className="lost-card" key={item._id}>
                    <div className="lost-type" aria-hidden="true">
                      {item.type === 'lost' ? '⌕' : '⌂'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="case-detail">
                        <div>
                          <h3>
                            {item.type === 'lost' ? 'Lost' : 'Found'} · {item.animalType}
                          </h3>
                          <p>{item.description}</p>
                        </div>
                        <StatusBadge value={item.status} />
                      </div>
                      <p>{item.location?.address || 'Location not shared'}</p>
                      <div className="contact-line">
                        Contact: <a href={`tel:${item.contact}`}>{item.contact}</a> ·{' '}
                        {item.reporterId?.name || 'Community member'}
                      </div>
                      {String(item.reporterId?._id) === String(user?.id || user?._id) &&
                        item.status === 'Open' && (
                          <button
                            className="button button-outline button-small"
                            style={{ marginTop: 9 }}
                            onClick={() => markReunited(item)}
                          >
                            Mark reunited
                          </button>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No open notices for this filter"
                text={
                  error
                    ? 'Connect the API and MongoDB to read notice records.'
                    : 'A new post can help a lost pet find familiar faces.'
                }
              />
            )}
          </section>
          <aside>
            {user ? (
              <form id="post-a-notice" className="surface" onSubmit={create}>
                <div className="surface-title">Post a lost or found pet</div>
                <p className="surface-copy">
                  Share safe contact details so neighbors can coordinate a reunion.
                </p>
                <div className="content-stack" style={{ marginTop: 16 }}>
                  <div className="form-field">
                    <label>Notice type *</label>
                    <select name="type" required defaultValue="lost">
                      <option value="lost">Lost pet</option>
                      <option value="found">Found pet</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Animal type *</label>
                    <input name="animalType" required placeholder="Dog, cat, bird…" />
                  </div>
                  <div className="form-field">
                    <label>Description *</label>
                    <textarea
                      name="description"
                      required
                      minLength="10"
                      maxLength="1600"
                      placeholder="Color, markings, collar, when last seen…"
                    />
                  </div>
                  <div className="form-field">
                    <label>Contact phone *</label>
                    <input name="contact" required defaultValue={user.phone || ''} />
                  </div>
                  <div className="form-field">
                    <label>Nearby address *</label>
                    <input
                      name="address"
                      required
                      value={location.address}
                      onChange={(e) => setLocation((old) => ({ ...old, address: e.target.value }))}
                      placeholder="Street, park, or landmark"
                    />
                  </div>
                  <div className="form-field">
                    <label>Location pin</label>
                    <AnimalMap location={location} onSelect={setLocation} />
                  </div>
                  <div className="form-field">
                    <label>Photo (optional)</label>
                    <input
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                    />
                  </div>
                  <button className="button button-primary" disabled={busy}>
                    {busy ? 'Posting…' : 'Share notice'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="surface">
                <div className="surface-title">Want to add a notice?</div>
                <p className="surface-copy">
                  Sign in to share a lost or found pet with the community and keep the contact
                  details up to date.
                </p>
                <Link
                  to="/login"
                  className="button button-primary button-small"
                  style={{ marginTop: 14 }}
                >
                  Sign in to post
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
