import { useEffect, useState } from 'react';
import { Card, SectionHead } from '@/shared/ui/Card';
import type { Nonprofit } from '../api'
import { nonprofitsApi } from '../api';

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

export const ProfilePage = () => {
  const [nonprofit, setNonprofit] = useState<Nonprofit | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nonprofitId = localStorage.getItem('nonprofitId') || 'mock-nonprofit-id';

  const [formData, setFormData] = useState<Partial<Nonprofit>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await nonprofitsApi.get(nonprofitId);
        setNonprofit(data);
        setFormData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [nonprofitId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      primaryServices: prev.primaryServices?.includes(service)
        ? prev.primaryServices.filter(s => s !== service)
        : [...(prev.primaryServices || []), service],
    }));
  };

  const handleDemographicToggle = (demo: string) => {
    setFormData(prev => ({
      ...prev,
      demographics: prev.demographics?.includes(demo)
        ? prev.demographics.filter(d => d !== demo)
        : [...(prev.demographics || []), demo],
    }));
  };

  const handleZipChange = (idx: number, value: string) => {
    const zips = [...(formData.serviceAreaZipCodes || [])];
    zips[idx] = value;
    setFormData(prev => ({
      ...prev,
      serviceAreaZipCodes: zips,
    }));
  };

  const addZip = () => {
    setFormData(prev => ({
      ...prev,
      serviceAreaZipCodes: [...(prev.serviceAreaZipCodes || []), ''],
    }));
  };

  const removeZip = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      serviceAreaZipCodes: prev.serviceAreaZipCodes?.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      const updated = await nonprofitsApi.update(nonprofitId, formData);
      setNonprofit(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Settings
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!nonprofit) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Settings
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Settings
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Organization Profile</h1>
          <p className="mt-1 max-w-xl text-[13px] text-text-mid">
            Manage your organization's information and reputation.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-ink-0 hover:bg-coral/90"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <Card className="border-coral">
          <div className="text-sm text-coral">{error}</div>
        </Card>
      )}

      {!editing ? (
        <>
          {/* Reputation */}
          <Card>
            <SectionHead title="Reputation" />
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[13px] text-text-mid">Overall Score</div>
                  <div className="mt-1 text-3xl font-semibold">{nonprofit.reputationScore}</div>
                </div>
                <div className="text-[13px] text-text-low">out of 100</div>
              </div>
              <div className="mt-3 text-[13px]">
                <div className="text-text-mid">Completed Exchanges: {nonprofit.completedExchanges}</div>
              </div>
            </div>
          </Card>

          {/* Basic Info */}
          <Card>
            <SectionHead title="Organization Info" />
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-text-mid">Legal Name:</span>
                <span>{nonprofit.legalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-mid">Operating Name:</span>
                <span>{nonprofit.operatingName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-mid">Bed Capacity:</span>
                <span>{nonprofit.bedCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-mid">Full-Time Staff:</span>
                <span>{nonprofit.ftesCount}</span>
              </div>
            </div>
          </Card>

          {/* Services */}
          <Card>
            <SectionHead title="Primary Services" />
            <div className="flex flex-wrap gap-2">
              {nonprofit.primaryServices?.map(service => (
                <span key={service} className="rounded-full bg-coral-dim px-3 py-1 text-sm text-coral">
                  {service.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </Card>

          {/* Demographics */}
          <Card>
            <SectionHead title="Demographics Served" />
            <div className="flex flex-wrap gap-2">
              {nonprofit.demographics?.map(demo => (
                <span key={demo} className="rounded-full bg-teal-dim px-3 py-1 text-sm text-teal">
                  {demo.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </Card>

          {/* Service Area */}
          <Card>
            <SectionHead title="Service Area ZIP Codes" />
            <div className="text-[13px]">
              {nonprofit.serviceAreaZipCodes?.join(', ')}
            </div>
          </Card>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <SectionHead title="Organization Info" />
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">Legal Name</label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={e => handleInputChange('legalName', e.target.value)}
                  className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Operating Name</label>
                <input
                  type="text"
                  value={formData.operatingName || ''}
                  onChange={e => handleInputChange('operatingName', e.target.value)}
                  className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Bed Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedCapacity || ''}
                    onChange={e => handleInputChange('bedCapacity', parseInt(e.target.value))}
                    className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Full-Time Staff</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ftesCount || ''}
                    onChange={e => handleInputChange('ftesCount', parseInt(e.target.value))}
                    className="w-full rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Services */}
          <Card>
            <SectionHead title="Primary Services" />
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICE_TYPES.map(service => (
                <label key={service} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.primaryServices?.includes(service) || false}
                    onChange={() => handleServiceToggle(service)}
                    className="rounded"
                  />
                  <span className="text-sm">{service.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Demographics */}
          <Card>
            <SectionHead title="Demographics Served" />
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMOGRAPHICS.map(demo => (
                <label key={demo} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.demographics?.includes(demo) || false}
                    onChange={() => handleDemographicToggle(demo)}
                    className="rounded"
                  />
                  <span className="text-sm">{demo.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Service Area */}
          <Card>
            <SectionHead title="Service Area ZIP Codes" />
            <div className="space-y-2">
              {formData.serviceAreaZipCodes?.map((zip, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={zip}
                    onChange={e => handleZipChange(idx, e.target.value)}
                    placeholder="ZIP code"
                    className="flex-1 rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi focus:border-coral focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeZip(idx)}
                    className="rounded-md border border-line px-3 py-2 text-sm hover:bg-ink-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addZip}
                className="text-sm font-semibold text-coral hover:text-coral/90"
              >
                Add ZIP Code →
              </button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-coral px-4 py-2 font-semibold text-ink-0 hover:bg-coral/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFormData(nonprofit);
              }}
              className="rounded-md border border-line px-4 py-2 font-semibold hover:bg-ink-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
