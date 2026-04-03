/**
 * AES-256-GCM encryption for sensitive tokens
 * Used to encrypt Google refresh tokens before storing in Supabase
 *
 * Requires env var: TOKEN_ENCRYPTION_KEY (32-byte hex string)
 * Generate with: openssl rand -hex 32
 */

const ALGO = 'AES-GCM'
const KEY_LENGTH = 256

function getEncryptionKey(): string {
  const key = (globalThis as unknown as { process?: { env?: { TOKEN_ENCRYPTION_KEY?: string } } }).process?.env?.TOKEN_ENCRYPTION_KEY ?? ''
  if (!key || key.length < 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: openssl rand -hex 32')
  }
  return key
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(hexKey)
  return crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: ALGO, length: KEY_LENGTH }, false, ['encrypt', 'decrypt'])
}

/**
 * Encrypt a plaintext string.
 * Returns a hex string: iv (24 hex chars) + ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key    = await importKey(getEncryptionKey())
  const iv     = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded)

  // Prepend IV to ciphertext so we can decrypt later
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return bytesToHex(combined)
}

/**
 * Decrypt a hex string produced by encrypt().
 * Returns the original plaintext string.
 */
export async function decrypt(encryptedHex: string): Promise<string> {
  const key      = await importKey(getEncryptionKey())
  const combined = hexToBytes(encryptedHex)

  const iv         = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}
