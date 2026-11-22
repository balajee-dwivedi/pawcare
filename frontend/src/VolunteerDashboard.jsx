import { useCallback, useEffect, useState } from 'react';
import { api } from './client.js';
import { useAuth } from './AuthContext.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import {
  Alert,
  EmptyState,
  Loading,
  PageSection,
  PriorityBadge,
  StatusBadge,
} from './UI.jsx';

const priorityRank = { Emergency: 0, Urgent: 1, Normal: 2 };
const nextStatus = { Accepted: 'In Progress', 'In Progress': 'Resolved' };
const nearbyRadiusKm = 50;

function distanceKm(from, to) {
  if (!to || to.lat == null || to.lng == null) return Infinity;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(Number(to.lat) - from.lat);
  const longitudeDelta = radians(Number(to.lng) - from.lng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(Number(to.lat))) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VolunteerDashboard() {
  const { token } = useAuth();
  const [queue, setQueue] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [availability, setAvailability] = useState('available');
  const [contact, setContact] = useState('');
  const [area, setArea] = useState('');
  const [nearbyCenter, setNearbyCenter] = useState(null);
  const [locating, setLocating] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const refresh = useCallback(async () => {
    setError('');
    try {
      const [queueData, summary] = await Promise.all([
        api.volunteerRequests(token),
        api.volunteerSummary(token),
      ]);
      const sorted = (queueData.reports || []).sort(
        (a, b) =>
          priorityRank[a.priority] - priorityRank[b.priority] || new Date(a.date) - new Date(b.date)
      );
      setQueue(sorted);
      setAssignments(summary.assignments || []);
      setProfile(summary.profile);
      setAvailability(summary.profile?.availability || 'available');
      setContact(summary.profile?.contact || '');
      setArea(summary.profile?.area || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function accept(id) {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await api.acceptReport(token, id);
      setNotice(
        'Rescue accepted. The reporter’s phone and email are now in your assignment details.'
      );
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId('');
    }
  }
  async function advance(item) {
    const status = nextStatus[item.status];
    if (!status) return;
    setBusyId(item._id);
    setError('');
    setNotice('');
    try {
      await api.updateReportStatus(token, item._id, status);
      setNotice(`Case status updated to ${status}.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId('');
    }
  }
  async function saveAvailability(event) {
    event.preventDefault();
    try {
      const result = await api.updateAvailability(token, { availability, contact, area });
      setProfile(result.profile);
      setNotice('Your volunteer contact, service area, and availability have been updated.');
    } catch (e) {
      setError(e.message);
    }
  }
  function toggleNearby() {
    if (nearbyCenter) {
      setNearbyCenter(null);
      setNearbyError('');
      return;
    }
    if (!navigator.geolocation) {
      setNearbyError('This browser cannot share a location. All verified requests remain visible.');
      return;
    }
    setLocating(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNearbyCenter({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        setNearbyError('Location permission was not granted. All verified requests remain visible.');
        setLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  }
  const pendingQueue = queue.filter((item) => item.status === 'Pending' && !item.assignedVolunteerId);
  const visibleQueue = nearbyCenter
    ? pendingQueue.filter((item) => distanceKm(nearbyCenter, item.location) <= nearbyRadiusKm)
    : pendingQueue;
  const active = assignments.filter((item) => item.status !== 'Resolved');
  return (
    <DashboardLayout eyebrow="VOLUNTEER DESK">
      <div className="stat-grid">
        <div className="stat-card">
          <span>Open requests</span>
          <strong>{visibleQueue.length}</strong>
        </div>
        <div className="stat-card">
          <span>Your active cases</span>
          <strong>{active.length}</strong>
        </div>
        <div className="stat-card">
          <span>Resolved</span>
          <strong>{assignments.filter((item) => item.status === 'Resolved').length}</strong>
        </div>
        <div className="stat-card">
          <span>Service area</span>
          <strong style={{ fontSize: 15, marginTop: 12 }}>{profile?.area || 'Not set'}</strong>
        </div>
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}
      {loading ? (
        <Loading label="Loading volunteer requests…" />
      ) : (
        <>
          <PageSection
            title="Your availability"
            detail="Let the volunteer network know when you can respond"
          >
            <form className="form-grid" onSubmit={saveAvailability}>
              <div className="form-field">
                <label htmlFor="volunteerContact">Contact phone</label>
                <input
                  id="volunteerContact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  maxLength="30"
                />
              </div>
              <div className="form-field">
                <label htmlFor="volunteerArea">Service area</label>
                <input
                  id="volunteerArea"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                  maxLength="120"
                  placeholder="Neighborhood or district"
                />
              </div>
              <div className="form-field">
                <label htmlFor="availability">Current status</label>
                <select
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="off-duty">Off duty</option>
                </select>
              </div>
              <div className="form-field full">
                <button className="button button-outline button-small">
                  Save volunteer profile
                </button>
              </div>
            </form>
          </PageSection>
          <PageSection
            title="Requests to review"
            detail={`Verified cases are sorted Emergency → Urgent → Normal${nearbyCenter ? ` · within ${nearbyRadiusKm} km` : ''}`}
          >
            <div className="inline-actions" style={{ marginBottom: 12 }}>
              <span className="form-hint">
                {nearbyCenter ? 'Your location is used only in this browser to filter nearby cases.' : 'Show requests in your area using your current location.'}
              </span>
              <button type="button" className="button button-outline button-small" onClick={toggleNearby} disabled={locating}>
                {locating ? 'Finding location…' : nearbyCenter ? 'Show all areas' : 'Find requests near me'}
              </button>
            </div>
            {nearbyError && <Alert kind="info">{nearbyError}</Alert>}
            {visibleQueue.length ? (
              <div className="content-stack">
                {visibleQueue.map((item) => (
                    <article className="surface" key={item._id}>
                      <div className="case-detail">
                        <div>
                          <h3>{item.animalType} needs a hand</h3>
                          <p>{item.description}</p>
                          <div className="case-meta">
                            <PriorityBadge value={item.priority} />
                            <span className="form-hint">{item.location?.address}</span>
                            {nearbyCenter && <span className="form-hint">{Math.round(distanceKm(nearbyCenter, item.location))} km away</span>}
                          </div>
                        </div>
                      </div>
                      <div className="case-actions">
                        <button
                          className="button button-primary button-small"
                          disabled={busyId === item._id}
                          onClick={() => accept(item._id)}
                        >
                          {busyId === item._id ? 'Accepting…' : 'Accept this rescue'}
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <EmptyState
                title={nearbyCenter ? 'No open requests within 50 km' : 'No open requests at the moment'}
                text={nearbyCenter ? 'Show all areas to browse every verified request.' : 'New verified cases will appear here, with the most urgent at the top.'}
              />
            )}
          </PageSection>
          <PageSection
            title="Your assigned cases"
            detail="Contact details appear only after you accept a case"
          >
            {assignments.length ? (
              <div className="content-stack">
                {assignments.map((item) => (
                  <article className="surface" key={item._id}>
                    <div className="case-detail">
                      <div>
                        <h3>
                          {item.animalType} · {item.location?.address}
                        </h3>
                        <p>{item.description}</p>
                        <div className="case-meta">
                          <PriorityBadge value={item.priority} />
                          <StatusBadge value={item.status} />
                        </div>
                      </div>
                    </div>
                    {item.reporterId && (
                      <div className="contact-line" style={{ marginTop: 12 }}>
                        Reporter: {item.reporterId.name}
                        {item.reporterId.phone && (
                          <>
                            {' '}
                            · <a href={`tel:${item.reporterId.phone}`}>{item.reporterId.phone}</a>
                          </>
                        )}
                        {item.reporterId.email && (
                          <>
                            {' '}
                            ·{' '}
                            <a href={`mailto:${item.reporterId.email}`}>{item.reporterId.email}</a>
                          </>
                        )}
                      </div>
                    )}
                    {nextStatus[item.status] && (
                      <div className="case-actions">
                        <button
                          className="button button-outline button-small"
                          disabled={busyId === item._id}
                          onClick={() => advance(item)}
                        >
                          {busyId === item._id ? 'Updating…' : `Mark ${nextStatus[item.status]}`}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Accept a case to get started"
                text="Once you accept a rescue, it will appear here with the reporter’s contact details."
              />
            )}
          </PageSection>
        </>
      )}
    </DashboardLayout>
  );
}
