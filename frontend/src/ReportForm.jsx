import { useState } from 'react';
import { api } from './client.js';
import { useAuth } from './AuthContext.jsx';
import AnimalMap from './AnimalMap.jsx';
import { Alert } from './UI.jsx';

export default function ReportForm({ rescueMode = false }) {
  const { token } = useAuth();
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const pin = {
      ...location,
      address: form.get('address')?.trim() || location.address || 'Map pin location',
    };
    if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) {
      setError("Choose the animal's location on the map before sending the report.");
      return;
    }
    form.set('location', JSON.stringify(pin));
    setBusy(true);
    try {
      const result = await api.createReport(token, form);
      setMessage(result.message || 'Your report has been sent for verification.');
      formElement.reset();
      setLocation({ lat: null, lng: null, address: '' });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="surface" onSubmit={handleSubmit}>
      <div className="surface-title">
        {rescueMode ? 'Tell us what’s happening' : 'Animal details'}
      </div>
      <p className="surface-copy">
        A clear description and location help nearby volunteers respond safely.
      </p>
      {error && (
        <div style={{ marginTop: 15 }}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      {message && (
        <div style={{ marginTop: 15 }}>
          <Alert kind="success">{message} Track updates from your dashboard.</Alert>
        </div>
      )}
      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="form-field">
          <label htmlFor="animalType">Animal type *</label>
          <select id="animalType" name="animalType" required defaultValue="">
            <option value="" disabled>
              Select an animal
            </option>
            <option>Dog</option>
            <option>Cat</option>
            <option>Cow</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="priority">Assistance priority *</label>
          <select
            id="priority"
            name="priority"
            required
            defaultValue={rescueMode ? 'Urgent' : 'Normal'}
          >
            <option value="Emergency">Emergency — severely injured</option>
            <option value="Urgent">Urgent — sick or injured</option>
            <option value="Normal">Normal — food or shelter</option>
          </select>
        </div>
        <div className="form-field full">
          <label htmlFor="description">What do you see? *</label>
          <textarea
            id="description"
            name="description"
            required
            minLength="10"
            maxLength="1800"
            placeholder="Describe the animal, condition, and anything that could help a volunteer prepare."
          />
        </div>
        <div className="form-field full">
          <label htmlFor="assistanceRequired">What help is needed? *</label>
          <input
            id="assistanceRequired"
            name="assistanceRequired"
            required
            maxLength="500"
            placeholder="For example: safe transport and a veterinary check"
          />
        </div>
        <div className="form-field full">
          <label htmlFor="address">Location / nearby address *</label>
          <input
            id="address"
            name="address"
            required
            maxLength="180"
            value={location.address}
            onChange={(event) =>
              setLocation((previous) => ({ ...previous, address: event.target.value }))
            }
            placeholder="Add a street, landmark, or neighborhood"
          />
          <span className="form-hint">
            Choose the animal's location on the map, then add a nearby landmark for the rescuer.
          </span>
        </div>
        <div className="form-field full">
          <label>Pin the animal's location *</label>
          <AnimalMap location={location} onSelect={setLocation} />
          <span className="form-hint">
            Map centre: India. Zoom or click to select the correct area. The selected coordinates
            will be attached to your report.
          </span>
        </div>
        <div className="form-field full">
          <label htmlFor="photo">Animal photo (JPG, PNG, WEBP or GIF; up to 5 MB)</label>
          <input
            id="photo"
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
          />
          <span className="form-hint">
            A photo is optional. Never approach an animal if it could put you at risk.
          </span>
        </div>
      </div>
      <div className="form-footer">
        <span className="form-hint">Reports are reviewed before appearing publicly.</span>
        <button className="button button-primary" disabled={busy}>
          {busy ? 'Sending report…' : 'Send report'}
        </button>
      </div>
    </form>
  );
}
