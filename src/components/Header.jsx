export default function Header({ storeNumber, setStoreNumber, date, setDate, score, onHome, onFinish }) {
  const pct = score.pct.toFixed(0);

  return (
    <div className="bg-brand-500 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onHome} className="text-brand-100 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
          <img src="/logo.png" alt="Keith's Superstores" className="h-8 object-contain" />
          <button
            onClick={onFinish}
            className="text-sm bg-white text-brand-700 font-semibold px-3 py-1 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Finish
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-brand-100 whitespace-nowrap">Store #</label>
            <input
              type="text"
              value={storeNumber}
              onChange={e => setStoreNumber(e.target.value)}
              placeholder="####"
              className="bg-brand-600 text-white placeholder-brand-200 rounded px-2 py-1 text-sm w-20 border border-brand-400 focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-brand-100 whitespace-nowrap">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-brand-600 text-white rounded px-2 py-1 text-sm border border-brand-400 focus:outline-none focus:border-white"
            />
          </div>
          <div className="text-right">
            <div className="text-xs text-brand-100">{score.correct}/{score.total}</div>
            <div className="text-lg font-bold leading-tight">{pct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
