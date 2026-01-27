-- Remove phonetic columns from companies and unions
ALTER TABLE companies DROP COLUMN IF EXISTS name_phonetic;
ALTER TABLE unions DROP COLUMN IF EXISTS name_phonetic;