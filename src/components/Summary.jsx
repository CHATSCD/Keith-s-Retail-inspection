import { useState, useEffect } from 'react';
import { SECTIONS } from '../inspectionData';
import { saveInspection } from '../supabase';

export default function Summary({
  sessionId, storeNumber, date, answers, textFields, photos,
  comments, signature, score, onBack, onReset,
}) {
  const { total, correct, pct, grade } = score;
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [savedId, setSavedId] = useState(null);
  const [shareStatus, setShareStatus] = useState('idle'); // idle | copied | shared

  const gradeColor =
    grade === 100 ? 'text-green-600' :
    grade === 90  ? 'text-blue-600'  :
    grade === 80  ? 'text-yellow-600': 'text-red-600';

  const gradeBg =
    grade === 100 ? 'bg-green-50 border-green-200' :
    grade === 90  ? 'bg-blue-50 border-blue-200'   :
    grade === 80  ? 'bg-yellow-50 border-yellow-200': 'bg-red-50 border-red-200';

  const photoUrls = Object.fromEntries(
    Object.entries(photos)
      .filter(([, v]) => v && !v.uploading && !v.error)
      .map(([k, v]) => [k, v.url])
  );

  const failedItems = SECTIONS.flatMap(sec =>
    sec.items.filter(item => answers[item.id] === 'no')
      .map(item => ({ ...item, sectionTitle: sec.title }))
  );

  const unanswered = SECTIONS.flatMap(sec =>
    sec.items.filter(item => answers[item.id] === undefined)
      .map(item => ({ ...item, sectionTitle: sec.title }))
  );

  // Auto-save when the summary mounts
  useEffect(() => {
    (async () => {
      if (saveStatus !== 'idle') return;
      setSaveStatus('saving');
      try {
        const id = await saveInspection({
          storeNumber, date, signature, comments, score,
          answers, textFields, photos: photoUrls,
        });
        setSavedId(id);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRetrySave() {
    setSaveStatus('saving');
    try {
      const id = await saveInspection({
        storeNumber, date, signature, comments, score,
        answers, textFields, photos: photoUrls,
      });
      setSavedId(id);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  }

  function inspectionLink() {
    return `${window.location.origin}${window.location.pathname}?view=${savedId}`;
  }

  function buildReportText(link) {
    const failedLines = failedItems.map(i =>
      `  • [${i.sectionTitle}] ${i.text}${photoUrls[i.id] ? ' 📷' : ''}`
    ).join('\n');

    return [
      `Keith's Store Inspection Report`,
      `Store #${storeNumber || '—'}  |  Date: ${date}`,
      `Score: ${grade}%  (${correct}/${total} correct, ${pct.toFixed(1)}%)`,
      '',
      failedItems.length > 0
        ? `Failed Items (${failedItems.length}):\n${failedLines}`
        : 'No failed items.',
      '',
      comments ? `Comments: ${comments}` : '',
      signature ? `Inspector: ${signature}` : '',
      '',
      link ? `View full report: ${link}` : '',
    ].filter(l => l !== undefined).join('\n').trim();
  }

  async function handleSendToStore() {
    const link = savedId ? inspectionLink() : null;
    const text = buildReportText(link);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Keith's Store #${storeNumber || '?'} Inspection — ${date}`,
          text,
          ...(link ? { url: link } : {}),
        });
        setShareStatus('shared');
      } catch {
        // User cancelled — no-op
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(link ? `${text}` : text);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 3000);
      } catch {
        setShareStatus('idle');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      {/* Header — title only, no buttons */}
      <div className="bg-blue-600 text-white px-4 py-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-base font-bold">Inspection Summary</h1>
          <p className="text-blue-200 text-xs mt-0.5">
            Store #{storeNumber || '—'}&nbsp;&nbsp;|&nbsp;&nbsp;{date}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Save status banner */}
        <div className={`rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm ${
          saveStatus === 'saved'  ? 'bg-green-50 text-green-700 border border-green-200' :
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700 border border-blue-200'   :
          saveStatus === 'error'  ? 'bg-red-50 text-red-700 border border-red-200'      :
          'bg-gray-50 text-gray-500 border border-gray-200'
        }`}>
          {saveStatus === 'saving' && (
            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          {saveStatus === 'saved' && (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          )}
          {saveStatus === 'error' && (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
          <div className="flex-1 min-w-0">
            {saveStatus === 'saving' && 'Saving to database…'}
            {saveStatus === 'saved'  && (
              <span>Saved — <span className="font-mono text-xs truncate">{savedId}</span></span>
            )}
            {saveStatus === 'error'  && 'Auto-save failed'}
            {saveStatus === 'idle'   && 'Preparing…'}
          </div>
          {saveStatus === 'error' && (
            <button onClick={handleRetrySave}
              className="text-xs font-semibold underline flex-shrink-0">
              Retry
            </button>
          )}
        </div>

        {/* Score Card */}
        <div className={`rounded-xl border-2 p-5 text-center ${gradeBg}`}>
          <div className={`text-6xl font-black ${gradeColor}`}>{grade}%</div>
          <div className="text-gray-500 text-sm mt-1">
            {correct} / {total} correct ({pct.toFixed(1)}%)
          </div>
          <div className="text-xs text-gray-400 mt-2">
            95–100% = 100%&nbsp;&nbsp;|&nbsp;&nbsp;90–94% = 90%&nbsp;&nbsp;|&nbsp;&nbsp;85–89% = 80%&nbsp;&nbsp;|&nbsp;&nbsp;&lt;85% = 0%
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Section Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {SECTIONS.map(sec => {
              const secTotal   = sec.items.length;
              const secCorrect = sec.items.filter(i => answers[i.id] === 'yes').length;
              const secNo      = sec.items.filter(i => answers[i.id] === 'no').length;
              const secPct     = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;
              return (
                <div key={sec.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{sec.title}</div>
                    {secNo > 0 && <div className="text-xs text-red-500">{secNo} failed</div>}
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
                      <img src={photo.url} alt="Issue photo"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
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

        {/* Shareable link (shown once saved) */}
        {savedId && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shareable Link</div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inspectionLink()}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono select-all"
                onFocus={e => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inspectionLink());
                  setShareStatus('copied');
                  setTimeout(() => setShareStatus('idle'), 2500);
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {shareStatus === 'copied' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom bar — all action buttons ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 no-print">
        <div className="max-w-2xl mx-auto bg-white border-t border-gray-200 px-4 py-3">
          {/* Row 1: Home | Back | Print */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onReset}
              className="flex flex-col items-center justify-center w-14 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-0.5">Home</span>
            </button>

            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              ← Back
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Print / PDF
            </button>
          </div>

          {/* Row 2: Send to Store (full width, prominent) */}
          <button
            onClick={handleSendToStore}
            disabled={saveStatus === 'saving'}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-colors flex items-center justify-center gap-2 ${
              shareStatus === 'shared' || shareStatus === 'copied'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-60`}
          >
            {shareStatus === 'shared' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                Sent!
              </>
            ) : shareStatus === 'copied' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                Report Copied to Clipboard
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Send to Store
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
