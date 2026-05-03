import React, { lazy, Suspense } from 'react';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { Award, Users, Phone, Trophy, CheckCircle2, BookOpen, Target, GraduationCap, PlayCircle, ArrowRight, MessageCircle, Star, Quote, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Counter from '../components/Counter';
import WhatsAppFloatingButton from '../components/WhatsAppFloatingButton';

const ReviewsSection = lazy(() => import('../components/ReviewsSection'));
const NoticeBoard = lazy(() => import('../components/NoticeBoard'));

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border-b border-slate-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-brand-primary transition-colors group"
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-brand-primary">{question}</span>
        <div className={`p-2 rounded-lg transition-all ${isOpen ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
          <HelpCircle size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-6 text-slate-600 leading-relaxed">
          {answer}
        </p>
      </motion.div>
    </div>
  );
};
import { ADVANTAGES, FACULTY, VIDEOS, CONTACTS, TRANSLATIONS } from '../constants';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import { getDoc, doc, collection, query, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Home() {
  const { language } = useApp();
  const t = TRANSLATIONS[language];

  const [remoteTitle, setRemoteTitle] = React.useState(t.heroTitle);
  const [remoteSubtitle, setRemoteSubtitle] = React.useState(t.heroSub);
  const [siteImages, setSiteImages] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // Sync initial state when translation changes
    setRemoteTitle(t.heroTitle);
    setRemoteSubtitle(t.heroSub);
    
    // Fetch global setting overrides
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          if (snap.data().heroTitle) setRemoteTitle(snap.data().heroTitle);
          if (snap.data().heroSubtitle) setRemoteSubtitle(snap.data().heroSubtitle);
        }
      } catch (err) {
        console.error("Could not load remote settings", err);
      }
    };
    fetchSettings();

    // Listen for site images
    const qImages = query(collection(db, 'siteImages'));
    const unsubscribe = onSnapshot(qImages, (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        images[data.key] = data.url;
      });
      setSiteImages(images);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'siteImages'));

    return () => unsubscribe();
  }, [language, t]);

  return (
    <div className="flex flex-col bg-white transition-colors duration-300">
      <WhatsAppFloatingButton />
      <SEO 
        title="Pradeep Classes Mathura | Top Coaching for Navodaya, Sainik School & IIT/NEET"
        description="Pradeep Classes Mathura offers expert coaching for Navodaya, Sainik School, IIT/NEET Foundation, and school academics (1st-12th). Join Mathura's top-rated coaching center with 15+ years of experience."
        keywords="Coaching in Mathura, Navodaya Coaching, Sainik School Coaching, IIT Foundation Mathura, NEET Foundation Mathura, Pradeep Classes Mathura, Academic Coaching Mathura, best coaching center mathura, pradeep sir coaching mathura"
      />
      <Suspense fallback={<div>Loading...</div>}>
        <NoticeBoard />
      </Suspense>
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 skew-x-[-12deg] translate-x-1/4"></div>
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary/20 text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider">
                  <Award size={14} />
                  Top Rated Coaching in Mathura
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/20 text-brand-accent rounded-full text-xs font-bold uppercase tracking-wider">
                  <Users size={14} />
                  15+ Years Experience
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-brand-primary leading-[1.1] heading-serif italic">
                {remoteTitle} <span className="text-brand-accent">at Pradeep Classes.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                {remoteSubtitle} Special batches for Navodaya, Sainik School, and IIT/NEET Foundation.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/contact" className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-primary/90 hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl shadow-brand-primary/30 flex items-center gap-2">
                  Start Your Journey
                  <Phone size={18} />
                </Link>
                <Link to="/results" className="bg-white text-brand-primary border-2 border-brand-primary/10 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                  View Results
                  <Trophy size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                <div>
                  <p className="text-3xl font-black text-brand-primary"><Counter value={1500} />+</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Students</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-brand-primary"><Counter value={100} />%</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Commitment</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-brand-primary">1st-12th</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Grades</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-slate-200 rounded-[3rem] overflow-hidden relative shadow-2xl group border-8 border-white">
                <img 
                  src={siteImages['pradeep_sir'] || FACULTY[0].image} 
                  alt="Pradeep Sir"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10 text-white">
                  <p className="text-sm font-medium tracking-[0.3em] uppercase mb-2">Director & Mentor</p>
                  <h3 className="text-4xl font-black heading-serif italic">Pradeep Kumar</h3>
                  <p className="text-brand-secondary font-bold">M.Com, UPSC IAS (Aspirant)</p>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-secondary rounded-full flex items-center justify-center p-4 text-center shadow-lg border-4 border-white rotate-12">
                <p className="text-[10px] font-black text-brand-primary uppercase leading-tight">
                  Registration <br /> <span className="text-xl">OPEN</span> <br /> 2026-27
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Admissions Poster Section */}
      <section className="py-12 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 rounded-[3rem] p-6 md:p-12 border-2 border-brand-primary/5 shadow-xl relative overflow-hidden"
          >
            {/* Visual background details */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-secondary/10 rounded-full blur-3xl"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div className="order-2 md:order-1">
                <motion.div 
                  animate={{ 
                    boxShadow: ["0 25px 50px -12px rgba(0,0,0,0.25)", "0 25px 50px -12px rgba(var(--brand-primary-rgb), 0.3)", "0 25px 50px -12px rgba(0,0,0,0.25)"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="aspect-[3/4] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[12px] border-white ring-4 ring-brand-primary/5 hover:ring-brand-primary/20 transition-all duration-500"
                >
                  <img 
                    src={siteImages['admissions_poster'] || 'https://lh3.googleusercontent.com/d/1qv_xncWkt5A7sgecugiqeSzKk0aqsF4H'} 
                    alt="Admissions Open 2026-27" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if the specific image ID above isn't yours
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop';
                    }}
                  />
                </motion.div>
              </div>
              
              <div className="order-1 md:order-2 space-y-8">
                <div>
                  <span className="inline-block px-4 py-1.5 bg-brand-accent text-white text-xs font-black uppercase tracking-widest rounded-full mb-4 shadow-lg shadow-brand-accent/20">
                    Enrollment Open 2026-27
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-brand-primary leading-tight italic heading-serif">
                    Military, Sainik & <br />
                    <span className="text-brand-accent">Navodaya</span> Coaching
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-primary">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Entrance Prep: Class 4th - 8th</p>
                      <p className="text-xs text-slate-500">Complete Defense School Preparation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      'Experienced Defence Mentors',
                      'Regular Tests & Doubts',
                      'Safe Environment',
                      'Limited Seats'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link 
                    to="/contact" 
                    className="flex-1 bg-brand-primary text-white text-center py-4 rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Apply Now
                  </Link>
                  <a 
                    href={`tel:${CONTACTS.phone1}`}
                    className="flex-1 bg-white text-brand-primary text-center py-4 rounded-2xl font-black border-2 border-brand-primary/10 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    {CONTACTS.phone1}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-black text-brand-primary heading-serif italic">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Our mission is to provide high-quality education and mentorship to every student, regardless of their background. 
                We aim to simplify complex concepts and build a strong foundation for lifelong learning and success in competitive exams.
              </p>
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl transition-colors duration-300">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-accent shadow-sm transition-colors duration-300">
                  <Target size={24} />
                </div>
                <p className="font-bold text-brand-primary transition-colors duration-300">Targeting Excellence in every student.</p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-black text-brand-primary heading-serif italic">Our Vision</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                We envision a society where every child has access to the right direction and resources to achieve their dreams. 
                Pradeep Classes strives to be the guiding light for future engineers, doctors, and civil servants of our nation.
              </p>
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl transition-colors duration-300">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-secondary shadow-sm transition-colors duration-300">
                  <GraduationCap size={24} />
                </div>
                <p className="font-bold text-brand-primary transition-colors duration-300">Building Leaders of Tomorrow.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Google Ratings & Social Proof */}
      <section className="py-24 bg-white overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-brand-primary rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Trophy key={i} size={32} className="text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                  ))}
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight heading-serif italic mb-6">
                  Trusted by <span className="text-brand-accent">1500+</span> Students & Parents
                </h2>
                <p className="text-brand-secondary/80 text-xl font-medium max-w-xl mx-auto md:mx-0 italic">
                  "Pradeep Sir's teaching methodology is legendary in Mathura. The way he simplifies complex math is unique and builds real confidence."
                </p>
              </div>

              <div className="flex-shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[3.5rem] flex flex-col items-center shadow-inner">
                <div className="text-6xl font-black text-white mb-2">4.9</div>
                <div className="flex gap-1 mb-4">
                   {[...Array(5)].map((_, i) => (
                    <motion.span 
                      key={i} 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: i * 0.1, repeat: Infinity, duration: 3 }}
                      className="text-yellow-400"
                    >
                      ★
                    </motion.span>
                  ))}
                </div>
                <div className="text-brand-secondary text-sm font-black uppercase tracking-widest mb-8">Google Rating</div>
                <a 
                  href={CONTACTS.googleReviews}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-brand-primary px-8 py-4 rounded-2xl font-black hover:bg-brand-accent hover:text-white transition-all shadow-xl"
                  id="google-review-btn"
                >
                  Read All Reviews
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Reviews & Form */}
      <Suspense fallback={<div>Loading Reviews...</div>}>
        <ReviewsSection />
      </Suspense>

      {/* Testimonials Section */}
      <section className="py-24 bg-brand-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-brand-secondary font-bold uppercase tracking-widest text-sm mb-2">Success Stories</p>
            <h2 className="text-4xl md:text-5xl font-black mb-6">What Parents & Students Say</h2>
            <div className="w-24 h-1.5 bg-brand-secondary mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rahul Sharma",
                sub: "Navodaya Selection 2023",
                text: "Pradeep Classes is the best choice for Navodaya preparation in Mathura. The trick-based math teaching is revolutionary.",
                rating: 5
              },
              {
                name: "Mrs. Verma",
                sub: "Parent of Class 10 student",
                text: "Personalized attention is what sets them apart. My daughter's confidence in Science and Math improved within 3 months.",
                rating: 5
              },
              {
                name: "Kartik Singh",
                sub: "IIT Foundation Batch",
                text: "The foundation batch helped me build concepts that are helping me even now in my higher studies. Highly recommended!",
                rating: 5
              }
            ].map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col justify-between h-full group hover:bg-white/20 transition-all"
              >
                <div>
                  <div className="flex gap-1 mb-6 text-brand-secondary">
                    {Array(t.rating).fill(0).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <Quote size={40} className="text-brand-secondary/20 mb-4" />
                  <p className="text-lg text-white/90 leading-relaxed mb-8 italic">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="w-12 h-12 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-xl">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-sm text-brand-secondary/80">{t.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Have Questions?</p>
            <h2 className="text-4xl font-black text-brand-primary mb-4 text-center">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-center">Everything you need to know about admissions and our coaching philosophy.</p>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="What is the admission procedure for Pradeep Classes?"
              answer="Admission starts with a small diagnostic test to understand the student's current level. You can visit our center near Goverdhan Chauraha to enroll directly or use the contact form on this website."
            />
            <FAQItem 
              question="Do you provide coaching for Navodaya and Sainik School?"
              answer="Yes, we have specialized separate batches for Navodaya Vidyalaya and Sainik School entrance exams with a track record of 100+ selections."
            />
            <FAQItem 
              question="What are the batch timings for Class 10th and 12th?"
              answer="We offer multiple batches: Morning (6:00 AM - 8:00 AM) and Evening (3:00 PM - 7:00 PM) to suit school schedules. Please call us for current batch availability."
            />
            <FAQItem 
              question="Is there a separate foundation batch for IIT/NEET?"
              answer="Yes, we have specialized foundation batches for Class 8th to 10th students targeting future competitive success in engineering and medical fields."
            />
          </div>
        </div>
      </section>

      {/* Video Lectures Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-brand-secondary font-black tracking-widest uppercase text-sm mb-4 block">Classroom Glimpse</span>
              <h2 className="text-4xl md:text-6xl font-black text-brand-primary leading-tight heading-serif italic">
                Learn Anytime with Our <span className="text-brand-accent">Video Lectures</span>
              </h2>
            </div>
            <a 
              href={CONTACTS.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border-2 border-brand-primary/10 font-black text-brand-primary hover:border-brand-secondary transition-all hover:shadow-xl group"
              id="view-all-videos"
            >
              View More on YouTube
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VIDEOS.map((video, idx) => (
              <motion.a
                key={video.id}
                href={video.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-brand-primary/5"
              >
                <div className="relative aspect-video">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-brand-primary/20 group-hover:bg-brand-primary/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <PlayCircle className="text-brand-primary" size={32} fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
                    {video.duration}
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-black text-brand-primary group-hover:text-brand-accent transition-colors heading-serif italic">
                    {video.title}
                  </h4>
                  <p className="text-slate-500 mt-2 font-medium text-sm">Pradeep Classes • Official Gallery</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Advantage Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-brand-primary py-24 text-white overflow-hidden transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.h2 
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black heading-serif italic leading-tight"
              >
                The Pradeep Classes Advantage
              </motion.h2>
              <div className="space-y-4">
                {ADVANTAGES.map((adv, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <CheckCircle2 className="text-brand-secondary shrink-0" size={24} />
                    <p className="text-xl font-medium">{adv}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 pt-12">
                <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 text-center">
                  <BookOpen size={48} className="mx-auto mb-4 text-brand-secondary" />
                  <h4 className="font-bold">Study Material</h4>
                  <p className="text-sm opacity-60">Comprehensive</p>
                </div>
                <div className="bg-brand-secondary p-8 rounded-3xl text-brand-primary text-center">
                  <Users size={48} className="mx-auto mb-4" />
                  <h4 className="font-black">Limited Batch</h4>
                  <p className="text-sm opacity-80 font-bold">Personalized Focus</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-brand-accent p-8 rounded-3xl text-white text-center">
                  <Target size={48} className="mx-auto mb-4" />
                  <h4 className="font-bold">Proven Selection</h4>
                  <p className="text-sm opacity-80">Great Results</p>
                </div>
                <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 text-center">
                  <Award size={48} className="mx-auto mb-4 text-brand-secondary" />
                  <h4 className="font-bold">Expert Faculty</h4>
                  <p className="text-sm opacity-60">Highly Qualified</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Free Education Banner */}
      <section className="py-24 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-brand-primary z-0">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_20%_50%,#fff_0%,transparent_10%)] bg-[length:40px_40px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-16 rounded-[4rem] shadow-2xl flex flex-col md:flex-row items-center gap-12 border-8 border-brand-secondary"
          >
            <div className="flex-1 space-y-6">
              <div className="bg-brand-accent text-white px-6 py-2 rounded-full inline-block font-black uppercase text-sm tracking-widest shadow-xl shadow-brand-accent/20">
                Social Mission
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-brand-primary heading-serif italic">
                अनाथ, असहाय बच्चों की शिक्षा मुफ्त
              </h3>
              <p className="text-xl text-slate-600 font-medium italic leading-relaxed">
                "Education is the most powerful weapon which you can use to change the world." - Nelson Mandela. We are committed to social upliftment.
              </p>
            </div>
            <div className="w-full md:w-1/3 bg-brand-primary rounded-[3rem] p-10 text-white text-center space-y-4">
              <h4 className="text-2xl font-black text-brand-secondary">Entrance Exam Ready</h4>
              <div className="space-y-4 text-sm font-bold uppercase tracking-widest">
                <p className="border-b border-white/20 pb-2">Navodaya School</p>
                <p className="border-b border-white/20 pb-2">Shriji Baba School</p>
                <p className="border-b border-white/20 pb-2">Sainik School</p>
                <p className="pb-2">Military School</p>
              </div>
              <Link to="/contact" className="block w-full bg-brand-secondary text-brand-primary py-4 rounded-2xl font-black text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all text-center">
                Join Special Batch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
