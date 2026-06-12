-- CML Mission Hub — Seed Data
-- Inserts test content across today and the next 6 days.

-- ============================================================
-- CONTENT ITEMS — Today (June 10)
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Faith in Sixty Seconds',
  'faith-in-sixty-seconds',
  'reel',
  'A short visual reflection to begin your morning with purpose.',
  'Start each morning with a one-minute reminder of God''s presence in the ordinary moments of life.',
  false,
  '2026-06-10T07:00:00+05:30'
),
(
  'Morning Voice Note',
  'morning-voice-note',
  'voice-note',
  'Listen to a two-minute reflection from your animator.',
  'Today''s reflection invites us to pause and listen to the quiet voice within.',
  false,
  '2026-06-10T07:30:00+05:30'
),
(
  'A Word for Today',
  'a-word-for-today',
  'message',
  'Draw near, and let today be shaped by gratitude and small acts of love.',
  'Dear friends, as we begin this new day, let us remember that every small act of kindness is a prayer in itself. The Lord asks nothing grand of us — only that we love where we are, with what we have.',
  false,
  '2026-06-10T08:00:00+05:30'
),
(
  'Witness of the Day — St. Therese',
  'witness-of-the-day-st-therese',
  'saint-reflection',
  'A life that reminds us courage and kindness can change a community.',
  'St. Therese of Lisieux showed us the "little way" — doing small things with great love. Her example teaches us that holiness is not in grand gestures but in the faithfulness of everyday moments.',
  false,
  '2026-06-10T09:00:00+05:30'
);

-- ============================================================
-- CONTENT ITEMS — Tomorrow (June 11)
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Joy in Service',
  'joy-in-service',
  'reel',
  'Highlights from last weekend''s neighbourhood mission visit.',
  'Watch the smiles and stories from our outreach to the elderly in Kalpetta.',
  false,
  '2026-06-11T07:00:00+05:30'
),
(
  'Evening Reflection',
  'evening-reflection-jun11',
  'voice-note',
  'A guided reflection on today''s Gospel reading.',
  'Let the words of today''s Gospel settle in your heart as you wind down.',
  false,
  '2026-06-11T20:00:00+05:30'
);

-- ============================================================
-- CONTENT ITEMS — June 12
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Midweek Encouragement',
  'midweek-encouragement',
  'voice-note',
  'Stay strong in faith — a short word from Fr. Thomas.',
  'Fr. Thomas shares a brief reflection on perseverance and trust in God''s plan.',
  false,
  '2026-06-12T06:30:00+05:30'
),
(
  'Teaching Series Part 2',
  'teaching-series-part-2',
  'video',
  'Part two of the formation series for senior members.',
  'Continuing our study on the Beatitudes — this session covers "Blessed are the meek."',
  false,
  '2026-06-12T19:00:00+05:30'
);

-- ============================================================
-- CONTENT ITEMS — June 13
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Mission Moments',
  'mission-moments',
  'reel',
  'Behind the scenes of this month''s outreach visit.',
  'A glimpse into the preparation and prayer that goes into every CML mission trip.',
  false,
  '2026-06-13T07:00:00+05:30'
),
(
  'Saint of the Day — St. Anthony',
  'saint-of-the-day-st-anthony',
  'saint-reflection',
  'The story of St. Anthony and his devotion to the poor.',
  'St. Anthony of Padua is remembered for his powerful preaching and tireless service to those in need.',
  false,
  '2026-06-13T08:00:00+05:30'
);

-- ============================================================
-- CONTENT ITEMS — June 14
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Friday Praise',
  'friday-praise',
  'reel',
  'Worship highlights from the youth gathering.',
  'Relive the energy and devotion from this week''s Friday praise session.',
  false,
  '2026-06-14T18:00:00+05:30'
),
(
  'Evening Prayer Guide',
  'evening-prayer-guide',
  'audio',
  'A guided audio reflection to close your day in peace.',
  'A gentle five-minute guided prayer to help you release the day and rest in God.',
  false,
  '2026-06-14T21:00:00+05:30'
);

-- ============================================================
-- CONTENT ITEMS — June 15
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Weekend Reflection',
  'weekend-reflection',
  'voice-note',
  'Prepare your heart for Sunday with this short meditation.',
  'Take five minutes to quiet your mind and prepare for tomorrow''s celebration.',
  false,
  '2026-06-15T07:00:00+05:30'
);

-- ============================================================
-- CONTENT ITEMS — June 16 (Sunday)
-- ============================================================
INSERT INTO content_items (title, slug, content_type, summary, content, featured, published_at) VALUES
(
  'Sunday Special',
  'sunday-special',
  'reel',
  'This week''s Mass highlights and community moments.',
  'Beautiful moments captured from today''s celebration — the choir, the readings, and fellowship.',
  false,
  '2026-06-16T12:00:00+05:30'
),
(
  'Homily Recap',
  'homily-recap',
  'voice-note',
  'Key takeaways from today''s homily by Fr. Thomas.',
  'Fr. Thomas spoke about forgiveness and how it frees the one who forgives first.',
  false,
  '2026-06-16T13:00:00+05:30'
);

-- ============================================================
-- NOTICES
-- ============================================================
INSERT INTO notices (title, category, summary, body, priority, published_at) VALUES
(
  'Unit Meeting Moved to Friday',
  'Meeting',
  'This week''s gathering shifts to Friday evening at 6:30 PM.',
  'Due to the parish feast preparations on Wednesday, our unit meeting has been rescheduled to Friday, June 13 at 6:30 PM. Same venue — St. Theresa''s Hall. Please confirm your attendance with your unit leader.',
  'high',
  '2026-06-10T10:00:00+05:30'
),
(
  'Choir Practice Open to All',
  'Event',
  'Open to all members ahead of the feast celebration.',
  'We are inviting all CML members to join choir practice this Wednesday and Saturday in preparation for the parish feast. No experience needed — just a willing heart!',
  'normal',
  '2026-06-12T17:00:00+05:30'
),
(
  'Formation Material Available',
  'Resource',
  'New study booklets available for collection after Mass.',
  'The latest CML formation booklets have arrived. Collect your copy from the parish office after any Mass this weekend.',
  'low',
  '2026-06-12T09:00:00+05:30'
),
(
  'Monthly Mission Report Due',
  'Admin',
  'Submit unit activity reports by end of Friday.',
  'All unit leaders must submit their June activity reports by Friday, June 14 end of day. Use the standard template shared in the WhatsApp group.',
  'urgent',
  '2026-06-14T09:00:00+05:30'
),
(
  'Next Week''s Schedule',
  'General',
  'Updated meeting times and activity calendar for next week.',
  'Please note the following changes for next week: Monday formation class moved to 5 PM, Wednesday outreach visit to Sulthan Bathery, and Friday unit meetings as usual.',
  'normal',
  '2026-06-16T15:00:00+05:30'
);

-- ============================================================
-- ACTIVITIES (upcoming events)
-- ============================================================
INSERT INTO activities (title, description, location, start_date, end_date, featured) VALUES
(
  'Monthly Mission Gathering',
  'Our monthly gathering for prayer, sharing, and mission planning. All members welcome.',
  'St. Theresa''s Hall, Kalpetta',
  '2026-06-15T18:00:00+05:30',
  '2026-06-15T20:30:00+05:30',
  true
),
(
  'Youth Formation Program',
  'Interactive formation session for senior CML members on the Beatitudes.',
  'Parish Center, Kalpetta',
  '2026-06-19T16:00:00+05:30',
  '2026-06-19T18:00:00+05:30',
  false
),
(
  'Community Outreach Visit',
  'Visiting the elderly at the Wayanad Old Age Home. Bring small gifts and your smile.',
  'Wayanad Old Age Home, Sulthan Bathery',
  '2026-06-22T09:00:00+05:30',
  '2026-06-22T13:00:00+05:30',
  true
),
(
  'Parish Feast Day Celebration',
  'Join the parish community for the annual feast — Mass, procession, and cultural programs.',
  'St. Theresa''s Church, Kalpetta',
  '2026-06-29T09:00:00+05:30',
  '2026-06-29T21:00:00+05:30',
  true
);
