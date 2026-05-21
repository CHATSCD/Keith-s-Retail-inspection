import { useState } from 'react';
import { SECTIONS } from '../inspectionData';
import { saveInspection } from '../supabase';

export default function Summary({
  sessionId, storeNumber, date, answers, textFields, photos,
  comments, signature, score, onBack, onReset,
}) {
  const { total, correct, pct, grade } = score;
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [savedId, setSavedId] = useState(null);

  const gradeColor =
    grade === 100 ? 'text-green-600' :
    grade === 90  ? 'text-blue-600'  :
    grade === 80  ? 'text-yellow-600': 'text-red-600';

  const gradeBg =
    grade === 100 ? 'bg-green-50 border-green-200' :
    grade === 90  ? 'bg-blue-50 border-blue-200'   :
    grade === 80  ? 'bg-yellow-50 border-yellow-200': 'bg-red-50 border-red-200';

  const failedItems = SECTIONS.flatMap(sec =>
    sec.items
      .filter(item => answers[item.id] === 'no')
      .map(item => ({ ...item, sectionTitle: sec.title }))
  );

  const unanswered = SECTIONS.flatMap(sec =>
    sec.items
      .filter(item => answers[item.id] === undefined)
      .map(item => ({ ...item, sectionTitle: sec.title }))
  );

  // Flatten photos to url-only map for saving
  const photoUrls = Object.fromEntries(
    Object.entries(photos)
      .filter(([, v]) => v && !v.uploading && !v.error)
      .map(([k, v]) => [k, v.url])
  );

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const id = await saveInspection({
        storeNumber,
        date,
        signature,
        comments,
        score,
        answers,
        textFields,
        photos: photoUrls,
      });
      setSavedId(id);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 no-print">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="text-blue-100 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-base font-bold">Inspection Summary</h1>
          <button
            onClick={() => window.print()}
            className="text-sm bg-white text-blue-600 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50"
          >
            Print
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Score Card */}
        <div className={`rounded-xl border-2 p-5 text-center ${gradeBg}`}>
          <div className="text-sm text-gray-600 mb-1">
            Store #{storeNumber || '—'}&nbsp;&nbsp;|&nbsp;&nbsp;{date}
          </div>
          <div className={`text-6xl font-black ${gradeColor}`}>{grade}%</div>
          <div className="text-gray-500 text-sm mt-1">
            {correct} / {total} correct ({pct.toFixed(1)}%)
          </div>
          <div className="text-xs text-gray-400 mt-2">
            95–100% = 100%&nbsp;&nbsp;|&nbsp;&nbsp;90–94% = 90%&nbsp;&nbsp;|&nbsp;&nbsp;85–89% = 80%&nbsp;&nbsp;|&nbsp;&nbsp;&lt;85% = 0%
          </div>
        </div>

        {/* Save to Supabase */}
        <div className="bg-white rounded-xl shadow-sm p-4 no-print">
          {saveStatus === 'saved' ? (
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-sm">Saved to database</div>
                <div className="text-xs text-green-600 font-mono">{savedId}</div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                saveStatus === 'error'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-60`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Saving…
                </>
              ) : saveStatus === 'error' ? (
                'Retry Save'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Save to Database
                </>
              )}
            </button>
          )}
          {saveStatus === 'error' && (
            <p className="text-xs text-red-500 mt-1 text-center">Save failed — check connection and retry</p>
          )}
        </div>

        {/* Section Breakdown */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Section Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {SECTIONS.map(sec => {
              const secTotal = sec.items.length;
              const secCorrect = sec.items.filter(i => answers[i.id] === 'yes').length;
              const secNo = sec.items.filter(i => answers[i.id] === 'no').length;
              const secPct = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;
              return (
                <div key={sec.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{sec.title}</div>
                    {secNo > 0 && (
                      <div className="text-xs text-red-500">{secNo} failed</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">{secCorrect}/{secTotal}</div>
                    <div className={`text-sm font-bold ${secPct === 100 ? 'text-green-600' : secPct >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {secPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Failed Items with Photos */}
        {failedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
              <h2 className="font-bold text-red-800 text-sm">Failed Items ({failedItems.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {failedItems.map(item => {
                const photo = photos[item.id];
                return (
                  <div key={item.id} className="px-4 py-2.5 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-red-500 font-medium">{item.sectionTitle}</div>
                      <div className="text-sm text-gray-800">
                        {item.critical && <span className="text-amber-600 font-semibold mr-0.5">*</span>}
                        {item.text}
                        {item.hasTextField && textFields[item.id] && (
                          <span className="text-gray-500"> — {textFields[item.id]}</span>
                        )}
                      </div>
                    </div>
                    {photo && !photo.uploading && (
                      <img
                        src={photo.url}
                        alt="Issue photo"
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unanswered */}
        {unanswered.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-yellow-50">
              <h2 className="font-bold text-yellow-800 text-sm">Unanswered ({unanswered.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {unanswered.map(item => (
                <div key={item.id} className="px-4 py-2.5">
                  <div className="text-xs text-yellow-600 font-medium">{item.sectionTitle}</div>
                  <div className="text-sm text-gray-500">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments & Signature */}
        {(comments || signature) && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {comments && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Comments</div>
                <p className="text-sm text-gray-700">{comments}</p>
              </div>
            )}
            {signature && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signature</div>
                <p className="text-sm text-gray-800 font-medium border-b border-gray-300 pb-1 italic">{signature}</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-3 no-print">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-colors"
          >
            Print / PDF
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            New
          </button>
        </div>
      </div>
    </div>
  );
}
