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
