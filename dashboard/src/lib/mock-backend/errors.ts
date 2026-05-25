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

export type EmployeeValidationCode = 'pinfl-taken' | 'email-taken';

export class EmployeeValidationError extends Error {
  readonly code: EmployeeValidationCode;
  constructor(code: EmployeeValidationCode) {
    super(`Employee validation failed: ${code}`);
    this.name = 'EmployeeValidationError';
    this.code = code;
  }
}

export function maybeFail(probability = 0.03): void {
  if (Math.random() < probability) throw new MockNetworkError();
}
