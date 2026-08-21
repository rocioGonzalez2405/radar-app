-- Buy Nothing Marketplace Database Schema
-- PostgreSQL tables for nonprofit resource exchange system
-- Integrated with Radar homelessness decision-support dashboard

-- ============================================================================
-- NONPROFIT PROFILES
-- ============================================================================

CREATE TABLE nonprofits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name VARCHAR(255) NOT NULL,
  operating_name VARCHAR(255) NOT NULL,
  primary_services TEXT[] NOT NULL, -- Stored as array of ServiceType enums
  demographics TEXT[] NOT NULL, -- Array of RTFHDemographic enums
  service_area_zip_codes TEXT[] NOT NULL,
  bed_capacity INTEGER NOT NULL,
  utilization_rate DECIMAL(3, 2) NOT NULL, -- 0.00-1.00
  ftes_count INTEGER NOT NULL,
  reputation_score DECIMAL(3, 0) NOT NULL DEFAULT 70, -- 0-100
  completed_exchanges INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_nonprofits_active ON nonprofits(is_active);
CREATE INDEX idx_nonprofits_services ON nonprofits USING GIN(primary_services);
CREATE INDEX idx_nonprofits_demographics ON nonprofits USING GIN(demographics);
CREATE INDEX idx_nonprofits_zip ON nonprofits USING GIN(service_area_zip_codes);

-- ============================================================================
-- INVENTORY (What orgs have available)
-- ============================================================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- ServiceType enum
  quantity INTEGER NOT NULL,
  quantity_unit VARCHAR(50) NOT NULL, -- 'beds', 'hours', 'units', etc.
  description TEXT NOT NULL,
  demographics TEXT[] NOT NULL, -- Who this serves (RTFHDemographic[])
  available_from TIMESTAMP NOT NULL,
  available_until TIMESTAMP NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_inventory_nonprofit ON inventory_items(nonprofit_id);
CREATE INDEX idx_inventory_service_type ON inventory_items(service_type);
CREATE INDEX idx_inventory_available ON inventory_items(available_from, available_until, is_available);
CREATE INDEX idx_inventory_demographics ON inventory_items USING GIN(demographics);

-- ============================================================================
-- NEEDS (What orgs are looking for)
-- ============================================================================

CREATE TABLE needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- ServiceType enum
  quantity INTEGER NOT NULL,
  quantity_unit VARCHAR(50) NOT NULL,
  urgency VARCHAR(20) NOT NULL, -- UrgencyLevel enum: 'critical', 'high', 'medium', 'low'
  deadline TIMESTAMP NOT NULL,
  demographics TEXT[] NOT NULL, -- Who needs this (RTFHDemographic[])
  fairness_criteria TEXT NOT NULL, -- What would feel fair?
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_needs_nonprofit ON needs(nonprofit_id);
CREATE INDEX idx_needs_service_type ON needs(service_type);
CREATE INDEX idx_needs_open ON needs(is_open, deadline);
CREATE INDEX idx_needs_demographics ON needs USING GIN(demographics);

-- ============================================================================
-- MATCHES (Potential exchanges proposed by system)
-- ============================================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  from_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  to_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'proposed', -- MatchStatus enum
  proposed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,

  -- Fairness scoring (breakdown stored as JSONB)
  fairness_score DECIMAL(3, 0) NOT NULL, -- 0-100
  fairness_breakdown JSONB NOT NULL, -- { fit, value, benefit, radarImpact, reputation }
  fairness_reasoning TEXT,

  -- Radar integration
  radar_signal VARCHAR(100), -- e.g., 'age_55_plus_rising', 'housing_pressure'

  -- Transaction reference
  transaction_id UUID REFERENCES transactions(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_matches_inventory ON matches(inventory_id);
CREATE INDEX idx_matches_need ON matches(need_id);
CREATE INDEX idx_matches_from_nonprofit ON matches(from_nonprofit_id);
CREATE INDEX idx_matches_to_nonprofit ON matches(to_nonprofit_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_score ON matches(fairness_score DESC);
CREATE INDEX idx_matches_radar ON matches(radar_signal);

-- ============================================================================
-- TRANSACTIONS (Completed/executing exchanges)
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
  from_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  to_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'executing', -- MatchStatus enum
  what_transferred TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  expected_end_date TIMESTAMP NOT NULL,
  actual_end_date TIMESTAMP,
  people_served INTEGER,
  radar_demographic VARCHAR(50), -- Which subgroup was served (RTFHDemographic)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_transactions_match ON transactions(match_id);
CREATE INDEX idx_transactions_from_nonprofit ON transactions(from_nonprofit_id);
CREATE INDEX idx_transactions_to_nonprofit ON transactions(to_nonprofit_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date_range ON transactions(start_date, expected_end_date);

-- ============================================================================
-- FAIRNESS RATINGS (Post-transaction feedback)
-- ============================================================================

CREATE TABLE fairness_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  rated_by_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  stars SMALLINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fairness_ratings_transaction ON fairness_ratings(transaction_id);
CREATE INDEX idx_fairness_ratings_nonprofit ON fairness_ratings(rated_by_nonprofit_id);

-- ============================================================================
-- AUDIT LOG (Complete history of all actions)
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL, -- e.g., 'match_proposed', 'match_accepted', 'transaction_completed'
  actor_type VARCHAR(50) NOT NULL, -- 'nonprofit', 'admin', 'system'
  actor_id VARCHAR(100), -- nonprofit_id or admin user id
  resource_type VARCHAR(50) NOT NULL, -- 'nonprofit', 'inventory', 'need', 'match', 'transaction'
  resource_id UUID NOT NULL,
  changes JSONB, -- { before: {...}, after: {...} }
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);

-- ============================================================================
-- MATCH REJECTIONS (Track why orgs say no)
-- ============================================================================

CREATE TABLE match_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rejected_by_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  reason TEXT,
  rejected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rejections_match ON match_rejections(match_id);
CREATE INDEX idx_rejections_nonprofit ON match_rejections(rejected_by_nonprofit_id);

-- ============================================================================
-- DISPUTE TRACKING (For Phase 2)
-- ============================================================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reported_by_nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'escalated'
  resolution TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_transaction ON disputes(transaction_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Available inventory (not yet matched)
CREATE VIEW available_inventory AS
SELECT
  i.id,
  i.nonprofit_id,
  n.operating_name,
  i.service_type,
  i.quantity,
  i.quantity_unit,
  i.description,
  i.demographics,
  i.available_from,
  i.available_until,
  CASE
    WHEN m.id IS NOT NULL THEN false
    ELSE true
  END AS is_unmatched
FROM inventory_items i
JOIN nonprofits n ON i.nonprofit_id = n.id
LEFT JOIN matches m ON i.id = m.inventory_id AND m.status IN ('proposed', 'negotiated', 'accepted', 'executing')
WHERE i.is_available = true
  AND i.available_from <= NOW()
  AND i.available_until > NOW()
  AND i.deleted_at IS NULL;

-- Open needs (not yet fulfilled)
CREATE VIEW open_needs AS
SELECT
  n.id,
  n.nonprofit_id,
  np.operating_name,
  n.service_type,
  n.quantity,
  n.quantity_unit,
  n.urgency,
  n.deadline,
  n.demographics,
  CASE
    WHEN m.id IS NOT NULL THEN false
    ELSE true
  END AS is_unmatched
FROM needs n
JOIN nonprofits np ON n.nonprofit_id = np.id
LEFT JOIN matches m ON n.id = m.need_id AND m.status IN ('proposed', 'negotiated', 'accepted', 'executing')
WHERE n.is_open = true
  AND n.deadline > NOW()
  AND n.deleted_at IS NULL;

-- Active matches (proposed, negotiated, or accepted)
CREATE VIEW active_matches AS
SELECT
  m.id,
  m.inventory_id,
  m.need_id,
  m.from_nonprofit_id,
  m.to_nonprofit_id,
  fnp.operating_name as from_nonprofit,
  tnp.operating_name as to_nonprofit,
  m.status,
  m.fairness_score,
  m.fairness_breakdown,
  m.radar_signal,
  m.proposed_at,
  m.accepted_at
FROM matches m
JOIN nonprofits fnp ON m.from_nonprofit_id = fnp.id
JOIN nonprofits tnp ON m.to_nonprofit_id = tnp.id
WHERE m.status IN ('proposed', 'negotiated', 'accepted')
  AND m.deleted_at IS NULL;
