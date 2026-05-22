import { useRef, useState } from 'react';
import { uploadPhoto } from '../supabase';

function MiniToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
      <span className="text-xs text-gray-600 flex-1">{label}</span>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={() => onChange(value === 'yes' ? '' : 'yes')}
          className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
            value === 'yes'
              ? 'bg-green-500 border-green-500 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(value === 'no' ? '' : 'no')}
          className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
            value === 'no'
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default function ChecklistItem({
  item, index, answer, textValue, photoData, logValue, maintValue,
  onAnswer, onTextField, onSetField, onPhoto, onRemovePhoto, sessionId,
}) {
  const isYes = answer === 'yes';
  const isNo  = answer === 'no';
  const isNA  = answer === 'na';
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    onPhoto(item.id, { url: localUrl, uploading: true });
    setUploading(true);
    try {
      const remoteUrl = await uploadPhoto(file, sessionId, item.id);
      onPhoto(item.id, { url: remoteUrl, uploading: false });
    } catch (err) {
      console.error('Photo upload failed:', err);
      onPhoto(item.id, { url: localUrl, uploading: false, error: true });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const rowBg = isNo ? 'bg-red-50' : isYes ? 'bg-green-50' : isNA ? 'bg-gray-50' : 'bg-white';

  return (
    <div className={`px-4 py-3 transition-colors ${rowBg}`}>
      <div className="flex items-start gap-3">
        <span className="text-xs text-gray-400 mt-0.5 w-5 flex-shrink-0 text-right">{index}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">
            {item.critical && <span className="text-amber-600 font-semibold mr-0.5">*</span>}
            {item.text}
          </p>
          {item.hasTextField && !isNA && (
            <input
              type="text"
              value={textValue}
              onChange={e => onTextField(e.target.value)}
              placeholder="Describe..."
              className="mt-1 w-full border-b border-gray-300 text-sm py-0.5 focus:outline-none focus:border-brand-500 bg-transparent"
            />
          )}

          {/* Photo + maintenance reporting — shown on No */}
          {isNo && (
            <div className="mt-2 space-y-2">
              {/* Camera */}
              {photoData ? (
                <div className="relative inline-block">
                  <img
                    src={photoData.url}
                    alt="Inspection photo"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  {photoData.uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    </div>
                  )}
                  {photoData.error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-xs text-center rounded-b-lg py-0.5">
                      Upload failed
                    </div>
                  )}
                  <button
                    onClick={() => onRemovePhoto(item.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs text-brand-500 border border-brand-300 bg-brand-50 px-2.5 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Add Photo
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Maintenance reporting sub-questions */}
              {item.isMaintenance && (
                <div className="space-y-1.5 pt-1">
                  <MiniToggle
                    label="Reported on Dispatch Log?"
                    value={logValue}
                    onChange={val => onSetField(item.id + '_log', val)}
                  />
                  <MiniToggle
                    label="Reported to Maintenance?"
                    value={maintValue}
                    onChange={val => onSetField(item.id + '_maint', val)}
                  />
                  {(logValue === 'no' || maintValue === 'no') && (
                    <p className="text-xs text-red-600 font-semibold px-1">
                      ⚠ Deduct 1 point — not fully reported/logged
                    </p>
                  )}
                  {logValue === 'yes' && maintValue === 'yes' && (
                    <p className="text-xs text-green-700 font-semibold px-1">
                      ✓ Reported &amp; logged — no additional deduction
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Yes / No / NA buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => onAnswer(isYes ? undefined : 'yes')}
            className={`w-11 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              isYes
                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => onAnswer(isNo ? undefined : 'no')}
            className={`w-11 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              isNo
                ? 'bg-red-500 border-red-500 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600'
            }`}
          >
            No
          </button>
          {item.hasNA && (
            <button
              onClick={() => onAnswer(isNA ? undefined : 'na')}
              className={`w-11 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                isNA
                  ? 'bg-gray-500 border-gray-500 text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600'
              }`}
            >
              N/A
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
