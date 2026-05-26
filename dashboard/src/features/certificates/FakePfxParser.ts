// Fake PFX parser. No real X.509 / PKCS#12 parsing — the file is read only
// for size validation; the "password" gate is non-empty; the extracted
// metadata is mocked plausibly. In the real system this work happens in the
// browser via WebCrypto + a PKCS#12 reader, or via the local E-IMZO plugin
// over a WebSocket. See master §17 for the deliberate scope choice.

export interface ExtractedCertMeta {
  serialNumber: string;
  thumbprint: string;
  subjectPinfl: string;
  subjectCommonName: string;
  subjectOrganization?: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  keyUsage: string[];
}

export const MAX_PFX_SIZE_BYTES = 100 * 1024;

export type FakePfxParseErrorCode = 'pfx-too-large' | 'pfx-password-wrong';

export class FakePfxParseError extends Error {
  readonly code: FakePfxParseErrorCode;
  constructor(code: FakePfxParseErrorCode) {
    super(`PFX parse failed: ${code}`);
    this.name = 'FakePfxParseError';
    this.code = code;
  }
}

function randomHex(len: number): string {
  // crypto.getRandomValues is available in every modern browser; uniform-random
  // hex without the bias of Math.random + manual char picking.
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0').toUpperCase();
  return out.slice(0, len);
}

export async function fakeExtractFromPfx(
  file: File,
  password: string,
  knownPinfl: string,
  knownFio: string,
  knownOrganization?: string,
): Promise<ExtractedCertMeta> {
  // Simulate local parse latency (800–1500 ms).
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

  if (file.size > MAX_PFX_SIZE_BYTES) throw new FakePfxParseError('pfx-too-large');
  if (!password || password.trim().length === 0) throw new FakePfxParseError('pfx-password-wrong');

  // Plausible 1-year validity window starting today, second precision.
  const now = new Date();
  const validFrom = new Date(now);
  validFrom.setHours(0, 0, 0, 0);
  const validTo = new Date(validFrom);
  validTo.setFullYear(validTo.getFullYear() + 1);

  return {
    serialNumber: randomHex(32),
    thumbprint: randomHex(64),
    subjectPinfl: knownPinfl,
    subjectCommonName: knownFio,
    subjectOrganization: knownOrganization,
    issuerName: "YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ",
    validFrom: validFrom.toISOString(),
    validTo: validTo.toISOString(),
    keyUsage: ['digitalSignature', 'keyEncipherment'],
  };
}
