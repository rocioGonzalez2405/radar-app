import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import type { Match, InventoryItem, Need } from '../api'
import { matchesApi, inventoryApi, needsApi } from '../api';

const STATUS_TONE: Record<Match['status'], 'crit' | 'high' | 'mod'> = {
  proposed: 'high',
  accepted: 'mod',
  rejected: 'crit',
  completed: 'mod',
};

export const MatchesPage = () => {
  const [matches, setMatches] = useState<(Match & { inventory?: InventoryItem; need?: Need })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const nonprofitId = localStorage.getItem('nonprofitId') || 'mock-nonprofit-id';

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const data = await matchesApi.listByNonprofit(nonprofitId, { limit: 100 });

        // Merge incoming and outgoing matches (matches returns { incoming: [], outgoing: [] })
        const allMatches = [...((data as any).incoming || []), ...((data as any).outgoing || [])];

        // Enrich matches with inventory and need details
        const enriched = await Promise.all(
          allMatches.map(async (match: any) => {
            const inventory = await inventoryApi.get(match.inventoryId).catch(() => undefined);
            const need = await needsApi.get(match.needId).catch(() => undefined);
            return { ...match, inventory, need };
          })
        );

        setMatches(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [nonprofitId]);

  const filteredMatches = matches.filter(match => {
    if (filter === 'incoming') {
      return match.toNonprofitId === nonprofitId;
    }
    if (filter === 'outgoing') {
      return match.fromNonprofitId === nonprofitId;
    }
    return true;
  });

  const handleAccept = async (matchId: string) => {
    try {
      setActionLoading(matchId);
      const updated = await matchesApi.accept(matchId);
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updated } : m));
    } catch (err) {
      console.error('Failed to accept match:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      setActionLoading(matchId);
      const reason = prompt('Optional: Why are you rejecting this match?');
      const updated = await matchesApi.reject(matchId, reason || undefined);
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updated } : m));
    } catch (err) {
      console.error('Failed to reject match:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Matches
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">Match Proposals</h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Review matches between your inventory/needs and other nonprofits.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'incoming', 'outgoing'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
              filter === f
                ? 'border-coral bg-coral-dim text-coral'
                : 'border-line text-text-mid hover:border-text-mid'
            }`}
          >
            {f === 'incoming' ? 'Incoming' : f === 'outgoing' ? 'Outgoing' : 'All'} ({filteredMatches.length})
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <Card>
          <div className="h-40 animate-pulse bg-line"></div>
        </Card>
      ) : error ? (
        <Card className="border-coral">
          <div className="text-sm text-coral">{error}</div>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="text-sm text-text-mid">No matches found</div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <Card key={match.id}>
              <div className="space-y-4">
                {/* Match Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Match #{match.id.substring(0, 8)}</span>
                      <Badge tone={STATUS_TONE[match.status]}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                      {match.status === 'proposed' && (
                        <div className="ml-2 text-[12px] font-semibold text-amber">
                          Fairness: {match.fairnessScore}/100
                        </div>
                      )}
                    </div>
                  </div>
                  {match.status === 'rejected' && match.rejectionReason && (
                    <div className="text-[13px] text-text-low">
                      Reason: {match.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Match Details */}
                <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[13px] font-semibold text-text-mid uppercase tracking-wide">
                      Offering
                    </div>
                    <div className="mt-2 text-sm">
                      {match.inventory?.description}
                    </div>
                    <div className="mt-1 text-[13px] text-text-low">
                      {match.inventory?.quantity} {match.inventory?.quantityUnit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-text-mid uppercase tracking-wide">
                      Requesting
                    </div>
                    <div className="mt-2 text-sm">
                      {match.need?.description}
                    </div>
                    <div className="mt-1 text-[13px] text-text-low">
                      {match.need?.quantity} {match.need?.quantityUnit}
                    </div>
                  </div>
                </div>

                {/* Fairness Breakdown */}
                {match.status === 'proposed' && (
                  <div className="border-t border-line pt-4">
                    <div className="text-[13px] font-semibold text-text-mid uppercase tracking-wide mb-3">
                      Fairness Breakdown
                    </div>
                    <div className="grid gap-2 text-[13px] sm:grid-cols-2 lg:grid-cols-5">
                      <div className="rounded bg-ink-2 p-2">
                        <div className="text-text-low">Fit</div>
                        <div className="font-semibold">{match.fairnessBreakdown.fit}/100</div>
                      </div>
                      <div className="rounded bg-ink-2 p-2">
                        <div className="text-text-low">Value</div>
                        <div className="font-semibold">{match.fairnessBreakdown.value}/100</div>
                      </div>
                      <div className="rounded bg-ink-2 p-2">
                        <div className="text-text-low">Benefit</div>
                        <div className="font-semibold">{match.fairnessBreakdown.benefit.toFixed(1)}/100</div>
                      </div>
                      <div className="rounded bg-ink-2 p-2">
                        <div className="text-text-low">Radar Impact</div>
                        <div className="font-semibold">{match.fairnessBreakdown.radarImpact}/100</div>
                      </div>
                      <div className="rounded bg-ink-2 p-2">
                        <div className="text-text-low">Reputation</div>
                        <div className="font-semibold">{match.fairnessBreakdown.reputation}/100</div>
                      </div>
                    </div>
                    {match.reasoning && (
                      <div className="mt-3 rounded bg-ink-2 p-3 text-[13px]">
                        <strong>Reasoning:</strong> {match.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {match.status === 'proposed' && (
                  <div className="flex gap-2 border-t border-line pt-4">
                    <button
                      onClick={() => handleAccept(match.id)}
                      disabled={actionLoading === match.id}
                      className="flex-1 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-ink-0 hover:bg-teal/90 disabled:opacity-50"
                    >
                      {actionLoading === match.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleReject(match.id)}
                      disabled={actionLoading === match.id}
                      className="flex-1 rounded-md border border-coral px-3 py-2 text-sm font-semibold text-coral hover:bg-coral-dim disabled:opacity-50"
                    >
                      {actionLoading === match.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
