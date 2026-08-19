-- ============================================================
-- St. Michael's Lent 2026 — 40-day devotional (key-value JSONB)
-- Aug 15 (Assumption) - Sep 29 (Archangels), the Franciscan "St. Michael's
-- Lent" custom, NOT the universal Ash-Wednesday-to-Easter Lent.
-- Run in the Supabase SQL editor. Idempotent (safe to re-run).
--
-- Schema + real bilingual meta (5 phases) + two worked example days
-- (day 1, day 40). The remaining 38 days are added later via the
-- generated supabase/migration-st-michaels-lent-content.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS lent_content (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  sort_order  int   NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lent_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lent_content' AND policyname='lent_content_public_read') THEN
    CREATE POLICY "lent_content_public_read" ON lent_content FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lent_content' AND policyname='lent_content_auth_all') THEN
    CREATE POLICY "lent_content_auth_all" ON lent_content FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

INSERT INTO lent_content (key, value, sort_order) VALUES ('st-michaels-lent-2026:meta', '{"org":"ചെറുപുഷ്പ മിഷൻ ലീഗ് · കൽപ്പറ്റ മേഖല","titleEn":"St. Michael''s Lent","titleMl":"വിശുദ്ധ മിഖായേലിന്റെ നോമ്പ്","yearLabel":"St. Michael''s Lent 2026","heroTaglineEn":"A Journey of Prayer, Fasting, Courage & Spiritual Warfare","heroTaglineMl":"പ്രാർത്ഥനയുടെയും ഉപവാസത്തിന്റെയും ധൈര്യത്തിന്റെയും ആത്മീയ പോരാട്ടത്തിന്റെയും ഒരു യാത്ര","heroBodyEn":"40 days. 40 steps of courage. One victory in Christ. From the Feast of the Assumption to the Feast of the Archangels, walk with St. Michael toward a stronger, more confident faith.","heroBodyMl":"40 ദിവസങ്ങൾ. 40 ധൈര്യത്തിന്റെ ചുവടുകൾ. ക്രിസ്തുവിൽ ഒരു വിജയം. പരിശുദ്ധ കന്യകാമറിയത്തിന്റെ സ്വർഗ്ഗാരോപണ തിരുനാൾ മുതൽ മാലാഖമാരുടെ തിരുനാൾ വരെ, വിശുദ്ധ മിഖായേലിനോടൊപ്പം ശക്തമായ വിശ്വാസത്തിലേക്ക് നടക്കാം.","ctaLabelEn":"Begin My Journey","ctaLabelMl":"എന്റെ യാത്ര ആരംഭിക്കാം","progressLabelEn":"days of courage","progressLabelMl":"ധൈര്യത്തിന്റെ ദിനങ്ങൾ","phases":[{"index":1,"dayStart":1,"dayEnd":10,"labelEn":"Lord, protect me","labelMl":"കർത്താവേ, എന്നെ കാത്തുകൊള്ളണമേ"},{"index":2,"dayStart":11,"dayEnd":20,"labelEn":"Lord, change me","labelMl":"കർത്താവേ, എന്നെ മാറ്റണമേ"},{"index":3,"dayStart":21,"dayEnd":30,"labelEn":"Lord, purify me","labelMl":"കർത്താവേ, എന്നെ ശുദ്ധീകരിക്കണമേ"},{"index":4,"dayStart":31,"dayEnd":39,"labelEn":"Lord, strengthen me","labelMl":"കർത്താവേ, എന്നെ ശക്തിപ്പെടുത്തണമേ"},{"index":5,"dayStart":40,"dayEnd":40,"labelEn":"Christ has won","labelMl":"ക്രിസ്തു ജയിച്ചു"}]}'::jsonb, 0)
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, sort_order=EXCLUDED.sort_order, updated_at=now();

-- Day 1 — Aug 15 (Assumption)
INSERT INTO lent_content (key, value, sort_order) VALUES ('st-michaels-lent-2026:day-01', '{"day":1,"emoji":"🌿","en":{"themeTitle":"Begin With Surrender","reading":{"text":"The Lord is my light and my salvation; whom shall I fear?","reference":"Psalm 27:1"},"prayer":"Saint Michael the Archangel, help me begin this journey with a sincere heart. Lead me closer to God and teach me to trust Him completely.","activity":"Write down one thing you want to surrender to God during these 40 days.","reflectionQuestion":"What is one thing I want to surrender to God during these 40 days?","posterQuote":{"label":"Strength","text":"The Lord is my light and my salvation; whom shall I fear?","reference":"Psalm 27:1"}},"ml":{"themeTitle":"സമർപ്പണത്തോടെ ആരംഭിക്കാം","reading":{"text":"കർത്താവ് എന്റെ വെളിച്ചവും എന്റെ രക്ഷയും ആകുന്നു; ഞാൻ ആരെ ഭയപ്പെടും?","reference":"സങ്കീർത്തനം 27:1"},"prayer":"വിശുദ്ധ മിഖായേൽ മാലാഖേ, ആത്മാർത്ഥമായ ഹൃദയത്തോടെ ഈ യാത്ര ആരംഭിക്കാൻ എന്നെ സഹായിക്കണമേ. ദൈവത്തോട് കൂടുതൽ അടുപ്പിക്കുകയും പൂർണ്ണമായി അവിടുത്തെ വിശ്വസിക്കാൻ എന്നെ പഠിപ്പിക്കുകയും ചെയ്യണമേ.","activity":"ഈ 40 ദിവസങ്ങളിൽ ദൈവത്തിന് സമർപ്പിക്കാൻ ആഗ്രഹിക്കുന്ന ഒരു കാര്യം എഴുതുക.","reflectionQuestion":"ഈ 40 ദിവസങ്ങളിൽ ദൈവത്തിന് സമർപ്പിക്കാൻ ഞാൻ ആഗ്രഹിക്കുന്ന ഒരു കാര്യം എന്താണ്?","posterQuote":{"label":"ശക്തി","text":"കർത്താവ് എന്റെ വെളിച്ചവും എന്റെ രക്ഷയും ആകുന്നു; ഞാൻ ആരെ ഭയപ്പെടും?","reference":"സങ്കീർത്തനം 27:1"}}}'::jsonb, 1)
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, sort_order=EXCLUDED.sort_order, updated_at=now();

-- Day 40 — Sep 29 (Feast of the Archangels) — the finale
INSERT INTO lent_content (key, value, sort_order) VALUES ('st-michaels-lent-2026:day-40', '{"day":40,"emoji":"🛡️","en":{"themeTitle":"Victory Belongs to God","reading":{"text":"Michael and his angels fought against the dragon…","reference":"Revelation 12:7-11"},"prayer":"Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly hosts, by the power of God, cast into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.","activity":"Attend Holy Mass if possible. Receive the Sacraments worthily, thank God for these 40 days, and make a personal commitment: “I will continue the battle—not with fear, but with faith; not by my strength, but by the grace of Christ.”","reflectionQuestion":"As I complete this journey, what am I most grateful to God for?","posterQuote":{"label":"Victory","text":"The kingdom of our God and the authority of his Christ have come.","reference":"Revelation 12:10"}},"ml":{"themeTitle":"വിജയം ദൈവത്തിന്റേതാണ്","reading":{"text":"മിഖായേലും അവന്റെ ദൂതന്മാരും മഹാസർപ്പത്തോട് യുദ്ധം ചെയ്തു…","reference":"വെളിപാട് 12:7-11"},"prayer":"വിശുദ്ധ മിഖായേൽ മാലാഖേ, യുദ്ധത്തിൽ ഞങ്ങളെ പ്രതിരോധിക്കണമേ. പിശാചിന്റെ ദുഷ്ടതയിൽ നിന്നും കെണികളിൽ നിന്നും ഞങ്ങളെ കാത്തുകൊള്ളണമേ. ദൈവം അവനെ ശാസിക്കട്ടെ എന്ന് ഞങ്ങൾ വിനയത്തോടെ പ്രാർത്ഥിക്കുന്നു; സ്വർഗ്ഗീയ സൈന്യത്തിന്റെ പ്രഭുവായ അങ്ങ്, ദൈവത്തിന്റെ ശക്തിയാൽ, ലോകത്തിൽ ചുറ്റിനടന്ന് ആത്മാക്കളുടെ നാശം തേടുന്ന സാത്താനെയും സകല ദുരാത്മാക്കളെയും നരകത്തിലേക്ക് തള്ളിവിടണമേ. ആമേൻ.","activity":"സാധിക്കുമെങ്കിൽ വിശുദ്ധ കുർബാനയിൽ പങ്കെടുക്കുക. കൂദാശകൾ യോഗ്യതയോടെ സ്വീകരിച്ച്, ഈ 40 ദിവസങ്ങൾക്ക് ദൈവത്തിന് നന്ദി പറഞ്ഞ്, ഒരു വ്യക്തിഗത പ്രതിജ്ഞ എടുക്കുക: “ഭയത്തോടെയല്ല, വിശ്വാസത്തോടെ ഞാൻ പോരാട്ടം തുടരും; എന്റെ ശക്തിയാലല്ല, ക്രിസ്തുവിന്റെ കൃപയാൽ.”","reflectionQuestion":"ഈ യാത്ര പൂർത്തിയാക്കിയപ്പോൾ ഞാൻ ദൈവത്തോട് ഏറ്റവും നന്ദിയുള്ളത് എന്തിനാണ്?","posterQuote":{"label":"വിജയം","text":"നമ്മുടെ ദൈവത്തിന്റെ രാജ്യവും അവിടുത്തെ ക്രിസ്തുവിന്റെ അധികാരവും വന്നിരിക്കുന്നു.","reference":"വെളിപാട് 12:10"}}}'::jsonb, 40)
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, sort_order=EXCLUDED.sort_order, updated_at=now();
