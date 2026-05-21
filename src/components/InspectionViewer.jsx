import { useEffect, useState } from 'react';
import { SECTIONS } from '../inspectionData';
import { fetchInspection } from '../supabase';

export default function InspectionViewer({ inspectionId, onHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInspection(inspectionId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [inspectionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-gray-500 text-sm">Loading inspection…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-2">Could not load inspection</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button onClick={onHome} className="text-blue-600 text-sm font-medium">← Go Home</button>
        </div>
      </div>
    );
  }

  const { inspection, items } = data;
  const answersMap = Object.fromEntries(items.map(i => [i.item_id, i.answer]));
  const photosMap = Object.fromEntries(
    items.filter(i => i.photo_url).map(i => [i.item_id, i.photo_url])
  );
  const textMap = Object.fromEntries(
    items.filter(i => i.text_value).map(i => [i.item_id, i.text_value])
  );

  const grade = inspection.score_grade;
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
      .filter(item => answersMap[item.id] === 'no')
      .map(item => ({ ...item, sectionTitle: sec.title }))
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 no-print">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-sm font-semibold">Keith's Store Inspection</div>
          <button
            onClick={() => window.print()}
            className="text-sm bg-white text-blue-600 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50"
          >
            Print
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Score */}
        <div className={`rounded-xl border-2 p-5 text-center ${gradeBg}`}>
          <div className="text-sm text-gray-600 mb-1">
            Store #{inspection.store_number || '—'}&nbsp;&nbsp;|&nbsp;&nbsp;{inspection.date}
          </div>
          <div className={`text-6xl font-black ${gradeColor}`}>{grade}%</div>
          <div className="text-gray-500 text-sm mt-1">
            {inspection.correct_count} / {inspection.total_count} correct ({Number(inspection.score_pct).toFixed(1)}%)
          </div>
          {inspection.inspector_signature && (
            <div className="text-xs text-gray-500 mt-2 italic">Signed: {inspection.inspector_signature}</div>
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
              const secCorrect = sec.items.filter(i => answersMap[i.id] === 'yes').length;
              const secNo = sec.items.filter(i => answersMap[i.id] === 'no').length;
              const secPct = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;
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

        {/* Failed Items */}
        {failedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
              <h2 className="font-bold text-red-800 text-sm">Failed Items ({failedItems.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {failedItems.map(item => {
                const photoUrl = photosMap[item.id];
                return (
                  <div key={item.id} className="px-4 py-2.5 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-red-500 font-medium">{item.sectionTitle}</div>
                      <div className="text-sm text-gray-800">
                        {item.critical && <span className="text-amber-600 font-semibold mr-0.5">*</span>}
                        {item.text}
                        {textMap[item.id] && <span className="text-gray-500"> — {textMap[item.id]}</span>}
                      </div>
                    </div>
                    {photoUrl && (
                      <img src={photoUrl} alt="Issue photo"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments */}
        {inspection.comments && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Comments</div>
            <p className="text-sm text-gray-700">{inspection.comments}</p>
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 no-print">
        <div className="max-w-2xl mx-auto bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={onHome}
              className="flex flex-col items-center justify-center w-14 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-0.5">Home</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 text-sm"
            >
              Print / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
