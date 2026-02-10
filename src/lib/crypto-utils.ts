/**
 * AES-256-GCM encryption/decryption using Node.js crypto (Vercel runtime).
 * Interoperable with the Web Crypto version in lefilonao-workers/src/crypto-utils.ts.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export interface EncryptedData {
  ciphertext: string
  iv: string
  authTag: string
}

export function encrypt(text: string, masterKeyHex: string): EncryptedData {
  const key = Buffer.from(masterKeyHex, 'hex')
  const iv = randomBytes(12)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

export function decrypt(
  ciphertext: string,
  iv: string,
  authTag: string,
  masterKeyHex: string,
): string {
  const key = Buffer.from(masterKeyHex, 'hex')
  const ivBuf = Buffer.from(iv, 'base64')

  const decipher = createDecipheriv('aes-256-gcm', key, ivBuf)
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
