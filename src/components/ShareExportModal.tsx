import React, { useState } from 'react';
import { Workflow } from '../types';
import {
  X,
  Share2,
  Download,
  Upload,
  Copy,
  Check,
  Lock,
  Unlock,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import { exportWorkflow, importWorkflow } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
  onImportSuccess: (importedWorkflow: Workflow) => void;
}

export const ShareExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  workflow,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [encryptExport, setEncryptExport] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [sanitizeSecrets, setSanitizeSecrets] = useState(true);
  const [exportedResult, setExportedResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Import State
  const [importText, setImportText] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportWorkflow(
        workflow.id,
        encryptExport ? exportPassphrase : undefined,
        sanitizeSecrets
      );
      setExportedResult(res);
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExportFile = () => {
    if (!exportedResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportedResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${workflow.name.toLowerCase().replace(/\s+/g, '_')}${encryptExport ? '.encrypted' : ''}.nodeflow.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportError(null);
    try {
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(importText);
      } catch (e) {
        throw new Error('Invalid JSON format. Please paste valid JSON.');
      }

      const importedWf = await importWorkflow(parsedPayload, importPassphrase || undefined);
      onImportSuccess(importedWf);
      onClose();
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      id="modal-share-export"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Share & Export Workflow
              </h2>
              <p className="text-xs text-neutral-400">
                Export and share automation setups with optional AES-256 password encryption and secret stripping.
              </p>
            </div>
          </div>
          <button
            id="btn-close-share-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-5 text-xs font-semibold">
          <button
            id="tab-export-view"
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Current Workflow
          </button>
          <button
            id="tab-import-view"
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import Workflow Package
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="font-semibold text-neutral-200">Export Security Options</div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sanitizeSecrets}
                    onChange={(e) => setSanitizeSecrets(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-indigo-600"
                  />
                  <span>
                    <strong>Sanitize Secrets & Passwords</strong> (replaces API tokens with placeholders for safe public sharing)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encryptExport}
                    onChange={(e) => setEncryptExport(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-indigo-600"
                  />
                  <span className="flex items-center gap-1 text-indigo-300">
                    <Lock className="w-3.5 h-3.5" />
                    <strong>Protect with AES-256-GCM Encryption Passphrase</strong>
                  </span>
                </label>

                {encryptExport && (
                  <div className="space-y-1 pt-1">
                    <label className="text-neutral-400">Export Decryption Passphrase</label>
                    <input
                      type="password"
                      placeholder="Enter a secure passphrase..."
                      value={exportPassphrase}
                      onChange={(e) => setExportPassphrase(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <button
                id="btn-generate-export-json"
                type="button"
                disabled={isExporting}
                onClick={handleGenerateExport}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                {isExporting ? 'Packaging Workflow...' : 'Generate Export Package'}
              </button>

              {exportedResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">
                      Export Package Ready ({exportedResult.isEncrypted ? 'AES-256-GCM Encrypted' : 'Plain JSON'})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(exportedResult, null, 2));
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadExportFile}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-emerald-400 max-h-48 overflow-auto">
                    <pre>{JSON.stringify(exportedResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-200">Paste Workflow JSON Package</label>
                <textarea
                  rows={8}
                  placeholder='Paste {"app": "NodeFlow", "workflow": { ... }} or {"isEncrypted": true, "cipherText": ...}'
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-400">
                  Decryption Passphrase (Required only if package was encrypted)
                </label>
                <input
                  type="password"
                  placeholder="Passphrase used when exporting..."
                  value={importPassphrase}
                  onChange={(e) => setImportPassphrase(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white"
                />
              </div>

              {importError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-400 text-xs">
                  {importError}
                </div>
              )}

              <button
                id="btn-confirm-import-workflow"
                type="button"
                disabled={isImporting || !importText.trim()}
                onClick={handleExecuteImport}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                {isImporting ? 'Decrypting & Importing...' : 'Import Workflow to Local Database'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
