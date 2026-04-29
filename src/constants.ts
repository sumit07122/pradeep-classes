import pradeepSir from './assets/pradeep.jpg';

export const CONTACTS = {
  phone1: "8126180408",
  phone2: "7017775704",
  email: "pradeepclasses@gmail.com",
  socials: {
    facebook: "https://facebook.com/pradeepclassesmathura",
    instagram: "https://www.instagram.com/pradeepclasses07",
    youtube: "https://www.youtube.com/@PradeepClasses07",
  },
  googleReviews: "https://share.google/KDMh4z709Yvc3OMt4",
  branches: [
    {
      name: "Main Branch",
      address: "Anand Lok Colony, Beside Shriji Baba School, Goverdhan Road, Mathura (U.P.) - 281004",
      landmark: "Beside Shriji Baba School",
      coords: { lat: 27.5020, lng: 77.6430 }
    },
    {
      name: "Pradeep Classes Academy",
      address: "Narsi Vihar, Transport Nagar, Sonkh Road, Mathura (U.P.)",
      landmark: "Narsi Vihar Colony",
      coords: { lat: 27.4868951, lng: 77.6496309 }
    }
  ]
};

export const FACULTY = [
  {
    name: "Mr. Pradeep Kumar",
    designation: "Director & Lead Faculty",
    qualification: "M.Com, UPSC IAS (Aspirant)",
    specialization: "General Studies, Advanced Mathematics & Mentorship",
    experience: "15+ Years of dedicated teaching experience",
    philosophy: "I believe every student has a unique potential that needs the right direction. My focus is on strengthening basic concepts and developing an analytical mindset rather than rote learning.",
    achievements: "Mentored over 500+ students to achieve 90%+ in board exams and top ranks in school entrance tests like Navodaya and Sainik school.",
    image: pradeepSir
  },
  {
    name: "Our Elite Faculty Team",
    designation: "Subject Specialists",
    qualification: "Post-Graduates & B.Ed Experts",
    specialization: "Physics, Chemistry, Biology, Commerce & Humanities",
    experience: "Collective experience of 20+ years",
    philosophy: "We prioritize individual student development through interactive sessions and personalized attention in limited batch sizes. Every student deserves a mentor who understands their pace.",
    achievements: "Consistent 100% pass rate in board exams for the last 4 years and multiple selections in IIT/NEET foundation levels.",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
  }
];

export const COURSES = [
  {
    title: "Class 1st to 12th",
    description: "Comprehensive coaching for Science, Commerce, and Humanity streams.",
    icon: "GraduationCap",
  },
  {
    title: "IIT / NEET Foundation",
    description: "Early preparation for engineering and medical entrance exams.",
    icon: "FlaskConical",
  },
  {
    title: "Special Entrance Exams",
    description: "Dedicated batches for Navodaya, Shriji Baba, Sainik, and Military School entrance.",
    icon: "Trophy",
  },
  {
    title: "General Studies",
    description: "GS classes for Polity, History, Economics, Geography for all competitive exams.",
    icon: "BookOpen",
  }
];

export const TOPPERS_BY_YEAR = {
  "2025": [
    { name: "Shivam Agrawal", school: "Shriji Baba", rank: "Dhanuka 5th Rank" },
    { name: "Mayank Hiteshi", school: "Shriji Baba" },
    { name: "Radhika Chaudhary", school: "Shriji Baba" },
    { name: "Naina Sharma", school: "Shriji Baba" },
    { name: "Shreya Chaudhary", school: "Shriji Baba" },
    { name: "Anshul Sharma", school: "Dhanuka" }
  ],
  "2024": [
    { name: "Divyansh Kuntal", score: "96.2%", school: "RMS", details: "SST-99, Science-97" },
    { name: "Rishab Agrawal", score: "89.4%", school: "Sainik School", details: "Math-97, SST-96" },
    { name: "Kush Pathak", score: "88.2%", details: "Math-97, SST-96" },
    { name: "Madhu Chaudhary", score: "88.4%", details: "SST-91, Science-88" },
    { name: "Nitin Chaudhary", school: "Shriji Baba" },
    { name: "Khushi Sharma", school: "Shriji Baba" },
    { name: "Ishant Chaudhary", school: "Shriji Baba" },
    { name: "Harsh Chaudhary", school: "Rashtriya Military School" },
    { name: "Rishav", school: "Sainik School" }
  ],
  "2023": [
    { name: "Archana Chaudhary", score: "92%", details: "10th CBSE (SST-96, Hindi-94)" },
    { name: "Shrikant Thakur", score: "84%", details: "Science-94, Maths-96" },
    { name: "Shaurya", score: "80%", details: "10th CBSE (Maths-92, Science-88)" },
    { name: "Sonam", score: "93%", details: "Science-95, Hindi-94" },
    { name: "Saniya Agrawal", score: "91%", details: "10th CBSE (Science-92, Maths-90)" },
    { name: "Navyank Sharma", score: "89%", details: "SST-94, English-88" },
    { name: "Piyush Chaudhary", score: "88%", details: "Math-92, Science-86" },
    { name: "Aditya Ch.", score: "87%", details: "Math-90, SST-88" },
    { name: "Devendra Pandey", score: "85%", details: "SST-89, English-84" },
    { name: "Krishna Sirohi", score: "81%", details: "Math-85, Science-82" },
    { name: "Ayush Chaudhary", score: "90%", details: "10th CBSE (Science-98, Maths-97)" }
  ]
};

export const TOPPERS = [
  { name: "Sapna Chaudhary", class: "12th", score: "96%", year: "2021", detail: "Physics-96, Chem-90, Math-88" },
  { name: "Yogesh Singh", class: "10th", score: "100", year: "2021", detail: "Math-100, SST-97" },
  { name: "Atharva Chahar", class: "10th", year: "2022", detail: "Topper 2022, 2nd Rank" },
  { name: "Karan Chaudhary", class: "10th", year: "2022" },
  { name: "Shivam Agrawal", class: "10th", year: "2022" }
];

export const ADVANTAGES = [
  "Highly Qualified & Experienced faculty",
  "Proven Student Selection",
  "Comprehensive Study Material",
  "Limited Batch Size",
  "Honest Efforts ! Great Results !"
];

export const VIDEOS = [
  {
    id: "v1",
    title: "Basic Mathematics Concepts",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop",
    duration: "12:45",
    link: "https://www.youtube.com/@PradeepClasses07/videos"
  },
  {
    id: "v2",
    title: "Science: Physics Wonders",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2021&auto=format&fit=crop",
    duration: "15:20",
    link: "https://www.youtube.com/@PradeepClasses07/videos"
  },
  {
    id: "v3",
    title: "Entrance Exam Strategy",
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop",
    duration: "10:30",
    link: "https://www.youtube.com/@PradeepClasses07/videos"
  }
];

export const NOTIFICATIONS = [
  "CBSE Board Exams 2026 dates announced! Check the notice board.",
  "Navodaya Entrance Exam 2026 Registration is now OPEN.",
  "Sainik School Entrance Special Batch starts from May 15th.",
  "New IIT/NEET Foundation Batch for Class 9th & 10th starts next week."
];

export const RESOURCES = [
  {
    category: "Navodaya",
    papers: [
      { year: "2024", title: "JNVST Class 6th Paper", link: "#" },
      { year: "2023", title: "JNVST Class 6th Paper", link: "#" },
      { year: "2022", title: "JNVST Class 6th Paper", link: "#" }
    ]
  },
  {
    category: "Sainik School",
    papers: [
      { year: "2024", title: "AISSEE Class 6th Paper", link: "#" },
      { year: "2023", title: "AISSEE Class 6th Paper", link: "#" },
      { year: "2022", title: "AISSEE Class 9th Paper", link: "#" }
    ]
  },
  {
    category: "Board Exams",
    papers: [
      { year: "2024", title: "CBSE Class 10th Maths", link: "#" },
      { year: "2024", title: "CBSE Class 10th Science", link: "#" },
      { year: "2023", title: "CBSE Class 10th Standard Maths", link: "#" }
    ]
  }
];

export const TRANSLATIONS = {
  en: {
    heroTitle: "Empowering Future Leaders",
    heroSub: "Dedicated coaching for Class 1st to 12th.",
    admission: "Admission Open",
    contactUs: "Contact Us",
    courses: "Our Courses",
    results: "Our Results",
    faculty: "Expert Faculty",
    resources: "Resources"
  },
  hi: {
    heroTitle: "भविष्य के नेताओं को सशक्त बनाना",
    heroSub: "कक्षा 1 से 12 तक के लिए समर्पित कोचिंग।",
    admission: "प्रवेश प्रारंभ",
    contactUs: "संपर्क करें",
    courses: "हमारे कोर्सेस",
    results: "हमारे परिणाम",
    faculty: "विशेषज्ञ शिक्षक",
    resources: "संसाधन"
  }
};
