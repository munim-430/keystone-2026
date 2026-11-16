import React, { useState, useMemo } from 'react';
import { Center, CenterStatus, ProposalReviewItem, User } from '../types';
import { CALLER_HUBS, ALL_DISTRICTS, POPULAR_DISTRICTS, generateProposalCopy } from '../constants';
import {
  updateProposalReviewStatus,
  markProposalDispatched,
  logCallOutcome,
} from '../lib/supabase';
import { lookupTruecaller } from '../lib/truecaller';
import {
  Flame,
  Clock,
  XCircle,
  PhoneCall,
  Search,
  MessageCircle,
  CheckCircle,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  Award,
  RefreshCw,
  Phone,
  Filter,
  FileText,
  Eye,
  Calendar,
  Send,
} from 'lucide-react';

interface OwnerDashboardProps {
  user: User;
  centers: Center[];
  reviewQueue: ProposalReviewItem[];
  onCenterUpdated: (center: Center) => void;
  onQueueUpdated: () => void;
  onSwitchToCallerView: () => void;
  onLogout: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  user,
  centers,
  reviewQueue,
  onCenterUpdated,
  onQueueUpdated,
  onSwitchToCallerView,
  onLogout,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'queue' | 'directory' | 'leaderboard'>('queue');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Proposal modal state
  const [activeProposal, setActiveProposal] = useState<{
    queueId: string;
    centerId: string;
    centerName: string;
    phone: string;
    directorName?: string;
  } | null>(null);
  const [proposalCopy, setProposalCopy] = useState<string>('');

  // Truecaller resolving state
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // --- Nationwide KPI Metrics ---
  const kpis = useMemo(() => {
    let totalCalled = 0;
    let eager = 0;
    let longLeads = 0;
    let rejected = 0;
    let partnered = 0;

    centers.forEach((c) => {
      if (c.notes && c.notes.length > 0) totalCalled++;
      if (c.status === 'Eager') eager++;
      else if (c.status === 'FollowUp') longLeads++;
      else if (c.status === 'Cold' || c.status === 'Rejected') rejected++;
      else if (c.status === 'Partnered') partnered++;
    });

    const pendingQueueCount = reviewQueue.filter((q) => q.status === 'pending').length;

    return {
      total: centers.length,
      totalCalled,
      eager,
      longLeads,
      rejected,
      partnered,
      pendingQueueCount,
      conversionRate: totalCalled > 0 ? ((eager / totalCalled) * 100).toFixed(1) : '0.0',
    };
  }, [centers, reviewQueue]);

  // --- Caller Performance Leaderboard ---
  const leaderboard = useMemo(() => {
    const callerKeys: Array<{ key: string; name: string; hubId: 'CALLER_1' | 'CALLER_2' | 'CALLER_3' }> = [
      { key: '3001', name: 'কলার ১ (ইস্টার্ন হাব)', hubId: 'CALLER_1' },
      { key: '3002', name: 'কলার ২ (নর্দার্ন হাব)', hubId: 'CALLER_2' },
      { key: '3003', name: 'কলার ৩ (সাউদার্ন হাব)', hubId: 'CALLER_3' },
    ];

    return callerKeys.map((c) => {
      const hubDistricts = CALLER_HUBS[c.hubId].districts;
      const hubCenters = centers.filter((center) => hubDistricts.includes(center.district));

      let calledCount = 0;
      let eagerCount = 0;
      let followUpCount = 0;
      let rejectedCount = 0;

      hubCenters.forEach((center) => {
        const hasNotes = center.notes && center.notes.length > 0;
        const touchedByCaller = center.employee === c.key || hasNotes;
        if (touchedByCaller && hasNotes) calledCount++;
        if (center.status === 'Eager') eagerCount++;
        else if (center.status === 'FollowUp') followUpCount++;
        else if (center.status === 'Cold' || center.status === 'Rejected') rejectedCount++;
      });

      const conversion = calledCount > 0 ? ((eagerCount / calledCount) * 100).toFixed(1) : '0.0';

      return {
        callerPin: c.key,
        callerName: c.name,
        hubName: CALLER_HUBS[c.hubId].name,
        territory: CALLER_HUBS[c.hubId].desc,
        totalAssigned: hubCenters.length,
        calledCount,
        eagerCount,
        followUpCount,
        rejectedCount,
        conversion,
      };
    });
  }, [centers]);

  // --- Filtered Center Directory ---
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      if (selectedDistrict !== 'ALL' && c.district !== selectedDistrict) return false;
      if (selectedStatus !== 'ALL' && c.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mPhone = c.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        const mDistrict = c.district.toLowerCase().includes(q);
        const mDirector = (c.directorName || '').toLowerCase().includes(q);
        if (!mName && !mPhone && !mDistrict && !mDirector) return false;
      }
      return true;
    });
  }, [centers, selectedDistrict, selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filteredCenters.length / pageSize) || 1;
  const paginatedCenters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCenters.slice(start, start + pageSize);
  }, [filteredCenters, currentPage]);

  // Handle Review Queue Action: Approve
  const handleApprove = async (item: ProposalReviewItem) => {
    await updateProposalReviewStatus(item.id, 'approved', 'Approved by owner Hasibul Munim');
    onQueueUpdated();
    // Open proposal modal for immediate 1-click dispatch
    openProposalModal(item.id, item.partner_id, item.partner_name, item.phone, item.director_name);
  };

  // Handle Review Queue Action: Reject
  const handleReject = async (item: ProposalReviewItem) => {
    await updateProposalReviewStatus(item.id, 'rejected', 'Rejected by owner review');
    onQueueUpdated();
  };

  // Open WhatsApp Dispatch Modal
  const openProposalModal = (
    queueId: string,
    centerId: string,
    centerName: string,
    phone: string,
    directorName?: string
  ) => {
    const text = generateProposalCopy(centerName, directorName);
    setProposalCopy(text);
    setActiveProposal({ queueId, centerId, centerName, phone, directorName });
  };

  // Send WhatsApp Proposal
  const handleDispatchWhatsApp = async () => {
    if (!activeProposal) return;
    const clean = activeProposal.phone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 8) {
      alert('সেন্টারটির সঠিক ফোন নম্বর নেই। হোয়াটসঅ্যাপ বার্তা পাঠানো সম্ভব নয়।');
      return;
    }
    const waPhone = clean.startsWith('88') ? clean : `88${clean}`;
    const enc = encodeURIComponent(proposalCopy);

    // Native URI with wa.me fallback
    const nativeUri = `whatsapp://send?phone=${waPhone}&text=${enc}`;
    const webUri = `https://wa.me/${waPhone}?text=${enc}`;

    // Mark as dispatched
    await markProposalDispatched(activeProposal.queueId, activeProposal.centerId);
    onQueueUpdated();

    // Log in partner notes with skipReviewQueue: true (prevents infinite re-queueing)
    const outcome = await logCallOutcome(
      activeProposal.centerId,
      'Eager',
      'অফিশিয়াল হোয়াটসঅ্যাপ পার্টনারশিপ প্রপোজাল ডিসপ্যাচ করা হয়েছে।',
      user.pin,
      user.name,
      undefined,
      { skipReviewQueue: true }
    );
    if (outcome.success && outcome.center) {
      onCenterUpdated(outcome.center);
    }

    // Launch WhatsApp
    window.open(webUri, '_blank');
    setActiveProposal(null);
  };

  // Truecaller resolution for any center in table
  const handleResolveTruecaller = async (center: Center) => {
    setResolvingId(center.id);
    const res = await lookupTruecaller(center.phone, center.id);
    setResolvingId(null);

    if (res.success && res.name) {
      const updated: Center = {
        ...center,
        directorName: res.name,
        contactPerson: res.name,
        truecallerName: res.name,
      };
      onCenterUpdated(updated);
    } else {
      window.open(res.webSearchUrl, '_blank');
    }
  };

  return (
    <div className="owner-layout">
      {/* Top Navbar */}
      <header className="owner-navbar">
        <div className="owner-nav-container">
          <div className="owner-brand">
            <img src="/keystone_logo_official.png" alt="Keystone" className="brand-logo-img" />
            <div className="brand-titles">
              <h1>
                KEYSTONE <span>COMMAND</span>
              </h1>
              <p>দেশব্যাপী B2B আউটরিচ ও এক্সিকিউটিভ ড্যাশবোর্ড</p>
            </div>
            <span className="owner-badge">
              <ShieldCheck size={12} />
              <span>এডমিন প্যানেল</span>
            </span>
          </div>

          <div className="owner-nav-actions">
            <button
              type="button"
              className="btn btn-caller-preview"
              onClick={onSwitchToCallerView}
              title="কলার ভিউতে গিয়ে নিজে কল করুন বা প্রিভিউ দেখুন"
            >
              <Eye size={14} />
              <span>কলার ভিউ প্রিভিউ</span>
            </button>
            <a
              href="/Keystone_IELTS_Center_Partnership_Proposal.pdf"
              target="_blank"
              rel="noreferrer"
              className="btn btn-pdf-view"
              title="অফিশিয়াল পার্টনারশিপ পিডিএফ দেখুন"
            >
              <FileText size={14} />
              <span>পিডিএফ প্রপোজাল</span>
            </a>
            <button
              type="button"
              className="btn btn-logout-owner"
              onClick={onLogout}
              title="লগআউট"
            >
              লগআউট
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="owner-main-content">
        {/* Nationwide Real-Time KPI Cards Bar */}
        <section className="nationwide-kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-box text-cerulean">🏢</div>
            <div className="kpi-data">
              <span className="kpi-value">{kpis.total}</span>
              <span className="kpi-label">সারাদেশের সেন্টার</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box text-sky">
              <PhoneCall size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{kpis.totalCalled}</span>
              <span className="kpi-label">মোট কল সম্পন্ন</span>
            </div>
          </div>

          <div className="kpi-card kpi-card-eager">
            <div className="kpi-icon-box text-magenta">
              <Flame size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{kpis.eager}</span>
              <span className="kpi-label">🔥 আগ্রহী (Eager)</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box text-amber">
              <Clock size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{kpis.longLeads}</span>
              <span className="kpi-label">⏳ লং লিড (Follow Up)</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box text-rose">
              <XCircle size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{kpis.rejected}</span>
              <span className="kpi-label">❌ আগ্রহহীন / কোল্ড</span>
            </div>
          </div>

          <div className="kpi-card kpi-card-conversion">
            <div className="kpi-icon-box text-green">
              <TrendingUp size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{kpis.conversionRate}%</span>
              <span className="kpi-label">আগ্রহীর কনভার্শন রেট</span>
            </div>
          </div>
        </section>

        {/* Navigation Tabs (Review Queue, Leaderboard, Directory) */}
        <div className="owner-tab-nav">
          <button
            type="button"
            className={`owner-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <Flame size={16} />
            <span>অনার রিভিউ কিউ (Review Queue)</span>
            {kpis.pendingQueueCount > 0 && (
              <span className="queue-pill-count">{kpis.pendingQueueCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`owner-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Award size={16} />
            <span>কলার পারফরম্যান্স লিডারবোর্ড</span>
          </button>

          <button
            type="button"
            className={`owner-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <Filter size={16} />
            <span>সকল ৮৫৯ সেন্টার ডিরেক্টরি</span>
          </button>
        </div>

        {/* TAB 1: MANDATORY OWNER REVIEW QUEUE */}
        {activeTab === 'queue' && (
          <section className="review-queue-section">
            <div className="section-header-banner">
              <div>
                <h2>🚨 ম্যান্ডাটরি অনার রিভিউ ও অফার ডিসপ্যাচ গেট</h2>
                <p>
                  টেলিকলাররা যাদেরকে আগ্রহী হিসেবে চিহ্নিত করেছে—তাদেরকে কোনো অফিশিয়াল প্রস্তাব
                  পাঠানোর আগে অনারের নিরীক্ষা ও অনুমোদন আবশ্যক।
                </p>
              </div>
              <span className="review-stat-badge">
                পেন্ডিং রিভিউ: {kpis.pendingQueueCount} টি সেন্টার
              </span>
            </div>

            {reviewQueue.length === 0 ? (
              <div className="empty-queue-box">
                <CheckCircle size={32} className="text-green mb-2" />
                <p>সব রিভিউ সম্পন্ন হয়েছে! এই মুহূর্তে কোনো পেন্ডিং সেন্টার নেই।</p>
              </div>
            ) : (
              <div className="review-cards-grid">
                {reviewQueue.map((item) => {
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isDispatched = item.status === 'dispatched';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item.id}
                      className={`review-card ${isPending ? 'border-pending' : ''} ${
                        isApproved ? 'border-approved' : ''
                      } ${isDispatched ? 'border-dispatched' : ''}`}
                    >
                      <div className="review-card-top">
                        <div>
                          <h3 className="review-center-name">{item.partner_name}</h3>
                          <div className="review-meta-line">
                            <span className="district-chip">{item.district}</span>
                            <span className="phone-chip">📞 {item.phone}</span>
                            {item.director_name && (
                              <span className="director-chip">
                                👤 পরিচালক: {item.director_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`review-status-tag tag-${item.status}`}>
                          {isPending && '⏳ পেন্ডিং অনার রিভিউ'}
                          {isApproved && '✅ অনুমোদিত (পাঠানোর জন্য প্রস্তুত)'}
                          {isDispatched && '🚀 হোয়াটসঅ্যাপে প্রেরিত'}
                          {isRejected && '❌ বাতিলকৃত'}
                        </span>
                      </div>

                      {/* Caller Submission Details */}
                      <div className="caller-notes-box">
                        <div className="caller-meta">
                          <span className="caller-author">
                            👩‍💼 সাবমিটকারী: {item.submitted_by_caller_name || 'টেলিকলার'}
                          </span>
                          <span className="caller-time">
                            {new Date(item.created_at).toLocaleString('bn-BD')}
                          </span>
                        </div>
                        <p className="caller-note-text">
                          {item.caller_notes || 'আউটরিচ কলে পার্টনারশিপে আগ্রহ প্রকাশ করেছেন।'}
                        </p>
                      </div>

                      {/* Owner Action Gate */}
                      <div className="review-card-actions">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              className="btn btn-approve-gate"
                              onClick={() => handleApprove(item)}
                            >
                              <CheckCircle size={15} />
                              <span>অনুমোদন ও হোয়াটসঅ্যাপ অফার পাঠান</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-reject-gate"
                              onClick={() => handleReject(item)}
                            >
                              <X size={15} />
                              <span>বাতিল / আরও তথ্য চান</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            className="btn btn-dispatch-ready"
                            onClick={() =>
                              openProposalModal(
                                item.id,
                                item.partner_id,
                                item.partner_name,
                                item.phone,
                                item.director_name
                              )
                            }
                          >
                            <MessageCircle size={15} />
                            <span>১-ক্লিক হোয়াটসঅ্যাপ অফার পাঠান</span>
                          </button>
                        )}

                        {isDispatched && (
                          <div className="dispatched-indicator">
                            <CheckCircle size={14} className="text-green" />
                            <span>
                              অফিশিয়াল প্রপোজাল ডিসপ্যাচ করা হয়েছে (
                              {item.whatsapp_dispatched_at
                                ? new Date(item.whatsapp_dispatched_at).toLocaleDateString(
                                    'bn-BD'
                                  )
                                : 'আজ'}
                              )
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: CALLER PERFORMANCE LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <section className="leaderboard-section">
            <div className="section-header-banner">
              <div>
                <h2>🏆 টেলিকলার পারফরম্যান্স লিডারবোর্ড ও হাব মেট্রিক্স</h2>
                <p>
                  ৩ জন ফিল্ড কলারের দৈনিক কল ভলিউম, আগ্রহীদের সংখ্যা এবং রিয়েল-টাইম কনভার্শন রেট।
                </p>
              </div>
            </div>

            <div className="leaderboard-grid">
              {leaderboard.map((lb, idx) => (
                <div key={lb.callerPin} className="leaderboard-card">
                  <div className="lb-header">
                    <div className="lb-rank">#{idx + 1}</div>
                    <div className="lb-caller-info">
                      <h3>{lb.callerName}</h3>
                      <span className="lb-hub-name">{lb.hubName}</span>
                    </div>
                    <div className="lb-rate-badge">
                      <span className="rate-num">{lb.conversion}%</span>
                      <span className="rate-label">কনভার্শন</span>
                    </div>
                  </div>

                  <p className="lb-territory-text">📍 আওতাধীন জেলা: {lb.territory}</p>

                  <div className="lb-metrics-grid">
                    <div className="lb-metric-item">
                      <span className="metric-val text-cerulean">{lb.totalAssigned}</span>
                      <span className="metric-desc">বরাদ্দকৃত সেন্টার</span>
                    </div>
                    <div className="lb-metric-item">
                      <span className="metric-val text-sky">{lb.calledCount}</span>
                      <span className="metric-desc">কল সম্পন্ন</span>
                    </div>
                    <div className="lb-metric-item">
                      <span className="metric-val text-magenta">{lb.eagerCount}</span>
                      <span className="metric-desc">🔥 আগ্রহী (Eager)</span>
                    </div>
                    <div className="lb-metric-item">
                      <span className="metric-val text-amber">{lb.followUpCount}</span>
                      <span className="metric-desc">⏳ লং লিড</span>
                    </div>
                  </div>

                  <div className="lb-progress-bar-wrap">
                    <div
                      className="lb-progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (lb.calledCount / (lb.totalAssigned || 1)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="lb-progress-text">
                    কভারেজ: {((lb.calledCount / (lb.totalAssigned || 1)) * 100).toFixed(1)}% সম্পন্ন
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: ALL CENTERS DIRECTORY */}
        {activeTab === 'directory' && (
          <section className="directory-section">
            {/* Control Strip */}
            <div className="directory-control-bar">
              <div className="search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="সেন্টার, ফোন বা পরিচালকের নাম লিখুন..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="directory-search-input"
                />
              </div>

              <div className="filter-dropdowns">
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">সকল জেলা (৪৯টি জেলা)</option>
                  {ALL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="EAGER">🔥 আগ্রহী (Eager)</option>
                  <option value="FOLLOWUP">⏳ লং লিড (Follow Up)</option>
                  <option value="COLD">❄️ কোল্ড / আগ্রহ নেই</option>
                  <option value="PARTNERED">🤝 পার্টনার</option>
                  <option value="NEW">🆕 নতুন</option>
                </select>
              </div>

              <div className="directory-results-count">
                প্রদর্শিত: {filteredCenters.length} টি সেন্টার
              </div>
            </div>

            {/* Centers Table */}
            <div className="table-responsive-container">
              <table className="centers-data-table">
                <thead>
                  <tr>
                    <th>সেন্টারের নাম</th>
                    <th>জেলা</th>
                    <th>ফোন নম্বর ও Truecaller</th>
                    <th>পরিচালক / কন্টাক্ট</th>
                    <th>স্ট্যাটাস</th>
                    <th>সর্বশেষ নোট</th>
                    <th className="text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCenters.map((c) => {
                    const clean = c.phone.replace(/[^0-9]/g, '');
                    const isResolving = resolvingId === c.id;

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="cell-name-box">
                            <span className="center-primary-name">{c.name}</span>
                            {c.url && (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="center-url-link"
                              >
                                <span>পেজ/ম্যাপ</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="table-district-badge">{c.district}</span>
                        </td>
                        <td>
                          <div className="cell-phone-box">
                            <a href={`tel:${c.phone}`} className="phone-link">
                              📞 {c.phone}
                            </a>
                            <button
                              type="button"
                              className="btn-tc-inline"
                              onClick={() => handleResolveTruecaller(c)}
                              disabled={isResolving || !c.phone}
                              title="Truecaller নাম যাচাই করুন"
                            >
                              <RefreshCw size={10} className={isResolving ? 'animate-spin' : ''} />
                              <span>{isResolving ? 'যাচাই...' : 'Truecaller'}</span>
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="table-director-name">
                            {c.directorName || c.contactPerson || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${c.status.toLowerCase()}`}>
                            {c.status === 'Eager' && '🔥 আগ্রহী'}
                            {c.status === 'FollowUp' && '⏳ ফলোআপ'}
                            {c.status === 'Cold' && '❄️ কোল্ড'}
                            {c.status === 'Rejected' && '❌ বাতিল'}
                            {c.status === 'Partnered' && '🤝 পার্টনার'}
                            {c.status === 'New' && '🆕 নতুন'}
                          </span>
                        </td>
                        <td>
                          <span className="table-last-note">
                            {c.notes?.slice(-1)[0]?.text || 'কোনো নোট নেই'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn-action-send-wa"
                            onClick={() =>
                              openProposalModal(
                                'direct-' + c.id,
                                c.id,
                                c.name,
                                c.phone,
                                c.directorName
                              )
                            }
                            title="১-ক্লিক হোয়াটসঅ্যাপ অফার পাঠান"
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="pagination-info">
                পেজ {currentPage} / {totalPages} (মোট {filteredCenters.length} সেন্টার)
              </span>
              <div className="pagination-buttons">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ◀ আগের পেজ
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  পরের পেজ ▶
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 1-Click WhatsApp Proposal Dispatch Modal */}
      {activeProposal && (
        <div className="modal-backdrop" onClick={() => setActiveProposal(null)}>
          <div className="modal-dialog proposal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <MessageCircle size={18} className="text-magenta" />
                <h3>অফিশিয়াল পার্টনারশিপ প্রস্তাবনা ডিসপ্যাচ</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveProposal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="proposal-modal-body">
              <div className="proposal-recipient-box">
                <span className="recipient-label">প্রাপক সেন্টার:</span>
                <span className="recipient-name">{activeProposal.centerName}</span>
                <span className="recipient-phone">({activeProposal.phone})</span>
              </div>

              <label className="proposal-copy-label">হোয়াটসঅ্যাপ বার্তার খসড়া (সম্পাদনাযোগ্য):</label>
              <textarea
                className="proposal-copy-textarea"
                rows={11}
                value={proposalCopy}
                onChange={(e) => setProposalCopy(e.target.value)}
              />

              <div className="proposal-benefit-highlight">
                💡 <strong>সংযুক্ত অফার:</strong> ৳২,০০০ নিশ্চিত সাইনআপ কমিশন + ৳১৫k–৳২৫k ভিসা বোনাস +
                অফিশিয়াল পিডিএফ প্রপোজাল লিংক।
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-subtle"
                onClick={() => setActiveProposal(null)}
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                className="btn btn-dispatch-whatsapp"
                onClick={handleDispatchWhatsApp}
              >
                <Send size={15} />
                <span>WhatsApp এ পাঠান ও রেকর্ড করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
