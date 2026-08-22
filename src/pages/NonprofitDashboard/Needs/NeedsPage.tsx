import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { ROUTES } from '@/app/routes';
import type { Need } from '../api'
import { needsApi } from '../api';

const URGENCY_TONE: Record<Need['urgency'], 'crit' | 'high' | 'mod'> = {
  critical: 'crit',
  high: 'high',
  medium: 'mod',
  low: 'mod',
};

export const NeedsPage = () => {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  const nonprofitId = localStorage.getItem('nonprofitId') || 'mock-nonprofit-id';

  useEffect(() => {
    const fetchNeeds = async () => {
      try {
        setLoading(true);
        const data = await needsApi.listByNonprofit(nonprofitId, { limit: 100 });
        setNeeds(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load needs');
      } finally {
        setLoading(false);
      }
    };

    fetchNeeds();
  }, [nonprofitId]);

  const filteredNeeds = needs.filter(need => {
    if (filter === 'open') {
      return new Date(need.deadline) > new Date();
    }
    if (filter === 'closed') {
      return new Date(need.deadline) <= new Date();
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Manage
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Your Needs</h1>
          <p className="mt-1 max-w-xl text-[13px] text-text-mid">
            View and manage all needs posted by your organization.
          </p>
        </div>
        <Link
          to={ROUTES.nonprofitDashboard.needsNew}
          className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-ink-0 hover:bg-coral/90"
        >
          Post New Need
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'closed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
              filter === f
                ? 'border-coral bg-coral-dim text-coral'
                : 'border-line text-text-mid hover:border-text-mid'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({filteredNeeds.length})
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
      ) : filteredNeeds.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="text-sm text-text-mid">No needs found</div>
            <Link
              to={ROUTES.nonprofitDashboard.needsNew}
              className="mt-3 inline-block text-sm font-semibold text-coral hover:text-coral/90"
            >
              Post a need →
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNeeds.map(need => (
            <Card key={need.id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="font-semibold">{need.description}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone={URGENCY_TONE[need.urgency]}>
                          {need.urgency.charAt(0).toUpperCase() + need.urgency.slice(1)}
                        </Badge>
                        <Badge tone="mod">
                          {need.quantity} {need.quantityUnit}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-text-mid">
                    <span>Type: {need.serviceType}</span>
                    <span>Deadline: {new Date(need.deadline).toLocaleDateString()}</span>
                  </div>
                  {need.demographics && need.demographics.length > 0 && (
                    <div className="mt-2 text-[13px] text-text-low">
                      For: {need.demographics.join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-ink-2"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-coral px-3 py-1.5 text-sm text-coral hover:bg-coral-dim"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
