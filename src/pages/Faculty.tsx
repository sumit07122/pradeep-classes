import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FACULTY as CONSTANT_FACULTY } from '../constants';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Faculty() {
  const [faculties, setFaculties] = useState<any[]>([]);

  const [sortType, setSortType] = useState<'default' | 'experience' | 'alphabetical'>('default');

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const q = query(collection(db, 'faculties'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fbFaculties = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Ensure Pradeep Sir is always first
          const pradeepIndex = fbFaculties.findIndex((f: any) => f.name && f.name.includes('Pradeep'));
          if (pradeepIndex > -1) {
            const pradeep = fbFaculties.splice(pradeepIndex, 1)[0];
            fbFaculties.unshift(pradeep);
          }
          
          setFaculties(fbFaculties);
        } else {
          setFaculties(CONSTANT_FACULTY);
        }
      } catch (err) {
        console.error("Could not load faculties", err);
        setFaculties(CONSTANT_FACULTY);
      }
    };
    fetchFaculties();
  }, []);

  const sortedSpecialists = React.useMemo(() => {
    if (faculties.length <= 1) return [];
    const specialists = [...faculties.slice(1)];
    
    if (sortType === 'experience') {
      return specialists.sort((a, b) => {
        const expA = parseInt(a.experience) || 0;
        const expB = parseInt(b.experience) || 0;
        return expB - expA; // Descending
      });
    } else if (sortType === 'alphabetical') {
      return specialists.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    
    return specialists;
  }, [faculties, sortType]);

  return (
    <div className="py-24 bg-white min-h-screen relative overflow-hidden">
      <SEO 
        title="Meet Our Expert Faculty | Pradeep Classes Mathura"
        description="Learn from the best mentors in Mathura. Our expert faculty, led by Pradeep Kumar, provides personalized coaching for board exams and competitive entrances."
        keywords="pradeep classes mathura faculty, best teachers mathura, coaching mentors, pradeep sir mathura, expert coaching faculty"
        canonical="https://pradeepclasses.in/faculty"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-20">
          <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Our Mentors</p>
          <h1 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
            Guided by Excellence
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium text-lg">Learn from the experts who bring years of academic and competitive experience.</p>
        </div>

        <div className="space-y-40">
          {/* Featured Director Section */}
          {faculties.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row gap-12 lg:gap-24 items-center"
            >
              <div className="md:w-5/12">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-brand-secondary/20 rounded-[4rem] rotate-3 transition-transform group-hover:rotate-0"></div>
                  <div className="relative aspect-[4/5] bg-gray-50 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl">
                    <img 
                      src={faculties[0].imageUrl || faculties[0].image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop'} 
                      alt={faculties[0].name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 object-top"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="md:w-7/12 space-y-8">
                <div>
                  <span className="bg-brand-primary text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-lg shadow-brand-primary/20">
                    {faculties[0].designation}
                  </span>
                  <h2 className="text-5xl md:text-6xl font-black text-brand-primary heading-serif italic leading-tight">
                    {faculties[0].name}
                  </h2>
                  <p className="text-2xl font-bold text-slate-400 mt-2">{faculties[0].qualification}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-brand-secondary" />
                       Experience
                    </h4>
                    <p className="font-bold text-slate-700 text-lg">{faculties[0].experience}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-brand-secondary" />
                       Specialization
                    </h4>
                    <p className="font-bold text-slate-700 text-lg">{faculties[0].specialization}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {faculties[0].philosophy && (
                    <div>
                      <h4 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] mb-3">Teaching Philosophy</h4>
                      <p className="text-slate-600 leading-relaxed italic font-medium text-lg">"{faculties[0].philosophy}"</p>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Link to="/contact" className="w-fit bg-brand-primary text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 hover:scale-105">
                    Consult with Pradeep Sir
                    <Phone size={20} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Expert Faculty Grid */}
          {faculties.length > 1 && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div className="text-center md:text-left w-full md:w-auto">
                  <h3 className="text-3xl font-black text-brand-primary heading-serif italic mb-2">Our Subject Specialists</h3>
                  <div className="w-20 h-1.5 bg-brand-secondary mx-auto md:mx-0 rounded-full"></div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
                  <label htmlFor="sortFaculty" className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Sort By:</label>
                  <select 
                    id="sortFaculty" 
                    className="bg-slate-50 border-2 border-slate-100 text-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-brand-secondary focus:ring-0 transition-colors cursor-pointer appearance-none"
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value as 'default' | 'experience' | 'alphabetical')}
                  >
                    <option value="default">Default</option>
                    <option value="experience">Experience (High to Low)</option>
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {sortedSpecialists.map((f, idx) => (
                  <motion.div
                    key={f.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <div className="relative mb-6">
                      <div className="absolute -inset-2 bg-slate-50 rounded-[2.5rem] group-hover:bg-brand-secondary/10 transition-colors duration-500"></div>
                      <div className="relative aspect-[4/5] bg-gray-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg">
                        <img 
                          src={f.imageUrl || f.image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop'} 
                          alt={f.name}
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${f.name.includes('Rajesh') ? 'object-[center_20%]' : 'object-top'}`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 px-2">
                      <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/10 px-2 py-0.5 rounded">
                        {f.designation}
                      </span>
                      <h4 className="text-2xl font-black text-brand-primary heading-serif italic leading-tight group-hover:text-brand-accent transition-colors">
                        {f.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{f.qualification}</p>
                      
                      <div className="pt-3 space-y-2 border-t border-slate-100 mt-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <CheckCircle2 size={12} className="text-brand-secondary" />
                          {f.experience}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          {f.specialization}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Faculty Values */}
        <div className="mt-32 border-t border-slate-100 pt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-brand-primary heading-serif italic">Our Academic Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Conceptual Clarity", desc: "We move beyond memorization to ensure students understand the 'why' behind every concept." },
              { title: "Regular Tracking", desc: "Weekly tests and personalized performance reports to keep every student on the right track." },
              { title: "Ethical Mentoring", desc: "Teaching values of honesty, hard work, and social responsibility alongside academics." }
            ].map((value, i) => (
              <div key={i} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-secondary mb-6 shadow-sm font-black text-xl">
                  0{i + 1}
                </div>
                <h4 className="text-xl font-black text-brand-primary mb-4">{value.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Join as Faculty */}
        <div className="mt-32 bg-brand-accent p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-4 text-center md:text-left">
             <h3 className="text-3xl font-black">Want to join our faculty?</h3>
             <p className="text-white/80 font-medium max-w-md">We are always looking for passionate teachers who want to make a difference in Mathura's education landscape.</p>
           </div>
           <Link to="/contact" className="bg-white text-brand-accent px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform whitespace-nowrap">
             Apply Now
           </Link>
        </div>
      </div>
    </div>
  );
}
