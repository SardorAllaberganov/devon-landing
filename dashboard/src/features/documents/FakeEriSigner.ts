// Fake ERI signer. No real E-IMZO plugin / WebSocket — the challenge-response
// handshake is simulated with a delay and the "signature" is random hex
// (master §17, same theatre as FakePfxParser). The backend's signDocument
// mints the persisted SignatureRecord itself; this module exists for the
// SignDialog's visible signing ceremony and is deliberately generic so the
// step-21 letter flow reuses it (`resourceUuid` is a document OR letter uuid).

export interface FakeEriSignPayload {
  resourceUuid: string;
}

export interface FakeEriSignResult {
  signatureHex: string;
}

function randomHex(len: number): string {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out.slice(0, len);
}

export const FakeEriSigner = {
  /** Simulated E-IMZO challenge-response (~1.5 s), resolves with fake hex. */
  async sign(payload: FakeEriSignPayload): Promise<FakeEriSignResult> {
    // The payload isn't consumed by the fake handshake — the signature shape
    // exists so call sites read like the real plugin API (step 21 reuse).
    void payload;
    await new Promise((r) => setTimeout(r, 1500));
    return { signatureHex: randomHex(256) };
  },
};
