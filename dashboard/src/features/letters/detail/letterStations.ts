// BP-3 timeline model. The detail timeline reads actor/date from the letter's
// audit trail (listAudit({ resourceUuid })) rather than denormalising new
// fields onto Letter — the live mutations and the seed both write one audit
// row per transition, so the trail is the single source of truth. This module
// is the pure mapping from (letter, audit rows) → ordered timeline stations
// with past/current/future state. Kept framework-free so the verification
// harness can exercise it directly.

import type { AuditEntry, Letter, LetterStatus } from '@/types/domain';

export type StationKey =
  | 'registered'
  | 'routed'
  | 'assigned'
  | 'started'
  | 'submitted'
  | 'accepted'
  | 'signed'
  | 'dispatched'
  | 'closed'
  | 'closed-no-response';

export type StationState = 'past' | 'current' | 'future';

export interface LetterStation {
  key: StationKey;
  state: StationState;
  /** The audit row that produced this station, when one exists. */
  entry?: AuditEntry;
}

/** How far along the lifecycle a status sits (terminal states share rank 9). */
const STATUS_RANK: Record<LetterStatus, number> = {
  REGISTERED: 1,
  ROUTED: 2,
  ASSIGNED: 3,
  IN_PROGRESS: 4,
  EXECUTED: 5,
  ON_SIGNATURE: 6,
  RESPONDED: 7,
  DISPATCHED: 9,
  CLOSED: 9,
  CLOSED_NO_RESPONSE: 9,
};

/** The single station the next pending action would advance, keyed by status. */
const CURRENT_BY_STATUS: Partial<Record<LetterStatus, StationKey>> = {
  REGISTERED: 'routed',
  ROUTED: 'assigned',
  ASSIGNED: 'started',
  IN_PROGRESS: 'submitted',
  EXECUTED: 'accepted',
  ON_SIGNATURE: 'signed',
  RESPONDED: 'dispatched',
};

function findAction(
  audit: AuditEntry[],
  action: AuditEntry['action'],
  phase?: 'started' | 'submitted',
): AuditEntry | undefined {
  return audit.find(
    (e) =>
      e.action === action &&
      (phase === undefined || e.context?.phase === phase),
  );
}

/**
 * Ordered BP-3 stations for the letter, branching on its execution path:
 * - comment-only (executionComment set) ends at "Qabul qilindi → Yopildi
 *   (javobsiz)" — no signature, no dispatch;
 * - response path runs through the signature station (only when
 *   requiresSignature) and dispatch.
 * Outgoing replies collapse to Ro'yxatga olindi → Jo'natildi.
 */
export function buildLetterStations(letter: Letter, audit: AuditEntry[]): LetterStation[] {
  if (letter.direction === 'OUTGOING') {
    return [
      { key: 'registered', state: 'past' },
      {
        key: 'dispatched',
        state: 'past',
        entry: findAction(audit, 'LETTER_DISPATCHED'),
      },
    ];
  }

  const rank = STATUS_RANK[letter.status];
  const current = CURRENT_BY_STATUS[letter.status];
  const isCommentOnly = Boolean(letter.executionComment);
  const needsSignature = letter.requiresSignature && !isCommentOnly;

  const startedEntry = findAction(audit, 'LETTER_EXECUTED', 'started');

  const state = (key: StationKey, done: boolean): StationState =>
    current === key ? 'current' : done ? 'past' : 'future';

  const stations: LetterStation[] = [];

  stations.push({
    key: 'registered',
    state: 'past',
    entry: findAction(audit, 'LETTER_REGISTERED'),
  });
  stations.push({
    key: 'routed',
    state: state('routed', rank >= 2),
    entry: findAction(audit, 'LETTER_ROUTED'),
  });
  stations.push({
    key: 'assigned',
    state: state('assigned', rank >= 3),
    entry: findAction(audit, 'LETTER_ASSIGNED'),
  });

  // "Ijro boshlandi" is optional — an executor may submit straight from
  // ASSIGNED. Show it only when it actually happened or it's the live step.
  if (startedEntry || letter.status === 'ASSIGNED' || letter.status === 'IN_PROGRESS') {
    stations.push({
      key: 'started',
      state: state('started', Boolean(startedEntry)),
      entry: startedEntry,
    });
  }

  stations.push({
    key: 'submitted',
    state: state('submitted', rank >= 5),
    entry: findAction(audit, 'LETTER_EXECUTED', 'submitted'),
  });
  stations.push({
    key: 'accepted',
    state: state('accepted', rank >= 6),
    entry: findAction(audit, 'LETTER_ACCEPTED'),
  });

  if (needsSignature) {
    stations.push({
      key: 'signed',
      state: state('signed', Boolean(findAction(audit, 'LETTER_SIGNED'))),
      entry: findAction(audit, 'LETTER_SIGNED'),
    });
  }

  if (isCommentOnly) {
    // Acceptance closed it outright; no dispatch.
    stations.push({
      key: 'closed-no-response',
      state: letter.status === 'CLOSED_NO_RESPONSE' ? 'past' : 'future',
    });
  } else {
    stations.push({
      key: 'dispatched',
      state: state('dispatched', letter.status === 'CLOSED'),
      entry: findAction(audit, 'LETTER_DISPATCHED'),
    });
    stations.push({
      key: 'closed',
      state: letter.status === 'CLOSED' ? 'past' : 'future',
    });
  }

  return stations;
}

export { STATUS_RANK };
