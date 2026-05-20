export default function Header({ storeNumber, setStoreNumber, date, setDate, score, onHome, onFinish }) {
  const answered = score.correct + (score.total - score.correct - (score.total - Object.keys({}).length));
  const pct = score.pct.toFixed(0);

  return (
    <div className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onHome} className="text-blue-100 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
          <h1 className="text-base font-bold">Keith's Store Inspection</h1>
          <button
            onClick={onFinish}
            className="text-sm bg-white text-blue-600 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Finish
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-blue-200 whitespace-nowrap">Store #</label>
            <input
              type="text"
              value={storeNumber}
              onChange={e => setStoreNumber(e.target.value)}
              placeholder="####"
              className="bg-blue-500 text-white placeholder-blue-300 rounded px-2 py-1 text-sm w-20 border border-blue-400 focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-blue-200 whitespace-nowrap">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-blue-500 text-white rounded px-2 py-1 text-sm border border-blue-400 focus:outline-none focus:border-white"
            />
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-200">{score.correct}/{score.total}</div>
            <div className="text-lg font-bold leading-tight">{pct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
