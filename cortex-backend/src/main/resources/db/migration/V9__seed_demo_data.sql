-- Demo seed data: users (incl. advertised demo accounts), contacts, deals, activities.
-- Dates are relative to now() so RFM recency, churn risk, and deal-health populate realistically.
-- All demo users share password "password123" (BCrypt).

-- ── Users ──────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES
  (1, 'Admin User',   'admin@cortex.com',   '$2y$10$T27I4kHzmiXzVGMcz9k8x.Drlqg.7xAPvREvE2dvCZCTx/9ogJPPi', 'ADMIN',     now() - interval '120 days', now() - interval '120 days'),
  (2, 'Morgan Lee',   'manager@cortex.com', '$2y$10$T27I4kHzmiXzVGMcz9k8x.Drlqg.7xAPvREvE2dvCZCTx/9ogJPPi', 'MANAGER',   now() - interval '110 days', now() - interval '110 days'),
  (3, 'Alex Rivera',  'rep@cortex.com',     '$2y$10$T27I4kHzmiXzVGMcz9k8x.Drlqg.7xAPvREvE2dvCZCTx/9ogJPPi', 'SALES_REP', now() - interval '100 days', now() - interval '100 days'),
  (4, 'Priya Shah',   'priya@cortex.com',   '$2y$10$T27I4kHzmiXzVGMcz9k8x.Drlqg.7xAPvREvE2dvCZCTx/9ogJPPi', 'SALES_REP', now() - interval '95 days',  now() - interval '95 days');

-- ── Contacts ───────────────────────────────────────────────────────────────
INSERT INTO contacts (id, name, email, phone, company, status, assigned_to, created_at, updated_at) VALUES
  (1, 'Sarah Chen',    'sarah@northwind.com',  '555-0101', 'Northwind Traders',    'CUSTOMER',  3, now() - interval '90 days', now() - interval '5 days'),
  (2, 'David Kim',     'david@acmecorp.com',   '555-0102', 'Acme Corp',            'QUALIFIED', 3, now() - interval '80 days', now() - interval '2 days'),
  (3, 'Elena Petrov',  'elena@globex.com',     '555-0103', 'Globex',               'CUSTOMER',  4, now() - interval '75 days', now() - interval '40 days'),
  (4, 'Marcus Webb',   'marcus@initech.com',   '555-0104', 'Initech',              'CONTACTED', 4, now() - interval '60 days', now() - interval '120 days'),
  (5, 'Nina Torres',   'nina@umbrella.com',    '555-0105', 'Umbrella Inc',         'CUSTOMER',  3, now() - interval '55 days', now() - interval '1 day'),
  (6, 'Tom Fletcher',  'tom@hooli.com',        '555-0106', 'Hooli',                'LOST',      4, now() - interval '50 days', now() - interval '100 days'),
  (7, 'Grace Okafor',  'grace@stark.com',      '555-0107', 'Stark Industries',     'QUALIFIED', 3, now() - interval '30 days', now() - interval '3 days'),
  (8, 'Leo Martins',   'leo@wonka.com',        '555-0108', 'Wonka Co',             'NEW',       4, now() - interval '10 days', now() - interval '10 days');

-- ── Deals (mix of WON for leaderboard/RFM, open for health, overdue/stalled) ─
INSERT INTO deals (id, title, value, stage, close_date, contact_id, assigned_to, created_at, updated_at) VALUES
  (1, 'Northwind annual license',  48000, 'WON',         current_date - 20, 1, 3, now() - interval '85 days', now() - interval '20 days'),
  (2, 'Acme expansion',            32000, 'NEGOTIATION', current_date + 10, 2, 3, now() - interval '40 days', now() - interval '3 days'),
  (3, 'Globex renewal',            60000, 'WON',         current_date - 45, 3, 4, now() - interval '70 days', now() - interval '45 days'),
  (4, 'Initech pilot',             15000, 'PROPOSAL',    current_date - 5,  4, 4, now() - interval '55 days', now() - interval '35 days'),
  (5, 'Umbrella upsell',           22000, 'QUALIFIED',   current_date + 30, 5, 3, now() - interval '20 days', now() - interval '1 day'),
  (6, 'Hooli platform',            90000, 'LOST',        current_date - 30, 6, 4, now() - interval '48 days', now() - interval '30 days'),
  (7, 'Stark integration',         75000, 'PROPOSAL',    current_date + 20, 7, 3, now() - interval '25 days', now() - interval '18 days'),
  (8, 'Wonka starter',              8000, 'PROSPECT',    current_date + 45, 8, 4, now() - interval '9 days',  now() - interval '9 days');

-- ── Activities (recency + sentiment/intent drive analytics) ──────────────────
INSERT INTO activities (type, notes, activity_date, contact_id, deal_id, created_by, sentiment, intent, created_at, updated_at) VALUES
  ('CALL',    'Great call — customer happy, signed the renewal.',           now() - interval '5 days',  1, 1, 3, 'POSITIVE', 'RENEWAL',  now() - interval '5 days',  now() - interval '5 days'),
  ('MEETING', 'Discussed pricing and discount options for expansion.',      now() - interval '2 days',  2, 2, 3, 'NEUTRAL',  'PRICING',  now() - interval '2 days',  now() - interval '2 days'),
  ('EMAIL',   'Customer unhappy about delays, considering competitor.',     now() - interval '40 days', 3, 3, 4, 'NEGATIVE', 'CHURN',    now() - interval '40 days', now() - interval '40 days'),
  ('NOTE',    'No response in weeks, deal going cold.',                      now() - interval '120 days',4, 4, 4, 'NEGATIVE', 'COMPLAINT',now() - interval '120 days',now() - interval '120 days'),
  ('CALL',    'Interested in upgrade with more seats next quarter.',         now() - interval '1 day',   5, 5, 3, 'POSITIVE', 'UPSELL',   now() - interval '1 day',   now() - interval '1 day'),
  ('EMAIL',   'Filed a complaint about support response times.',            now() - interval '100 days',6, 6, 4, 'NEGATIVE', 'COMPLAINT',now() - interval '100 days',now() - interval '100 days'),
  ('MEETING', 'Positive demo, wants a formal proposal.',                    now() - interval '3 days',  7, 7, 3, 'POSITIVE', 'PRICING',  now() - interval '3 days',  now() - interval '3 days'),
  ('CALL',    'Intro call, gathering requirements.',                        now() - interval '10 days', 8, 8, 4, 'NEUTRAL',  'OTHER',    now() - interval '10 days', now() - interval '10 days'),
  ('EMAIL',   'Sent onboarding docs, all good.',                            now() - interval '15 days', 1, 1, 3, 'POSITIVE', 'OTHER',    now() - interval '15 days', now() - interval '15 days'),
  ('NOTE',    'Renewal risk — usage down, check in soon.',                  now() - interval '45 days', 3, 3, 4, 'NEGATIVE', 'RENEWAL',  now() - interval '45 days', now() - interval '45 days');

-- Advance sequences past the explicit ids so app-generated inserts don't collide.
SELECT setval('users_id_seq',      (SELECT MAX(id) FROM users));
SELECT setval('contacts_id_seq',   (SELECT MAX(id) FROM contacts));
SELECT setval('deals_id_seq',      (SELECT MAX(id) FROM deals));
SELECT setval('activities_id_seq', (SELECT MAX(id) FROM activities));
