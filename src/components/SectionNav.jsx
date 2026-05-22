export default function SectionNav({ sections, activeSection, onSelect, answers }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-print" style={{ scrollbarWidth: 'none' }}>
      {sections.map((sec, idx) => {
        const total = sec.items.length;
        const done = sec.items.filter(i => answers[i.id] !== undefined).length;
        const complete = done === total;
        const isActive = idx === activeSection;

        return (
          <button
            key={sec.id}
            onClick={() => onSelect(idx)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-brand-600 text-white border-brand-600'
                : complete
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-300'
            }`}
          >
            {complete && !isActive && <span className="mr-1">✓</span>}
            {sec.title}
            <span className={`ml-1 text-xs ${isActive ? 'text-brand-200' : 'text-gray-400'}`}>
              {done}/{total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
