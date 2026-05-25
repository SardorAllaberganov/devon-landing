// SHA-256 helper for the mock backend's "password hashing".
// NOT real security — passwords are stored as plain SHA-256 hex of the
// literal password (master §15). Real auth would salt + use Argon2/bcrypt.
export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
