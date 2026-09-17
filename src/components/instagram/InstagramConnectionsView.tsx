import React, { useState } from 'react';
import {
  Instagram,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { InstagramAccount, ContentPillar } from '../../types/instagram';

interface InstagramConnectionsViewProps {
  account: InstagramAccount;
  onSaveAccount: (updates: Partial<InstagramAccount>) => Promise<void>;
}

export const InstagramConnectionsView: React.FC<InstagramConnectionsViewProps> = ({
  account,
  onSaveAccount
}) => {
  const [bio, setBio] = useState(account.bio);
  const [displayName, setDisplayName] = useState(account.displayName);
  const [pillars, setPillars] = useState<ContentPillar[]>(account.contentPillars);
  const [competitors, setCompetitors] = useState<string[]>(account.competitorHandles);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePillarChange = (index: number, targetPercentage: number) => {
    const updated = [...pillars];
    updated[index].targetPercentage = targetPercentage;
    setPillars(updated);
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitor.trim()) return;
    const handle = newCompetitor.trim().replace(/^@/, '');
    if (!competitors.includes(handle)) {
      setCompetitors([...competitors, handle]);
    }
    setNewCompetitor('');
  };

  const handleRemoveCompetitor = (handle: string) => {
    setCompetitors(competitors.filter((c) => c !== handle));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveAccount({
        bio,
        displayName,
        contentPillars: pillars,
        competitorHandles: competitors
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instagram Page Connected
            </span>
            <span className="text-xs text-gray-500">
              Graph API Sync: <strong className="text-gray-900 font-semibold">Active</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">Instagram Account & Competitor Setup</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Configure target profile "@{account.username}", content pillar target ratios, and competitor research tracking list.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {savedSuccess ? 'Changes Saved!' : 'Save Connection Profile'}
        </button>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Target Instagram Profile Overview</h2>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-gray-900 font-bold text-lg">
              @
            </div>
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">@{account.username}</h3>
              <span className="text-xs text-gray-400 font-mono">ID: {account.id}</span>
              <span className="text-xs text-orange-800 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                {account.category}
              </span>
            </div>
            <p className="text-xs text-gray-600">{account.displayName}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Followers</span>
              <span className="text-base font-bold text-gray-900">{(account.followersCount / 1000).toFixed(1)}k</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Engagement</span>
              <span className="text-base font-bold text-emerald-700">{account.engagementRate}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Avg Views</span>
              <span className="text-base font-bold text-gray-900">{(account.averageReelViews / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Account Bio</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Content Pillars Configuration */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Target Content Pillar Allocations</h2>
        <p className="text-xs text-gray-500">
          Adjust your target posting distribution. The topic generator and scheduler prioritize pillars with negative deltas.
        </p>

        <div className="space-y-3">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.name}
              className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-gray-900">{pillar.name}</span>
                <p className="text-[11px] text-gray-500">
                  Current Distribution: <strong className="text-gray-900">{pillar.currentPercentage}%</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[11px] text-gray-500 shrink-0">Target %:</span>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={pillar.targetPercentage}
                  onChange={(e) => handlePillarChange(idx, parseInt(e.target.value))}
                  className="w-32 accent-orange-600"
                />
                <span className="font-mono font-bold text-gray-900 w-10 text-right">
                  {pillar.targetPercentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Tracking Handles */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Tracked Competitor Accounts (Manus Benchmarks)</h2>
        <p className="text-xs text-gray-500">
          Scans these accounts during audit cycles to benchmark reel hooks, visual formats, and engagement rates.
        </p>

        <div className="flex flex-wrap gap-2">
          {competitors.map((handle) => (
            <div
              key={handle}
              className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2 text-xs text-gray-800 shadow-2xs"
            >
              <span className="font-mono text-indigo-700 font-medium">@{handle}</span>
              <button
                type="button"
                onClick={() => handleRemoveCompetitor(handle)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCompetitor} className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            placeholder="Add competitor handle (@example)..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>
    </div>
  );
};
