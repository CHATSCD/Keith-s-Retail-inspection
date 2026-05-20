import SectionNav from './SectionNav';
import ChecklistSection from './ChecklistSection';

export default function InspectionForm({
  sections,
  answers,
  textFields,
  comments,
  signature,
  activeSection,
  onAnswer,
  onTextField,
  onComments,
  onSignature,
  onSectionChange,
  onFinish,
}) {
  const section = sections[activeSection];
  const isLast = activeSection === sections.length - 1;

  function goNext() {
    if (isLast) {
      onFinish();
    } else {
      onSectionChange(activeSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goPrev() {
    if (activeSection > 0) {
      onSectionChange(activeSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function sectionProgress(sec) {
    const total = sec.items.length;
    const done = sec.items.filter(i => answers[i.id] !== undefined).length;
    return { total, done };
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 pt-4">
      <SectionNav
        sections={sections}
        activeSection={activeSection}
        onSelect={onSectionChange}
        answers={answers}
      />

      <ChecklistSection
        section={section}
        answers={answers}
        textFields={textFields}
        onAnswer={onAnswer}
        onTextField={onTextField}
        sectionIndex={activeSection}
        totalSections={sections.length}
      />

      {isLast && (
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea
              value={comments}
              onChange={e => onComments(e.target.value)}
              rows={3}
              placeholder="Add any comments..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input
              type="text"
              value={signature}
              onChange={e => onSignature(e.target.value)}
              placeholder="Type name as signature"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 max-w-2xl mx-auto no-print">
        <button
          onClick={goPrev}
          disabled={activeSection === 0}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          className={`flex-2 px-6 py-3 rounded-xl font-semibold text-white transition-colors ${
            isLast ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          style={{ flex: 2 }}
        >
          {isLast ? 'Finish & Review →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
