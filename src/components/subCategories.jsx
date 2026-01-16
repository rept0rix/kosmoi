// מיפוי תת-קטגוריות לפי קטגוריה-על
export const subCategoriesBySuperCategory = {
  eat: [
    "all_restaurants",
    "delivery",
    "thai_food",
    "western_food",
    "cafes",
    "seafood",
    "street_food",
    "fine_dining",
    "breakfast",
    "bars",
    "beach_clubs",
    "markets"
  ],
  fix: [
    "all_fixers",
    "ac_repair",
    "plumber",
    "electrician",
    "motorcycle_mechanic",
    "car_mechanic",
    "phone_repair",
    "cleaning",
    "laundry",
    "pool_maintenance",
    "gardener",
    "pest_control",
    "construction"
  ],
  shop: [
    "all_shops",
    "supermarkets",
    "convenience_stores",
    "clothing",
    "pharmacies",
    "cannabis_shops",
    "electronics",
    "souvenirs",
    "furniture"
  ],
  enjoy: [
    "all_activities",
    "massage_spa",
    "yoga",
    "gyms",
    "muay_thai",
    "water_sports",
    "cooking_classes",
    "beach_activities",
    "kids_activities"
  ],
  go_out: [
    "all_events",
    "night_clubs",
    "live_music",
    "beach_parties",
    "pubs",
    "shows"
  ],
  travel: [
    "all_trips",
    "motorbike_rental",
    "car_rental",
    "taxis",
    "ferries",
    "island_tours",
    "visa_services",
    "hotels",
    "villas",
    "hostels"
  ],
  help: [
    "tourist_police",
    "hospitals",
    "clinics",
    "animal_rescue",
    "embassies"
  ],
  get_service: [
    "all_services",
    "money_exchange",
    "laundry",
    "visa_services",
    "real_estate",
    "health_clinics",
    "cannabis_shops",
    "coworking",
    "photographers",
    "legal_accounting",
    "digital_nomad"
  ],
  get_info: [
    "all_info",
    "weather",
    "tides",
    "transport_schedules",
    "emergency_numbers"
  ]
};

// תרגום כל תת-הקטגוריות לכל השפות
export const subCategoryTranslations = {
  he: {
    // Fix additions
    electrician: "חשמלאי",
    ac_repair: "תיקון מזגנים",
    cleaning: "ניקיון",
    gardener: "גינון",
    pest_control: "הדברה",
    pool_cleaning: "ניקוי בריכות",
    carpenter: "נגר",
    locksmith: "מנעולן",
    painter: "צבע",
    solar_energy: "אנרגיה סולארית",

    // Services (New)
    money_exchange: "כסף וצ'יינג'",
    health_clinics: "מרפאות ובריאות",
    legal_accounting: "עריכת דין וחשבון",
    digital_nomad: "נוודים דיגיטליים",
    coworking: "חללי עבודה",
    cannabis_shops: "קנאביס",

    // Get Service additions
    laundry: "מכבסה",
    housekeeping: "משק בית",
    internet_tech: "טכנאי אינטרנט",
    visa_services: "שירותי ויזה",

    // Eat
    all_restaurants: "כל המקומות",
    restaurants: "מסעדות",
    delivery: "הזמנת משלוח",
    cafes: "בתי קפה",
    fast_food: "מזון מהיר",
    bar_restaurant: "בר מסעדה",
    coffee_carts: "עגלות קפה",
    kosher_restaurant: "מסעדה כשרה",
    chef_restaurant: "מסעדת שף",
    ice_cream: "גלידריה",
    outdoor_seating: "ישיבה בחוץ",
    sweets: "מתוקים",

    // Fix
    all_fixers: "את מי מזמינים?",
    plumber: "אינסטלטורים",
    handyman: "בעלי מקצוע",
    technicians: "טכנאים",
    renovations: "שיפוצים ותיקונים",
    home_maintenance: "אחזקת הבית",
    craftsmen: "בעלי מלאכה",
    installers: "מתקינים",
    repair_labs: "מעבדות שירות",

    // Shop
    all_shops: "כל החנויות",
    fashion: "אופנה",
    electronics: "חשמל ואלקטרוניקה",
    sports_camping: "ספורט ומחנאות",
    pet_supplies: "ציוד ומזון לבע\"ח",
    food_beverages: "מזון ומשקאות",
    furniture: "רהיטים",
    leisure_products: "מוצרי פנאי",
    baby_products: "מוצרי תינוקות",
    flowers: "פרחים",
    second_hand: "יד שנייה",
    department_store: "כלבו",

    // Enjoy
    all_activities: "כל הפעילויות",
    sports: "ספורט",
    workshops: "סדנאות",
    health_spa: "מרכזי בריאות וספא",
    parks_gardens: "גנים ופארקים",
    fountains: "מזרקות שכשוך",
    enrichment: "העשרה",
    shopping_centers: "מרכזי קניות",
    attractions: "אטרקציות",
    gymboree: "ג'ימבורי",

    // Go Out
    all_events: "כל האירועים",
    pubs: "פאבים",
    movies: "סרטים",
    concerts: "הופעות",
    escape_rooms: "חדרי בריחה",
    exhibitions: "תערוכות",
    kids_events: "אירועים לילדים",
    shows: "הצגות",
    stand_up: "סטנד אפ",
    clubs: "מועדונים",

    // Travel
    all_trips: "כל הטיולים",
    accommodation: "מקומות לינה",
    trip_attractions: "אטרקציות לטיולים",
    trip_routes: "מסלולי טיול",
    springs: "מעיינות",
    points_of_interest: "נקודות עניין",
    nature: "חיק הטבע",
    heritage_sites: "אתרי מורשת",

    // Help
    emergency_volunteering: "התנדבות חירום",
    aid_organizations: "ארגוני סיוע",
    food_distribution: "חלוקת מזון",
    clothing_collection: "איסוף בגדים לתרומה",
    wizo: "הביגודית ויצ\"ו",
    volunteer: "להתנדב",
    hair_donation: "תרומות שיער",
    one_in_nine: "אחת מתשע",

    // Get Service
    all_services: "כל השירותים",
    pharmacies: "בתי מרקחת",
    fuel_transport: "דלק ותחבורה",
    atms: "כספומטים",
    health: "בריאות",
    mental_health: "בריאות הנפש",
    beauty: "טיפוח",
    consulting_treatment: "ייעוץ וטיפול",
    finance: "פיננסים",
    business_services: "שירותים לעסק",
    animals: "בעלי חיים",
    event_organizers: "מארגנים אירוע",

    // Get Info
    all_info: "כל המידע",
    protected_spaces: "מרחבים מוגנים",
    social_security: "ביטוח לאומי שירות עצמי",
    education: "חינוך והשכלה",
    authorities: "רשויות ומוסדות",
    welfare: "רווחה",
    organizations: "ארגונים ועמותות",
    cell_towers: "אנטנות סלולריות",
    religious_institutions: "מוסדות דת",
    agriculture_environment: "חקלאות וסביבה",
    industries: "תעשיות"
  },
  en: {
    // Fix additions
    electrician: "Electrician",
    ac_repair: "AC Repair",
    cleaning: "Cleaning",
    gardener: "Gardener",
    pest_control: "Pest Control",
    pool_cleaning: "Pool Cleaning",
    carpenter: "Carpenter",
    locksmith: "Locksmith",
    painter: "Painter",
    solar_energy: "Solar Energy",

    // Services (New)
    money_exchange: "Money Exchange & Crypto",
    health_clinics: "Health Clinics",
    legal_accounting: "Legal & Accounting",
    digital_nomad: "Digital Nomad",
    coworking: "Coworking Spaces",
    cannabis_shops: "Cannabis",

    // Get Service additions
    laundry: "Laundry",
    housekeeping: "Housekeeping",
    internet_tech: "Internet Tech",
    visa_services: "Visa Services",

    // Eat
    all_restaurants: "All Places",
    restaurants: "Restaurants",
    delivery: "Delivery",
    cafes: "Cafes",
    fast_food: "Fast Food",
    bar_restaurant: "Bar Restaurant",
    coffee_carts: "Coffee Carts",
    kosher_restaurant: "Kosher Restaurant",
    chef_restaurant: "Chef Restaurant",
    ice_cream: "Ice Cream",
    outdoor_seating: "Outdoor Seating",
    sweets: "Sweets",

    // Fix
    all_fixers: "All Services",
    plumber: "Plumbers",
    handyman: "Handyman",
    technicians: "Technicians",
    renovations: "Renovations",
    home_maintenance: "Home Maintenance",
    craftsmen: "Craftsmen",
    installers: "Installers",
    repair_labs: "Repair Labs",

    // Shop
    all_shops: "All Shops",
    fashion: "Fashion",
    electronics: "Electronics",
    sports_camping: "Sports & Camping",
    pet_supplies: "Pet Supplies",
    food_beverages: "Food & Beverages",
    furniture: "Furniture",
    leisure_products: "Leisure Products",
    baby_products: "Baby Products",
    flowers: "Flowers",
    second_hand: "Second Hand",
    department_store: "Department Store",

    // Enjoy
    all_activities: "All Activities",
    sports: "Sports",
    workshops: "Workshops",
    health_spa: "Health & Spa",
    parks_gardens: "Parks & Gardens",
    fountains: "Fountains",
    enrichment: "Enrichment",
    shopping_centers: "Shopping Centers",
    attractions: "Attractions",
    gymboree: "Gymboree",

    // Go Out
    all_events: "All Events",
    pubs: "Pubs",
    movies: "Movies",
    concerts: "Concerts",
    escape_rooms: "Escape Rooms",
    exhibitions: "Exhibitions",
    kids_events: "Kids Events",
    shows: "Shows",
    stand_up: "Stand Up",
    clubs: "Clubs",

    // Travel
    all_trips: "All Trips",
    accommodation: "Accommodation",
    trip_attractions: "Trip Attractions",
    trip_routes: "Trip Routes",
    springs: "Springs",
    points_of_interest: "Points of Interest",
    nature: "Nature",
    heritage_sites: "Heritage Sites",

    // Help
    emergency_volunteering: "Emergency Volunteering",
    aid_organizations: "Aid Organizations",
    food_distribution: "Food Distribution",
    clothing_collection: "Clothing Collection",
    wizo: "WIZO",
    volunteer: "Volunteer",
    hair_donation: "Hair Donation",
    one_in_nine: "One in Nine",

    // Get Service
    all_services: "All Services",
    pharmacies: "Pharmacies",
    fuel_transport: "Fuel & Transport",
    atms: "ATMs",
    health: "Health",
    mental_health: "Mental Health",
    beauty: "Beauty",
    consulting_treatment: "Consulting & Treatment",
    finance: "Finance",
    business_services: "Business Services",
    animals: "Animals",
    event_organizers: "Event Organizers",

    // Get Info
    all_info: "All Info",
    protected_spaces: "Protected Spaces",
    social_security: "Social Security",
    education: "Education",
    authorities: "Authorities",
    welfare: "Welfare",
    organizations: "Organizations",
    cell_towers: "Cell Towers",
    religious_institutions: "Religious Institutions",
    agriculture_environment: "Agriculture & Environment",
    industries: "Industries"
  },
  th: {
    // Fix additions
    electrician: "ช่างไฟฟ้า",
    ac_repair: "ซ่อมแอร์",
    cleaning: "ทำความสะอาด",
    gardener: "คนสวน",
    pest_control: "กำจัดแมลง",
    pool_cleaning: "ทำความสะอาดสระว่ายน้ำ",
    carpenter: "ช่างไม้",
    locksmith: "ช่างกุญแจ",
    painter: "ช่างทาสี",
    solar_energy: "พลังงานแสงอาทิตย์",

    // Services (New)
    money_exchange: "แลกเปลี่ยนเงินตรา",
    health_clinics: "คลินิกสุขภาพ",
    legal_accounting: "กฎหมายและบัญชี",
    digital_nomad: "ดิจิทัลโนแมด",
    coworking: "โคเวิร์กกิ้งสเปซ",
    cannabis_shops: "กัญชา",

    // Get Service additions
    laundry: "ซักรีด",
    housekeeping: "แม่บ้าน",
    internet_tech: "ช่างอินเทอร์เน็ต",
    visa_services: "บริการวีซ่า",

    // Eat
    all_restaurants: "ทุกสถานที่",
    restaurants: "ร้านอาหาร",
    delivery: "บริการจัดส่ง",
    cafes: "คาเฟ่",
    fast_food: "อาหารจานด่วน",
    bar_restaurant: "บาร์เรสเทอรองต์",
    coffee_carts: "รถกาแฟ",
    kosher_restaurant: "ร้านอาหารโคเชอร์",
    chef_restaurant: "ร้านอาหารเชฟ",
    ice_cream: "ไอศกรีม",
    outdoor_seating: "ที่นั่งกลางแจ้ง",
    sweets: "ขนมหวาน",

    // Fix
    all_fixers: "บริการทั้งหมด",
    plumber: "ช่างประปา",
    handyman: "ช่างซ่อมบำรุง",
    technicians: "ช่างเทคนิค",
    renovations: "ปรับปรุง",
    home_maintenance: "ดูแลบ้าน",
    craftsmen: "ช่างฝีมือ",
    installers: "ติดตั้ง",
    repair_labs: "ศูนย์ซ่อม",

    // Shop
    all_shops: "ร้านค้าทั้งหมด",
    fashion: "แฟชั่น",
    electronics: "อิเล็กทรอนิกส์",
    sports_camping: "กีฬาและแค้มป์ปิ้ง",
    pet_supplies: "อุปกรณ์สัตว์เลี้ยง",
    food_beverages: "อาหารและเครื่องดื่ม",
    furniture: "เฟอร์นิเจอร์",
    leisure_products: "ผลิตภัณฑ์สันทนาการ",
    baby_products: "ผลิตภัณฑ์เด็ก",
    flowers: "ดอกไม้",
    second_hand: "มือสอง",
    department_store: "ห้างสรรพสินค้า",

    // Enjoy
    all_activities: "กิจกรรมทั้งหมด",
    sports: "กีฬา",
    workshops: "เวิร์กช็อป",
    health_spa: "สปาและสุขภาพ",
    parks_gardens: "สวนสาธารณะ",
    fountains: "น้ำพุ",
    enrichment: "พัฒนา",
    shopping_centers: "ศูนย์การค้า",
    attractions: "สถานที่ท่องเที่ยว",
    gymboree: "ยิมโบรี",

    // Go Out
    all_events: "งานทั้งหมด",
    pubs: "ผับ",
    movies: "ภาพยนตร์",
    concerts: "คอนเสิร์ต",
    escape_rooms: "ห้องหนี",
    exhibitions: "นิทรรศการ",
    kids_events: "กิจกรรมเด็ก",
    shows: "การแสดง",
    stand_up: "สแตนด์อัพ",
    clubs: "คลับ",

    // Travel
    all_trips: "ทริปทั้งหมด",
    accommodation: "ที่พัก",
    trip_attractions: "สถานที่ท่องเที่ยว",
    trip_routes: "เส้นทางท่องเที่ยว",
    springs: "น้ำพุร้อน",
    points_of_interest: "จุดที่น่าสนใจ",
    nature: "ธรรมชาติ",
    heritage_sites: "มรดก",

    // Help
    emergency_volunteering: "อาสาสมัครฉุกเฉิน",
    aid_organizations: "องค์กรช่วยเหลือ",
    food_distribution: "แจกอาหาร",
    clothing_collection: "เก็บเสื้อผ้า",
    wizo: "วิซโซ",
    volunteer: "อาสาสมัคร",
    hair_donation: "บริจาคผม",
    one_in_nine: "หนึ่งในเก้า",

    // Get Service
    all_services: "บริการทั้งหมด",
    pharmacies: "ร้านขายยา",
    fuel_transport: "เชื้อเพลิงและการขนส่ง",
    atms: "ตู้เอทีเอ็ม",
    health: "สุขภาพ",
    mental_health: "สุขภาพจิต",
    beauty: "ความงาม",
    consulting_treatment: "ให้คำปรึกษา",
    finance: "การเงิน",
    business_services: "บริการธุรกิจ",
    animals: "สัตว์",
    event_organizers: "จัดงาน",

    // Get Info
    all_info: "ข้อมูลทั้งหมด",
    protected_spaces: "พื้นที่คุ้มครอง",
    social_security: "ประกันสังคม",
    education: "การศึกษา",
    authorities: "หน่วยงาน",
    welfare: "สวัสดิการ",
    organizations: "องค์กร",
    cell_towers: "เสาสัญญาณ",
    religious_institutions: "สถาบันศาสนา",
    agriculture_environment: "เกษตรและสิ่งแวดล้อม",
    industries: "อุตสาหกรรม"
  },
  ru: {
    // Fix additions
    electrician: "Электрик",
    ac_repair: "Ремонт кондиционеров",
    cleaning: "Уборка",
    gardener: "Садовник",
    pest_control: "Борьба с вредителями",
    pool_cleaning: "Чистка бассейнов",
    carpenter: "Плотник",
    locksmith: "Слесарь",
    painter: "Маляр",
    solar_energy: "Солнечная энергия",

    // Services (New)
    money_exchange: "Обмен валюты",
    health_clinics: "Медицинские клиники",
    legal_accounting: "Юридические услуги",
    digital_nomad: "Цифровой кочевник",
    coworking: "Коворкинг",
    cannabis_shops: "Каннабис",

    // Get Service additions
    laundry: "Прачечная",
    housekeeping: "Уборка дома",
    internet_tech: "Интернет-мастер",
    visa_services: "Визовые услуги",

    // Eat
    all_restaurants: "Все места",
    restaurants: "Рестораны",
    delivery: "Доставка",
    cafes: "Кафе",
    fast_food: "Фастфуд",
    bar_restaurant: "Бар-ресторан",
    coffee_carts: "Кофейные тележки",
    kosher_restaurant: "Кошерный ресторан",
    chef_restaurant: "Ресторан шеф-повара",
    ice_cream: "Мороженое",
    outdoor_seating: "Места на улице",
    sweets: "Сладости",

    // Fix
    all_fixers: "Все услуги",
    plumber: "Сантехники",
    handyman: "Мастер на все руки",
    technicians: "Техники",
    renovations: "Ремонт",
    home_maintenance: "Обслуживание дома",
    craftsmen: "Мастера",
    installers: "Установщики",
    repair_labs: "Ремонтные мастерские",

    // Shop
    all_shops: "Все магазины",
    fashion: "Мода",
    electronics: "Электроника",
    sports_camping: "Спорт и кемпинг",
    pet_supplies: "Товары для животных",
    food_beverages: "Еда и напитки",
    furniture: "Мебель",
    leisure_products: "Товары для отдыха",
    baby_products: "Товары для детей",
    flowers: "Цветы",
    second_hand: "Б/у",
    department_store: "Универмаг",

    // Enjoy
    all_activities: "Все активности",
    sports: "Спорт",
    workshops: "Мастер-классы",
    health_spa: "Спа и здоровье",
    parks_gardens: "Парки и сады",
    fountains: "Фонтаны",
    enrichment: "Развитие",
    shopping_centers: "Торговые центры",
    attractions: "Достопримечательности",
    gymboree: "Джимбори",

    // Go Out
    all_events: "Все мероприятия",
    pubs: "Пабы",
    movies: "Кино",
    concerts: "Концерты",
    escape_rooms: "Квесты",
    exhibitions: "Выставки",
    kids_events: "Детские мероприятия",
    shows: "Шоу",
    stand_up: "Стендап",
    clubs: "Клубы",

    // Travel
    all_trips: "Все поездки",
    accommodation: "Проживание",
    trip_attractions: "Достопримечательности",
    trip_routes: "Маршруты",
    springs: "Источники",
    points_of_interest: "Интересные места",
    nature: "Природа",
    heritage_sites: "Наследие",

    // Help
    emergency_volunteering: "Волонтерство в чрезвычайных ситуациях",
    aid_organizations: "Организации помощи",
    food_distribution: "Раздача еды",
    clothing_collection: "Сбор одежды",
    wizo: "WIZO",
    volunteer: "Волонтер",
    hair_donation: "Пожертвование волос",
    one_in_nine: "Одна из девяти",

    // Get Service
    all_services: "Все услуги",
    pharmacies: "Аптеки",
    fuel_transport: "Топливо и транспорт",
    atms: "Банкоматы",
    health: "Здоровье",
    mental_health: "Психическое здоровье",
    beauty: "Красота",
    consulting_treatment: "Консультации",
    finance: "Финансы",
    business_services: "Бизнес-услуги",
    animals: "Животные",
    event_organizers: "Организация мероприятий",

    // Get Info
    all_info: "Вся информация",
    protected_spaces: "Защищенные пространства",
    social_security: "Социальное обеспечение",
    education: "Образование",
    authorities: "Власти",
    welfare: "Благосостояние",
    organizations: "Организации",
    cell_towers: "Вышки связи",
    religious_institutions: "Религиозные учреждения",
    agriculture_environment: "Сельское хозяйство и окружающая среда",
    industries: "Промышленность"
  }
};

export const getSubCategoryLabel = (subCategoryId, language = 'he') => {
  return subCategoryTranslations[language]?.[subCategoryId] || subCategoryId;
};
