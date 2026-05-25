export class MockNetworkError extends Error {
  constructor() {
    super('Network error simulated by mock backend');
    this.name = 'MockNetworkError';
  }
}

export function maybeFail(probability = 0.03): void {
  if (Math.random() < probability) throw new MockNetworkError();
}
