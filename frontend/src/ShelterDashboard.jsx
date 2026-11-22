import { useCallback, useEffect, useState } from 'react';
import { api } from './client.js';
import { useAuth } from './AuthContext.jsx';
import AnimalMap from './AnimalMap.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import { Alert, EmptyState, Loading, PageSection, PriorityBadge, StatusBadge } from './UI.jsx';

export default function ShelterDashboard() {
  const { token, user, setUser } = useAuth();
  const [shelter, setShelter] = useState(null);
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [shelterLocation, setShelterLocation] = useState({ lat: null, lng: null, address: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [shelterData, requestData, adoptionData] = await Promise.all([
        api.shelters(),
        api.shelterRequests(token),
        api.myAdoptions(token),
      ]);
      const own =
        (shelterData.shelters || []).find((item) => String(item._id) === String(user.shelterId)) ||
        null;
      setShelter(own);
      setShelterLocation(own?.location || { lat: null, lng: null, address: '' });
      setRequests(requestData.reports || []);
      setListings(
        (adoptionData.adoptions || []).filter(
          (item) => String(item.shelterId?._id) === String(user.shelterId)
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveShelter(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (!Number.isFinite(shelterLocation.lat) || !Number.isFinite(shelterLocation.lng)) {
      setError('Choose the shelter location on the map before saving.');
      setBusy(false);
      return;
    }
    try {
      const result = shelter
        ? await api.updateShelter(token, shelter._id, form)
        : await api.createShelter(token, form);
      setShelter(result.shelter);
      setUser({ ...user, shelterId: result.shelter._id });
      setNotice('Shelter information saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addListing(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await api.createAdoption(token, form);
      setListings((current) => [...current, result.adoption]);
      formElement.reset();
      setNotice(
        result.adoption?.imageStatus === 'pending_review'
          ? 'Listing saved. The photo needs a quick review before it appears publicly.'
          : 'Adoption listing added.'
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(item, status) {
    try {
      const result = await api.updateAdoption(token, item._id, { adoptionStatus: status });
      setListings((items) =>
        items.map((entry) => (entry._id === item._id ? result.adoption : entry))
      );
      setNotice(`Listing marked ${status.toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function resolveRequest(item) {
    if (!window.confirm(`Mark the ${item.animalType} assistance case as resolved?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.updateReportStatus(token, item._id, 'Resolved');
      setNotice('Assistance request marked resolved.');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout eyebrow="SHELTER DESK">
      <div className="stat-grid">
        <div className="stat-card">
          <span>Adoption listings</span>
          <strong>{listings.length}</strong>
        </div>
        <div className="stat-card">
          <span>Available</span>
          <strong>{listings.filter((item) => item.adoptionStatus === 'Available').length}</strong>
        </div>
        <div className="stat-card">
          <span>Incoming requests</span>
          <strong>{requests.length}</strong>
        </div>
        <div className="stat-card">
          <span>Profile status</span>
          <strong style={{ fontSize: 16, marginTop: 12 }}>{shelter ? 'Listed' : 'Set up'}</strong>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      {loading ? (
        <Loading label="Loading shelter workspace…" />
      ) : (
        <>
          <PageSection
            title="Shelter information"
            detail="Keep contact details current for adopters and rescuers"
          >
            <form onSubmit={saveShelter} className="form-grid">
              <input type="hidden" name="location" value={JSON.stringify(shelterLocation)} />
              <div className="form-field">
                <label>Shelter name *</label>
                <input
                  name="name"
                  required
                  defaultValue={shelter?.name || ''}
                  placeholder="Your rescue center"
                />
              </div>
              <div className="form-field">
                <label>Contact phone *</label>
                <input name="phone" required defaultValue={shelter?.phone || user.phone || ''} />
              </div>
              <div className="form-field">
                <label>Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={shelter?.email || user.email || ''}
                />
              </div>
              <div className="form-field">
                <label>Address *</label>
                <input name="address" required defaultValue={shelter?.address || ''} />
              </div>
              <div className="form-field full">
                <label>Shelter location pin</label>
                <AnimalMap
                  location={shelterLocation}
                  onSelect={setShelterLocation}
                  markerLabel="Shelter location"
                />
                <span className="form-hint">
                  Choose the shelter's location on the map so people can find the right rescue center.
                </span>
              </div>
              <div className="form-field full">
                <label>Description *</label>
                <textarea
                  name="description"
                  required
                  defaultValue={shelter?.description || ''}
                  placeholder="What kind of care does your shelter provide?"
                />
              </div>
              <div className="form-field full">
                <button className="button button-primary" disabled={busy}>
                  {shelter ? 'Save shelter details' : 'Add shelter information'}
                </button>
              </div>
            </form>
          </PageSection>

          <PageSection
            title="Add an animal for adoption"
            detail="New listings are visible to the public while Available"
          >
            <form onSubmit={addListing} className="form-grid">
              <div className="form-field">
                <label>Animal type *</label>
                <input name="animalType" required placeholder="Indie dog, kitten…" />
              </div>
              <div className="form-field">
                <label>Age *</label>
                <input name="age" required placeholder="About 1 year" />
              </div>
              <div className="form-field">
                <label>Gender</label>
                <select name="gender" defaultValue="Unknown">
                  <option>Female</option>
                  <option>Male</option>
                  <option>Unknown</option>
                </select>
              </div>
              <div className="form-field">
                <label>Photo *</label>
                <input
                  type="file"
                  name="photo"
                  required
                  accept="image/jpeg,image/png,image/webp,image/gif"
                />
              </div>
              <div className="form-field full">
                <label>About this animal *</label>
                <textarea
                  name="description"
                  required
                  maxLength="1400"
                  placeholder="Personality, care needs, and what kind of home would suit them."
                />
              </div>
              <div className="form-field full">
                <button className="button button-primary" disabled={busy || !shelter}>
                  {busy ? 'Saving…' : 'Add adoption listing'}
                </button>
                {!shelter && (
                  <span className="form-hint">
                    Add your shelter profile before creating an adoption listing.
                  </span>
                )}
              </div>
            </form>
          </PageSection>

          <PageSection
            title="Adoption listings"
            detail="Update adoption status when an animal finds a home"
          >
            {listings.length ? (
              <div className="data-list">
                {listings.map((item) => (
                  <div key={item._id} className="data-row">
                    <div className="data-main">
                      <strong>
                        {item.animalType} · {item.age}
                      </strong>
                      <span>{item.description}</span>
                    </div>
                    <div className="inline-actions">
                      <StatusBadge value={item.adoptionStatus} />
                      {item.adoptionStatus === 'Available' ? (
                        <button
                          className="button button-outline button-small"
                          onClick={() => changeStatus(item, 'Adopted')}
                        >
                          Mark adopted
                        </button>
                      ) : (
                        <button
                          className="button button-outline button-small"
                          onClick={() => changeStatus(item, 'Available')}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No adoption listings yet"
                text="Add an animal after saving shelter details."
              />
            )}
          </PageSection>

          <PageSection
            title="Incoming assistance requests"
            detail="Open verified cases for shelter support"
          >
            {requests.length ? (
              <div className="data-list">
                {requests.map((item) => (
                  <div className="data-row" key={item._id}>
                    <div className="data-main">
                      <strong>
                        {item.animalType} · {item.location?.address}
                      </strong>
                      <span>{item.assistanceRequired}</span>
                      <span>
                        <PriorityBadge value={item.priority} />
                      </span>
                    </div>
                    <div className="inline-actions">
                      <StatusBadge value={item.status} />
                      <button
                        className="button button-outline button-small"
                        disabled={busy}
                        onClick={() => resolveRequest(item)}
                      >
                        Mark resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No open requests to manage"
                text="Verified rescue cases will appear here for shelter teams."
              />
            )}
          </PageSection>
        </>
      )}
    </DashboardLayout>
  );
}