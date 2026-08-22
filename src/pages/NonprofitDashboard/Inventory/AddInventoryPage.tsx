import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, SectionHead } from '@/shared/ui/Card';
import { ROUTES } from '@/app/routes';
import { inventoryApi } from '../api';

const SERVICE_TYPES = [
  'geriatric_care',
  'childcare',
  'mental_health',
  'substance_abuse',
  'domestic_violence',
  'food_security',
  'housing',
  'medical',
  'dental',
  'legal',
  'job_training',
  'education',
];

const DEMOGRAPHICS = [
  'age_55_plus',
  'age_18_64',
  'age_under_18',
  'english_proficient',
  'limited_english',
  'immigrant',
  'veteran',
  'unhoused',
  'lgbtq',
  'women',
  'men',
];

const QUANTITY_UNITS = ['hours', 'items', 'beds', 'seats', 'units', 'kg', 'liters'];

export const AddInventoryPage = () => {
  const navigate = useNavigate();
  const nonprofitId = localStorage.getItem('nonprofitId') || 'mock-nonprofit-id';

  const [formData, setFormData] = useState({
    serviceType: '',
    quantity: '',
    quantityUnit: 'hours',
    description: '',
    demographics: [] as string[],
    availableFrom: '',
    availableUntil: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDemographicToggle = (demo: string) => {
    setFormData(prev => ({
      ...prev,
      demographics: prev.demographics.includes(demo)
        ? prev.demographics.filter(d => d !== demo)
        : [...prev.demographics, demo],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.serviceType) {
      setError('Service type is required');
      return;
    }
    if (!formData.quantity) {
      setError('Quantity is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.availableFrom) {
      setError('Available from date is required');
      return;
    }
    if (!formData.availableUntil) {
      setError('Available until date is required');
      return;
    }
    if (new Date(formData.availableFrom) >= new Date(formData.availableUntil)) {
      setError('Available until date must be after available from date');
      return;
    }

    try {
      setLoading(true);
      await inventoryApi.create(nonprofitId, {
        serviceType: formData.serviceType,
        quantity: parseInt(formData.quantity),
        quantityUnit: formData.quantityUnit,
        description: formData.description,
        demographics: formData.demographics,
        availableFrom: new Date(formData.availableFrom).toISOString(),
        availableUntil: new Date(formData.availableUntil).toISOString(),
      });

      navigate(ROUTES.nonprofitDashboard.inventory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Add
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">New Inventory Item</h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          List resources your organization can share with other nonprofits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <Card>
          <SectionHead title="Service Type" />
          <select
            value={formData.serviceType}
            onChange={e => handleInputChange('serviceType', e.target.value)}
            className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
          >
            <option value="">Select a service type...</option>
            {SERVICE_TYPES.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Card>

        {/* Quantity */}
        <Card>
          <SectionHead title="Quantity" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">Amount</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={e => handleInputChange('quantity', e.target.value)}
                placeholder="e.g., 10"
                className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Unit</label>
              <select
                value={formData.quantityUnit}
                onChange={e => handleInputChange('quantityUnit', e.target.value)}
                className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
              >
                {QUANTITY_UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card>
          <SectionHead title="Description" />
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Describe the inventory, condition, and any relevant details..."
            rows={4}
            className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
          />
        </Card>

        {/* Demographics */}
        <Card>
          <SectionHead title="Serves Demographics (optional)" />
          <div className="grid gap-2 sm:grid-cols-2">
            {DEMOGRAPHICS.map(demo => (
              <label key={demo} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.demographics.includes(demo)}
                  onChange={() => handleDemographicToggle(demo)}
                  className="rounded"
                />
                <span className="text-sm">{demo.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Dates */}
        <Card>
          <SectionHead title="Availability Period" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">Available From</label>
              <input
                type="date"
                value={formData.availableFrom}
                onChange={e => handleInputChange('availableFrom', e.target.value)}
                className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Available Until</label>
              <input
                type="date"
                value={formData.availableUntil}
                onChange={e => handleInputChange('availableUntil', e.target.value)}
                className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-coral">
            <div className="text-sm text-coral">{error}</div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-coral px-4 py-2 font-semibold text-ink-0 hover:bg-coral/90 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Inventory'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.nonprofitDashboard.inventory)}
            className="rounded-md border border-line px-4 py-2 font-semibold hover:bg-ink-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
