'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';

const DEFAULT_CENTER = { lat: 24.8607, lng: 67.0011 };

/**
 * Same pattern as add restaurant: Leaflet + OpenStreetMap tiles + Nominatim search,
 * draggable marker, click map to place. User picks lat/lng visually (no typing).
 */
export default function LeafletPinPicker({
  title,
  committed,
  suggestedCenter = DEFAULT_CENTER,
  searchSeed = '',
  onCommit,
  disabled = false,
  minHeightClass = 'min-h-[180px]',
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);
  const mapSearchDebounceRef = useRef(null);
  const suppressSearchDebounceRef = useRef(false);

  const [mapSearch, setMapSearch] = useState(searchSeed);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapResults, setMapResults] = useState([]);

  useEffect(() => {
    if (searchSeed && !mapSearch) setMapSearch(searchSeed);
  }, [searchSeed, mapSearch]);

  const markerPosition = committed || suggestedCenter;
  const lat = Number(markerPosition.lat);
  const lng = Number(markerPosition.lng);

  const handleMapLookup = useCallback(async (query) => {
    const q = String(query || '').trim();
    if (!q) return;
    setMapLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`
      );
      const data = await response.json();
      setMapResults(Array.isArray(data) ? data : []);
    } catch {
      setMapResults([]);
    } finally {
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    const query = mapSearch.trim();
    if (suppressSearchDebounceRef.current) {
      suppressSearchDebounceRef.current = false;
      return;
    }
    if (mapSearchDebounceRef.current) clearTimeout(mapSearchDebounceRef.current);
    if (query.length < 3) {
      setMapResults([]);
      return;
    }
    mapSearchDebounceRef.current = setTimeout(() => {
      handleMapLookup(query);
    }, 450);
    return () => {
      if (mapSearchDebounceRef.current) clearTimeout(mapSearchDebounceRef.current);
    };
  }, [mapSearch, handleMapLookup]);

  const applyLatLng = useCallback(
    async (nextLat, nextLng, { updateSearch = true } = {}) => {
      const safeLat = Number(nextLat);
      const safeLng = Number(nextLng);
      if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return;
      onCommit?.(safeLat, safeLng);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${safeLat}&lon=${safeLng}`
        );
        const reverse = await response.json();
        const displayName = typeof reverse?.display_name === 'string' ? reverse.display_name : '';
        if (updateSearch && displayName) {
          suppressSearchDebounceRef.current = true;
          setMapSearch(displayName);
        }
      } catch {
        // keep coords
      }
    },
    [onCommit]
  );

  const applyLatLngRef = useRef(applyLatLng);
  applyLatLngRef.current = applyLatLng;

  const selectSearchResult = useCallback(
    (item) => {
      const nlat = Number(item?.lat);
      const nlng = Number(item?.lon);
      const displayName = typeof item?.display_name === 'string' ? item.display_name : '';
      if (!Number.isFinite(nlat) || !Number.isFinite(nlng)) return;
      suppressSearchDebounceRef.current = true;
      if (displayName) setMapSearch(displayName);
      setMapResults([]);
      const marker = leafletMarkerRef.current;
      const map = leafletMapRef.current;
      if (marker && map) {
        marker.setLatLng([nlat, nlng]);
        map.setView([nlat, nlng], 15, { animate: false });
      }
      void applyLatLng(nlat, nlng, { updateSearch: false });
    },
    [applyLatLng]
  );

  useEffect(() => {
    let disposed = false;

    const loadLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      if (!document.getElementById('leaflet-css')) {
        const css = document.createElement('link');
        css.id = 'leaflet-css';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (disposed || leafletMapRef.current || !window.L || !mapContainerRef.current) return;

      const ilat = Number.isFinite(lat) ? lat : DEFAULT_CENTER.lat;
      const ilng = Number.isFinite(lng) ? lng : DEFAULT_CENTER.lng;
      const map = window.L.map(mapContainerRef.current, { zoomControl: true }).setView([ilat, ilng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = window.L.marker([ilat, ilng], { draggable: !disabled }).addTo(map);
      if (!disabled) {
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          void applyLatLngRef.current(position.lat, position.lng, { updateSearch: true });
        });
        map.on('click', (event) => {
          const { lat: la, lng: ln } = event.latlng;
          marker.setLatLng([la, ln]);
          void applyLatLngRef.current(la, ln, { updateSearch: true });
        });
      }

      leafletMapRef.current = map;
      leafletMarkerRef.current = marker;
    };

    loadLeaflet();

    return () => {
      disposed = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
    };
  }, [disabled]);

  useEffect(() => {
    const map = leafletMapRef.current;
    const marker = leafletMarkerRef.current;
    if (!map || !marker) return;
    const nlat = Number.isFinite(lat) ? lat : DEFAULT_CENTER.lat;
    const nlng = Number.isFinite(lng) ? lng : DEFAULT_CENTER.lng;
    marker.setLatLng([nlat, nlng]);
    if (disabled) return;
    map.setView([nlat, nlng], map.getZoom(), { animate: false });
  }, [lat, lng, disabled]);

  useEffect(() => {
    const marker = leafletMarkerRef.current;
    if (!marker) return;
    if (disabled) {
      marker.dragging?.disable();
    } else {
      marker.dragging?.enable();
    }
  }, [disabled]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2">
        <MapPin className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
        <span className="text-xs font-semibold text-[#1E1E24]">{title}</span>
        {committed ? (
          <span className="ml-auto font-mono text-[10px] text-emerald-700">
            {Number(committed.lat).toFixed(5)}, {Number(committed.lng).toFixed(5)}
          </span>
        ) : (
          <span className="ml-auto text-[10px] font-medium text-amber-700">Tap map or search</span>
        )}
      </div>
      <div className="space-y-2 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            disabled={disabled}
            placeholder="Search area (same as add restaurant)…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50/80 py-2 pl-8 pr-2 text-xs outline-none focus:border-violet-400 focus:bg-white disabled:opacity-50"
          />
          {mapLoading ? (
            <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-violet-600" />
          ) : null}
        </div>
        {mapResults.length > 0 ? (
          <ul className="max-h-28 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 text-[11px]">
            {mapResults.map((item, idx) => (
              <li key={`${item?.osm_id ?? idx}-${item?.lat}`}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => selectSearchResult(item)}
                  className="w-full px-2 py-1.5 text-left hover:bg-violet-50 disabled:opacity-50"
                >
                  {typeof item?.display_name === 'string' ? item.display_name : 'Result'}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div
          ref={mapContainerRef}
          className={`z-0 w-full overflow-hidden rounded-lg border border-gray-200 ${minHeightClass}`}
        />
        <p className="text-[10px] leading-snug text-gray-500">
          Fine-tune by dragging the pin or searching — pins are filled from the order addresses when you open this
          dialog.
        </p>
      </div>
    </div>
  );
}
