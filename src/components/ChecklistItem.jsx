export default function ChecklistItem({ item, index, answer, textValue, onAnswer, onTextField }) {
  const isYes = answer === 'yes';
  const isNo = answer === 'no';

  return (
    <div className={`px-4 py-3 flex items-start gap-3 transition-colors ${
      isNo ? 'bg-red-50' : isYes ? 'bg-green-50' : 'bg-white'
    }`}>
      <span className="text-xs text-gray-400 mt-0.5 w-5 flex-shrink-0 text-right">{index}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">
          {item.critical && <span className="text-amber-600 font-semibold mr-0.5">*</span>}
          {item.text}
        </p>
        {item.hasTextField && (
          <input
            type="text"
            value={textValue}
            onChange={e => onTextField(e.target.value)}
            placeholder="Describe..."
            className="mt-1 w-full border-b border-gray-300 text-sm py-0.5 focus:outline-none focus:border-blue-500 bg-transparent"
          />
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onAnswer(isYes ? undefined : 'yes')}
          className={`w-12 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
            isYes
              ? 'bg-green-500 border-green-500 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onAnswer(isNo ? undefined : 'no')}
          className={`w-12 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
            isNo
              ? 'bg-red-500 border-red-500 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}
