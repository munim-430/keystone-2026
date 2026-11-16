import React, { useState } from 'react';
import { CALLING_SCRIPTS } from '../constants';
import { BookOpen, X, Lightbulb, PhoneCall, ShieldAlert, Users } from 'lucide-react';

interface CallingScriptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerName?: string;
  district?: string;
}

export const CallingScriptsModal: React.FC<CallingScriptsModalProps> = ({
  isOpen,
  onClose,
  centerName = '[সেন্টারের নাম]',
  district = '[জেলা]',
}) => {
  const [activeTab, setActiveTab] = useState<'director' | 'objection' | 'gatekeeper'>('director');

  if (!isOpen) return null;

  const current = CALLING_SCRIPTS[activeTab];
  const renderedText = current.text
    .replaceAll('[Center Name]', centerName)
    .replaceAll('[District Name]', district);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog scripts-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <BookOpen size={18} className="text-cerulean" />
            <h3>কলিং স্ক্রিপ্ট ও কথা বলার গাইডলাইন</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Script Selection Tabs */}
        <div className="script-tab-bar">
          <button
            type="button"
            className={`script-tab ${activeTab === 'director' ? 'active' : ''}`}
            onClick={() => setActiveTab('director')}
          >
            <PhoneCall size={14} />
            <span>১ম কল: ডিরেক্টর পিচ</span>
          </button>
          <button
            type="button"
            className={`script-tab ${activeTab === 'objection' ? 'active' : ''}`}
            onClick={() => setActiveTab('objection')}
          >
            <ShieldAlert size={14} />
            <span>আপত্তি হ্যান্ডেলিং (FAQ)</span>
          </button>
          <button
            type="button"
            className={`script-tab ${activeTab === 'gatekeeper' ? 'active' : ''}`}
            onClick={() => setActiveTab('gatekeeper')}
          >
            <Users size={14} />
            <span>রিসেপশন / স্টাফ হ্যান্ডেলিং</span>
          </button>
        </div>

        {/* Tip Box */}
        <div className="script-tip-box">
          <Lightbulb size={16} className="text-amber" />
          <span>{current.tip}</span>
        </div>

        {/* Script Body */}
        <div className="script-body-box">
          <pre className="script-pre">{renderedText}</pre>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="text-dim text-xs">Keystone B2B Playbook — Version 2026</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            বুঝেছি, কল শুরু করুন
          </button>
        </div>
      </div>
    </div>
  );
};
