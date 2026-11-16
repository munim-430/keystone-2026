import React, { useState, useMemo } from 'react';
import { Center, CenterStatus, User } from '../types';
import { CALLER_HUBS, QUICK_NOTE_CHIPS } from '../constants';
import { logCallOutcome, leaseB2BBatch } from '../lib/supabase';
import { lookupTruecaller } from '../lib/truecaller';
import { CallingScriptsModal } from './CallingScriptsModal';
import {
  Phone,
  PhoneCall,
  MessageCircle,
  Flame,
  Clock,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  ExternalLink,
  UserCheck,
  RefreshCw,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CallerInterfaceProps {
  user: User;
  centers: Center[];
  onCenterUpdated: (updated: Center) => void;
  onLogout: () => void;
}

export const CallerInterface: React.FC<CallerInterfaceProps> = ({
  user,
  centers,
  onCenterUpdated,
  onLogout,
}) => {
  // Scoped territory hub
  const activeHubId = user.role === 'admin' ? 'ALL' : user.hub;
  const hubConfig = CALLER_HUBS[activeHubId];

  // Filter centers to caller's assigned hub
  const hubCenters = useMemo(() => {
    if (activeHubId === 'ALL') return centers;
    return centers.filter((c) => hubConfig.districts.includes(c.district));
  }, [centers, activeHubId, hubConfig]);

  // UI state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);

  // Batch leasing state
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [leasedCenters, setLeasedCenters] = useState<Center[]>([]);
  const [leasingLoading, setLeasingLoading] = useState<boolean>(false);
  const [leaseMsg, setLeaseMsg] = useState<string | null>(null);

  // Active pool: batch lease vs territorial hub
  const activePool = isBatchMode && leasedCenters.length > 0 ? leasedCenters : hubCenters;

  // Active disposition / notes input
  const [noteText, setNoteText] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [submittingStatus, setSubmittingStatus] = useState<boolean>(false);
  const [resolvingTruecaller, setResolvingTruecaller] = useState<boolean>(false);
  const [truecallerMsg, setTruecallerMsg] = useState<string | null>(null);

  // Filtered slice
  const filteredCenters = useMemo(() => {
    return activePool.filter((c) => {
      if (districtFilter !== 'ALL' && c.district !== districtFilter) return false;
      if (statusFilter === 'EAGER' && c.status !== 'Eager') return false;
      if (statusFilter === 'FOLLOW_UP' && c.status !== 'FollowUp') return false;
      if (statusFilter === 'COLD' && c.status !== 'Cold' && c.status !== 'Rejected') return false;
      if (statusFilter === 'CALLED' && (!c.notes || c.notes.length === 0)) return false;
      if (statusFilter === 'UNCALLED' && c.notes && c.notes.length > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        const matchDistrict = c.district.toLowerCase().includes(q);
        const matchDirector = (c.directorName || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDistrict && !matchDirector) return false;
      }

      return true;
    });
  }, [activePool, districtFilter, statusFilter, searchQuery]);

  // Request Batch Lease RPC (FOR UPDATE SKIP LOCKED)
  const handleRequestBatchLease = async () => {
    setLeasingLoading(true);
    setLeaseMsg('ব্যাচ রিজার্ভ করা হচ্ছে...');
    const res = await leaseB2BBatch({
      callerPin: user.pin,
      userId: user.id,
      batchSize: 30,
      leaseMinutes: 45,
      district: districtFilter !== 'ALL' ? districtFilter : undefined,
      hubDistricts: hubConfig.districts,
    });
    setLeasingLoading(false);
    if (res.centers.length > 0) {
      setLeasedCenters(res.centers);
      setIsBatchMode(true);
      setCurrentIndex(0);
      setLeaseMsg(`🔒 ৩০টি সেন্টার লিজ করা হয়েছে (${res.source === 'rpc' ? 'পোস্টগ্রেস লক' : 'টেরিটরি ফিল্টার'})`);
    } else {
      setLeaseMsg('কোনো নতুন সেন্টার খালি নেই');
    }
    setTimeout(() => setLeaseMsg(null), 3500);
  };

  // Current center
  const currentCenter = filteredCenters[currentIndex] || filteredCenters[0] || null;

  // Safe navigation
  const handleNext = () => {
    if (navigator.vibrate) navigator.vibrate([20]);
    setCurrentIndex((prev) => (prev < filteredCenters.length - 1 ? prev + 1 : 0));
    setNoteText('');
    setFollowUpDate('');
    setTruecallerMsg(null);
  };

  const handlePrev = () => {
    if (navigator.vibrate) navigator.vibrate([20]);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredCenters.length - 1));
    setNoteText('');
    setFollowUpDate('');
    setTruecallerMsg(null);
  };

  // Append note chip
  const handleAddChip = (chip: string) => {
    if (navigator.vibrate) navigator.vibrate([15]);
    setNoteText((prev) => (prev ? `${prev}, ${chip}` : chip));
  };

  // Quick Truecaller Lookup
  const handleTruecallerLookup = async () => {
    if (!currentCenter || !currentCenter.phone) return;
    setResolvingTruecaller(true);
    setTruecallerMsg('যাচাই করা হচ্ছে...');

    const res = await lookupTruecaller(currentCenter.phone, currentCenter.id);
    setResolvingTruecaller(false);

    if (res.success && res.name) {
      setTruecallerMsg(`পরিচালক: ${res.name}`);
      const updated: Center = {
        ...currentCenter,
        directorName: res.name,
        contactPerson: res.name,
        truecallerName: res.name,
      };
      onCenterUpdated(updated);
    } else {
      setTruecallerMsg(res.error || 'নাম পাওয়া যায়নি');
    }
  };

  // Submit Disposition
  const handleDisposition = async (newStatus: CenterStatus) => {
    if (!currentCenter) return;
    if (navigator.vibrate) navigator.vibrate([35]);
    setSubmittingStatus(true);

    const defaultNotes: Record<CenterStatus, string> = {
      Eager: 'হট লিড: পার্টনারশিপ অফার ও এগ্রিমেন্ট সামারি পাঠানো অনুরোধ করেছেন।',
      FollowUp: followUpDate ? `ফলোআপ নির্ধারিত: ${followUpDate}` : 'পরে কথা বলতে চেয়েছেন।',
      Cold: 'কল সম্পন্ন হয়েছে (সাধারণ)।',
      Rejected: 'আগ্রহ নেই / ভুল নম্বর।',
      Partnered: 'চুক্তি স্বাক্ষরিত / পার্টনার।',
      New: 'কল সম্পন্ন।',
    };

    const finalNotes = noteText.trim() || defaultNotes[newStatus];

    const res = await logCallOutcome(
      currentCenter.id,
      newStatus,
      finalNotes,
      user.pin,
      user.name,
      followUpDate || undefined
    );

    setSubmittingStatus(false);

    if (res.success && res.center) {
      onCenterUpdated(res.center);
    }

    // Advance to next center automatically after short visual feedback
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  const handleNextWithSave = async () => {
    if (noteText.trim() && currentCenter) {
      await handleDisposition(currentCenter.status === 'New' ? 'Cold' : currentCenter.status);
    } else {
      handleNext();
    }
  };

  // Hub KPI Metrics
  const stats = useMemo(() => {
    let eager = 0;
    let followUp = 0;
    let rejected = 0;
    let called = 0;

    hubCenters.forEach((c) => {
      if (c.notes && c.notes.length > 0) called++;
      if (c.status === 'Eager') eager++;
      else if (c.status === 'FollowUp') followUp++;
      else if (c.status === 'Cold' || c.status === 'Rejected') rejected++;
    });

    return { total: hubCenters.length, called, eager, followUp, rejected };
  }, [hubCenters]);

  // Clean phone numbers for tel & wa
  const cleanPhone = currentCenter ? currentCenter.phone.replace(/[^0-9]/g, '') : '';
  const hasValidPhone = Boolean(cleanPhone && cleanPhone.length >= 8);
  const waPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  const waText = encodeURIComponent(
    `আসসালামু আলাইকুম স্যার, Keystone Overseas (ধানমন্ডি, ঢাকা) থেকে কল করেছিলাম ${currentCenter?.name || ''}-এর সাথে পার্টনারশিপের বিষয়ে।`
  );

  return (
    <div className="caller-app-layout">
      {/* Top Fixed Mobile Header */}
      <header className="caller-header">
        <div className="caller-header-top">
          <div className="caller-profile-pill">
            <span className="profile-dot online"></span>
            <div className="profile-info">
              <span className="caller-name">{user.name}</span>
              <span className="caller-hub-tag">{hubConfig.name}</span>
            </div>
          </div>

          <div className="caller-header-actions">
            <button
              type="button"
              className="btn btn-script-guide"
              onClick={() => setIsScriptModalOpen(true)}
              title="কলিং স্ক্রিপ্ট গাইড"
            >
              <BookOpen size={15} />
              <span>স্ক্রিপ্ট</span>
            </button>
            <button
              type="button"
              className="btn btn-switch-pin"
              onClick={onLogout}
              title="প্রোফাইল পরিবর্তন"
            >
              লগআউট
            </button>
          </div>
        </div>

        {/* Territory 4-Status Metrics Bar with Uncalled filter */}
        <div className="caller-metrics-row">
          <div className={`kpi-mini-card ${statusFilter === 'ALL' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('ALL')}>
            <span className="kpi-mini-num">{stats.total}</span>
            <span className="kpi-mini-label">মোট সেন্টার</span>
          </div>
          <div className={`kpi-mini-card highlight-called ${statusFilter === 'CALLED' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('CALLED')}>
            <span className="kpi-mini-num">{stats.called}</span>
            <span className="kpi-mini-label">কল সম্পন্ন</span>
          </div>
          <div className={`kpi-mini-card highlight-uncalled ${statusFilter === 'UNCALLED' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('UNCALLED')}>
            <span className="kpi-mini-num">{Math.max(0, stats.total - stats.called)}</span>
            <span className="kpi-mini-label">আনকল্ড / বাকি</span>
          </div>
          <div className={`kpi-mini-card highlight-eager ${statusFilter === 'EAGER' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('EAGER')}>
            <span className="kpi-mini-num">{stats.eager}</span>
            <span className="kpi-mini-label">🔥 আগ্রহী</span>
          </div>
          <div className={`kpi-mini-card highlight-follow ${statusFilter === 'FOLLOW_UP' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('FOLLOW_UP')}>
            <span className="kpi-mini-num">{stats.followUp}</span>
            <span className="kpi-mini-label">⏳ ফলোআপ</span>
          </div>
          <div className={`kpi-mini-card highlight-cold ${statusFilter === 'COLD' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('COLD')}>
            <span className="kpi-mini-num">{stats.rejected}</span>
            <span className="kpi-mini-label">❌ আগ্রহহীন</span>
          </div>
        </div>

        {/* Concurrency Batch Lease Toolbar */}
        <div className="caller-batch-bar">
          <button
            type="button"
            className={`btn-batch-toggle ${isBatchMode ? 'active' : ''}`}
            onClick={isBatchMode ? () => setIsBatchMode(false) : handleRequestBatchLease}
            disabled={leasingLoading}
            title="অন্যান্য কলারদের সাথে ডুপ্লিকেট ডায়ালিং প্রতিরোধে ৩০টি সেন্টারের এক্সক্লুসিভ ব্যাচ লিজ করুন"
          >
            <Layers size={13} className={leasingLoading ? 'animate-spin' : ''} />
            <span>
              {leasingLoading
                ? 'লিজ রিজার্ভ হচ্ছে...'
                : isBatchMode
                ? `🔒 ব্যাচ মোড সক্রিয় (${leasedCenters.length}টি) — মূল পুলে ফিরুন`
                : '🔒 রিজার্ভ ব্যাচ (৩০টি সেন্টার)'}
            </span>
          </button>
          {leaseMsg && <span className="batch-status-msg">{leaseMsg}</span>}
        </div>

        {/* Quick Search & District Filter */}
        <div className="caller-filter-strip">
          <div className="caller-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="caller-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setCurrentIndex(0);
            }}
            className="caller-district-select"
          >
            <option value="ALL">সকল জেলা ({hubConfig.districts.length || 'All'})</option>
            {hubConfig.districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Center Focus Card Area */}
      <main className="caller-main-scroll">
        {filteredCenters.length === 0 ? (
          <div className="empty-state-box">
            <p className="empty-text">কোনো সেন্টার পাওয়া যায়নি।</p>
            <button
              type="button"
              className="btn btn-outline btn-sm mt-3"
              onClick={() => {
                setDistrictFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : currentCenter ? (
          <div className="focus-center-card">
            {/* Card Progress Stepper Header */}
            <div className="card-stepper-header">
              <span className="stepper-counter">
                সেন্টার {currentIndex + 1} / {filteredCenters.length}
              </span>
              <div className="stepper-arrows">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={handlePrev}
                  title="আগের সেন্টার"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={handleNextWithSave}
                  title={noteText.trim() ? "নোট সেভ করে পরের সেন্টার" : "পরের সেন্টার"}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Center Info */}
            <div className="center-identity">
              <div className="center-title-row">
                <h2 className="center-name">{currentCenter.name}</h2>
                <span className={`status-badge status-${currentCenter.status.toLowerCase()}`}>
                  {currentCenter.status === 'Eager' && '🔥 আগ্রহী'}
                  {currentCenter.status === 'FollowUp' && '⏳ ফলোআপ'}
                  {currentCenter.status === 'Cold' && '❄️ কোল্ড'}
                  {currentCenter.status === 'Rejected' && '❌ আগ্রহ নেই'}
                  {currentCenter.status === 'Partnered' && '🤝 পার্টনার'}
                  {currentCenter.status === 'New' && '🆕 নতুন'}
                </span>
              </div>

              <div className="center-meta-tags">
                <span className="meta-tag district-tag">
                  <MapPin size={12} />
                  {currentCenter.district}
                </span>
                <span className="meta-tag priority-tag">
                  অগ্রাধিকার: {currentCenter.priority}
                </span>
                {currentCenter.url && (
                  <a
                    href={currentCenter.url}
                    target="_blank"
                    rel="noreferrer"
                    className="meta-tag link-tag"
                  >
                    <span>লিংক</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>

            {/* Director & Truecaller Enrichment Box */}
            <div className="director-box">
              <div className="director-info">
                <UserCheck size={16} className="text-cerulean" />
                <div className="director-texts">
                  <span className="director-label">পরিচালক / কন্টাক্ট পার্সন:</span>
                  <span className="director-val">
                    {currentCenter.directorName || currentCenter.contactPerson || 'নাম জানা নেই (যাচাই করুন)'}
                  </span>
                </div>
              </div>

              <div className="truecaller-actions">
                <button
                  type="button"
                  className="btn btn-truecaller-action"
                  onClick={handleTruecallerLookup}
                  disabled={resolvingTruecaller || !currentCenter.phone}
                >
                  <RefreshCw size={12} className={resolvingTruecaller ? 'animate-spin' : ''} />
                  <span>{resolvingTruecaller ? 'খোঁজা হচ্ছে...' : 'Truecaller এ নাম দেখুন'}</span>
                </button>
              </div>
            </div>

            {truecallerMsg && (
              <div className="truecaller-msg-pill">
                <Sparkles size={12} />
                <span>{truecallerMsg}</span>
              </div>
            )}

            {/* Notes & Call History */}
            <div className="call-notes-section">
              <label className="section-label">কল নোট ও আপডেট:</label>

              {/* Quick Note Chips */}
              <div className="quick-chips-grid">
                {QUICK_NOTE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => handleAddChip(chip)}
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Custom Note Input */}
              <textarea
                className="note-textarea"
                rows={2}
                placeholder="সেন্টারের সাথে কথা বলে বিস্তারিত মন্তব্য লিখুন..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />

              {/* Follow-up Date Input */}
              <div className="followup-date-row">
                <Calendar size={14} className="text-cerulean" />
                <span>ফলোআপ সময় (প্রযোজ্য হলে):</span>
                <input
                  type="text"
                  placeholder="যেমন: কাল সকাল ১১টা / বিকেলে"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="followup-input"
                />
              </div>

              {/* Recent Notes Log */}
              {currentCenter.notes && currentCenter.notes.length > 0 && (
                <div className="previous-notes-log">
                  <span className="log-title">পূর্ববর্তী নোটসমূহ:</span>
                  <div className="notes-list">
                    {currentCenter.notes.slice(-3).map((n, i) => (
                      <div key={i} className="note-bubble">
                        <span className="note-time">{n.date}:</span>
                        <span className="note-content">{n.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Sticky Bottom One-Thumb Action Zone (Lower 40% Ergonomic Target per RFC Lens 1) */}
      {currentCenter && (
        <footer className="caller-bottom-bar">
          {/* Dial, WhatsApp and Skip Triggers */}
          <div className="primary-dial-strip">
            {hasValidPhone ? (
              <a
                href={`tel:${currentCenter.phone}`}
                className="btn-action-dial"
                title="সরাসরি ফোন করুন"
              >
                <Phone size={20} />
                <div className="dial-text-wrap">
                  <span className="dial-action-label">কল দিন (SIM Dial)</span>
                  <span className="dial-phone-number">{currentCenter.phone}</span>
                </div>
              </a>
            ) : (
              <div className="btn-action-dial btn-action-disabled" title="ফোন নম্বর নেই">
                <Phone size={20} />
                <div className="dial-text-wrap">
                  <span className="dial-action-label">ফোন নম্বর নেই</span>
                  <span className="dial-phone-number">—</span>
                </div>
              </div>
            )}

            {hasValidPhone ? (
              <a
                href={`https://wa.me/${waPhone}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-action-wa"
                title="হোয়াটসঅ্যাপ চ্যাট খুলুন"
              >
                <MessageCircle size={20} />
                <span>WhatsApp</span>
              </a>
            ) : (
              <div className="btn-action-wa btn-action-disabled" title="ফোন নম্বর নেই">
                <MessageCircle size={20} />
                <span>WhatsApp</span>
              </div>
            )}

            <button
              type="button"
              className="btn-action-skip"
              onClick={handleNextWithSave}
              title={noteText.trim() ? "নোট সেভ করে পরবর্তী সেন্টারে যান" : "পরবর্তী সেন্টারে যান"}
            >
              <span>স্কিপ</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 4-Status Disposition Touch Targets (Minimum 48x48dp per RFC Lens 1) */}
          <div className="disposition-grid">
            <button
              type="button"
              className="btn-disp btn-disp-called"
              disabled={submittingStatus}
              onClick={() => handleDisposition(currentCenter.status === 'New' ? 'Cold' : currentCenter.status)}
              title="সাধারণ কল সম্পন্ন (নোট সংরক্ষণ)"
            >
              <PhoneCall size={18} />
              <div className="disp-label-wrap">
                <span className="disp-title">📞 কল সম্পন্ন</span>
                <span className="disp-sub">নোট সেভ ও নেক্সট</span>
              </div>
            </button>

            <button
              type="button"
              className="btn-disp btn-disp-eager"
              disabled={submittingStatus}
              onClick={() => handleDisposition('Eager')}
              title="পার্টনার হতে আগ্রহী (অনার রিভিউয়ে যাবে)"
            >
              <Flame size={18} />
              <div className="disp-label-wrap">
                <span className="disp-title">🔥 আগ্রহী</span>
                <span className="disp-sub">অনার রিভিউ গেট</span>
              </div>
            </button>

            <button
              type="button"
              className="btn-disp btn-disp-followup"
              disabled={submittingStatus}
              onClick={() => handleDisposition('FollowUp')}
              title="পরে কথা বলতে চান (লং লিড)"
            >
              <Clock size={18} />
              <div className="disp-label-wrap">
                <span className="disp-title">⏳ লং লিড</span>
                <span className="disp-sub">ফলোআপ সময়</span>
              </div>
            </button>

            <button
              type="button"
              className="btn-disp btn-disp-cold"
              disabled={submittingStatus}
              onClick={() => handleDisposition('Rejected')}
              title="আগ্রহ নেই বা ভুল নম্বর (কোল্ড/বাতিল)"
            >
              <XCircle size={18} />
              <div className="disp-label-wrap">
                <span className="disp-title">❌ আগ্রহহীন</span>
                <span className="disp-sub">কোল্ড / বাতিল</span>
              </div>
            </button>
          </div>
        </footer>
      )}

      {/* Calling Scripts Modal */}
      <CallingScriptsModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        centerName={currentCenter?.name}
        district={currentCenter?.district}
      />
    </div>
  );
};
