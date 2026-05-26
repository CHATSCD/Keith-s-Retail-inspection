import { useState, useEffect } from 'react';
import { SECTIONS, calcScore } from './inspectionData';
import InspectionForm from './components/InspectionForm';
import Summary from './components/Summary';
import Header from './components/Header';
import InspectionViewer from './components/InspectionViewer';
import AdminPage from './components/AdminPage';
import MapPage from './components/MapPage';
import './index.css';

const STORAGE_KEY = 'keithsRetailInspection';

function newSessionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getViewId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') || null;
}

function isAdminUrl() {
  return new URLSearchParams(window.location.search).has('admin');
}

export default function App() {
  const viewId = getViewId();

  const [view, setView] = useState(
    isAdminUrl() ? 'admin' : viewId ? 'viewer' : 'home'
  );
  const [sessionId, setSessionId] = useState('');
  const [storeNumber, setStoreNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [answers, setAnswers] = useState({});
  const [textFields, setTextFields] = useState({});
  const [photos, setPhotos] = useState({});
  const [comments, setComments] = useState('');
  const [signature, setSignature] = useState('');
  const [staffing, setStaffing] = useState({ managerOnDuty: '', employeesOnShift: '' });
  const [activeSection, setActiveSection] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) setHasSaved(true);
  }, []);

  function goHome() {
    // Clear ?view= param from URL without reload
    const url = new URL(window.location);
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url);
    setView('home');
  }

  function startNew() {
    const id = newSessionId();
    setSessionId(id);
    setAnswers({});
    setTextFields({});
    setPhotos({});
    setComments('');
    setSignature('');
    setStaffing({ managerOnDuty: '', employeesOnShift: '' });
    setStoreNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setActiveSection(0);
    setView('form');
  }

  function resumeSaved() {
    const saved = loadSaved();
    if (!saved) return;
    setSessionId(saved.sessionId || newSessionId());
    setStoreNumber(saved.storeNumber || '');
    setDate(saved.date || new Date().toISOString().split('T')[0]);
    setAnswers(saved.answers || {});
    setTextFields(saved.textFields || {});
    setPhotos(saved.photos || {});
    setComments(saved.comments || '');
    setSignature(saved.signature || '');
    setStaffing(saved.staffing || { managerOnDuty: '', employeesOnShift: '' });
    setActiveSection(saved.activeSection || 0);
    setView('form');
  }

  function persist(updates = {}) {
    const data = {
      sessionId,
      storeNumber,
      date,
      answers,
      textFields,
      photos,
      comments,
      signature,
      staffing,
      activeSection,
      ...updates,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setHasSaved(true);
  }

  function handleAnswer(itemId, value) {
    const next = { ...answers, [itemId]: value };
    setAnswers(next);
    if (value !== 'no' && photos[itemId]) {
      const nextPhotos = { ...photos };
      delete nextPhotos[itemId];
      setPhotos(nextPhotos);
      persist({ answers: next, photos: nextPhotos });
    } else {
      persist({ answers: next });
    }
  }

  function handleTextField(itemId, value) {
    const next = { ...textFields, [itemId]: value };
    setTextFields(next);
    persist({ textFields: next });
  }

  function handlePhoto(itemId, photoData) {
    const next = { ...photos, [itemId]: photoData };
    setPhotos(next);
    persist({ photos: next });
  }

  function handleRemovePhoto(itemId) {
    const next = { ...photos };
    delete next[itemId];
    setPhotos(next);
    persist({ photos: next });
  }

  function handleComments(val) {
    setComments(val);
    persist({ comments: val });
  }

  function handleSignature(val) {
    setSignature(val);
    persist({ signature: val });
  }

  function handleStaffing(field, val) {
    const next = { ...staffing, [field]: val };
    setStaffing(next);
    persist({ staffing: next });
  }

  function handleSectionChange(idx) {
    setActiveSection(idx);
    persist({ activeSection: idx });
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setHasSaved(false);
    goHome();
  }

  const score = calcScore(answers);

  if (view === 'admin') return <AdminPage onHome={goHome} />;
  if (view === 'map')   return <MapPage onHome={goHome} />;

  // ── Shared-link viewer ──
  if (view === 'viewer') {
    return <InspectionViewer inspectionId={viewId} onHome={goHome} />;
  }

  // ── Home screen ──
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-brand-500 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <img src="/logo.png" alt="Keith's Superstores" className="h-20 object-contain mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">DM Store Inspection</h1>
            <p className="text-gray-500 mt-1 text-sm">District Manager Checklist</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={startNew}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Start New Inspection
            </button>
            {hasSaved && (
              <button
                onClick={resumeSaved}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Resume Saved Inspection
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-6">
            95–100% = 100%&nbsp;&nbsp;|&nbsp;&nbsp;90–94% = 90%&nbsp;&nbsp;|&nbsp;&nbsp;85–89% = 80%&nbsp;&nbsp;|&nbsp;&nbsp;&lt;85% = 0%
          </p>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setView('map')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              Route Map
            </button>
            <button
              onClick={() => setView('admin')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Panel
            </button>
          </div>

          <p className="text-xs text-gray-300 mt-5 leading-relaxed">
            Licensed to Keith's Superstores
            <br />
            © 2026 S.C.D. All Rights Reserved
          </p>
        </div>
      </div>
    );
  }

  // ── Summary ──
  if (view === 'summary') {
    return (
      <Summary
        sessionId={sessionId}
        storeNumber={storeNumber}
        date={date}
        answers={answers}
        textFields={textFields}
        photos={photos}
        comments={comments}
        signature={signature}
        staffing={staffing}
        score={score}
        onBack={() => setView('form')}
        onReset={handleReset}
      />
    );
  }

  // ── Inspection Form ──
  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        storeNumber={storeNumber}
        setStoreNumber={setStoreNumber}
        date={date}
        setDate={setDate}
        score={score}
        onHome={goHome}
        onFinish={() => setView('summary')}
      />
      <InspectionForm
        sections={SECTIONS}
        answers={answers}
        textFields={textFields}
        photos={photos}
        comments={comments}
        signature={signature}
        staffing={staffing}
        activeSection={activeSection}
        sessionId={sessionId}
        onAnswer={handleAnswer}
        onTextField={handleTextField}
        onPhoto={handlePhoto}
        onRemovePhoto={handleRemovePhoto}
        onComments={handleComments}
        onSignature={handleSignature}
        onStaffing={handleStaffing}
        onSectionChange={handleSectionChange}
        onFinish={() => setView('summary')}
        onHome={goHome}
      />
    </div>
  );
}
