import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, SectionHead } from '@/shared/ui/Card';
import { Kpi } from '@/shared/ui/Kpi';
import { ROUTES } from '@/app/routes';
import type { Nonprofit } from '../api'
import { nonprofitsApi, inventoryApi, needsApi, matchesApi } from '../api';

export const DashboardPage = () => {
  const [nonprofit, setNonprofit] = useState<Nonprofit | null>(null);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [needsCount, setNeedsCount] = useState(0);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get nonprofit ID from localStorage or fetch first nonprofit
  const [nonprofitId, setNonprofitId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get nonprofit ID
        let id = localStorage.getItem('nonprofitId');
        if (!id) {
          // Fetch first nonprofit if not in localStorage
          const list = await nonprofitsApi.list({ limit: 1 });
          if (list.nonprofits.length === 0) {
            throw new Error('No nonprofits found in database');
          }
          id = list.nonprofits[0].id;
          localStorage.setItem('nonprofitId', id);
        }
        setNonprofitId(id);

        // Get nonprofit profile
        const profileData = await nonprofitsApi.get(id);
        setNonprofit(profileData);

        // Get inventory count
        const inventoryData = await inventoryApi.listByNonprofit(id, { limit: 100 });
        setInventoryCount(inventoryData.total);

        // Get needs count
        const needsData = await needsApi.listByNonprofit(id, { limit: 100 });
        setNeedsCount(needsData.total);

        // Get pending matches
        const matchesData = await matchesApi.listByNonprofit(id, { limit: 100 });
        const allMatches = [...(matchesData as any).incoming || [], ...(matchesData as any).outgoing || []];
        const pending = allMatches.filter((m: any) => m.status === 'proposed').length;
        setPendingMatches(pending);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Dashboard
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Loading...</h1>
        </div>
        <Card>
          <div className="h-40 animate-pulse bg-line"></div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Dashboard
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Error</h1>
          <p className="mt-2 text-sm text-coral">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Dashboard
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          {nonprofit?.operatingName}
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Manage your inventory, post needs, and view matches from other nonprofits.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Reputation Score"
          value={`${nonprofit?.reputationScore || 0}/100`}
          tone={(nonprofit?.reputationScore ?? 0) >= 75 ? 'ok' : (nonprofit?.reputationScore ?? 0) >= 50 ? 'warn' : 'danger'}
        />
        <Kpi
          label="Completed Exchanges"
          value={nonprofit?.completedExchanges || 0}
          tone="ok"
        />
        <Kpi
          label="Inventory Items"
          value={inventoryCount}
          tone="neutral"
        />
        <Kpi
          label="Open Needs"
          value={needsCount}
          tone="warn"
        />
      </div>

      {/* Pending Matches Alert */}
      {pendingMatches > 0 && (
        <Card className="border-amber bg-amber-dim">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-amber">
                {pendingMatches} pending match{pendingMatches !== 1 ? 'es' : ''}
              </div>
              <p className="mt-1 text-[13px] text-text-mid">
                Review and accept or reject proposed matches to move forward with exchanges.
              </p>
            </div>
            <Link
              to={ROUTES.nonprofitDashboard.matches}
              className="flex-shrink-0 rounded-md bg-amber px-3 py-1.5 text-sm font-semibold text-ink-0 hover:bg-amber/90"
            >
              Review
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <SectionHead title="Quick Actions" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to={ROUTES.nonprofitDashboard.inventoryNew}
            className="rounded-lg border border-line bg-ink-1 p-4 hover:border-coral hover:bg-ink-2"
          >
            <div className="font-semibold">Add Inventory</div>
            <p className="mt-1 text-[13px] text-text-mid">
              List resources your nonprofit can share
            </p>
          </Link>
          <Link
            to={ROUTES.nonprofitDashboard.needsNew}
            className="rounded-lg border border-line bg-ink-1 p-4 hover:border-coral hover:bg-ink-2"
          >
            <div className="font-semibold">Post a Need</div>
            <p className="mt-1 text-[13px] text-text-mid">
              Request resources from other nonprofits
            </p>
          </Link>
          <Link
            to={ROUTES.nonprofitDashboard.inventory}
            className="rounded-lg border border-line bg-ink-1 p-4 hover:border-coral hover:bg-ink-2"
          >
            <div className="font-semibold">Browse Inventory</div>
            <p className="mt-1 text-[13px] text-text-mid">
              See what other nonprofits are offering
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Activity Links */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHead title="Inventory" />
          <div className="space-y-2">
            <p className="text-[13px] text-text-mid">
              You have {inventoryCount} active inventory {inventoryCount === 1 ? 'item' : 'items'}
            </p>
            <Link
              to={ROUTES.nonprofitDashboard.inventory}
              className="inline-block text-sm font-semibold text-coral hover:text-coral/90"
            >
              View all →
            </Link>
          </div>
        </Card>

        <Card>
          <SectionHead title="Needs" />
          <div className="space-y-2">
            <p className="text-[13px] text-text-mid">
              You have {needsCount} open {needsCount === 1 ? 'need' : 'needs'}
            </p>
            <Link
              to={ROUTES.nonprofitDashboard.needs}
              className="inline-block text-sm font-semibold text-coral hover:text-coral/90"
            >
              View all →
            </Link>
          </div>
        </Card>
      </div>

      {/* Organization Info */}
      <Card>
        <SectionHead title="Organization Info" />
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-text-mid">Services:</span>
            <span>{nonprofit?.primaryServices?.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-mid">Demographics Served:</span>
            <span>{nonprofit?.demographics?.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-mid">Service Area Zips:</span>
            <span>{nonprofit?.serviceAreaZipCodes?.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-mid">Bed Capacity:</span>
            <span>{nonprofit?.bedCapacity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-mid">Full-Time Staff:</span>
            <span>{nonprofit?.ftesCount}</span>
          </div>
        </div>
        <div className="mt-4">
          <Link
            to={ROUTES.nonprofitDashboard.profile}
            className="text-sm font-semibold text-coral hover:text-coral/90"
          >
            Edit profile →
          </Link>
        </div>
      </Card>
    </div>
  );
};
