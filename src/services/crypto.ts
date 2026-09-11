/**
 * Robust End-to-End Encryption & Cryptography Utilities
 * Uses standard Web Crypto API (SubtleCrypto) for zero-trust client side security
 */

// Generate random salt
export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  window.crypto.getRandomValues(salt);
  return salt;
}

// Convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to ArrayBuffer
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array / ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM 256-bit key from passphrase using PBKDF2
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt string with passphrase
export async function encryptWithPassphrase(
  plainText: string,
  passphrase: string
): Promise<{ cipherText: string; iv: string; salt: string }> {
  const salt = generateSalt(16);
  const key = await deriveKey(passphrase, salt);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  return {
    cipherText: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

// Decrypt string with passphrase
export async function decryptWithPassphrase(
  cipherText: string,
  passphrase: string,
  iv: string,
  salt: string
): Promise<string> {
  const saltBuf = base64ToBuffer(salt);
  const ivBuf = base64ToBuffer(iv);
  const cipherBuf = base64ToBuffer(cipherText);

  const key = await deriveKey(passphrase, saltBuf);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf as any },
    key,
    cipherBuf as any
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// Hash string (SHA-256)
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return bufferToHex(hashBuffer);
}
