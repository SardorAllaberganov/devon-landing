export class MockNetworkError extends Error {
  constructor() {
    super('Network error simulated by mock backend');
    this.name = 'MockNetworkError';
  }
}

export type UnitValidationCode = 'cycle' | 'duplicate-name' | 'max-depth' | 'invalid-parent';

export class UnitValidationError extends Error {
  readonly code: UnitValidationCode;
  constructor(code: UnitValidationCode) {
    super(`Unit validation failed: ${code}`);
    this.name = 'UnitValidationError';
    this.code = code;
  }
}

export type EmployeeValidationCode = 'pinfl-taken' | 'email-taken' | 'order-extract-missing';

export class EmployeeValidationError extends Error {
  readonly code: EmployeeValidationCode;
  constructor(code: EmployeeValidationCode) {
    super(`Employee validation failed: ${code}`);
    this.name = 'EmployeeValidationError';
    this.code = code;
  }
}

export type AssignmentValidationCode = 'workload-exceeded';

export class AssignmentValidationError extends Error {
  readonly code: AssignmentValidationCode;
  constructor(code: AssignmentValidationCode) {
    super(`Assignment validation failed: ${code}`);
    this.name = 'AssignmentValidationError';
    this.code = code;
  }
}

export type CertificateValidationCode = 'serial-taken' | 'pinfl-mismatch';

export class CertificateValidationError extends Error {
  readonly code: CertificateValidationCode;
  constructor(code: CertificateValidationCode) {
    super(`Certificate validation failed: ${code}`);
    this.name = 'CertificateValidationError';
    this.code = code;
  }
}

// Policy layer for milestone-2 documents (CLAUDE.md: per-document
// authorization is enforced in mutations, never by UI hiding alone).
// Every document mutation validates against the *acting* employee uuid.
export type DocumentValidationCode =
  | 'wrong-status' // action not allowed in the current DocumentStatus
  | 'not-creator' // edit/delete/submit by someone other than the creator
  | 'not-participant' // decideApproval by a non-participant of the current round
  | 'out-of-order' // participant exists but an earlier order is still PENDING
  | 'already-decided' // participant already acted this round
  | 'comment-required' // REJECTED without a comment (BP-4 failure-mode rule)
  | 'not-signer' // signDocument by someone other than signerUuid
  | 'not-recipient' // acceptDocument by someone other than recipientUuid
  | 'cert-invalid' // certificate not ACTIVE or not owned by the signer
  | 'not-editable' // update on a non-DRAFT/non-REJECTED document
  | 'not-deletable'; // delete on anything except own DRAFT (§2.2 signed-doc protection)

export class DocumentValidationError extends Error {
  readonly code: DocumentValidationCode;
  constructor(code: DocumentValidationCode) {
    super(`Document validation failed: ${code}`);
    this.name = 'DocumentValidationError';
    this.code = code;
  }
}

// Policy layer for milestone-2 letters (step 20, BPMN 3.3 / BP-3). Same
// contract as documents: every letter mutation validates status + persona
// against the *acting* employee uuid — never UI hiding alone.
export type LetterValidationCode =
  | 'wrong-status' // action not allowed in the current LetterStatus
  | 'not-devonxona' // register/dispatch by someone without ROLE_DEVONXONA
  | 'not-rahbar' // route/sign by someone who heads no root-level unit
  | 'not-unit-head' // assign/accept by someone who heads neither the routed unit nor an ancestor
  | 'not-executor' // execution action by someone other than assignedEmployeeUuid
  | 'comment-required' // comment-only execution with an empty comment (BPMN 7.1)
  | 'missing-response' // response-path execution with neither file nor document (BPMN 7.2)
  | 'cert-invalid'; // certificate not ACTIVE or not owned by the signer

export class LetterValidationError extends Error {
  readonly code: LetterValidationCode;
  constructor(code: LetterValidationCode) {
    super(`Letter validation failed: ${code}`);
    this.name = 'LetterValidationError';
    this.code = code;
  }
}

export type PasswordValidationCode = 'current-wrong';

export class PasswordValidationError extends Error {
  readonly code: PasswordValidationCode;
  constructor(code: PasswordValidationCode) {
    super(`Password validation failed: ${code}`);
    this.name = 'PasswordValidationError';
    this.code = code;
  }
}

export function maybeFail(probability = 0.03): void {
  if (Math.random() < probability) throw new MockNetworkError();
}
