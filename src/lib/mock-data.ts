// ---------------------------------------------------------------------------
// Mock Data Layer for LittleBridge Demo Mode
// Used when Supabase environment variables are not configured.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Unsplash photo URLs (free, no auth required)
// ---------------------------------------------------------------------------

const PHOTOS = {
  exterior: "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=800",
  playing: "https://images.unsplash.com/photo-1567057419565-4349c49d8a04?w=800",
  learning: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
  classroom: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800",
  playground: "https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=800",
  teacher: "https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=800",
  craft: "https://images.unsplash.com/photo-1560785477-d43d2b34e0df?w=800",
  reading: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800",
};

// ---------------------------------------------------------------------------
// Helper: generate deterministic UUIDs for mock data
// ---------------------------------------------------------------------------

function mockUuid(index: number): string {
  const hex = index.toString(16).padStart(4, "0");
  return `00000000-0000-4000-a000-00000000${hex}`;
}

// ---------------------------------------------------------------------------
// Mock Centers
// ---------------------------------------------------------------------------

export interface MockCenterProfile {
  id: string;
  center_name: string;
  slug: string;
  suburb: string;
  postcode: string;
  state: string;
  description_en: string;
  description_zh: string;
  fee_min: number;
  fee_max: number;
  nqs_rating: string;
  programs: string[];
  staff_languages: { language: string; count: number }[];
  age_groups: { group_name: string; capacity: number; vacancies: number }[];
  is_ccs_approved: boolean;
  is_founding_partner: boolean;
  subscription_status: string;
  center_photos: { id: string; photo_url: string; display_order: number; alt_text: string | null }[];
  address: string;
  phone: string;
  email: string;
  website: string;
  acecqa_url: string;
  operating_hours: Record<string, { open: string; close: string }>;
  location: null;
}

export const mockCenters: MockCenterProfile[] = [
  // 1 - Little Stars Bilingual Early Learning
  {
    id: mockUuid(1),
    center_name: "Little Stars Bilingual Early Learning",
    slug: "little-stars-chatswood",
    suburb: "Chatswood",
    postcode: "2067",
    state: "NSW",
    description_en:
      "Little Stars Bilingual Early Learning is a premium Mandarin-English immersion centre in the heart of Chatswood. Our dedicated team of bilingual educators create a nurturing environment where children develop fluency in both languages through play-based learning. We offer STEM exploration, nature programs, and a rich cultural curriculum that celebrates diversity.",
    description_zh:
      "小星星双语早教中心位于Chatswood核心地段，是一家优质的中英双语沉浸式教育机构。我们专业的双语教师团队营造温馨的学习环境，让孩子们通过游戏化学习自然掌握中英双语。我们提供STEM探索、自然课程和丰富的多元文化教学。",
    fee_min: 120,
    fee_max: 145,
    nqs_rating: "exceeding",
    programs: ["Bilingual Immersion", "STEM Play", "Outdoor Nature"],
    staff_languages: [
      { language: "Mandarin", count: 8 },
      { language: "English", count: 12 },
      { language: "Cantonese", count: 3 },
    ],
    age_groups: [
      { group_name: "Nursery (0-2)", capacity: 12, vacancies: 2 },
      { group_name: "Toddler (2-3)", capacity: 16, vacancies: 3 },
      { group_name: "Preschool (3-5)", capacity: 22, vacancies: 1 },
    ],
    is_ccs_approved: true,
    is_founding_partner: true,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(101), photo_url: PHOTOS.exterior, display_order: 1, alt_text: "Centre exterior" },
      { id: mockUuid(102), photo_url: PHOTOS.classroom, display_order: 2, alt_text: "Bright classroom" },
      { id: mockUuid(103), photo_url: PHOTOS.playing, display_order: 3, alt_text: "Children at play" },
    ],
    address: "12 Railway Street",
    phone: "(02) 9411 2345",
    email: "hello@littlestars.com.au",
    website: "https://www.littlestars.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "7:00", close: "18:00" },
      tuesday: { open: "7:00", close: "18:00" },
      wednesday: { open: "7:00", close: "18:00" },
      thursday: { open: "7:00", close: "18:00" },
      friday: { open: "7:00", close: "18:00" },
    },
    location: null,
  },

  // 2 - Harmony Kids Childcare
  {
    id: mockUuid(2),
    center_name: "Harmony Kids Childcare",
    slug: "harmony-kids-hurstville",
    suburb: "Hurstville",
    postcode: "2220",
    state: "NSW",
    description_en:
      "Harmony Kids Childcare is a warm, inclusive centre in Hurstville offering trilingual care in Mandarin, Cantonese, and English. Our experienced educators bring Chinese cultural traditions to life through art, music, and storytelling. We focus on early literacy, social-emotional development, and building confident bilingual learners.",
    description_zh:
      "和谐儿童托管中心位于Hurstville，提供温馨、包容的中英粤三语教育环境。我们经验丰富的教师通过艺术、音乐和故事让中华文化在课堂上焕发活力。我们注重早期读写能力、社交情感发展和培养自信的双语小学者。",
    fee_min: 110,
    fee_max: 135,
    nqs_rating: "meeting",
    programs: ["Chinese Cultural Program", "Music & Movement", "Early Literacy"],
    staff_languages: [
      { language: "Mandarin", count: 6 },
      { language: "English", count: 10 },
      { language: "Cantonese", count: 4 },
    ],
    age_groups: [
      { group_name: "Nursery (0-2)", capacity: 10, vacancies: 1 },
      { group_name: "Toddler (2-3)", capacity: 14, vacancies: 0 },
      { group_name: "Preschool (3-5)", capacity: 20, vacancies: 4 },
      { group_name: "Kindergarten (5-6)", capacity: 15, vacancies: 2 },
    ],
    is_ccs_approved: true,
    is_founding_partner: true,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(201), photo_url: PHOTOS.teacher, display_order: 1, alt_text: "Teachers with children" },
      { id: mockUuid(202), photo_url: PHOTOS.reading, display_order: 2, alt_text: "Reading corner" },
      { id: mockUuid(203), photo_url: PHOTOS.craft, display_order: 3, alt_text: "Craft activities" },
    ],
    address: "88 Forest Road",
    phone: "(02) 9580 6789",
    email: "info@harmonykids.com.au",
    website: "https://www.harmonykids.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "7:00", close: "18:00" },
      tuesday: { open: "7:00", close: "18:00" },
      wednesday: { open: "7:00", close: "18:00" },
      thursday: { open: "7:00", close: "18:00" },
      friday: { open: "7:00", close: "18:00" },
    },
    location: null,
  },

  // 3 - Bright Horizons Eastwood
  {
    id: mockUuid(3),
    center_name: "Bright Horizons Eastwood",
    slug: "bright-horizons-eastwood",
    suburb: "Eastwood",
    postcode: "2122",
    state: "NSW",
    description_en:
      "Bright Horizons Eastwood is an Exceeding-rated multilingual centre offering Mandarin, Korean, and English programs. Our centre features purpose-built learning spaces, a large outdoor nature play area, and a curriculum that integrates Asian cultural education with the Australian Early Years Learning Framework.",
    description_zh:
      "明亮地平线Eastwood中心是一家获得'超出标准'评级的多语言教育机构，提供中文、韩语和英语课程。中心配备专业教学空间、大型户外自然游戏区，课程融合亚洲文化教育与澳大利亚幼儿学习框架。",
    fee_min: 130,
    fee_max: 155,
    nqs_rating: "exceeding",
    programs: ["Multilingual Program", "Nature Play", "Cultural Arts", "STEM Discovery"],
    staff_languages: [
      { language: "Mandarin", count: 7 },
      { language: "English", count: 11 },
      { language: "Korean", count: 4 },
    ],
    age_groups: [
      { group_name: "Nursery (0-2)", capacity: 10, vacancies: 0 },
      { group_name: "Toddler (2-3)", capacity: 15, vacancies: 2 },
      { group_name: "Preschool (3-5)", capacity: 20, vacancies: 3 },
    ],
    is_ccs_approved: true,
    is_founding_partner: false,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(301), photo_url: PHOTOS.playground, display_order: 1, alt_text: "Outdoor playground" },
      { id: mockUuid(302), photo_url: PHOTOS.learning, display_order: 2, alt_text: "Children learning" },
    ],
    address: "5 Rowe Street",
    phone: "(02) 9874 3210",
    email: "admin@brighthorizonseastwood.com.au",
    website: "https://www.brighthorizonseastwood.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "6:30", close: "18:30" },
      tuesday: { open: "6:30", close: "18:30" },
      wednesday: { open: "6:30", close: "18:30" },
      thursday: { open: "6:30", close: "18:30" },
      friday: { open: "6:30", close: "18:30" },
    },
    location: null,
  },

  // 4 - Panda Cubs Early Learning
  {
    id: mockUuid(4),
    center_name: "Panda Cubs Early Learning",
    slug: "panda-cubs-burwood",
    suburb: "Burwood",
    postcode: "2134",
    state: "NSW",
    description_en:
      "Panda Cubs Early Learning specialises in nurturing our youngest learners aged 0-3 in a cosy, bilingual Mandarin-English environment. Our low educator-to-child ratios and gentle settling-in program ensure every baby and toddler feels safe, loved, and ready to explore. A founding LittleBridge partner centre.",
    description_zh:
      "熊猫宝贝早教中心专注于0-3岁幼儿的中英双语照护教育。我们保持低师生比和温馨的适应期计划，确保每个宝宝都感到安全、被关爱、充满探索欲。作为LittleBridge创始合作机构，我们致力于最高标准的双语早教。",
    fee_min: 125,
    fee_max: 150,
    nqs_rating: "exceeding",
    programs: ["Infant Sensory Play", "Bilingual Storytime", "Baby Yoga & Music"],
    staff_languages: [
      { language: "Mandarin", count: 5 },
      { language: "English", count: 8 },
    ],
    age_groups: [
      { group_name: "Baby (0-1)", capacity: 8, vacancies: 1 },
      { group_name: "Nursery (1-2)", capacity: 10, vacancies: 2 },
      { group_name: "Toddler (2-3)", capacity: 12, vacancies: 0 },
    ],
    is_ccs_approved: true,
    is_founding_partner: true,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(401), photo_url: PHOTOS.reading, display_order: 1, alt_text: "Cosy reading area" },
      { id: mockUuid(402), photo_url: PHOTOS.teacher, display_order: 2, alt_text: "Caring educators" },
      { id: mockUuid(403), photo_url: PHOTOS.craft, display_order: 3, alt_text: "Sensory play" },
    ],
    address: "27 Burwood Road",
    phone: "(02) 9747 1234",
    email: "enrol@pandacubs.com.au",
    website: "https://www.pandacubs.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "7:00", close: "18:00" },
      tuesday: { open: "7:00", close: "18:00" },
      wednesday: { open: "7:00", close: "18:00" },
      thursday: { open: "7:00", close: "18:00" },
      friday: { open: "7:00", close: "18:00" },
    },
    location: null,
  },

  // 5 - Sunflower Bilingual Centre
  {
    id: mockUuid(5),
    center_name: "Sunflower Bilingual Centre",
    slug: "sunflower-bilingual-epping",
    suburb: "Epping",
    postcode: "2121",
    state: "NSW",
    description_en:
      "Sunflower Bilingual Centre in Epping provides a vibrant Mandarin-English learning environment for children aged 2-5. Our play-based curriculum is designed by qualified bilingual educators who bring language learning to life through cooking, gardening, art, and imaginative play. CCS approved with flexible booking options.",
    description_zh:
      "向日葵双语中心位于Epping，为2-5岁儿童提供充满活力的中英双语学习环境。我们的课程由合格的双语教师团队设计，通过烹饪、园艺、艺术和想象力游戏让语言学习变得生动有趣。CCS认可，提供灵活的预约选项。",
    fee_min: 115,
    fee_max: 140,
    nqs_rating: "meeting",
    programs: ["Bilingual Immersion", "Garden-to-Table", "Creative Arts"],
    staff_languages: [
      { language: "Mandarin", count: 5 },
      { language: "English", count: 7 },
    ],
    age_groups: [
      { group_name: "Toddler (2-3)", capacity: 14, vacancies: 3 },
      { group_name: "Preschool (3-5)", capacity: 22, vacancies: 5 },
    ],
    is_ccs_approved: true,
    is_founding_partner: false,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(501), photo_url: PHOTOS.exterior, display_order: 1, alt_text: "Centre front" },
      { id: mockUuid(502), photo_url: PHOTOS.playing, display_order: 2, alt_text: "Outdoor play" },
    ],
    address: "41 Oxford Street",
    phone: "(02) 9868 5678",
    email: "hello@sunflowerbilingual.com.au",
    website: "https://www.sunflowerbilingual.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "7:30", close: "18:00" },
      tuesday: { open: "7:30", close: "18:00" },
      wednesday: { open: "7:30", close: "18:00" },
      thursday: { open: "7:30", close: "18:00" },
      friday: { open: "7:30", close: "18:00" },
    },
    location: null,
  },

  // 6 - Golden Bridge Early Education
  {
    id: mockUuid(6),
    center_name: "Golden Bridge Early Education",
    slug: "golden-bridge-rhodes",
    suburb: "Rhodes",
    postcode: "2138",
    state: "NSW",
    description_en:
      "Golden Bridge Early Education in Rhodes is a flagship trilingual centre offering Mandarin, Japanese, and English programs. Our Exceeding NQS-rated centre features state-of-the-art facilities, an indoor rock-climbing wall, a dedicated music studio, and organic meals prepared on-site. A founding LittleBridge partner.",
    description_zh:
      "金桥早教中心位于Rhodes，是一家旗舰级三语教育中心，提供中文、日语和英语课程。我们获得NQS'超出标准'评级，配备先进设施、室内攀岩墙、专业音乐工作室和现场制作的有机餐食。作为LittleBridge创始合作伙伴，品质有保障。",
    fee_min: 135,
    fee_max: 160,
    nqs_rating: "exceeding",
    programs: ["Trilingual Immersion", "Music Studio", "STEM & Robotics", "Mindfulness"],
    staff_languages: [
      { language: "Mandarin", count: 9 },
      { language: "English", count: 14 },
      { language: "Japanese", count: 3 },
    ],
    age_groups: [
      { group_name: "Nursery (0-2)", capacity: 12, vacancies: 0 },
      { group_name: "Toddler (2-3)", capacity: 16, vacancies: 1 },
      { group_name: "Preschool (3-5)", capacity: 24, vacancies: 2 },
    ],
    is_ccs_approved: true,
    is_founding_partner: true,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(601), photo_url: PHOTOS.classroom, display_order: 1, alt_text: "Modern classroom" },
      { id: mockUuid(602), photo_url: PHOTOS.playground, display_order: 2, alt_text: "Play facilities" },
      { id: mockUuid(603), photo_url: PHOTOS.learning, display_order: 3, alt_text: "Learning activities" },
    ],
    address: "3 Rider Boulevard",
    phone: "(02) 9743 9876",
    email: "info@goldenbridge.edu.au",
    website: "https://www.goldenbridge.edu.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "6:30", close: "18:30" },
      tuesday: { open: "6:30", close: "18:30" },
      wednesday: { open: "6:30", close: "18:30" },
      thursday: { open: "6:30", close: "18:30" },
      friday: { open: "6:30", close: "18:30" },
    },
    location: null,
  },

  // 7 - Melbourne Mandarin Kids
  {
    id: mockUuid(7),
    center_name: "Melbourne Mandarin Kids",
    slug: "melbourne-mandarin-boxhill",
    suburb: "Box Hill",
    postcode: "3128",
    state: "VIC",
    description_en:
      "Melbourne Mandarin Kids is Box Hill's leading Mandarin-English-Cantonese childcare centre. We provide a culturally rich program that includes Chinese calligraphy, lion dance workshops, and bilingual STEAM activities. Our warm team creates a home-away-from-home atmosphere for children aged 0-6.",
    description_zh:
      "墨尔本普通话儿童中心是Box Hill领先的中英粤三语托管机构。我们提供丰富的文化课程，包括中国书法、舞狮工作坊和双语STEAM活动。温暖的教师团队为0-6岁儿童营造家一般的学习氛围。",
    fee_min: 105,
    fee_max: 130,
    nqs_rating: "meeting",
    programs: ["Chinese Calligraphy", "Bilingual STEAM", "Cultural Festivals", "Outdoor Play"],
    staff_languages: [
      { language: "Mandarin", count: 6 },
      { language: "English", count: 9 },
      { language: "Cantonese", count: 5 },
    ],
    age_groups: [
      { group_name: "Baby (0-1)", capacity: 8, vacancies: 2 },
      { group_name: "Nursery (1-2)", capacity: 10, vacancies: 1 },
      { group_name: "Toddler (2-3)", capacity: 14, vacancies: 0 },
      { group_name: "Preschool (3-5)", capacity: 20, vacancies: 3 },
      { group_name: "Kindergarten (5-6)", capacity: 15, vacancies: 4 },
    ],
    is_ccs_approved: true,
    is_founding_partner: false,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(701), photo_url: PHOTOS.teacher, display_order: 1, alt_text: "Our educators" },
      { id: mockUuid(702), photo_url: PHOTOS.craft, display_order: 2, alt_text: "Arts and craft" },
      { id: mockUuid(703), photo_url: PHOTOS.exterior, display_order: 3, alt_text: "Centre exterior" },
    ],
    address: "156 Station Street",
    phone: "(03) 9898 4567",
    email: "enrol@melbmandarinkids.com.au",
    website: "https://www.melbmandarinkids.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "7:00", close: "18:00" },
      tuesday: { open: "7:00", close: "18:00" },
      wednesday: { open: "7:00", close: "18:00" },
      thursday: { open: "7:00", close: "18:00" },
      friday: { open: "7:00", close: "18:00" },
    },
    location: null,
  },

  // 8 - Little Dragon Learning
  {
    id: mockUuid(8),
    center_name: "Little Dragon Learning",
    slug: "little-dragon-glen-waverley",
    suburb: "Glen Waverley",
    postcode: "3150",
    state: "VIC",
    description_en:
      "Little Dragon Learning in Glen Waverley is an Exceeding NQS-rated Mandarin-English bilingual centre. We believe every child deserves the gift of two languages and two cultures. Our play-based philosophy, combined with structured literacy and numeracy programs, prepares children for school and for life in a multicultural world.",
    description_zh:
      "小龙学习中心位于Glen Waverley，获得NQS'超出标准'评级，提供中英双语教育。我们相信每个孩子都应该拥有双语和双文化的礼物。以游戏为基础的教学理念，结合系统的读写和算术课程，帮助孩子为进入学校和多元文化社会做好准备。",
    fee_min: 115,
    fee_max: 145,
    nqs_rating: "exceeding",
    programs: ["Bilingual Literacy", "Play-Based Learning", "School Readiness", "Music & Dance"],
    staff_languages: [
      { language: "Mandarin", count: 7 },
      { language: "English", count: 10 },
    ],
    age_groups: [
      { group_name: "Nursery (0-2)", capacity: 10, vacancies: 1 },
      { group_name: "Toddler (2-3)", capacity: 14, vacancies: 2 },
      { group_name: "Preschool (3-5)", capacity: 22, vacancies: 4 },
    ],
    is_ccs_approved: true,
    is_founding_partner: false,
    subscription_status: "active",
    center_photos: [
      { id: mockUuid(801), photo_url: PHOTOS.playing, display_order: 1, alt_text: "Happy children" },
      { id: mockUuid(802), photo_url: PHOTOS.classroom, display_order: 2, alt_text: "Learning environment" },
      { id: mockUuid(803), photo_url: PHOTOS.reading, display_order: 3, alt_text: "Bilingual story time" },
    ],
    address: "22 Kingsway",
    phone: "(03) 9561 8901",
    email: "info@littledragonlearning.com.au",
    website: "https://www.littledragonlearning.com.au",
    acecqa_url: "https://www.acecqa.gov.au/",
    operating_hours: {
      monday: { open: "7:00", close: "18:30" },
      tuesday: { open: "7:00", close: "18:30" },
      wednesday: { open: "7:00", close: "18:30" },
      thursday: { open: "7:00", close: "18:30" },
      friday: { open: "7:00", close: "18:30" },
    },
    location: null,
  },
];

// ---------------------------------------------------------------------------
// Mock Enquiries (for center dashboard and family enquiries pages)
// ---------------------------------------------------------------------------

export interface MockEnquiry {
  id: string;
  center_profile_id: string;
  family_profile_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_wechat_id: string | null;
  guest_child_age: string | null;
  guest_child_days_needed: string | null;
  guest_suburb: string | null;
  message_original: string | null;
  message_translated: string | null;
  message_source_language: string | null;
  status: string;
  center_notes: string | null;
  is_guest: boolean;
  created_at: string;
  family_profiles: null;
  // Joined center data (for family enquiries view)
  center_profiles?: {
    center_name: string;
    slug: string | null;
    suburb: string | null;
  };
}

const today = new Date();
function daysAgo(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const mockEnquiries: MockEnquiry[] = [
  {
    id: mockUuid(1001),
    center_profile_id: mockCenters[0].id,
    family_profile_id: null,
    guest_name: "Lisa Chen",
    guest_email: "lisa.chen@gmail.com",
    guest_phone: "0412 345 678",
    guest_wechat_id: "lisachen88",
    guest_child_age: "2 years",
    guest_child_days_needed: "3 days",
    guest_suburb: "Chatswood",
    message_original: "Hi, I'm interested in enrolling my daughter in your bilingual program. She is currently 2 years old and we speak Mandarin at home. Could you let me know about availability and the settling-in process? Thank you!",
    message_translated: null,
    message_source_language: "en",
    status: "new",
    center_notes: null,
    is_guest: true,
    created_at: daysAgo(0),
    family_profiles: null,
    center_profiles: {
      center_name: "Little Stars Bilingual Early Learning",
      slug: "little-stars-chatswood",
      suburb: "Chatswood",
    },
  },
  {
    id: mockUuid(1002),
    center_profile_id: mockCenters[0].id,
    family_profile_id: null,
    guest_name: "Wang Wei",
    guest_email: "wangwei@163.com",
    guest_phone: "0423 456 789",
    guest_wechat_id: "wangwei_au",
    guest_child_age: "3 years",
    guest_child_days_needed: "5 days",
    guest_suburb: "Willoughby",
    message_original: "你好！我们刚从中国搬到悉尼，想给3岁的儿子找一个双语幼儿园。请问有空位吗？我们很希望参观一下。谢谢！",
    message_translated: "Hello! We have just moved to Sydney from China and are looking for a bilingual childcare centre for our 3-year-old son. Do you have availability? We would love to arrange a tour. Thank you!",
    message_source_language: "zh",
    status: "contacted",
    center_notes: "Called back, tour scheduled for next Tuesday",
    is_guest: true,
    created_at: daysAgo(2),
    family_profiles: null,
    center_profiles: {
      center_name: "Little Stars Bilingual Early Learning",
      slug: "little-stars-chatswood",
      suburb: "Chatswood",
    },
  },
  {
    id: mockUuid(1003),
    center_profile_id: mockCenters[0].id,
    family_profile_id: null,
    guest_name: "Sarah Thompson",
    guest_email: "sarah.t@outlook.com",
    guest_phone: "0434 567 890",
    guest_wechat_id: null,
    guest_child_age: "1 year",
    guest_child_days_needed: "2 days",
    guest_suburb: "Lane Cove",
    message_original: "We are looking for a centre with Mandarin exposure for our 1-year-old. My husband is Chinese-Australian and we want our child to grow up with both languages. What does your nursery program look like?",
    message_translated: null,
    message_source_language: "en",
    status: "tour_booked",
    center_notes: "Tour completed, very interested. Following up re waitlist for nursery.",
    is_guest: true,
    created_at: daysAgo(5),
    family_profiles: null,
    center_profiles: {
      center_name: "Little Stars Bilingual Early Learning",
      slug: "little-stars-chatswood",
      suburb: "Chatswood",
    },
  },
  {
    id: mockUuid(1004),
    center_profile_id: mockCenters[1].id,
    family_profile_id: null,
    guest_name: "Michael Zhang",
    guest_email: "m.zhang@yahoo.com",
    guest_phone: "0445 678 901",
    guest_wechat_id: "mzhang_syd",
    guest_child_age: "4 years",
    guest_child_days_needed: "4 days",
    guest_suburb: "Hurstville",
    message_original: "Hi there, my son is currently at another centre but we are looking for somewhere with a stronger Chinese language program. Can we arrange a visit? We live locally in Hurstville.",
    message_translated: null,
    message_source_language: "en",
    status: "new",
    center_notes: null,
    is_guest: true,
    created_at: daysAgo(1),
    family_profiles: null,
    center_profiles: {
      center_name: "Harmony Kids Childcare",
      slug: "harmony-kids-hurstville",
      suburb: "Hurstville",
    },
  },
  {
    id: mockUuid(1005),
    center_profile_id: mockCenters[0].id,
    family_profile_id: null,
    guest_name: "Jenny Liu",
    guest_email: "jenny.liu@gmail.com",
    guest_phone: "0456 789 012",
    guest_wechat_id: null,
    guest_child_age: "2.5 years",
    guest_child_days_needed: "3 days",
    guest_suburb: "Artarmon",
    message_original: "Hello! I saw your centre on LittleBridge and love that you have a STEM program for toddlers. My daughter is 2.5 and very curious. Would love to know more about the toddler room and current fees. Thanks!",
    message_translated: null,
    message_source_language: "en",
    status: "enrolled",
    center_notes: "Enrolled starting March 3. Toddler room, 3 days/week.",
    is_guest: true,
    created_at: daysAgo(14),
    family_profiles: null,
    center_profiles: {
      center_name: "Little Stars Bilingual Early Learning",
      slug: "little-stars-chatswood",
      suburb: "Chatswood",
    },
  },
];

// ---------------------------------------------------------------------------
// Mock Educator Leads (for educator sign-up page)
// ---------------------------------------------------------------------------

export interface MockEducatorLead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  suburb: string;
  languages: string[];
  qualification: string | null;
  has_wwcc: string;
  preferred_language: string;
  created_at: string;
}

export const mockEducatorLeads: MockEducatorLead[] = [
  {
    id: mockUuid(2001),
    full_name: "Mei Lin Wang",
    email: "meilin.wang@gmail.com",
    phone: "0412 111 222",
    suburb: "Chatswood",
    languages: ["mandarin", "english"],
    qualification: "diploma",
    has_wwcc: "yes",
    preferred_language: "zh",
    created_at: daysAgo(3),
  },
  {
    id: mockUuid(2002),
    full_name: "Amy Nguyen",
    email: "amy.nguyen@outlook.com",
    phone: "0423 222 333",
    suburb: "Hurstville",
    languages: ["cantonese", "english", "mandarin"],
    qualification: "bachelor",
    has_wwcc: "yes",
    preferred_language: "en",
    created_at: daysAgo(7),
  },
];

// ---------------------------------------------------------------------------
// Mock Family Profile (for FamilyProfile and FamilyEnquiries pages)
// ---------------------------------------------------------------------------

export interface MockFamilyProfile {
  id: string;
  profile_id: string;
  parent_name: string;
  suburb: string;
  phone: string;
  communication_language: string;
  chinese_name: string | null;
  wechat_id: string | null;
  priorities: string[];
  additional_notes: string | null;
}

export const mockFamilyProfile: MockFamilyProfile = {
  id: mockUuid(3001),
  profile_id: "demo-user-id",
  parent_name: "Lisa Chen",
  suburb: "Chatswood",
  phone: "0412 345 678",
  communication_language: "en",
  chinese_name: "陈丽莎",
  wechat_id: "lisachen88",
  priorities: ["bilingual_education", "cultural_understanding", "proximity"],
  additional_notes: "Looking for a centre that celebrates Chinese New Year and Mid-Autumn Festival.",
};

export interface MockChild {
  id: string;
  family_profile_id: string;
  name: string;
  date_of_birth: string;
  days_per_week: number;
}

export const mockChildren: MockChild[] = [
  {
    id: mockUuid(3101),
    family_profile_id: mockFamilyProfile.id,
    name: "Emma",
    date_of_birth: "2023-06-15",
    days_per_week: 3,
  },
];

// ---------------------------------------------------------------------------
// Mock Center Profile Row (for CenterDashboard)
// ---------------------------------------------------------------------------

export interface MockCenterProfileRow {
  id: string;
  center_name: string;
  slug: string | null;
  subscription_status: string;
  subscription_trial_end: string | null;
  is_founding_partner: boolean;
  founding_partner_expires_at: string | null;
}

export const mockCenterProfileRow: MockCenterProfileRow = {
  id: mockCenters[0].id,
  center_name: mockCenters[0].center_name,
  slug: mockCenters[0].slug,
  subscription_status: "active",
  subscription_trial_end: null,
  is_founding_partner: true,
  founding_partner_expires_at: "2027-06-30T00:00:00.000Z",
};
