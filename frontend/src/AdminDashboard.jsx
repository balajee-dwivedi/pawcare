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

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    setError('');
    try {
      const [overview, shelterData] = await Promise.all([api.adminOverview(token), api.shelters()]);
      setData(overview);
      setShelters(shelterData.shelters || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function verify(report, verified) {
    setError('');
    setNotice('');
    try {
      await api.verifyReport(token, report._id, verified);
      setNotice(
        verified
          ? 'Report verified and added to the volunteer queue.'
          : 'Report returned to review.'
      );
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeReport(report) {
    if (!window.confirm(`Remove this ${report.animalType} report? This cannot be undone.`)) return;
    try {
      await api.removeReport(token, report._id);
      setNotice('Report removed.');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function changeRole(person, role) {
    try {
      await api.updateUser(token, person._id || person.id, { role });
      setNotice(`${person.name} is now assigned the ${role} role.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function toggleUser(person) {
    try {
      await api.updateUser(token, person._id || person.id, { isActive: !person.isActive });
      setNotice(person.isActive ? 'Account paused.' : 'Account reactivated.');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeUser(person) {
    if (!window.confirm(`Delete the account for ${person.name}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(token, person._id || person.id);
      setNotice(`${person.name}'s account was removed.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function saveShelter(event, shelter) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.updateShelter(token, shelter._id, fields);
      setNotice(`${shelter.name} details updated.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeShelter(shelter) {
    if (!window.confirm(`Remove ${shelter.name} from the directory?`)) return;
    try {
      await api.removeShelter(token, shelter._id);
      setNotice('Shelter removed.');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <DashboardLayout eyebrow="PAWCARE ADMIN">
      <>
        {error && <Alert kind="error">{error}</Alert>}
        {notice && <Alert kind="success">{notice}</Alert>}
        {loading ? (
          <Loading label="Loading administration overview…" />
        ) : (
          data && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <span>Community accounts</span>
                  <strong>{data.stats.users}</strong>
                </div>
                <div className="stat-card">
                  <span>Volunteers</span>
                  <strong>{data.stats.volunteers}</strong>
                </div>
                <div className="stat-card">
                  <span>Reports to review</span>
                  <strong>{data.stats.pendingReports}</strong>
                </div>
                <div className="stat-card">
                  <span>Open rescues</span>
                  <strong>{data.stats.openReports}</strong>
                </div>
              </div>
              <PageSection
                title="All rescue cases"
                detail="Monitor every rescue report, verify appropriate cases, and remove fake or inappropriate content"
              >
                {data.recentReports.length ? (
                  <div className="content-stack">
                    {data.recentReports.map((report) => (
                      <article key={report._id} className="surface">
                        <div className="case-detail">
                          <div>
                            <h3>
                              {report.animalType} · {report.location?.address}
                            </h3>
                            <p>{report.description}</p>
                            {report.assistanceRequired && (
                              <p>
                                <strong>Assistance needed:</strong> {report.assistanceRequired}
                              </p>
                            )}
                            <div className="case-meta">
                              <PriorityBadge value={report.priority} />
                              <StatusBadge value={report.status} />
                              <span className="form-hint">
                                {report.verified ? 'Verified' : 'Awaiting review'}
                              </span>
                              {(report.date || report.createdAt) && (
                                <span className="form-hint">
                                  · Reported on{' '}
                                  {new Date(report.date || report.createdAt).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              )}
                              {report.photo && report.confidence != null && (
                                <span className="form-hint">
                                  · AI check:{' '}
                                  {report.imageStatus === 'approved'
                                    ? `Animal verified (${report.suggestedSpecies}, ${Math.round(report.confidence * 100)}%)`
                                    : `Needs review (${report.suggestedSpecies || 'low confidence'}, ${Math.round(report.confidence * 100)}%)`}
                                </span>
                              )}
                            </div>
                            <div className="contact-line" style={{ marginTop: 10 }}>
                              Reported by {report.reporterId?.name || 'Community member'}
                              {report.reporterId?.phone && <> · {report.reporterId.phone}</>}
                              {report.assignedVolunteerId?.name && (
                                <> · Volunteer: {report.assignedVolunteerId.name}</>
                              )}
                            </div>
                          </div>
                          {report.photo ? (
                            <a href={report.photo} target="_blank" rel="noreferrer">
                              <img
                                src={report.photo}
                                alt={`${report.animalType} report`}
                                style={{
                                  width: 140,
                                  height: 110,
                                  objectFit: 'cover',
                                  borderRadius: 8,
                                  border: '1px solid var(--line)',
                                  flexShrink: 0,
                                }}
                              />
                            </a>
                          ) : (
                            <span className="form-hint">No photo attached</span>
                          )}
                        </div>
                        <div className="case-actions">
                          {!report.verified && (
                            <button
                              className="button button-primary button-small"
                              onClick={() => verify(report, true)}
                            >
                              Verify report
                            </button>
                          )}
                          {report.verified && (
                            <button
                              className="button button-outline button-small"
                              onClick={() => verify(report, false)}
                            >
                              Return to review
                            </button>
                          )}
                          <button
                            className="button button-danger button-small"
                            onClick={() => removeReport(report)}
                          >
                            Remove report
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No rescue reports yet"
                    text="New reports appear here for review."
                  />
                )}
              </PageSection>
              <PageSection
                title="People and volunteer access"
                detail="Manage registered users, volunteers, shelter accounts and admins"
              >
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Account</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.usersList.map((person) => (
                        <tr key={person._id}>
                          <td>
                            <strong>{person.name}</strong>
                          </td>
                          <td>{person.email}</td>
                          <td>
                            <select
                              aria-label={`Role for ${person.name}`}
                              value={person.role}
                              onChange={(e) => changeRole(person, e.target.value)}
                            >
                              <option value="user">User</option>
                              <option value="volunteer">Volunteer</option>
                              <option value="shelter">Shelter</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>{person.isActive ? 'Active' : 'Paused'}</td>
                          <td>
                            <div className="inline-actions">
                              <button
                                className="button button-outline button-small"
                                onClick={() => toggleUser(person)}
                              >
                                {person.isActive ? 'Pause' : 'Reactivate'}
                              </button>
                              <button
                                className="button button-danger button-small"
                                disabled={String(person._id || person.id) === String(user?.id || user?._id)}
                                onClick={() => removeUser(person)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PageSection>
              <PageSection
                title="Shelter directory management"
                detail="Review and update shelter contact information"
              >
                {shelters.length ? (
                  <div className="content-stack">
                    {shelters.map((shelter) => (
                      <form
                        className="surface form-grid"
                        key={shelter._id}
                        onSubmit={(event) => saveShelter(event, shelter)}
                      >
                        <div className="form-field">
                          <label>Shelter name</label>
                          <input name="name" defaultValue={shelter.name} required />
                        </div>
                        <div className="form-field">
                          <label>Phone</label>
                          <input name="phone" defaultValue={shelter.phone} required />
                        </div>
                        <div className="form-field">
                          <label>Email</label>
                          <input name="email" defaultValue={shelter.email} required />
                        </div>
                        <div className="form-field">
                          <label>Address</label>
                          <input name="address" defaultValue={shelter.address} required />
                        </div>
                        <div className="form-field full">
                          <label>Description</label>
                          <textarea
                            name="description"
                            defaultValue={shelter.description}
                            required
                          />
                        </div>
                        <div className="inline-actions form-field full">
                          <button className="button button-outline button-small">
                            Save changes
                          </button>
                          <button
                            type="button"
                            className="button button-danger button-small"
                            onClick={() => removeShelter(shelter)}
                          >
                            Remove shelter
                          </button>
                        </div>
                      </form>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No shelters to manage"
                    text="Shelter accounts can add their organization details from their dashboard."
                  />
                )}
              </PageSection>
            </>
          )
        )}
      </>
    </DashboardLayout>
  );
}