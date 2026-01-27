-- Add name_phonetic column to companies and unions tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_phonetic TEXT;
ALTER TABLE unions ADD COLUMN IF NOT EXISTS name_phonetic TEXT;

-- Add comment
COMMENT ON COLUMN companies.name_phonetic IS 'Phiên âm tên công ty';
COMMENT ON COLUMN unions.name_phonetic IS 'Phiên âm tên nghiệp đoàn';