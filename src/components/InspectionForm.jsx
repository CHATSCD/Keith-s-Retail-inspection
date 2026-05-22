import SectionNav from './SectionNav';
import ChecklistSection from './ChecklistSection';

export default function InspectionForm({
  sections,
  answers,
  textFields,
  photos,
  comments,
  signature,
  staffing,
  activeSection,
  sessionId,
  onAnswer,
  onTextField,
  onPhoto,
  onRemovePhoto,
  onComments,
  onSignature,
  onStaffing,
  onSectionChange,
  onFinish,
  onHome,
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

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-4">

      {/* ── Inspector & Staffing — always visible at top ── */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inspection Details</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Inspector Name</label>
            <input
              type="text"
              value={signature || ''}
              onChange={e => onSignature(e.target.value)}
              placeholder="Enter name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Manager on Duty</label>
            <input
              type="text"
              value={staffing?.managerOnDuty || ''}
              onChange={e => onStaffing('managerOnDuty', e.target.value)}
              placeholder="Manager name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employees on Shift</label>
            <input
              type="number"
              min="0"
              value={staffing?.employeesOnShift || ''}
              onChange={e => onStaffing('employeesOnShift', e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Comments</label>
            <input
              type="text"
              value={comments || ''}
              onChange={e => onComments(e.target.value)}
              placeholder="Optional notes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <SectionNav
        sections={sections}
        activeSection={activeSection}
        onSelect={idx => {
          onSectionChange(idx);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        answers={answers}
      />

      <ChecklistSection
        section={section}
        answers={answers}
        textFields={textFields}
        photos={photos}
        onAnswer={onAnswer}
        onTextField={onTextField}
        onPhoto={onPhoto}
        onRemovePhoto={onRemovePhoto}
        sessionId={sessionId}
      />

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 no-print">
        <div className="max-w-2xl mx-auto bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onHome}
              className="flex flex-col items-center justify-center w-14 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-0.5">Home</span>
            </button>

            <button
              onClick={goPrev}
              disabled={activeSection === 0}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors text-sm"
            >
              ← Prev
            </button>

            <button
              onClick={goNext}
              className={`flex-[2] py-3 rounded-xl font-semibold text-white transition-colors text-sm ${
                isLast
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              {isLast ? 'Finish & Review →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
