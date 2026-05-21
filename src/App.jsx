import { useState, useEffect } from 'react';
import { SECTIONS, calcScore } from './inspectionData';
import InspectionForm from './components/InspectionForm';
import Summary from './components/Summary';
import Header from './components/Header';
import InspectionViewer from './components/InspectionViewer';
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

export default function App() {
  const viewId = getViewId();

  const [view, setView] = useState(viewId ? 'viewer' : 'home');
  const [sessionId, setSessionId] = useState('');
  const [storeNumber, setStoreNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [answers, setAnswers] = useState({});
  const [textFields, setTextFields] = useState({});
  const [photos, setPhotos] = useState({});
  const [comments, setComments] = useState('');
  const [signature, setSignature] = useState('');
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

  // ── Shared-link viewer ──
  if (view === 'viewer') {
    return <InspectionViewer inspectionId={viewId} onHome={goHome} />;
  }

  // ── Home screen ──
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Keith's Store Inspection</h1>
            <p className="text-gray-500 mt-1 text-sm">DM Store Inspection Checklist</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={startNew}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
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
        activeSection={activeSection}
        sessionId={sessionId}
        onAnswer={handleAnswer}
        onTextField={handleTextField}
        onPhoto={handlePhoto}
        onRemovePhoto={handleRemovePhoto}
        onComments={handleComments}
        onSignature={handleSignature}
        onSectionChange={handleSectionChange}
        onFinish={() => setView('summary')}
        onHome={goHome}
      />
    </div>
  );
}
