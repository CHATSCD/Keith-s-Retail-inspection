import { useState, useEffect } from 'react';
import { fetchAllInspections, deleteInspection, fetchStores, upsertStore, deleteStore, geocodeAddress } from '../supabase';
import InspectionViewer from './InspectionViewer';

const ADMIN_PASSWORD = 'keithsdm';

function gradeColor(g) {
  if (g === 100) return 'text-green-600 bg-green-50 border-green-200';
  if (g === 90)  return 'text-brand-600 bg-brand-50 border-brand-200';
  if (g === 80)  return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function StoresTab() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ store_number: '', name: '', address: '', dm_name: '' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchStores().then(setStores).finally(() => setLoading(false));
  }, []);

  function startEdit(s) {
    setEditing(s.id);
    setForm({ store_number: s.store_number, name: s.name || '', address: s.address || '', dm_name: s.dm_name || '' });
    setGeoError('');
  }

  function cancelEdit() { setEditing(null); setForm({ store_number: '', name: '', address: '', dm_name: '' }); setGeoError(''); }

  async function handleGeocode() {
    if (!form.address.trim()) return;
    setGeocoding(true); setGeoError('');
    try {
      const { lat, lng } = await geocodeAddress(form.address);
      const row = { id: editing || undefined, ...form, lat, lng };
      setSaving(true);
      await upsertStore(row);
      const updated = await fetchStores();
      setStores(updated);
      cancelEdit();
    } catch (e) {
      setGeoError(e.message || 'Could not find address');
    } finally {
      setGeocoding(false); setSaving(false);
    }
  }

  async function handleSaveNoGeo() {
    setSaving(true);
    try {
      await upsertStore({ id: editing || undefined, ...form, lat: null, lng: null });
      const updated = await fetchStores();
      setStores(updated);
      cancelEdit();
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this store?')) return;
    setDeleting(id);
    await deleteStore(id);
    setStores(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      {/* Add / Edit form */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {editing ? 'Edit Store' : 'Add Store'}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Store #</label>
              <input value={form.store_number} onChange={e => setForm(f => ({ ...f, store_number: e.target.value }))}
                placeholder="1234"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">DM Name</label>
              <input value={form.dm_name} onChange={e => setForm(f => ({ ...f, dm_name: e.target.value }))}
                placeholder="Kim"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name (optional)</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Downtown"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input value={form.address} onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setGeoError(''); }}
              placeholder="123 Main St, City, LA 70000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          {geoError && <p className="text-xs text-red-500">{geoError} — try a more specific address</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={handleGeocode}
              disabled={!form.store_number.trim() || !form.address.trim() || geocoding || saving}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-40 transition-colors">
              {geocoding ? 'Finding location…' : saving ? 'Saving…' : 'Save & Place on Map'}
            </button>
            <button onClick={handleSaveNoGeo}
              disabled={!form.store_number.trim() || saving}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              Save without map
            </button>
            {editing && (
              <button onClick={cancelEdit} className="px-3 py-2 text-xs text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Store list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <svg className="w-6 h-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">No stores yet — add one above</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {stores.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">Store #{s.store_number}{s.name ? ` — ${s.name}` : ''}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {s.dm_name && <span className="text-brand-600 font-medium mr-1">DM: {s.dm_name} ·</span>}
                    {s.address || <span className="italic">No address</span>}
                    {s.lat && s.lng ? <span className="text-green-600 ml-1">📍</span> : ''}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(s)}
                    className="text-xs bg-gray-50 text-gray-600 border border-gray-200 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-gray-100">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                    className="text-xs bg-red-50 text-red-600 border border-red-200 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50">
                    {deleting === s.id ? '…' : 'Del'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage({ onHome }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState('inspections');

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterStore, setFilterStore] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo]     = useState('');

  const [viewId, setViewId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  function login(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchAllInspections()
      .then(setInspections)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authed]);

  if (viewId) {
    return <InspectionViewer inspectionId={viewId} onHome={() => setViewId(null)} />;
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-brand-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <img src="/logo.png" alt="Keith's Superstores" className="h-16 object-contain mx-auto mb-6" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Admin Access</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the admin password to continue</p>
          <form onSubmit={login} className="space-y-3">
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError(false); }}
              placeholder="Password"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                pwError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              autoFocus
            />
            {pwError && <p className="text-xs text-red-500">Incorrect password</p>}
            <button
              type="submit"
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Sign In
            </button>
          </form>
          <button onClick={onHome} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Filtering ──
  const filtered = inspections.filter(r => {
    if (filterStore && !(r.store_number || '').toLowerCase().includes(filterStore.toLowerCase())) return false;
    if (filterGrade !== 'all' && r.score_grade !== Number(filterGrade)) return false;
    if (filterFrom && r.date < filterFrom) return false;
    if (filterTo   && r.date > filterTo)   return false;
    return true;
  });

  // ── Stats ──
  const totalCount  = filtered.length;
  const avgGrade    = totalCount > 0 ? Math.round(filtered.reduce((s, r) => s + (r.score_grade || 0), 0) / totalCount) : 0;
  const avgPct      = totalCount > 0 ? (filtered.reduce((s, r) => s + Number(r.score_pct || 0), 0) / totalCount).toFixed(1) : '0.0';
  const uniqueStores = new Set(filtered.map(r => r.store_number).filter(Boolean)).size;

  async function handleDelete(id) {
    if (!window.confirm('Delete this inspection? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteInspection(id);
      setInspections(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {/* Header */}
      <div className="bg-brand-500 text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={onHome} className="text-brand-100 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
          <img src="/logo.png" alt="Keith's Superstores" className="h-8 object-contain" />
          <span className="text-sm font-bold bg-white text-brand-700 px-3 py-1 rounded-lg">Admin</span>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto flex gap-1 mt-3">
          {[['inspections', 'Inspections'], ['stores', 'Stores']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === id ? 'bg-white text-brand-700' : 'text-brand-100 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {tab === 'stores' && <StoresTab />}

        {tab === 'inspections' && <>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Inspections', value: totalCount },
            { label: 'Avg Grade',         value: totalCount ? `${avgGrade}%` : '—' },
            { label: 'Stores Visited',    value: uniqueStores },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-black text-brand-600">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filters</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Store #</label>
              <input
                type="text"
                value={filterStore}
                onChange={e => setFilterStore(e.target.value)}
                placeholder="Any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Grade</label>
              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All</option>
                <option value="100">100%</option>
                <option value="90">90%</option>
                <option value="80">80%</option>
                <option value="0">0%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          {(filterStore || filterGrade !== 'all' || filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterStore(''); setFilterGrade('all'); setFilterFrom(''); setFilterTo(''); }}
              className="mt-3 text-xs text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">
              Inspections {totalCount > 0 && <span className="text-gray-400 font-normal">({totalCount})</span>}
            </h2>
            <div className="text-xs text-gray-400">Avg actual: {avgPct}%</div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
          )}

          {error && (
            <div className="px-4 py-6 text-center text-red-600 text-sm">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-gray-400 text-sm">No inspections found</div>
          )}

          <div className="divide-y divide-gray-50">
            {filtered.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                {/* Grade badge */}
                <div className={`text-sm font-black w-14 text-center py-1 rounded-lg border ${gradeColor(r.score_grade)} flex-shrink-0`}>
                  {r.score_grade}%
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      Store #{r.store_number || '—'}
                    </span>
                    <span className="text-xs text-gray-400">{r.date || '—'}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {r.inspector_signature ? `Inspector: ${r.inspector_signature}` : 'No signature'}
                    {' · '}
                    {r.correct_count}/{r.total_count} ({Number(r.score_pct).toFixed(1)}%)
                  </div>
                  {r.comments && (
                    <div className="text-xs text-gray-400 truncate mt-0.5 italic">"{r.comments}"</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewId(r.id)}
                    className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                  >
                    {deleting === r.id ? '…' : 'Del'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        </>}

      </div>
    </div>
  );
}
