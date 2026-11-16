import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { SYSTEM_USERS } from '../constants';
import { Lock, Delete, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface PinAuthModalProps {
  onAuthenticated: (user: User) => void;
  isOpen: boolean;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({ onAuthenticated, isOpen }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDigit = useCallback((digit: string) => {
    setError(null);
    if (navigator.vibrate) navigator.vibrate([20]);
    setPin((prev) => (prev.length < 4 ? prev + digit : prev));
  }, []);

  const handleDelete = useCallback(() => {
    setError(null);
    if (navigator.vibrate) navigator.vibrate([15]);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError(null);
  }, []);

  const submitPin = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);

      // Check system mapping
      const localUser = SYSTEM_USERS[code];
      if (localUser) {
        if (navigator.vibrate) navigator.vibrate([40]);
        setTimeout(() => {
          setLoading(false);
          onAuthenticated(localUser);
        }, 150);
        return;
      }

      // Check via /api/auth
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: code }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          if (navigator.vibrate) navigator.vibrate([40]);
          setLoading(false);
          onAuthenticated(data.user);
          return;
        }
      } catch (e) {
        // network fallback handled above
      }

      setLoading(false);
      setError('ভুল পিন কোড! অনুগ্রহ করে ৪ সংখ্যার সঠিক পিন দিন।');
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      setPin('');
    },
    [onAuthenticated]
  );

  // Auto-submit on 4th digit
  useEffect(() => {
    if (pin.length === 4) {
      submitPin(pin);
    }
  }, [pin, submitPin]);

  // Physical keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter' && pin.length === 4) {
        submitPin(pin);
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') || '';
      const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
      if (clean.length === 4) {
        setPin(clean);
        submitPin(clean);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [isOpen, pin, handleDigit, handleDelete, handleClear, submitPin]);

  if (!isOpen) return null;

  return (
    <div className="pin-overlay">
      <div className="pin-container">
        {/* Header */}
        <div className="pin-header">
          <div className="pin-logo-box">
            <img src="/keystone_logo_official.png" alt="Keystone" className="pin-logo" />
          </div>
          <h2>নিরাপদ প্রবেশদ্বার</h2>
          <p>আপনার ৪ সংখ্যার অথেনটিকেশন পিন প্রদান করুন</p>
        </div>

        {/* PIN Indicators */}
        <div className="pin-dots-display">
          {[0, 1, 2, 3].map((index) => {
            const filled = index < pin.length;
            return (
              <div
                key={index}
                className={`pin-dot ${filled ? 'filled' : ''} ${error ? 'error' : ''}`}
              >
                {filled ? '•' : ''}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="pin-error-box">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad (Optimized for Android Thumb Zone) */}
        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="pin-key"
              onClick={() => handleDigit(digit)}
              disabled={loading || pin.length >= 4}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="pin-key pin-key-action"
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            title="সব মুছুন"
          >
            C
          </button>
          <button
            type="button"
            className="pin-key"
            onClick={() => handleDigit('0')}
            disabled={loading || pin.length >= 4}
          >
            0
          </button>
          <button
            type="button"
            className="pin-key pin-key-action"
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            title="এক ঘর পিছান"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Fast Profile Access Badges (For instant field operations) */}
        <div className="pin-quick-profiles">
          <span className="quick-label">অনুমোদিত প্রোফাইল তালিকা:</span>
          <div className="quick-badges-grid">
            <button
              type="button"
              className="quick-badge admin-badge"
              onClick={() => { setPin('1001'); submitPin('1001'); }}
            >
              <ShieldCheck size={13} />
              <span>১০০১: হাসিবুল মুনিম (Owner)</span>
            </button>
            <button
              type="button"
              className="quick-badge admin-badge"
              onClick={() => { setPin('1002'); submitPin('1002'); }}
            >
              <ShieldCheck size={13} />
              <span>১০০২: কো-অনার (Admin)</span>
            </button>
            <button
              type="button"
              className="quick-badge caller-badge"
              onClick={() => { setPin('3001'); submitPin('3001'); }}
            >
              <UserCheck size={13} />
              <span>৩০০১: কলার ১ (ইস্টার্ন হাব)</span>
            </button>
            <button
              type="button"
              className="quick-badge caller-badge"
              onClick={() => { setPin('3002'); submitPin('3002'); }}
            >
              <UserCheck size={13} />
              <span>৩০০২: কলার ২ (নর্দার্ন হাব)</span>
            </button>
            <button
              type="button"
              className="quick-badge caller-badge"
              onClick={() => { setPin('3003'); submitPin('3003'); }}
            >
              <UserCheck size={13} />
              <span>৩০০৩: কলার ৩ (সাউদার্ন হাব)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
