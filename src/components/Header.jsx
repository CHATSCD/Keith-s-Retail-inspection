import KLogo from './KLogo';

export default function Header({ storeNumber, setStoreNumber, date, setDate, score, onHome, onFinish }) {
  const pct = score.pct.toFixed(0);

  return (
    <div className="bg-brand-600 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onHome} className="text-brand-200 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
          <div className="flex items-center gap-2">
            <KLogo className="w-5 h-5" />
            <h1 className="text-base font-bold">Keith's Store Inspection</h1>
          </div>
          <button
            onClick={onFinish}
            className="text-sm bg-white text-brand-700 font-semibold px-3 py-1 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Finish
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-brand-200 whitespace-nowrap">Store #</label>
            <input
              type="text"
              value={storeNumber}
              onChange={e => setStoreNumber(e.target.value)}
              placeholder="####"
              className="bg-brand-700 text-white placeholder-brand-300 rounded px-2 py-1 text-sm w-20 border border-brand-500 focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-brand-200 whitespace-nowrap">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-brand-700 text-white rounded px-2 py-1 text-sm border border-brand-500 focus:outline-none focus:border-white"
            />
          </div>
          <div className="text-right">
            <div className="text-xs text-brand-200">{score.correct}/{score.total}</div>
            <div className="text-lg font-bold leading-tight">{pct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
