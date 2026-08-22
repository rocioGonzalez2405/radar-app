import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, SectionHead } from '@/shared/ui/Card';
import { ROUTES } from '@/app/routes';
import { needsApi } from '../api';

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

const URGENCY_LEVELS = ['critical', 'high', 'medium', 'low'] as const;

export const PostNeedPage = () => {
  const navigate = useNavigate();
  const nonprofitId = localStorage.getItem('nonprofitId') || 'mock-nonprofit-id';

  const [formData, setFormData] = useState({
    serviceType: '',
    quantity: '',
    quantityUnit: 'hours',
    description: '',
    demographics: [] as string[],
    urgency: 'medium' as typeof URGENCY_LEVELS[number],
    deadline: '',
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
    if (!formData.deadline) {
      setError('Deadline is required');
      return;
    }
    if (new Date(formData.deadline) <= new Date()) {
      setError('Deadline must be in the future');
      return;
    }

    try {
      setLoading(true);
      await needsApi.create(nonprofitId, {
        serviceType: formData.serviceType,
        quantity: parseInt(formData.quantity),
        quantityUnit: formData.quantityUnit,
        description: formData.description,
        demographics: formData.demographics,
        urgency: formData.urgency,
        deadline: new Date(formData.deadline).toISOString(),
      });

      navigate(ROUTES.nonprofitDashboard.needs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post need');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Request
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">Post a Need</h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Describe what your organization needs. Other nonprofits will see your request and can offer to help.
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
          <SectionHead title="Quantity Needed" />
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
            placeholder="Explain why you need this resource and any specific requirements or constraints..."
            rows={4}
            className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-coral focus:outline-none"
          />
        </Card>

        {/* Demographics */}
        <Card>
          <SectionHead title="Who is this for? (optional)" />
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

        {/* Urgency */}
        <Card>
          <SectionHead title="Urgency Level" />
          <div className="grid gap-2 sm:grid-cols-4">
            {URGENCY_LEVELS.map(level => (
              <label key={level} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="urgency"
                  value={level}
                  checked={formData.urgency === level}
                  onChange={e => handleInputChange('urgency', e.target.value)}
                  className="rounded-full"
                />
                <span className="text-sm">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Deadline */}
        <Card>
          <SectionHead title="Deadline" />
          <input
            type="date"
            value={formData.deadline}
            onChange={e => handleInputChange('deadline', e.target.value)}
            className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
          />
          <p className="mt-2 text-[13px] text-text-low">
            By this date, other nonprofits should respond to your need request
          </p>
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
            {loading ? 'Posting...' : 'Post Need'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.nonprofitDashboard.needs)}
            className="rounded-md border border-line px-4 py-2 font-semibold hover:bg-ink-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
