import { useEffect, useState } from 'react';
import { Card, SectionHead } from '@/shared/ui/Card';
import type { InventoryItem } from '../api'
import { inventoryApi } from '../api';

export const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    serviceType: '',
    demographic: '',
    zip: '',
  });

  const LIMIT = 50;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await inventoryApi.search({
          serviceType: filters.serviceType || undefined,
          demographic: filters.demographic || undefined,
          zip: filters.zip || undefined,
          limit: LIMIT,
          offset,
        });

        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [offset, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const handleNextPage = () => {
    if (offset + LIMIT < total) {
      setOffset(offset + LIMIT);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - LIMIT));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Browse
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">Available Inventory</h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Search and filter inventory from other nonprofits. Post a need to request items.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <SectionHead title="Search & Filter" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">Service Type</label>
            <input
              type="text"
              placeholder="Search service..."
              value={filters.serviceType}
              onChange={e => handleFilterChange('serviceType', e.target.value)}
              className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Demographic</label>
            <input
              type="text"
              placeholder="Search demographic..."
              value={filters.demographic}
              onChange={e => handleFilterChange('demographic', e.target.value)}
              className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">ZIP Code</label>
            <input
              type="text"
              placeholder="Search ZIP..."
              value={filters.zip}
              onChange={e => handleFilterChange('zip', e.target.value)}
              className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <Card>
          <div className="h-40 animate-pulse bg-line"></div>
        </Card>
      ) : error ? (
        <Card className="border-coral">
          <div className="text-sm text-coral">{error}</div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-sm text-text-mid">No items found</div>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {items.map(item => (
              <Card key={item.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <div className="font-semibold">{item.description}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[13px] text-text-mid">
                      <span>Type: {item.serviceType}</span>
                      <span>Qty: {item.quantity} {item.quantityUnit}</span>
                      <span>Available: {new Date(item.availableFrom).toLocaleDateString()} - {new Date(item.availableUntil).toLocaleDateString()}</span>
                    </div>
                    {item.demographics && item.demographics.length > 0 && (
                      <div className="mt-2 text-[13px] text-text-low">
                        Serves: {item.demographics.join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-ink-0 hover:bg-coral/90"
                  >
                    Post Need
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-text-mid">
              Showing {offset + 1}-{Math.min(offset + LIMIT, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={offset === 0}
                className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={offset + LIMIT >= total}
                className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Help Text */}
      <Card className="bg-line">
        <div className="text-[13px] text-text-mid">
          <strong>How to request an item:</strong> Find what you need, click "Post Need" to create a specific request. Other nonprofits will be notified of your need, and matches may be proposed.
        </div>
      </Card>
    </div>
  );
};
