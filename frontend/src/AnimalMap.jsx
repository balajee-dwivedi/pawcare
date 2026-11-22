
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import LocationSearch from './LocationSearch.jsx';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Mapbox uses [lng, lat], the reverse of Leaflet's [lat, lng].
const defaultCenter = [78.9629, 20.5937];
const noReports = [];

function createPawElement(selected = false) {
  const el = document.createElement('div');
  el.className = selected ? 'paw-map-icon selected' : 'paw-map-icon';
  el.innerHTML = '<span></span>';
  el.style.width = '24px';
  el.style.height = '28px';
  return el;
}

/** Interactive pin-selection map; when read-only, report markers open their short case summary. */
export default function AnimalMap({
  location,
  onSelect,
  reports = noReports,
  zoom,
  markerLabel = 'Selected animal location',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const reportMarkersRef = useRef([]);
  const onSelectRef = useRef(onSelect);

  const hasLocation = location?.lat != null && location?.lng != null;
  const lat = hasLocation ? Number(location.lat) : null;
  const lng = hasLocation ? Number(location.lng) : null;
  const mapZoom = zoom || (onSelect ? (hasLocation ? 13 : 4) : 5);

  // Keep the latest callback without recreating the map.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: hasLocation ? [lng, lat] : defaultCenter,
      zoom: mapZoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.scrollZoom.disable();

    map.on('click', (event) => {
      const clickLat = event.lngLat.lat;
      const clickLng = event.lngLat.lng;
      onSelectRef.current?.({
        lat: Number(clickLat.toFixed(5)),
        lng: Number(clickLng.toFixed(5)),
        address: `Map pin · ${clickLat.toFixed(3)}, ${clickLng.toFixed(3)}`,
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when the selected location changes (the Leaflet version remounted for this).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasLocation) return;
    map.easeTo({ center: [lng, lat], zoom: mapZoom });
  }, [lat, lng]);

  // Show the selected pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = null;

    if (hasLocation) {
      selectedMarkerRef.current = new mapboxgl.Marker({
        element: createPawElement(true),
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 22 }).setText(markerLabel))
        .addTo(map);
    }
  }, [lat, lng, markerLabel]);

  // Show a paw marker for each report that has a location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    reportMarkersRef.current.forEach((marker) => marker.remove());
    reportMarkersRef.current = reports
      .filter((report) => report.location?.lat != null && report.location?.lng != null)
      .map((report) => {
        // Build the popup with textContent, not innerHTML, so report text can't inject HTML.
        const popupBody = document.createElement('div');
        popupBody.className = 'map-popup';

        const title = document.createElement('strong');
        title.textContent = `${report.animalType} · ${report.priority}`;

        const address = document.createElement('small');
        address.textContent = report.location.address || 'Location pin';

        popupBody.append(title, address);

        return new mapboxgl.Marker({ element: createPawElement(false), anchor: 'bottom' })
          .setLngLat([Number(report.location.lng), Number(report.location.lat)])
          .setPopup(new mapboxgl.Popup({ offset: 22 }).setDOMContent(popupBody))
          .addTo(map);
      });
  }, [reports]);

  return (
    <div className="map-frame" aria-label={`Mapbox ${markerLabel.toLowerCase()} map`}>
      {onSelect && <span className="map-help">Click the map to drop a location pin</span>}
      {onSelect && <LocationSearch onPick={onSelect} />}
      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}