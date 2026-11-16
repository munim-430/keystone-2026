import React, { useState, useEffect, useCallback } from 'react';
import { Center, ProposalReviewItem, User } from './types';
import {
  fetchAllCenters,
  fetchProposalReviewQueue,
  normalizeCenterRow,
  supabase,
} from './lib/supabase';
import { PinAuthModal } from './components/PinAuthModal';
import { CallerInterface } from './components/CallerInterface';
import { OwnerDashboard } from './components/OwnerDashboard';
import { Shield, Smartphone, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const AUTH_STORAGE_KEY = 'KEYSTONE_AUTH_USER_V1';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ProposalReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'local' | 'bundled'>('local');
  const [isCallerViewPreview, setIsCallerViewPreview] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Restore authenticated session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Online / Offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load Initial Centers & Queue
  const loadData = useCallback(async () => {
    setLoading(true);
    const { centers: fetchedCenters, source } = await fetchAllCenters();
    setCenters(fetchedCenters);
    setDataSource(source);

    const queue = await fetchProposalReviewQueue();
    setReviewQueue(queue);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime Supabase Channel (Subscribes to both b2b_partners & b2b_centers)
  useEffect(() => {
    const handleUpdate = (payload: any) => {
      if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && payload.new) {
        const normalized = normalizeCenterRow(payload.new);
        setCenters((prev) =>
          prev.map((c) => (c.id === normalized.id ? { ...c, ...normalized } : c))
        );
      }
    };

    const channel = supabase
      .channel('keystone_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'b2b_partners' },
        handleUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'b2b_centers' },
        handleUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposal_review_queue' },
        () => {
          fetchProposalReviewQueue().then(setReviewQueue);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handlers
  const handleAuthenticated = (authUser: User) => {
    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsCallerViewPreview(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const handleCenterUpdated = (updated: Center) => {
    setCenters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    fetchProposalReviewQueue().then(setReviewQueue);
  };

  const refreshQueue = async () => {
    const queue = await fetchProposalReviewQueue();
    setReviewQueue(queue);
  };

  if (!user) {
    return <PinAuthModal isOpen={true} onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="keystone-app-root">
      {/* Admin Caller-Preview Banner */}
      {user.role === 'admin' && isCallerViewPreview && (
        <div className="admin-preview-banner">
          <div className="banner-left">
            <Smartphone size={16} />
            <span>
              <strong>এডমিন মোড:</strong> আপনি বর্তমানে কলার ইন্টারফেস প্রিভিউ করছেন।
            </span>
          </div>
          <button
            type="button"
            className="btn btn-return-cockpit"
            onClick={() => setIsCallerViewPreview(false)}
          >
            <Shield size={14} />
            <span>এক্সিকিউটিভ ককপিটে ফিরে যান</span>
          </button>
        </div>
      )}

      {/* Network / Sync Status Floating Pill */}
      <div className="network-status-pill">
        {isOnline ? (
          <span className="net-status-online">
            <Wifi size={12} />
            <span>ক্লাউড সিঙ্ক: {dataSource === 'supabase' ? 'সরাসরি পোস্টগ্রেস' : 'লোকাল ব্যাকআপ'}</span>
          </span>
        ) : (
          <span className="net-status-offline">
            <WifiOff size={12} />
            <span>অফলাইন মোড</span>
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && centers.length === 0 ? (
        <div className="initial-loader">
          <RefreshCw size={28} className="animate-spin text-cerulean mb-3" />
          <p>৮৫৯টি কোচিং সেন্টারের ডেটা সিঙ্ক হচ্ছে...</p>
        </div>
      ) : user.role === 'admin' && !isCallerViewPreview ? (
        <OwnerDashboard
          user={user}
          centers={centers}
          reviewQueue={reviewQueue}
          onCenterUpdated={handleCenterUpdated}
          onQueueUpdated={refreshQueue}
          onSwitchToCallerView={() => setIsCallerViewPreview(true)}
          onLogout={handleLogout}
        />
      ) : (
        <CallerInterface
          user={user}
          centers={centers}
          onCenterUpdated={handleCenterUpdated}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};
