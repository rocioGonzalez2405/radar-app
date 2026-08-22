import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import type { Transaction, Match } from '../api'
import { transactionsApi, matchesApi } from '../api';

const STATUS_TONE: Record<Transaction['status'], 'crit' | 'high' | 'mod'> = {
  pending: 'high',
  in_progress: 'mod',
  completed: 'mod',
  cancelled: 'crit',
};

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<(Transaction & { match?: Match })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [ratingForm, setRatingForm] = useState<string | null>(null);
  const [ratingData, setRatingData] = useState({ rating: 5, notes: '' });

  const nonprofitId = localStorage.getItem('nonprofitId') || 'mock-nonprofit-id';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await transactionsApi.listByNonprofit(nonprofitId, { limit: 100 });

        // Handle response structure - transactions might return { transactions: [] } or { items: [] }
        const txnList = (data as any).transactions || (data as any).items || [];

        // Enrich transactions with match details
        const enriched = await Promise.all(
          txnList.map(async (transaction: any) => {
            const match = await matchesApi.get(transaction.matchId).catch(() => undefined);
            return { ...transaction, match };
          })
        );

        setTransactions(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [nonprofitId]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleStatusUpdate = async (transactionId: string, newStatus: Transaction['status']) => {
    try {
      const updated = await transactionsApi.updateStatus(transactionId, newStatus);
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, ...updated } : t));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleRateTransaction = async (transactionId: string) => {
    try {
      const updated = await transactionsApi.rateTransaction(transactionId, ratingData.rating, ratingData.notes || undefined);
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, ...updated } : t));
      setRatingForm(null);
      setRatingData({ rating: 5, notes: '' });
    } catch (err) {
      console.error('Failed to rate transaction:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Track
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Monitor the progress of all accepted matches and rate completed exchanges.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
              filter === f
                ? 'border-coral bg-coral-dim text-coral'
                : 'border-line text-text-mid hover:border-text-mid'
            }`}
          >
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)} ({filteredTransactions.length})
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
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="text-sm text-text-mid">No transactions found</div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map(transaction => (
            <Card key={transaction.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Transaction #{transaction.id.substring(0, 8)}</span>
                      <Badge tone={STATUS_TONE[transaction.status]}>
                        {transaction.status.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    </div>
                    <div className="mt-2 text-[13px] text-text-mid">
                      Created: {new Date(transaction.createdAt).toLocaleDateString()}
                      {transaction.completedAt && ` • Completed: ${new Date(transaction.completedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                {/* Status Progress */}
                <div className="border-t border-line pt-4">
                  <div className="text-[13px] font-semibold text-text-mid uppercase tracking-wide mb-3">
                    Status Timeline
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'in_progress', 'completed'] as const).map((status, idx, arr) => (
                      <div key={status} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (transaction.status !== status) {
                              handleStatusUpdate(transaction.id, status);
                            }
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                            transaction.status === status
                              ? 'bg-teal text-ink-0'
                              : transaction.status > status
                                ? 'bg-ink-2 text-text-mid'
                                : 'bg-ink-2 text-text-low cursor-not-allowed'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                        {idx < arr.length - 1 && <span className="text-text-mid">→</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating Section */}
                {transaction.status === 'completed' && (
                  <div className="border-t border-line pt-4">
                    <div className="text-[13px] font-semibold text-text-mid uppercase tracking-wide mb-3">
                      Fairness Rating
                    </div>
                    {transaction.fairnessRating ? (
                      <div className="rounded bg-ink-2 p-3">
                        <div className="flex items-center justify-between">
                          <span>Your Rating: {transaction.fairnessRating}/10</span>
                          <button
                            onClick={() => setRatingForm(transaction.id)}
                            className="text-[13px] text-coral hover:text-coral/90"
                          >
                            Update →
                          </button>
                        </div>
                        {transaction.ratingNotes && (
                          <div className="mt-2 text-[13px] text-text-low">{transaction.ratingNotes}</div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded bg-ink-2 p-3">
                        {ratingForm === transaction.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-2 block text-[13px] font-semibold">
                                How fair was this exchange? (1-10)
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={ratingData.rating}
                                onChange={e => setRatingData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                              <div className="mt-1 text-[13px] text-text-mid">{ratingData.rating}/10</div>
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-semibold">Notes (optional)</label>
                              <textarea
                                value={ratingData.notes}
                                onChange={e => setRatingData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Share your experience..."
                                rows={2}
                                className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRateTransaction(transaction.id)}
                                className="flex-1 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-ink-0 hover:bg-teal/90"
                              >
                                Submit Rating
                              </button>
                              <button
                                onClick={() => setRatingForm(null)}
                                className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-ink-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRatingForm(transaction.id)}
                            className="text-[13px] font-semibold text-coral hover:text-coral/90"
                          >
                            Rate this exchange →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Match Details */}
                {transaction.match && (
                  <div className="border-t border-line pt-4">
                    <div className="text-[13px] font-semibold text-text-mid uppercase tracking-wide mb-3">
                      Match Details
                    </div>
                    <div className="grid gap-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-text-mid">Match ID:</span>
                        <span>{transaction.match.id.substring(0, 8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-mid">Fairness Score:</span>
                        <span>{transaction.match.fairnessScore}/100</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Help Text */}
      <Card className="bg-line">
        <div className="text-[13px] text-text-mid">
          <strong>How to track transactions:</strong> Accepted matches become transactions. Update the status as the exchange progresses. When complete, rate the fairness of the exchange to help improve future matches.
        </div>
      </Card>
    </div>
  );
};
