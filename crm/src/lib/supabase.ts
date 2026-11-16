import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Center, CenterNote, CenterStatus, ProposalReviewItem, CallLog } from '../types';

const SUPABASE_URL = 'https://myuvhvmdftaxvdhrwwmu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JxGaanhRLZCmGhUskHs4LQ_SI1y7aNy';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const LOCAL_STORAGE_KEY = 'KEYSTONE_B2B_CRM_CENTERS_V5';
const LOCAL_REVIEW_QUEUE_KEY = 'KEYSTONE_B2B_REVIEW_QUEUE_V1';
const LOCAL_CALL_LOGS_KEY = 'KEYSTONE_B2B_CALL_LOGS_V1';

let activeTableName: 'b2b_partners' | 'b2b_centers' = 'b2b_centers';

export async function checkActiveTable(): Promise<'b2b_partners' | 'b2b_centers'> {
  try {
    const { data, error } = await supabase.from('b2b_partners').select('id').limit(1);
    if (!error) {
      activeTableName = 'b2b_partners';
      return 'b2b_partners';
    }
  } catch (e) {
    // fallback
  }
  activeTableName = 'b2b_centers';
  return 'b2b_centers';
}

/**
 * Fetch all centers with Supabase priority + localStorage / data.json fallback
 */
export async function fetchAllCenters(): Promise<{ centers: Center[]; source: 'supabase' | 'local' | 'bundled' }> {
  await checkActiveTable();

  try {
    // Supabase query
    const { data, error } = await supabase
      .from(activeTableName)
      .select('*')
      .order('id', { ascending: true })
      .limit(1000);

    if (!error && data && data.length > 0) {
      const formatted: Center[] = data.map((row: any) => normalizeCenterRow(row));
      // Update local cache
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
      } catch (e) {
        // quota exceeded or private mode
      }
      return { centers: formatted, source: 'supabase' };
    }
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to local storage:', err);
  }

  // Fallback 1: LocalStorage
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { centers: parsed, source: 'local' };
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback 2: Bundled data.json
  try {
    const res = await fetch('/data.json');
    if (res.ok) {
      const bundled = await res.json();
      if (Array.isArray(bundled)) {
        const mapped = bundled.map((b: any) => normalizeCenterRow(b));
        return { centers: mapped, source: 'bundled' };
      }
    }
  } catch (e) {
    console.error('Failed to load bundled data.json:', e);
  }

  return { centers: [], source: 'local' };
}

export function normalizeCenterRow(row: any): Center {
  const notes = Array.isArray(row.notes) ? row.notes : [];
  
  // Normalize status string
  let status: CenterStatus = 'Cold';
  const rawStatus = (row.status || '').toLowerCase();
  if (rawStatus === 'eager' || rawStatus === 'hot') status = 'Eager';
  else if (rawStatus === 'followup' || rawStatus === 'follow_up') status = 'FollowUp';
  else if (rawStatus === 'rejected') status = 'Rejected';
  else if (rawStatus === 'partnered') status = 'Partnered';
  else if (rawStatus === 'new') status = 'New';
  else status = 'Cold';

  return {
    id: row.id,
    name: row.name || 'Unnamed Center',
    district: row.district || 'Unknown',
    phone: row.phone || '',
    url: row.url || row.link || '',
    link: row.link || row.url || '',
    status,
    priority: row.priority || 'Medium',
    lastContact: row.lastContact || row.last_contact_at || '',
    followUpDate: row.followUpDate || row.follow_up_date || '',
    employee: row.employee || row.assigned_caller_pin || '',
    directorName: row.director_name || row.directorName || row.contact_person || '',
    contactPerson: row.contact_person || row.director_name || '',
    truecallerName: row.truecaller_name || '',
    truecallerResolvedAt: row.truecaller_resolved_at || '',
    notes,
    studentCount: row.studentCount || 0,
    referredStudents: row.referredStudents || 0,
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Log call outcome and update status
 */
export async function logCallOutcome(
  centerId: string,
  newStatus: CenterStatus,
  noteText: string,
  callerPin: string,
  callerName: string,
  followUpDate?: string,
  options?: { skipReviewQueue?: boolean }
): Promise<{ success: boolean; center?: Center; error?: string }> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
  });

  const newNote: CenterNote = {
    date: dateStr,
    text: noteText,
    author: `${callerName} (${callerPin})`,
  };

  // 1. Update in LocalStorage first (optimistic response)
  let updatedCenter: Center | null = null;
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed: Center[] = JSON.parse(local);
      const idx = parsed.findIndex(c => c.id === centerId);
      if (idx !== -1) {
        parsed[idx].status = newStatus;
        parsed[idx].lastContact = dateStr;
        parsed[idx].employee = callerPin;
        if (followUpDate) parsed[idx].followUpDate = followUpDate;
        parsed[idx].notes = [...(parsed[idx].notes || []), newNote];
        parsed[idx].updated_at = now.toISOString();
        updatedCenter = parsed[idx];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Insert into Call Logs (local + Supabase)
  const callLog: CallLog = {
    partner_id: centerId,
    caller_pin: callerPin,
    caller_name: callerName,
    status: newStatus.toLowerCase(),
    notes: noteText,
    callback_date: followUpDate || undefined,
    created_at: now.toISOString(),
  };
  saveLocalCallLog(callLog);

  // 3. If status is Eager, add to Mandatory Owner Review Queue unless explicitly bypassed
  if (newStatus === 'Eager' && updatedCenter && !options?.skipReviewQueue) {
    await queueProposalForReview({
      id: crypto.randomUUID ? crypto.randomUUID() : 'review-' + Date.now(),
      partner_id: centerId,
      partner_name: updatedCenter.name,
      district: updatedCenter.district,
      phone: updatedCenter.phone,
      director_name: updatedCenter.directorName || '',
      submitted_by_caller_name: callerName,
      submitted_by_caller_pin: callerPin,
      caller_notes: noteText,
      status: 'pending',
      created_at: now.toISOString(),
    });
  }

  // 4. Persist to Supabase
  try {
    const payload: any = {
      status: newStatus,
      lastContact: dateStr,
      employee: callerPin,
      notes: updatedCenter?.notes || [newNote],
      updated_at: now.toISOString(),
    };
    if (followUpDate) payload.followUpDate = followUpDate;

    // Table specific schema adjustments
    if (activeTableName === 'b2b_partners') {
      await supabase.from('b2b_partners').update({
        status: newStatus.toLowerCase(),
        last_contact_at: now.toISOString(),
        assigned_caller_pin: callerPin,
        notes: payload.notes,
        updated_at: now.toISOString(),
      }).eq('id', centerId);

      // Log in b2b_call_logs table
      await supabase.from('b2b_call_logs').insert([callLog]);
    } else {
      await supabase.from('b2b_centers').update(payload).eq('id', centerId);
    }

    return { success: true, center: updatedCenter || undefined };
  } catch (err: any) {
    console.warn('Supabase update failed, saved to local store:', err);
    return { success: true, center: updatedCenter || undefined };
  }
}

/**
 * Queue eager proposal for owner audit
 */
export async function queueProposalForReview(item: ProposalReviewItem): Promise<void> {
  // Local queue storage
  try {
    const existing = getLocalProposalQueue();
    // remove existing pending for same center if any
    const filtered = existing.filter(x => x.partner_id !== item.partner_id || x.status === 'dispatched');
    filtered.unshift(item);
    localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    // ignore
  }

  // Supabase proposal_review_queue
  try {
    await supabase.from('proposal_review_queue').insert([{
      partner_id: item.partner_id,
      partner_name: item.partner_name,
      district: item.district,
      phone: item.phone,
      director_name: item.director_name || '',
      submitted_by_caller_name: item.submitted_by_caller_name,
      submitted_by_caller_pin: item.submitted_by_caller_pin,
      caller_notes: item.caller_notes,
      status: 'pending',
      created_at: item.created_at,
    }]);
  } catch (e) {
    // Supabase table might not exist yet, local queue takes care of it
  }
}

export function getLocalProposalQueue(): ProposalReviewItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEW_QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Fetch owner review queue with resilient local merge
 */
export async function fetchProposalReviewQueue(): Promise<ProposalReviewItem[]> {
  try {
    const { data, error } = await supabase
      .from('proposal_review_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(data));
      return data as ProposalReviewItem[];
    }
  } catch (e) {
    // ignore
  }

  // Fallback: derive and sync with local queue
  const local = getLocalProposalQueue();
  const centersLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (centersLocal) {
    try {
      const centers: Center[] = JSON.parse(centersLocal);
      const eagerOnes = centers.filter(c => c.status === 'Eager');
      const existingPartnerIds = new Set(local.map(q => q.partner_id));
      let hasNew = false;

      for (const c of eagerOnes) {
        if (!existingPartnerIds.has(c.id)) {
          local.push({
            id: 'derived-' + c.id,
            partner_id: c.id,
            partner_name: c.name,
            district: c.district,
            phone: c.phone,
            director_name: c.directorName || '',
            submitted_by_caller_pin: c.employee || '3001',
            submitted_by_caller_name: c.employee ? `Caller (${c.employee})` : 'Caller',
            caller_notes: c.notes?.slice(-1)[0]?.text || 'Interested in European study corridors',
            status: 'pending',
            created_at: c.lastContact || new Date().toISOString(),
          });
          hasNew = true;
        }
      }

      if (hasNew || local.length > 0) {
        localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(local));
      }
      if (local.length > 0) return local;
    } catch (e) {
      // ignore
    }
  }

  return local;
}

/**
 * Approve or reject a proposal in the review queue
 */
export async function updateProposalReviewStatus(
  queueId: string,
  newStatus: 'approved' | 'rejected',
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  
  // Local storage update
  const queue = getLocalProposalQueue();
  const cleanId = queueId.replace(/^derived-/, '').replace(/^direct-/, '');
  const idx = queue.findIndex(q => q.id === queueId || q.partner_id === queueId || q.partner_id === cleanId);
  
  if (idx !== -1) {
    queue[idx].status = newStatus;
    queue[idx].reviewed_at = now;
    if (notes) queue[idx].review_notes = notes;
    localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(queue));
  } else {
    // If not yet present in queue, derive from centers and insert
    const centersLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (centersLocal) {
      try {
        const centers: Center[] = JSON.parse(centersLocal);
        const c = centers.find(x => x.id === cleanId || x.id === queueId);
        if (c) {
          queue.unshift({
            id: queueId,
            partner_id: c.id,
            partner_name: c.name,
            district: c.district,
            phone: c.phone,
            director_name: c.directorName || '',
            submitted_by_caller_pin: c.employee || '3001',
            submitted_by_caller_name: c.employee ? `Caller (${c.employee})` : 'Caller',
            caller_notes: c.notes?.slice(-1)[0]?.text || '',
            status: newStatus,
            reviewed_at: now,
            review_notes: notes || '',
            created_at: now,
          });
          localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(queue));
        }
      } catch (e) {}
    }
  }

  // Supabase update
  try {
    await supabase.from('proposal_review_queue').update({
      status: newStatus,
      reviewed_at: now,
      review_notes: notes || '',
      updated_at: now,
    }).or(`id.eq.${queueId},partner_id.eq.${cleanId}`);
  } catch (e) {
    // ignore
  }
}

/**
 * Mark proposal as dispatched to WhatsApp
 */
export async function markProposalDispatched(queueId: string, partnerId: string): Promise<void> {
  const now = new Date().toISOString();
  const cleanId = queueId.replace(/^derived-/, '').replace(/^direct-/, '');

  // Local storage update
  const queue = getLocalProposalQueue();
  const idx = queue.findIndex(q => q.id === queueId || q.partner_id === partnerId || q.partner_id === cleanId);
  if (idx !== -1) {
    queue[idx].status = 'dispatched';
    queue[idx].whatsapp_dispatched_at = now;
    localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(queue));
  } else {
    const centersLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (centersLocal) {
      try {
        const centers: Center[] = JSON.parse(centersLocal);
        const c = centers.find(x => x.id === partnerId || x.id === cleanId);
        if (c) {
          queue.unshift({
            id: queueId,
            partner_id: c.id,
            partner_name: c.name,
            district: c.district,
            phone: c.phone,
            director_name: c.directorName || '',
            status: 'dispatched',
            whatsapp_dispatched_at: now,
            reviewed_at: now,
            created_at: now,
          });
          localStorage.setItem(LOCAL_REVIEW_QUEUE_KEY, JSON.stringify(queue));
        }
      } catch (e) {}
    }
  }

  try {
    await supabase.from('proposal_review_queue').update({
      status: 'dispatched',
      whatsapp_dispatched_at: now,
      updated_at: now,
    }).or(`id.eq.${queueId},partner_id.eq.${partnerId},partner_id.eq.${cleanId}`);
  } catch (e) {
    // ignore
  }
}

/**
 * Concurrency Leasing RPC: lease a batch of centers with row locks (FOR UPDATE SKIP LOCKED)
 */
export async function leaseB2BBatch(params: {
  callerPin: string;
  userId?: string;
  batchSize?: number;
  leaseMinutes?: number;
  district?: string;
  hubDistricts?: string[];
}): Promise<{ centers: Center[]; leasedCount: number; source: 'rpc' | 'local' }> {
  const { callerPin, userId, batchSize = 30, leaseMinutes = 45, district, hubDistricts } = params;

  try {
    const { data, error } = await supabase.rpc('lease_b2b_batch', {
      p_user_id: userId || null,
      p_caller_pin: callerPin,
      p_batch_size: batchSize,
      p_lease_minutes: leaseMinutes,
      p_district: district || null,
      p_hub_districts: hubDistricts && hubDistricts.length > 0 ? hubDistricts : null,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      const leasedCenters = data.map((row: any) => normalizeCenterRow(row));
      return { centers: leasedCenters, leasedCount: leasedCenters.length, source: 'rpc' };
    }
  } catch (e) {
    console.warn('lease_b2b_batch RPC not available or failed, falling back to territorial slice:', e);
  }

  // Local fallback: return uncalled/follow_up centers for this caller's territory
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const all: Center[] = JSON.parse(local);
      const eligible = all.filter((c) => {
        if (hubDistricts && hubDistricts.length > 0 && !hubDistricts.includes(c.district)) return false;
        if (district && c.district !== district) return false;
        return c.status === 'Cold' || c.status === 'FollowUp' || c.status === 'New';
      });
      const slice = eligible.slice(0, batchSize);
      return { centers: slice, leasedCount: slice.length, source: 'local' };
    } catch (e) {}
  }

  return { centers: [], leasedCount: 0, source: 'local' };
}

/**
 * Enrich & update Director Name and Truecaller metadata
 */
export async function updateDirectorInfo(
  centerId: string,
  directorName: string,
  truecallerName?: string
): Promise<void> {
  const now = new Date().toISOString();

  // Update in local cache
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed: Center[] = JSON.parse(local);
      const c = parsed.find(x => x.id === centerId);
      if (c) {
        c.directorName = directorName;
        if (truecallerName) c.truecallerName = truecallerName;
        c.truecallerResolvedAt = now;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      // ignore
    }
  }

  // Update in Supabase
  try {
    if (activeTableName === 'b2b_partners') {
      await supabase.from('b2b_partners').update({
        director_name: directorName,
        contact_person: directorName,
        truecaller_name: truecallerName || directorName,
        truecaller_resolved_at: now,
        updated_at: now,
      }).eq('id', centerId);
    } else {
      // In b2b_centers, store in contact_person or notes
      await supabase.from('b2b_centers').update({
        employee: directorName,
        updated_at: now,
      }).eq('id', centerId);
    }
  } catch (e) {
    // ignore
  }
}

function saveLocalCallLog(log: CallLog): void {
  try {
    const raw = localStorage.getItem(LOCAL_CALL_LOGS_KEY);
    const logs: CallLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(log);
    // keep up to 1000 logs locally
    if (logs.length > 1000) logs.length = 1000;
    localStorage.setItem(LOCAL_CALL_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    // ignore
  }
}

export function getLocalCallLogs(): CallLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_CALL_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
}
