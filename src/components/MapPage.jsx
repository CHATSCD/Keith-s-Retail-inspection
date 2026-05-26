import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchStores } from '../supabase';

// Fix leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(label, selected) {
  return L.divIcon({
    className: '',
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    html: `
      <div style="position:relative;width:36px;text-align:center">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
            fill="${selected ? '#0099ff' : '#374151'}" />
          <circle cx="18" cy="18" r="10" fill="white"/>
        </svg>
        <div style="position:absolute;top:10px;left:0;right:0;text-align:center;
          font-size:9px;font-weight:800;color:${selected ? '#0099ff' : '#374151'};
          font-family:sans-serif;line-height:1">${label}</div>
      </div>`,
  });
}

function FitBounds({ stores }) {
  const map = useMap();
  useEffect(() => {
    const pts = stores.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
    if (pts.length === 1) { map.setView(pts[0], 13); }
    else if (pts.length > 1) { map.fitBounds(pts, { padding: [40, 40] }); }
  }, [stores, map]);
  return null;
}

// Nearest-neighbor TSP approximation starting from a given point
function optimizeRoute(start, stores) {
  const unvisited = [...stores];
  const route = [];
  let current = start;
  while (unvisited.length) {
    let best = 0;
    let bestDist = Infinity;
    unvisited.forEach((s, i) => {
      const d = Math.hypot(s.lat - current[0], s.lng - current[1]);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    route.push(unvisited[best]);
    current = [unvisited[best].lat, unvisited[best].lng];
    unvisited.splice(best, 1);
  }
  return route;
}

export default function MapPage({ onHome }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [route, setRoute] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchStores()
      .then(setStores)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const mappable = stores.filter(s => s.lat && s.lng);
  const unmapped  = stores.filter(s => !s.lat || !s.lng);
  const center = mappable.length ? [mappable[0].lat, mappable[0].lng] : [30.5, -91.1];

  function toggleStore(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setRoute([]);
  }

  function selectAll() {
    setSelected(new Set(mappable.map(s => s.id)));
    setRoute([]);
  }

  function clearAll() {
    setSelected(new Set());
    setRoute([]);
  }

  const getLocation = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setLocating(false); },
      ()  => { setLocating(false); },
      { timeout: 8000 }
    );
  }, []);

  function buildRoute() {
    const toVisit = mappable.filter(s => selected.has(s.id));
    if (!toVisit.length) return;
    const start = userPos || [toVisit[0].lat, toVisit[0].lng];
    setRoute(optimizeRoute(start, toVisit));
  }

  function openInMaps() {
    if (!route.length) return;
    const waypoints = route.map(s => `${s.lat},${s.lng}`).join('/');
    const origin = userPos ? `${userPos[0]},${userPos[1]}` : `${route[0].lat},${route[0].lng}`;
    window.open(`https://www.google.com/maps/dir/${origin}/${waypoints}`, '_blank');
  }

  const routeIds = new Set(route.map(s => s.id));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-brand-500 text-white px-4 py-3 shadow-md flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={onHome} className="text-brand-100 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
          <img src="/logo.png" alt="Keith's Superstores" className="h-8 object-contain" />
          <span className="text-sm font-bold">Route Planner</span>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && stores.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No stores added yet</p>
          <p className="text-gray-400 text-sm mt-1">Go to Admin → Stores to add store locations</p>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">

          {/* Map */}
          <div className="h-64 sm:h-80 flex-shrink-0">
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />
              <FitBounds stores={mappable} />
              {mappable.map((s, i) => {
                const routeIdx = route.findIndex(r => r.id === s.id);
                const label = routeIdx >= 0 ? String(routeIdx + 1) : `#${s.store_number}`;
                return (
                  <Marker key={s.id} position={[s.lat, s.lng]}
                    icon={makeIcon(label, selected.has(s.id))}
                    eventHandlers={{ click: () => toggleStore(s.id) }}>
                    <Popup>
                      <div className="text-sm font-semibold">Store #{s.store_number}</div>
                      {s.name && <div className="text-xs text-gray-600">{s.name}</div>}
                      {s.address && <div className="text-xs text-gray-500 mt-0.5">{s.address}</div>}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Controls */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* Action bar */}
            <div className="bg-white rounded-xl shadow-sm p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={selectAll}
                  className="text-xs bg-brand-50 text-brand-700 border border-brand-200 font-semibold px-3 py-1.5 rounded-lg">
                  Select All
                </button>
                <button onClick={clearAll}
                  className="text-xs bg-gray-50 text-gray-600 border border-gray-200 font-semibold px-3 py-1.5 rounded-lg">
                  Clear
                </button>
                <button onClick={getLocation} disabled={locating}
                  className="text-xs bg-gray-50 text-gray-600 border border-gray-200 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  {locating ? 'Locating…' : userPos ? 'Location ✓' : 'My Location'}
                </button>
                <div className="flex-1" />
                <button onClick={buildRoute} disabled={selected.size === 0}
                  className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-40">
                  Optimize Route
                </button>
              </div>
              {selected.size > 0 && (
                <p className="text-xs text-gray-400 mt-2">{selected.size} store{selected.size > 1 ? 's' : ''} selected — tap map pins or list below</p>
              )}
            </div>

            {/* Optimized route */}
            {route.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-brand-50 flex items-center justify-between">
                  <h2 className="font-bold text-brand-800 text-sm">Optimized Route ({route.length} stops)</h2>
                  <button onClick={openInMaps}
                    className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    Google Maps
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {route.map((s, i) => (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          Store #{s.store_number}{s.name ? ` — ${s.name}` : ''}
                        </div>
                        {s.address && <div className="text-xs text-gray-400 truncate">{s.address}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store list */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900 text-sm">All Stores</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {mappable.map(s => (
                  <button key={s.id} onClick={() => toggleStore(s.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      selected.has(s.id) ? 'bg-brand-50' : 'hover:bg-gray-50'
                    }`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected.has(s.id) ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                    }`}>
                      {selected.has(s.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">
                        Store #{s.store_number}{s.name ? ` — ${s.name}` : ''}
                      </div>
                      {s.address && <div className="text-xs text-gray-400 truncate">{s.address}</div>}
                    </div>
                    {routeIds.has(s.id) && (
                      <span className="text-xs bg-brand-500 text-white font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        #{route.findIndex(r => r.id === s.id) + 1}
                      </span>
                    )}
                  </button>
                ))}
                {unmapped.map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-3 opacity-50">
                    <div className="w-5 h-5 rounded border-2 border-gray-200 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-500">
                        Store #{s.store_number}{s.name ? ` — ${s.name}` : ''}
                      </div>
                      <div className="text-xs text-gray-400">No address — add in Admin</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
