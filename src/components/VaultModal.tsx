import React, { useState } from 'react';
import { VaultCredential, SecurityStatus } from '../types';
import {
  X,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Database,
  CheckCircle2,
  HardDrive,
  Copy,
  Wand2,
  Eye,
  EyeOff
} from 'lucide-react';
import { encryptWithPassphrase, decryptWithPassphrase } from '../services/crypto';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  securityStatus: SecurityStatus;
  credentials: VaultCredential[];
  onAddCredential: (name: string, type: string, secretValue: string, passphrase?: string) => Promise<void>;
  onDeleteCredential: (id: string) => Promise<void>;
}

export const VaultModal: React.FC<Props> = ({
  isOpen,
  onClose,
  securityStatus,
  credentials,
  onAddCredential,
  onDeleteCredential
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredType, setNewCredType] = useState('api_key');
  const [newCredSecret, setNewCredSecret] = useState('');
  const [customPassphrase, setCustomPassphrase] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Live Crypto Playground to verify client-side E2EE
  const [testPlaintext, setTestPlaintext] = useState('Confidential Client API Secret');
  const [testPassphrase, setTestPassphrase] = useState('user-master-passphrase-2026');
  const [testCipherPayload, setTestCipherPayload] = useState<{ cipherText: string; iv: string; salt: string } | null>(null);
  const [testDecrypted, setTestDecrypted] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName || !newCredSecret) return;
    setIsSaving(true);
    try {
      await onAddCredential(newCredName, newCredType, newCredSecret, customPassphrase || undefined);
      setNewCredName('');
      setNewCredSecret('');
      setShowAddForm(false);
    } catch (err: any) {
      alert('Failed to save credential: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunClientCryptoTest = async () => {
    try {
      const encrypted = await encryptWithPassphrase(testPlaintext, testPassphrase);
      setTestCipherPayload(encrypted);

      const decrypted = await decryptWithPassphrase(
        encrypted.cipherText,
        testPassphrase,
        encrypted.iv,
        encrypted.salt
      );
      setTestDecrypted(decrypted);
    } catch (e: any) {
      alert('Crypto test error: ' + e.message);
    }
  };

  return (
    <div
      id="modal-vault-security"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Local Database & End-to-End Encryption Vault
              </h2>
              <p className="text-xs text-neutral-400">
                Total privacy architecture: Zero telemetry, encrypted credentials at rest, and local node persistence.
              </p>
            </div>
          </div>
          <button
            id="btn-close-vault-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-neutral-200">
          {/* Security Architecture Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <HardDrive className="w-4 h-4" />
                Local Database Storage
              </div>
              <div className="text-sm font-bold text-white">Self-Hosted JSON DB</div>
              <div className="text-[11px] font-mono text-neutral-400 break-all">
                {securityStatus.localStorageLocation || 'data/nodeflow_db.json'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Lock className="w-4 h-4" />
                Authenticated Encryption
              </div>
              <div className="text-sm font-bold text-white">AES-256-GCM</div>
              <div className="text-[11px] text-neutral-400">
                128-bit authentication tags to prevent ciphertext tampering.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Key className="w-4 h-4" />
                Key Derivation (KDF)
              </div>
              <div className="text-sm font-bold text-white">PBKDF2-SHA256</div>
              <div className="text-[11px] text-neutral-400">
                100,000 rounds with per-installation unique salt.
              </div>
            </div>
          </div>

          {/* Credentials Vault Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  Encrypted Credentials Store ({credentials.length})
                </h3>
                <p className="text-xs text-neutral-400">
                  Store third-party tokens and passwords for seamless referencing inside HTTP Request nodes.
                </p>
              </div>
              <button
                id="btn-show-add-credential-form"
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Credential
              </button>
            </div>

            {/* Add Credential Form */}
            {showAddForm && (
              <form
                onSubmit={handleSaveCredential}
                className="p-4 bg-neutral-950 border border-indigo-500/40 rounded-xl space-y-3 shadow-lg"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Name / Service</label>
                    <input
                      type="text"
                      placeholder="e.g. Stripe Live Secret Key"
                      value={newCredName}
                      onChange={(e) => setNewCredName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Credential Type</label>
                    <select
                      value={newCredType}
                      onChange={(e) => setNewCredType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="api_key">API Key</option>
                      <option value="bearer_token">Bearer Token</option>
                      <option value="basic_auth">Basic Auth (user:pass)</option>
                      <option value="secret_key">Secret Encryption Key</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Secret Value</label>
                    <input
                      type="password"
                      placeholder="sk-live-..."
                      value={newCredSecret}
                      onChange={(e) => setNewCredSecret(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    {isSaving ? 'Encrypting & Storing...' : 'Encrypt & Store Locally'}
                  </button>
                </div>
              </form>
            )}

            {/* Credentials List */}
            <div className="space-y-2">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neutral-900 text-emerald-400 border border-neutral-800">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-200">{c.name}</div>
                      <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-2">
                        <span>{c.type}</span>
                        <span>•</span>
                        <span className="text-neutral-400">{c.maskedPreview}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 text-[10px] font-mono border border-emerald-800/40">
                      ENCRYPTED
                    </span>
                    <button
                      type="button"
                      title="Delete Credential"
                      onClick={() => onDeleteCredential(c.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-900 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {credentials.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                  No encrypted credentials stored in vault yet. Click "Add Credential" to store API keys securely.
                </div>
              )}
            </div>
          </div>

          {/* Client-Side E2EE Verification Sandbox */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Client-Side WebCrypto E2EE Verification Sandbox
              </h4>
              <button
                type="button"
                onClick={handleRunClientCryptoTest}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Wand2 className="w-3 h-3 text-indigo-400" /> Run Roundtrip Test
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">
              Direct verification of zero-knowledge WebCrypto AES-256-GCM encryption before data ever leaves your device.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-neutral-400">Test Secret Plaintext</label>
                <input
                  type="text"
                  value={testPlaintext}
                  onChange={(e) => setTestPlaintext(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-400">Master Passphrase</label>
                <input
                  type="text"
                  value={testPassphrase}
                  onChange={(e) => setTestPassphrase(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-xs text-white"
                />
              </div>
            </div>

            {testCipherPayload && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-xs">
                <div className="text-[11px] font-mono text-neutral-400">
                  Ciphertext (Base64 AES-GCM):
                </div>
                <div className="p-2 bg-neutral-900 rounded font-mono text-[11px] text-emerald-400 break-all">
                  {testCipherPayload.cipherText}
                </div>
                {testDecrypted && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Decrypted Match: <strong>{testDecrypted}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
