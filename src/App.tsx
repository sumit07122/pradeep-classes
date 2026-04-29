/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  FlaskConical, 
  Trophy, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Menu, 
  X,
  Target,
  Users,
  Youtube,
  Facebook,
  Instagram
} from 'lucide-react';
import { motion, useInView, animate } from 'motion/react';

const Counter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        onUpdate: (latest) => setCount(Math.floor(latest)),
      });
      return () => controls.stop();
    }
  }, [value, duration, isInView]);

  return <span ref={ref}>{count}</span>;
};
import { CONTACTS, COURSES, TOPPERS, ADVANTAGES, FACULTY, TOPPERS_BY_YEAR } from './constants';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;


export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen font-sans flex flex-col selection:bg-brand-secondary selection:text-brand-primary">
      {/* Top Bar */}
      <div className="bg-brand-primary text-white py-2 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-xs gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 hover:text-brand-secondary transition-colors cursor-default">
            <Phone size={14} className="text-brand-secondary" />
            <span>{CONTACTS.phone1}, {CONTACTS.phone2}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 hover:text-brand-secondary transition-colors cursor-default">
            <Mail size={14} className="text-brand-secondary" />
            <span>{CONTACTS.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-white/20 pr-4 mr-2">
            <a href={CONTACTS.socials.facebook} className="hover:text-brand-secondary transition-colors"><Facebook size={14} /></a>
            <a href={CONTACTS.socials.instagram} className="hover:text-brand-secondary transition-colors"><Instagram size={14} /></a>
            <a href={CONTACTS.socials.youtube} className="hover:text-brand-secondary transition-colors"><Youtube size={14} /></a>
          </div>
          <MapPin size={14} className="text-brand-secondary shrink-0" />
          <span className="truncate">Near Shriji Baba School & Narsi Vihar Colony, Mathura</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-brand-secondary shadow-lg">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-brand-primary leading-tight">PRADEEP CLASSES</h1>
              <p className="text-[10px] md:text-xs font-semibold text-brand-accent tracking-[0.2em] uppercase">Your Dreams Need A Direction</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            {['Home', 'Courses', 'Results', 'Faculty', 'Contact'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="hover:text-brand-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-secondary transition-all group-hover:w-full"></span>
              </a>
            ))}
            <button className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-primary/20">
              Admission Open
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-100 p-4 absolute w-full shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {['Home', 'Courses', 'Results', 'Faculty', 'Contact'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-lg font-medium text-slate-700 active:text-brand-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button className="bg-brand-primary text-white py-3 rounded-xl font-bold">
                Admission Open
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative pt-12 pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 skew-x-[-12deg] translate-x-1/4"></div>
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
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
                <h2 className="text-4xl md:text-6xl font-black text-brand-primary leading-[1.1] heading-serif italic">
                  Empowering <span className="text-brand-accent">Future</span> Leaders at Pradeep Classes.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                  Dedicated coaching for <span className="font-bold text-brand-primary">Class 1st to 12th</span>. Special batches for Navodaya, Sainik School, and IIT/NEET Foundation.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-primary/90 hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl shadow-brand-primary/30 flex items-center gap-2">
                    Start Your Journey
                    <Phone size={18} />
                  </button>
                  <button className="bg-white text-brand-primary border-2 border-brand-primary/10 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                    View Results
                    <Trophy size={18} />
                  </button>
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
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Visual Placeholder for Instructor Image */}
                <div className="aspect-[4/5] bg-slate-200 rounded-[3rem] overflow-hidden relative shadow-2xl group border-8 border-white">
                  <img 
                    src="/pradeep-sir.jpeg" 
                    alt="Pradeep Sir"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/40 via-transparent to-transparent"></div>
                  <div className="absolute bottom-10 left-10 text-white">
                    <p className="text-sm font-medium tracking-[0.3em] uppercase mb-2">Director & Mentor</p>
                    <h3 className="text-4xl font-black heading-serif italic">Pradeep Kumar</h3>
                    <p className="text-brand-secondary font-bold">M.Com, UPSC IAS (Aspirant)</p>
                  </div>
                </div>
                {/* Floating Badge */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-secondary rounded-full flex items-center justify-center p-4 text-center shadow-lg border-4 border-white rotate-12">
                  <p className="text-[10px] font-black text-brand-primary uppercase leading-tight">
                    Registration <br /> <span className="text-xl">OPEN</span> <br /> 2026-27
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Advantage Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-brand-primary py-24 text-white overflow-hidden"
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

        {/* Courses Section */}
        <section id="courses" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16"
            >
              <div className="max-w-2xl">
                <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Our Programs</p>
                <h2 className="text-4xl md:text-5xl font-black text-brand-primary heading-serif italic">
                  Courses Specially Designed for Your Success.
                </h2>
              </div>
              <p className="text-slate-500 font-medium">From Foundation to Mastery.</p>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {COURSES.map((course, idx) => {
                const Icon = course.icon === 'GraduationCap' ? GraduationCap : 
                             course.icon === 'FlaskConical' ? FlaskConical :
                             course.icon === 'Trophy' ? Trophy : BookOpen;
                return (
                  <motion.div 
                    key={idx}
                    variants={itemVariants}
                    className="p-8 bg-slate-50 rounded-[2rem] hover:bg-brand-primary hover:text-white transition-all duration-500 group shadow-sm hover:shadow-2xl hover:shadow-brand-primary/20"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-primary mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <Icon size={32} />
                    </div>
                    <h3 className="text-2xl font-black mb-4 leading-tight">{course.title}</h3>
                    <p className="text-slate-500 group-hover:text-white/80 transition-colors">
                      {course.description}
                    </p>
                    <div className="mt-8 flex items-center gap-2 font-bold text-sm group-hover:text-brand-secondary transition-colors">
                      Learn More
                      <div className="w-6 h-px bg-current"></div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Results Section */}
        <section id="results" className="py-24 bg-stone-50 border-y border-stone-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
                  Legacy of Excellence
                </h2>
                <div className="bg-brand-accent text-white inline-block px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-xl shadow-brand-accent/20">
                  Record Holders & Rankers
                </div>
              </motion.div>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                Our students consistently break records year after year, securing perfect scores and top ranks in Mathura's most prestigious institutions.
              </p>
            </div>

            {/* Hall of Fame - Historical Highlights */}
            <div className="grid md:grid-cols-3 gap-8 mb-24">
               {[
                 { label: "Perfect Score", value: "100", suffix: "/100", sub: "Mathematics", student: "Yogesh Singh", color: "bg-brand-primary" },
                 { label: "Highest Overall", value: "96.2", suffix: "%", sub: "Science Stream", student: "Divyansh Kuntal", color: "bg-brand-accent" },
                 { label: "Entrance Rank", value: "5th", suffix: "", sub: "Dhanuka School", student: "Shivam Agrawal", color: "bg-brand-secondary" }
               ].map((highlight, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1, type: "spring" }}
                   viewport={{ once: true }}
                   className={`${highlight.color} ${i === 2 ? 'text-brand-primary' : 'text-white'} p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group`}
                 >
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                      <Trophy size={80} />
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80">{highlight.label}</p>
                   <div className="flex items-baseline gap-1">
                     <span className="text-6xl font-black heading-serif italic">{highlight.value}</span>
                     <span className="text-2xl font-bold">{highlight.suffix}</span>
                   </div>
                   <p className="text-xl font-black mt-2">{highlight.sub}</p>
                   <div className="mt-8 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">
                       {highlight.student[0]}
                     </div>
                     <p className="font-bold">{highlight.student}</p>
                   </div>
                 </motion.div>
               ))}
            </div>

            {/* Detailed Results By Year */}
            {Object.entries(TOPPERS_BY_YEAR).sort((a,b) => b[0].localeCompare(a[0])).map(([year, students]) => (
              <div key={year} className="mb-24 last:mb-0">
                <div className="flex items-center gap-6 mb-12">
                  <h3 className="text-4xl font-black text-brand-primary heading-serif italic">The {year} Batch</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {students.map((topper, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 4) * 0.05 }}
                      whileHover={{ y: -5 }}
                      viewport={{ once: true }}
                      className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:border-brand-secondary transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-2 h-0 bg-brand-secondary group-hover:h-full transition-all duration-500"></div>
                      <h4 className="font-black text-brand-primary group-hover:text-brand-accent transition-colors text-lg leading-tight">{topper.name}</h4>
                      {topper.score && <p className="text-brand-accent font-black text-xl mt-2">{topper.score}</p>}
                      {topper.rank && <p className="text-brand-primary/60 text-xs font-black mt-1 uppercase tracking-tight">{topper.rank}</p>}
                      {topper.school && (
                        <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full w-fit">
                          <MapPin size={10} className="text-brand-secondary" />
                          <span className="text-[10px] text-slate-500 font-black uppercase">{topper.school}</span>
                        </div>
                      )}
                      {topper.details && (
                        <div className="mt-4 pt-4 border-t border-slate-50">
                           <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Highlights</p>
                           <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{topper.details}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

            {/* Past Legacy Section */}
            <div className="mt-24 pt-12 border-t border-slate-200/50">
              <div className="flex items-center gap-6 mb-12">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
                <h3 className="text-2xl font-black text-slate-400 heading-serif italic uppercase tracking-widest">Past Legends</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {TOPPERS.map((topper, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-5 rounded-3xl bg-white/40 border border-slate-100 hover:bg-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-primary font-black shadow-inner">
                      {topper.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-primary text-sm">{topper.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        {topper.class} • {topper.year}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Floating Elements */}
          <div className="absolute top-1/4 left-10 w-24 h-24 border border-brand-secondary/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-10 w-32 h-32 border-2 border-brand-primary/5 rounded-full rotate-45"></div>
        </section>

        {/* Faculty Section */}
        <section id="faculty" className="py-24 bg-white relative overflow-hidden text-slate-900">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-20">
              <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Our Mentors</p>
              <h2 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
                Guided by Excellence
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">Learn from the experts who bring years of academic and competitive experience.</p>
            </div>

            <div className="space-y-20">
              {FACULTY.map((f, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}
                >
                  <div className="md:w-5/12">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-brand-secondary/20 rounded-[3.5rem] rotate-3 transition-transform group-hover:rotate-0"></div>
                  <div className="relative aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
                        <img 
                          src={f.image} 
                          alt={f.name}
                          className="w-full h-full object-cover transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-7/12 space-y-6">
                    <div>
                      <span className="bg-brand-accent/10 text-brand-accent px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                        {f.designation}
                      </span>
                      <h3 className="text-4xl md:text-5xl font-black text-brand-primary heading-serif italic leading-tight">
                        {f.name}
                      </h3>
                      <p className="text-xl font-bold text-slate-400 mt-2">{f.qualification}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8 py-6 border-y border-slate-100">
                      <div>
                        <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-brand-secondary" />
                          Experience
                        </h4>
                        <p className="font-bold text-slate-600">{f.experience}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-brand-secondary" />
                          Specialization
                        </h4>
                        <p className="font-bold text-slate-600">{f.specialization}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] mb-2">Teaching Philosophy</h4>
                        <p className="text-slate-600 leading-relaxed italic font-medium">"{f.philosophy}"</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] mb-2">Notable Achievements</h4>
                        <p className="text-slate-600 leading-relaxed font-medium">{f.achievements}</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20">
                        Discuss Your Future
                        <Phone size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Free Education & Special Batch Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-primary z-0">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_20%_50%,#fff_0%,transparent_10%)] bg-[length:40px_40px]"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-primary text-xl font-black">
                    %
                  </div>
                  <p className="font-black text-brand-primary">Heavy Fee Discounts for 9th to 12th Standard Students!</p>
                </div>
              </div>
              <div className="w-full md:w-1/3 bg-brand-primary rounded-[3rem] p-10 text-white text-center space-y-4">
                <h4 className="text-2xl font-black text-brand-secondary">Entrance Exam Ready</h4>
                <div className="space-y-4 text-sm font-bold uppercase tracking-widest">
                  <p className="border-b border-white/20 pb-2">Navodaya School</p>
                  <p className="border-b border-white/20 pb-2">Shriji Baba School</p>
                  <p className="border-b border-white/20 pb-2">Sainik School</p>
                  <p className="pb-2">Military School</p>
                </div>
                <button className="w-full bg-brand-secondary text-brand-primary py-4 rounded-2xl font-black text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all">
                  Join Special Batch
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact/Location Section */}
        <section id="contact" className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-5 gap-12">
              <motion.div 
                initial={{ x: -40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="md:col-span-2 space-y-8"
              >
                <h2 className="text-4xl font-black text-brand-primary heading-serif italic">Let's Connect</h2>
                <p className="text-slate-500">Visit us at our main location or drop by our head office. We are always ready to guide you.</p>
                
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    {CONTACTS.branches.map((branch, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-primary shrink-0 shadow-sm border border-slate-100">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-brand-primary text-sm uppercase tracking-tight">{branch.name}</h4>
                          <p className="text-brand-accent text-[10px] font-bold uppercase tracking-wider mb-2">{branch.landmark}</p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">{branch.address}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-1">Call Now</h4>
                      <p className="text-2xl font-black text-brand-primary tracking-tighter">{CONTACTS.phone1}</p>
                      <p className="text-2xl font-black text-brand-primary tracking-tighter">{CONTACTS.phone2}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-1">Email Us</h4>
                      <p className="font-bold text-slate-800">{CONTACTS.email}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ x: 40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="md:col-span-3 space-y-8"
              >
                {/* Map Section */}
                <div className="bg-slate-100 rounded-[3rem] overflow-hidden h-[400px] shadow-inner border-8 border-white relative z-0">
                  <MapContainer 
                    center={[27.4890, 77.6555]} 
                    zoom={13} 
                    scrollWheelZoom={false}
                    className="w-full h-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {CONTACTS.branches.map((branch, idx) => (
                      <Marker key={idx} position={[branch.coords.lat, branch.coords.lng]}>
                        <Popup>
                          <div className="p-1">
                            <h4 className="font-bold text-brand-primary m-0">{branch.name}</h4>
                            <p className="text-[10px] text-brand-accent font-bold uppercase mt-1 mb-2">{branch.landmark}</p>
                            <p className="text-xs text-slate-600 leading-tight m-0">{branch.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {/* Enquiry Form */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100">
                  <h3 className="text-2xl font-black text-brand-primary mb-6">Send an Enquiry</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input type="text" placeholder="Your Name" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium" />
                      <input type="text" placeholder="Phone Number" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium" />
                    </div>
                    <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium">
                      <option>Select Class</option>
                      <option>Class 9th</option>
                      <option>Class 10th</option>
                      <option>Class 11th</option>
                      <option>Class 12th</option>
                      <option>IIT/NEET Foundation</option>
                    </select>
                    <textarea placeholder="Your Message" rows={4} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"></textarea>
                    <button className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all shadow-xl shadow-brand-primary/20">
                      Submit Details
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-slate-50 border-t border-slate-200 py-16 px-4 md:px-8"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid md:grid-cols-3 gap-12 border-b border-slate-200 pb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-brand-secondary">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-brand-primary">PRADEEP CLASSES</h2>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering students through quality education and dedicated mentorship. Join us at your nearest coaching center for a brighter future.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-black text-brand-primary text-xs uppercase tracking-[0.2em]">Our Branches</h4>
              {CONTACTS.branches.map((branch, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="font-bold text-slate-800 text-sm">{branch.name}</p>
                  <p className="text-slate-500 text-xs">{branch.landmark}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-brand-primary text-xs uppercase tracking-[0.2em]">Quick Links</h4>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
                <a href="#home" className="hover:text-brand-primary">Home</a>
                <a href="#courses" className="hover:text-brand-primary">Courses</a>
                <a href="#results" className="hover:text-brand-primary">Results</a>
                <a href="#faculty" className="hover:text-brand-primary">Faculty</a>
                <a href="#contact" className="hover:text-brand-primary">Admission</a>
              </div>
              <div className="flex gap-4 pt-4">
                <a href={CONTACTS.socials.facebook} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"><Facebook size={18} /></a>
                <a href={CONTACTS.socials.instagram} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"><Instagram size={18} /></a>
                <a href={CONTACTS.socials.youtube} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"><Youtube size={18} /></a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-medium text-slate-400">
              © {new Date().getFullYear()} Pradeep Classes. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>Mathura, Uttar Pradesh</span>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Floating Call Button for Mobile */}
      <motion.a 
        href={`tel:${CONTACTS.phone1}`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 right-6 md:hidden z-50 bg-brand-primary text-white p-5 rounded-full shadow-2xl flex items-center justify-center border-4 border-brand-secondary"
      >
        <Phone size={24} />
      </motion.a>
    </div>
  );
}
