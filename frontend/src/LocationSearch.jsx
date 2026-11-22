import { useEffect, useRef, useState } from 'react';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function LocationSearch({ onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);
  const chosenRef = useRef('');

  useEffect(() => {
    const text = query.trim();

    // Don't search again for the text we just picked from the list.
    if (text === chosenRef.current) return;

    if (text.length < 3) {
      setResults([]);
      setOpen(false);
      setError('');
      return;
    }

    const controller = new AbortController();
    // Wait a moment after typing stops before calling Mapbox, to save requests.
    const timer = setTimeout(async () => {
      const id = ++requestIdRef.current;
      setLoading(true);
      setError('');
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json`
        );
        url.searchParams.set('access_token', TOKEN);
        url.searchParams.set('autocomplete', 'true');
        url.searchParams.set('limit', '5');
        // Optional: uncomment and set your country code to limit results, e.g. 'in' for India.
        // url.searchParams.set('country', 'in');

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        // Ignore responses for older searches that finished late.
        if (id !== requestIdRef.current) return;
        setResults(data.features || []);
        setOpen(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Search is unavailable right now. You can still click the map.');
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(feature) {
    const [lng, lat] = feature.center; // Mapbox returns [lng, lat]
    chosenRef.current = feature.place_name;
    setQuery(feature.place_name);
    setOpen(false);
    onPick({
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      address: feature.place_name,
    });
  }

  return (
    <div className="map-search">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          chosenRef.current = '';
          setQuery(e.target.value);
        }}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Search a place or address"
        aria-label="Search for a location"
        autoComplete="off"
      />
      {loading && <small className="map-search-status">Searching...</small>}
      {error && <small className="map-search-status">{error}</small>}
      {open && results.length > 0 && (
        <ul className="map-search-results">
          {results.map((feature) => (
            <li key={feature.id}>
              <button type="button" onClick={() => choose(feature)}>
                {feature.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}