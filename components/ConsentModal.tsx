import React from 'react';
import { useT } from '../utils/strings';

interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  founderRecordConsent: boolean;
  onToggleRecordConsent: (value: boolean) => void;
  internationalFounder: boolean;
  onToggleInternationalFounder: (value: boolean) => void;
  founderDataConsent: boolean;
  onToggleDataConsent: (value: boolean) => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  open,
  onClose,
  founderRecordConsent,
  onToggleRecordConsent,
  internationalFounder,
  onToggleInternationalFounder,
  founderDataConsent,
  onToggleDataConsent
}) => {
  if (!open) return null;

  const t = useT().consent;
  const common = useT().common;

  const renderStandardSections = () =>
    t.sections.map((section, idx) => (
      <div className="space-y-2" key={`${section.title}-${idx}`}>
        <h3 className="text-base font-bold text-gray-900">{section.title}</h3>
        {section.paragraphs?.map((p, pIdx) => (
          <p key={`${section.title}-p-${pIdx}`}>{p}</p>
        ))}
        {section.bullets ? (
          <ul className="list-disc pl-5 space-y-1">
            {section.bullets.map((item, bIdx) => (
              <li key={`${section.title}-b-${bIdx}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 relative">
        <button
          onClick={onClose}
          aria-label={common.close}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
        >
          ×
        </button>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
            <p className="text-sm text-gray-600">{t.subtitle}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
            <div className="font-semibold text-gray-900">{t.summary.capture}</div>
            <div>{t.summary.record}: {founderRecordConsent ? common.yes : common.no}</div>
            <div>{t.summary.international}: {internationalFounder ? common.yes : common.no}</div>
            <div>{t.summary.dataConsent}: {founderDataConsent ? common.yes : common.no}</div>
          </div>
        </div>

        <div className="space-y-5 text-sm text-gray-800 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-1">
            <p><span className="font-semibold">{t.meta.studyTitle}</span></p>
            <p><span className="font-semibold">{t.meta.researchers}</span></p>
            <p><span className="font-semibold">{t.meta.version}</span></p>
          </div>

          {renderStandardSections()}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">{t.recording.title}</h4>
              <p>{t.recording.description}</p>
            </div>
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-gray-400 rounded"
                checked={founderRecordConsent}
                onChange={(e) => onToggleRecordConsent(e.target.checked)}
              />
              <span>{t.recording.checkbox}</span>
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-gray-400 rounded"
                checked={internationalFounder}
                onChange={(e) => onToggleInternationalFounder(e.target.checked)}
              />
              <span>{t.international.label}</span>
            </label>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-gray-900">{t.international.addendumTitle}</h4>
              {t.international.paragraphs.map((p, idx) => (
                <p key={`intl-p-${idx}`}>{p}</p>
              ))}
            </div>

            <ul className="list-disc pl-5 space-y-1">
              {t.international.bullets.map((item, idx) => (
                <li key={`intl-b-${idx}`}>{item}</li>
              ))}
            </ul>
            <p>{t.international.extraUse}</p>
            <ul className="list-disc pl-5 space-y-1">
              {t.international.extraBullets.map((item, idx) => (
                <li key={`intl-extra-${idx}`}>{item}</li>
              ))}
            </ul>
            <p>{t.international.retention}</p>
            <p>{t.international.anonymize}</p>
            <p>{t.international.rightsIntro}</p>
            <p>{t.international.gdpr.intro}</p>
            <ul className="list-disc pl-5 space-y-1">
              {t.international.gdpr.bullets.map((item, idx) => (
                <li key={`intl-gdpr-${idx}`}>{item}</li>
              ))}
            </ul>
            <p>{t.international.gdpr.transfer}</p>

            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-gray-400 rounded"
                checked={founderDataConsent}
                disabled={!internationalFounder}
                onChange={(e) => onToggleDataConsent(e.target.checked)}
              />
              <span>{t.international.dataConsent}</span>
            </label>
            {!internationalFounder && (
              <p className="text-xs text-gray-500">{t.international.dataConsentHint}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              {t.international.done}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
