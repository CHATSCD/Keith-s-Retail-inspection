import ChecklistItem from './ChecklistItem';

export default function ChecklistSection({
  section,
  answers,
  textFields,
  onAnswer,
  onTextField,
  sectionIndex,
  totalSections,
}) {
  const done = section.items.filter(i => answers[i.id] !== undefined).length;
  const total = section.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-base">{section.title}</h2>
          {section.note && (
            <p className="text-xs text-amber-700 mt-0.5">{section.note}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{done}/{total}</div>
          <div className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : 'text-gray-700'}`}>
            {pct}%
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {section.items.map((item, idx) => (
          <ChecklistItem
            key={item.id}
            item={item}
            index={idx + 1}
            answer={answers[item.id]}
            textValue={textFields[item.id] || ''}
            onAnswer={val => onAnswer(item.id, val)}
            onTextField={val => onTextField(item.id, val)}
          />
        ))}
      </div>
    </div>
  );
}
