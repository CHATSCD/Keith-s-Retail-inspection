import { useState, useEffect } from 'react';
import { SECTIONS, calcScore } from './inspectionData';
import InspectionForm from './components/InspectionForm';
import Summary from './components/Summary';
import Header from './components/Header';
import './index.css';

const STORAGE_KEY = 'keithsRetailInspection';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [view, setView] = useState('home');
  const [storeNumber, setStoreNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [answers, setAnswers] = useState({});
  const [textFields, setTextFields] = useState({});
  const [comments, setComments] = useState('');
  const [signature, setSignature] = useState('');
  const [activeSection, setActiveSection] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) setHasSaved(true);
  }, []);

  function startNew() {
    setAnswers({});
    setTextFields({});
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
    setStoreNumber(saved.storeNumber || '');
    setDate(saved.date || new Date().toISOString().split('T')[0]);
    setAnswers(saved.answers || {});
    setTextFields(saved.textFields || {});
    setComments(saved.comments || '');
    setSignature(saved.signature || '');
    setActiveSection(saved.activeSection || 0);
    setView('form');
  }

  function persist(newAnswers, newTextFields, newComments, newSignature, section) {
    const data = {
      storeNumber,
      date,
      answers: newAnswers,
      textFields: newTextFields,
      comments: newComments,
      signature: newSignature,
      activeSection: section,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setHasSaved(true);
  }

  function handleAnswer(itemId, value) {
    const next = { ...answers, [itemId]: value };
    setAnswers(next);
    persist(next, textFields, comments, signature, activeSection);
  }

  function handleTextField(itemId, value) {
    const next = { ...textFields, [itemId]: value };
    setTextFields(next);
    persist(answers, next, comments, signature, activeSection);
  }

  function handleComments(val) {
    setComments(val);
    persist(answers, textFields, val, signature, activeSection);
  }

  function handleSignature(val) {
    setSignature(val);
    persist(answers, textFields, comments, val, activeSection);
  }

  function handleSectionChange(idx) {
    setActiveSection(idx);
    persist(answers, textFields, comments, signature, idx);
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setHasSaved(false);
    setView('home');
  }

  const score = calcScore(answers);

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

  if (view === 'summary') {
    return (
      <Summary
        storeNumber={storeNumber}
        date={date}
        answers={answers}
        textFields={textFields}
        comments={comments}
        signature={signature}
        score={score}
        onBack={() => setView('form')}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        storeNumber={storeNumber}
        setStoreNumber={setStoreNumber}
        date={date}
        setDate={setDate}
        score={score}
        onHome={() => setView('home')}
        onFinish={() => setView('summary')}
      />
      <InspectionForm
        sections={SECTIONS}
        answers={answers}
        textFields={textFields}
        comments={comments}
        signature={signature}
        activeSection={activeSection}
        onAnswer={handleAnswer}
        onTextField={handleTextField}
        onComments={handleComments}
        onSignature={handleSignature}
        onSectionChange={handleSectionChange}
        onFinish={() => setView('summary')}
      />
    </div>
  );
}
