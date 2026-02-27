-- LittleBridge Seed Data
-- Run AFTER schema.sql and 001_review_feedback.sql
-- These are FICTIONAL centers for development/demo purposes
-- Replace with real center data before launch

-- ============================================================================
-- UUIDs follow a deterministic pattern for easy reference:
--   Profile (auth-like):  b2000000-0000-0000-0000-00000000000X
--   Center profile:       d2000000-0000-0000-0000-00000000000X
--   Job listing:          e2000000-0000-0000-0000-00000000000X
-- ============================================================================


-- ============================================================================
-- CENTER 1: Little Stars Early Learning — Chatswood, 2067
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000001'::uuid,
  'center',
  'admin@littlestars-chatswood.example.com',
  'Little Stars Early Learning',
  'en', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000001'::uuid,
  'b2000000-0000-0000-0000-000000000001'::uuid,
  'Little Stars Early Learning',
  'little-stars-early-learning',
  '51 234 567 001',
  '23 Victoria Avenue',
  'Chatswood', '2067', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1813, -33.7969), 4326)::geography,
  '02 9411 8801',
  'admin@littlestars-chatswood.example.com',
  'https://littlestars-chatswood.example.com',
  'Little Stars Early Learning is a warm, community-focused centre in the heart of Chatswood. Our bilingual Mandarin-English program is woven into every part of the day, from morning circle time to afternoon storytime. We believe children thrive when they feel culturally connected, and our dedicated team nurtures both language development and a love of learning.',
  '星星幼儿教育中心位于Chatswood核心地段，是一所温馨的社区型早教中心。我们的中英双语课程贯穿每日活动，从早晨的集体时间到下午的故事环节，处处融入双语学习。我们相信，当孩子感受到文化归属感时，才能真正茁壮成长。',
  '{"monday":{"open":"07:00","close":"18:00"},"tuesday":{"open":"07:00","close":"18:00"},"wednesday":{"open":"07:00","close":"18:00"},"thursday":{"open":"07:00","close":"18:00"},"friday":{"open":"07:00","close":"18:00"}}',
  '[{"group_name":"Toddlers (1-2)","capacity":16,"vacancies":3},{"group_name":"Pre-Kindy (3-4)","capacity":22,"vacancies":4},{"group_name":"Kindy (4-6)","capacity":20,"vacancies":2}]',
  120.00, 155.00,
  '[{"language":"Mandarin","count":3},{"language":"English","count":12}]',
  ARRAY['bilingual_program','cultural_events','mandarin_classes','play_based','outdoor','music'],
  'exceeding',
  'active', 'founding', true, true,
  'play_based', 'very_important', 'daily', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Photos for Little Stars
INSERT INTO center_photos (id, center_profile_id, photo_url, display_order, alt_text) VALUES
  (uuid_generate_v4(), 'd2000000-0000-0000-0000-000000000001'::uuid, '/demo/little-stars-outdoor.jpg', 1, 'Children playing in the outdoor learning area'),
  (uuid_generate_v4(), 'd2000000-0000-0000-0000-000000000001'::uuid, '/demo/little-stars-storytime.jpg', 2, 'Bilingual storytime session in the reading corner'),
  (uuid_generate_v4(), 'd2000000-0000-0000-0000-000000000001'::uuid, '/demo/little-stars-classroom.jpg', 3, 'Bright and spacious toddler room')
ON CONFLICT DO NOTHING;

-- Job listing for Little Stars
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000001'::uuid,
  'd2000000-0000-0000-0000-000000000001'::uuid,
  'Bilingual Early Childhood Educator (Mandarin/English)',
  'full_time',
  'We are looking for a passionate bilingual educator to join our toddler room team. You will deliver our Mandarin immersion program alongside experienced colleagues. The ideal candidate speaks Mandarin fluently and holds a Diploma or above in Early Childhood Education. Experience in a long day care setting is preferred.',
  '我们正在寻找一位热爱教育的中英双语教师加入幼儿班团队。您将与经验丰富的同事一起开展普通话沉浸式课程。理想候选人普通话流利，持有幼儿教育文凭或以上学历，有全日制托儿中心工作经验者优先。',
  'diploma',
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"fluent"}]',
  1,
  30.50, 36.00,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 2: Harmony Kids Childcare — Eastwood, 2122
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000002'::uuid,
  'center',
  'info@harmonykids-eastwood.example.com',
  'Harmony Kids Childcare',
  'zh', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000002'::uuid,
  'b2000000-0000-0000-0000-000000000002'::uuid,
  'Harmony Kids Childcare',
  'harmony-kids-childcare',
  '51 234 567 002',
  '8 Rowe Street',
  'Eastwood', '2122', 'NSW',
  ST_SetSRID(ST_MakePoint(151.0810, -33.7663), 4326)::geography,
  '02 9874 5502',
  'info@harmonykids-eastwood.example.com',
  'https://harmonykids-eastwood.example.com',
  'Harmony Kids Childcare in Eastwood is one of the most linguistically diverse centres in the area, with staff who speak Mandarin, Cantonese, and English. We welcome children from 6 weeks to school age and pride ourselves on creating an environment where every family feels at home. Our curriculum blends structured learning with free play, and we celebrate cultural festivals from around the world throughout the year.',
  'Harmony Kids位于Eastwood，是本区语言最多元的托儿中心之一，教职员工精通普通话、粤语和英语。我们接收6周至学龄儿童，致力于营造让每个家庭都有归属感的环境。我们的课程将结构化学习与自由游戏相结合，全年庆祝来自世界各地的文化节日。',
  '{"monday":{"open":"07:00","close":"18:30"},"tuesday":{"open":"07:00","close":"18:30"},"wednesday":{"open":"07:00","close":"18:30"},"thursday":{"open":"07:00","close":"18:30"},"friday":{"open":"07:00","close":"18:30"}}',
  '[{"group_name":"Nursery (0-1)","capacity":12,"vacancies":2},{"group_name":"Toddlers (1-2)","capacity":16,"vacancies":3},{"group_name":"Pre-Kindy (3-4)","capacity":22,"vacancies":5},{"group_name":"Kindy (4-6)","capacity":20,"vacancies":4}]',
  110.00, 145.00,
  '[{"language":"Mandarin","count":4},{"language":"Cantonese","count":2},{"language":"English","count":10}]',
  ARRAY['bilingual_program','cultural_events','play_based','outdoor','art','music','stem'],
  'meeting',
  'active', 'founding', true, true,
  'balanced', 'very_important', 'weekly', 'lots', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Harmony Kids
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000002'::uuid,
  'd2000000-0000-0000-0000-000000000002'::uuid,
  'Mandarin-Speaking Room Leader — Toddler Room',
  'full_time',
  'We need an experienced Room Leader for our busy toddler room. You will lead a team of three educators and be responsible for programming, family communication, and daily documentation. Mandarin fluency is essential as many of our families communicate primarily in Mandarin. Must hold a Diploma or Bachelor in Early Childhood Education.',
  '我们正在招聘一位经验丰富的幼儿班组长。您将带领三名教师团队，负责课程规划、家长沟通及每日记录工作。由于许多家庭以普通话为主要沟通语言，普通话流利是必备条件。需持有幼儿教育文凭或学士学位。',
  'diploma',
  '[{"language":"Mandarin","proficiency":"native"},{"language":"English","proficiency":"fluent"}]',
  3,
  33.00, 39.00,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 3: Bright Bridge Early Education — Burwood, 2134
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000003'::uuid,
  'center',
  'hello@brightbridge-burwood.example.com',
  'Bright Bridge Early Education',
  'en', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000003'::uuid,
  'b2000000-0000-0000-0000-000000000003'::uuid,
  'Bright Bridge Early Education',
  'bright-bridge-early-education',
  '51 234 567 003',
  '102 Burwood Road',
  'Burwood', '2134', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1042, -33.8773), 4326)::geography,
  '02 9747 6603',
  'hello@brightbridge-burwood.example.com',
  'https://brightbridge-burwood.example.com',
  'Bright Bridge Early Education provides a nurturing, Mandarin-rich environment for children from birth to preschool age. Located in the heart of Burwood, our NQS Exceeding-rated centre integrates Chinese language and culture into our play-based curriculum every single day. Our qualified educators are passionate about giving children the gift of bilingualism from their earliest years.',
  'Bright Bridge幼儿教育中心为从婴儿到学龄前的孩子提供一个充满关爱、沉浸在普通话环境中的成长空间。我们位于Burwood中心地段，NQS评级为"超越标准"。中文语言与文化每天都融入我们以游戏为基础的课程中，让孩子从小就拥有双语的优势。',
  '{"monday":{"open":"07:00","close":"18:00"},"tuesday":{"open":"07:00","close":"18:00"},"wednesday":{"open":"07:00","close":"18:00"},"thursday":{"open":"07:00","close":"18:00"},"friday":{"open":"07:00","close":"18:00"}}',
  '[{"group_name":"Nursery (0-1)","capacity":10,"vacancies":1},{"group_name":"Toddlers (1-2)","capacity":16,"vacancies":2},{"group_name":"Pre-Kindy (3-5)","capacity":24,"vacancies":4}]',
  125.00, 160.00,
  '[{"language":"Mandarin","count":4},{"language":"English","count":8}]',
  ARRAY['bilingual_program','mandarin_classes','cultural_events','play_based','art','outdoor'],
  'exceeding',
  'active', 'founding', true, true,
  'play_based', 'very_important', 'daily', 'moderate', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Bright Bridge
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000003'::uuid,
  'd2000000-0000-0000-0000-000000000003'::uuid,
  'Nursery Educator — Bilingual (Mandarin/English)',
  'full_time',
  'Join our caring nursery team and help give babies and young toddlers a beautiful start. We are looking for a Mandarin-speaking educator with a Certificate III or above who is gentle, patient, and enthusiastic about early language exposure. You will support our bilingual nursery program, singing songs, reading stories, and engaging in sensory play in both Mandarin and English.',
  '加入我们温馨的婴儿班团队，为宝宝们带来美好的人生起点。我们正在寻找一位会说普通话、持有三级证书或以上学历的教育者。您需要温柔、耐心，并热衷于早期语言启蒙，通过中英双语唱歌、讲故事和感官游戏来支持我们的双语课程。',
  'certificate_iii',
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"conversational"}]',
  0,
  28.50, 32.00,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 4: Sunshine Bilingual Centre — Hurstville, 2220
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000004'::uuid,
  'center',
  'contact@sunshineblc-hurstville.example.com',
  'Sunshine Bilingual Centre',
  'zh', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000004'::uuid,
  'b2000000-0000-0000-0000-000000000004'::uuid,
  'Sunshine Bilingual Centre',
  'sunshine-bilingual-centre',
  '51 234 567 004',
  '35 Queens Road',
  'Hurstville', '2220', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1024, -33.9673), 4326)::geography,
  '02 9580 7704',
  'contact@sunshineblc-hurstville.example.com',
  'https://sunshineblc-hurstville.example.com',
  'Sunshine Bilingual Centre is a well-established long day care centre in Hurstville, serving the local Chinese-Australian community for over ten years. With staff fluent in Mandarin, Cantonese, and English, we make every family feel welcome from day one. Our programs include bilingual storytime, cultural celebrations for Lunar New Year, Mid-Autumn Festival, and more, plus a strong focus on school readiness for our kindy children.',
  '阳光双语托儿中心是Hurstville一所历史悠久的全日制托儿中心，服务本地华人社区已超过十年。我们的教职员工精通普通话、粤语和英语，让每个家庭从第一天起就感到宾至如归。我们的课程包括双语故事时间、春节和中秋节等文化庆祝活动，同时注重为即将入学的孩子做好充分的幼小衔接准备。',
  '{"monday":{"open":"07:30","close":"18:00"},"tuesday":{"open":"07:30","close":"18:00"},"wednesday":{"open":"07:30","close":"18:00"},"thursday":{"open":"07:30","close":"18:00"},"friday":{"open":"07:30","close":"18:00"}}',
  '[{"group_name":"Toddlers (1-2)","capacity":16,"vacancies":4},{"group_name":"Pre-Kindy (3-4)","capacity":22,"vacancies":6},{"group_name":"Kindy (4-6)","capacity":20,"vacancies":3}]',
  105.00, 140.00,
  '[{"language":"Mandarin","count":5},{"language":"Cantonese","count":3},{"language":"English","count":8}]',
  ARRAY['bilingual_program','cultural_events','mandarin_classes','play_based','outdoor','sports'],
  'meeting',
  'active', 'founding', true, true,
  'balanced', 'very_important', 'weekly', 'lots', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Sunshine Bilingual Centre
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000004'::uuid,
  'd2000000-0000-0000-0000-000000000004'::uuid,
  'Cantonese/Mandarin-Speaking Educator — Pre-Kindy',
  'part_time',
  'We have a part-time opportunity (3 days per week) in our Pre-Kindy room for an educator who speaks Cantonese or Mandarin. You will help deliver our bilingual storytime program and support children in developing confidence in both their home language and English. Certificate III minimum; Diploma preferred.',
  '我们Pre-Kindy班正在招聘一位兼职教师（每周三天），需会说粤语或普通话。您将协助开展双语故事课程，帮助孩子们在母语和英语方面都建立信心。最低要求三级证书，文凭学历优先。',
  'certificate_iii',
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"conversational"}]',
  1,
  29.00, 33.50,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 5: Rainbow Garden Early Learning — Epping, 2121
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000005'::uuid,
  'center',
  'enrol@rainbowgarden-epping.example.com',
  'Rainbow Garden Early Learning',
  'en', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000005'::uuid,
  'b2000000-0000-0000-0000-000000000005'::uuid,
  'Rainbow Garden Early Learning',
  'rainbow-garden-early-learning',
  '51 234 567 005',
  '15 Rawson Street',
  'Epping', '2121', 'NSW',
  ST_SetSRID(ST_MakePoint(151.0818, -33.7726), 4326)::geography,
  '02 9868 9905',
  'enrol@rainbowgarden-epping.example.com',
  'https://rainbowgarden-epping.example.com',
  'Rainbow Garden Early Learning in Epping offers an exceptional bilingual experience from nursery through to kindergarten. Our NQS Exceeding-rated centre features purpose-built outdoor learning spaces, a dedicated Mandarin immersion room, and a team of educators who genuinely love what they do. We are proud to be one of the top-rated bilingual centres in the Epping area.',
  'Rainbow Garden幼儿教育中心位于Epping，为从婴儿班到幼儿园的孩子提供卓越的双语体验。我们的NQS评级为"超越标准"，拥有专门设计的户外学习空间、独立的普通话沉浸式教室，以及一支真正热爱教育事业的团队。我们是Epping地区评价最高的双语中心之一。',
  '{"monday":{"open":"07:00","close":"18:30"},"tuesday":{"open":"07:00","close":"18:30"},"wednesday":{"open":"07:00","close":"18:30"},"thursday":{"open":"07:00","close":"18:30"},"friday":{"open":"07:00","close":"18:30"}}',
  '[{"group_name":"Nursery (0-1)","capacity":10,"vacancies":1},{"group_name":"Toddlers (1-2)","capacity":16,"vacancies":2},{"group_name":"Pre-Kindy (3-4)","capacity":22,"vacancies":3},{"group_name":"Kindy (4-6)","capacity":20,"vacancies":2}]',
  130.00, 165.00,
  '[{"language":"Mandarin","count":5},{"language":"English","count":14}]',
  ARRAY['bilingual_program','mandarin_classes','cultural_events','play_based','outdoor','stem','music','art'],
  'exceeding',
  'active', 'founding', true, true,
  'play_based', 'very_important', 'daily', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Rainbow Garden
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000005'::uuid,
  'd2000000-0000-0000-0000-000000000005'::uuid,
  'Early Childhood Teacher — Bilingual Program Lead',
  'full_time',
  'We are seeking a qualified Early Childhood Teacher (Bachelor degree) to lead our bilingual program across the centre. You will mentor junior educators, design the Mandarin immersion curriculum, and liaise with families in both Mandarin and English. This is a leadership role suited to someone with at least 3 years of experience in early childhood education.',
  '我们正在招聘一位持有学士学位的幼儿教师，负责领导全中心的双语课程。您将指导初级教师、设计普通话沉浸式课程，并以中英双语与家长沟通。这是一个领导型岗位，适合拥有至少三年幼教经验的候选人。',
  'bachelor',
  '[{"language":"Mandarin","proficiency":"native"},{"language":"English","proficiency":"fluent"}]',
  3,
  38.00, 45.00,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 6: Little Panda Childcare — Strathfield, 2135
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000006'::uuid,
  'center',
  'admin@littlepanda-strathfield.example.com',
  'Little Panda Childcare',
  'zh', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000006'::uuid,
  'b2000000-0000-0000-0000-000000000006'::uuid,
  'Little Panda Childcare',
  'little-panda-childcare',
  '51 234 567 006',
  '42 The Boulevarde',
  'Strathfield', '2135', 'NSW',
  ST_SetSRID(ST_MakePoint(151.0933, -33.8795), 4326)::geography,
  '02 9742 1106',
  'admin@littlepanda-strathfield.example.com',
  'https://littlepanda-strathfield.example.com',
  'Little Panda Childcare is a boutique centre in Strathfield caring for children from birth to preschool. We keep our group sizes small so every child receives individual attention. Our Mandarin-speaking educators lead daily bilingual activities including songs, cooking, and art, helping children build language skills naturally. We serve freshly prepared meals with Chinese and Western options every day.',
  '小熊猫托儿中心是Strathfield一家精品托儿中心，接收从婴儿到学龄前的孩子。我们保持小班制，确保每个孩子都能得到个别关注。我们的普通话教师每天带领双语活动，包括歌曲、烹饪和艺术创作，帮助孩子自然地发展语言能力。每天供应中西合璧的新鲜餐食。',
  '{"monday":{"open":"07:30","close":"18:00"},"tuesday":{"open":"07:30","close":"18:00"},"wednesday":{"open":"07:30","close":"18:00"},"thursday":{"open":"07:30","close":"18:00"},"friday":{"open":"07:30","close":"18:00"}}',
  '[{"group_name":"Nursery (0-1)","capacity":8,"vacancies":1},{"group_name":"Toddlers (1-2)","capacity":12,"vacancies":3},{"group_name":"Pre-Kindy (3-5)","capacity":20,"vacancies":4}]',
  115.00, 150.00,
  '[{"language":"Mandarin","count":3},{"language":"English","count":7}]',
  ARRAY['bilingual_program','cultural_events','play_based','art','music'],
  'meeting',
  'active', 'founding', true, true,
  'play_based', 'somewhat_important', 'weekly', 'moderate', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Little Panda
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000006'::uuid,
  'd2000000-0000-0000-0000-000000000006'::uuid,
  'Bilingual Nursery Educator (Mandarin/English)',
  'full_time',
  'Our nursery room is growing, and we need a caring, bilingual educator to join the team. You will work closely with infants and young toddlers, providing a safe and stimulating environment. Mandarin skills are essential for communicating with our families. Certificate III required; we welcome new graduates.',
  '随着婴儿班的扩大，我们需要一位有爱心的双语教师加入团队。您将与婴幼儿密切接触，提供安全且富有启发性的环境。普通话能力是与家长沟通的必备条件。需持有三级证书，欢迎应届毕业生申请。',
  'certificate_iii',
  '[{"language":"Mandarin","proficiency":"conversational"},{"language":"English","proficiency":"fluent"}]',
  0,
  28.00, 31.50,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 7: Golden Bridge Early Education — Ashfield, 2131
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000007'::uuid,
  'center',
  'director@goldenbridge-ashfield.example.com',
  'Golden Bridge Early Education',
  'en', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000007'::uuid,
  'b2000000-0000-0000-0000-000000000007'::uuid,
  'Golden Bridge Early Education',
  'golden-bridge-early-education',
  '51 234 567 007',
  '58 Liverpool Road',
  'Ashfield', '2131', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1260, -33.8881), 4326)::geography,
  '02 9798 2207',
  'director@goldenbridge-ashfield.example.com',
  'https://goldenbridge-ashfield.example.com',
  'Golden Bridge Early Education is located in the vibrant multicultural hub of Ashfield. We specialise in preparing children aged 3-6 for school, with a strong bilingual program in Mandarin, Cantonese, and English. Our educators come from diverse backgrounds and bring real cultural depth to the classroom. We offer affordable fees and are committed to making quality bilingual education accessible to all families.',
  '金桥幼儿教育中心位于充满活力的多元文化社区Ashfield。我们专注于为3至6岁的孩子做好入学准备，提供普通话、粤语和英语的强化双语课程。我们的教师来自不同的文化背景，为课堂带来真正的文化深度。我们收费合理，致力于让所有家庭都能享受到优质的双语教育。',
  '{"monday":{"open":"07:00","close":"18:00"},"tuesday":{"open":"07:00","close":"18:00"},"wednesday":{"open":"07:00","close":"18:00"},"thursday":{"open":"07:00","close":"18:00"},"friday":{"open":"07:00","close":"18:00"}}',
  '[{"group_name":"Pre-Kindy (3-4)","capacity":22,"vacancies":5},{"group_name":"Kindy (4-6)","capacity":20,"vacancies":4}]',
  100.00, 135.00,
  '[{"language":"Mandarin","count":3},{"language":"Cantonese","count":2},{"language":"English","count":7}]',
  ARRAY['bilingual_program','cultural_events','mandarin_classes','play_based','art','sports'],
  'meeting',
  'active', 'founding', true, true,
  'structured', 'very_important', 'weekly', 'moderate', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Golden Bridge
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000007'::uuid,
  'd2000000-0000-0000-0000-000000000007'::uuid,
  'Mandarin-Speaking Kindy Educator — School Readiness',
  'full_time',
  'We are looking for an educator to join our Kindy room, with a focus on school readiness and bilingual literacy. You will work with children aged 4-6, running structured group activities in Mandarin and English. Strong classroom management skills and a warm personality are essential. Diploma or Bachelor in Early Childhood Education required.',
  '我们正在为幼儿园班招聘一位教师，重点关注幼小衔接和双语读写能力培养。您将负责4至6岁儿童的中英双语结构化小组活动。出色的课堂管理能力和亲和力是必备条件。需持有幼儿教育文凭或学士学位。',
  'diploma',
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"fluent"}]',
  2,
  31.00, 37.00,
  'active'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- CENTER 8: Bilingual Beginnings — Campsie, 2194
-- ============================================================================

INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES (
  'b2000000-0000-0000-0000-000000000008'::uuid,
  'center',
  'enquiries@bilingualbeginnings-campsie.example.com',
  'Bilingual Beginnings',
  'en', true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner, is_ccs_approved,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'd2000000-0000-0000-0000-000000000008'::uuid,
  'b2000000-0000-0000-0000-000000000008'::uuid,
  'Bilingual Beginnings',
  'bilingual-beginnings',
  '51 234 567 008',
  '19 Beamish Street',
  'Campsie', '2194', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1041, -33.9117), 4326)::geography,
  '02 9718 3308',
  'enquiries@bilingualbeginnings-campsie.example.com',
  'https://bilingualbeginnings-campsie.example.com',
  'Bilingual Beginnings is a friendly, affordable centre in Campsie for toddlers and preschoolers. We are passionate about giving children a head start in Mandarin while keeping our fees accessible for working families. Our small team creates a family-like atmosphere where children are known by name and parents are always welcome to drop in. We are currently working towards our next NQS rating and are committed to continuous improvement.',
  'Bilingual Beginnings是Campsie一家友好且收费亲民的托儿中心，接收幼儿和学龄前儿童。我们热衷于让孩子尽早接触普通话，同时确保收费对双职工家庭友好。我们的小型团队营造出家一般的温馨氛围，每个孩子都被亲切地叫着名字，家长随时可以来访。我们正在努力提升NQS评级，致力于持续进步。',
  '{"monday":{"open":"07:30","close":"18:00"},"tuesday":{"open":"07:30","close":"18:00"},"wednesday":{"open":"07:30","close":"18:00"},"thursday":{"open":"07:30","close":"18:00"},"friday":{"open":"07:30","close":"18:00"}}',
  '[{"group_name":"Toddlers (1-2)","capacity":14,"vacancies":4},{"group_name":"Pre-Kindy (3-5)","capacity":20,"vacancies":6}]',
  95.00, 125.00,
  '[{"language":"Mandarin","count":2},{"language":"English","count":6}]',
  ARRAY['bilingual_program','cultural_events','play_based','outdoor','art'],
  'working_towards',
  'active', 'founding', true, true,
  'play_based', 'somewhat_important', 'weekly', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Job listing for Bilingual Beginnings
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required, experience_required,
  pay_min, pay_max, status
) VALUES (
  'e2000000-0000-0000-0000-000000000008'::uuid,
  'd2000000-0000-0000-0000-000000000008'::uuid,
  'Casual Bilingual Educator (Mandarin/English)',
  'casual',
  'We are building our casual pool and are looking for reliable Mandarin-speaking educators who can cover shifts at short notice. This is a great opportunity for students completing their early childhood qualification or experienced educators seeking flexible hours. Certificate III required (or currently studying).',
  '我们正在组建临时代班教师团队，寻找可靠的普通话教师在短时间内顶班。这是正在攻读幼教学历的学生或希望灵活工作时间的资深教师的理想机会。需持有三级证书（或正在就读）。',
  'certificate_iii',
  '[{"language":"Mandarin","proficiency":"conversational"},{"language":"English","proficiency":"fluent"}]',
  0,
  30.00, 35.00,
  'active'
) ON CONFLICT (id) DO NOTHING;
