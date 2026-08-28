-- Sentiment + intent classification columns for activities (nullable; backfilled by InsightService).
ALTER TABLE activities ADD COLUMN sentiment VARCHAR(20);
ALTER TABLE activities ADD COLUMN intent VARCHAR(20);
