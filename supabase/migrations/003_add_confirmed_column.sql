ALTER TABLE prediction_data ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false;
ALTER TABLE champion_data ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false;
