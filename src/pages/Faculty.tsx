import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FACULTY as CONSTANT_FACULTY } from '../constants';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Faculty() {
  const [faculties, setFaculties] = useState<any[]>([]);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const q = query(collection(db, 'faculties'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFaculties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  return (
    <div className="py-24 bg-white min-h-screen relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-20">
          <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Our Mentors</p>
          <h1 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
            Guided by Excellence
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium text-lg">Learn from the experts who bring years of academic and competitive experience.</p>
        </div>

        <div className="space-y-32">
          {faculties.map((f, idx) => (
            <motion.div 
              key={f.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 lg:gap-24 items-center`}
            >
              <div className="md:w-5/12">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-brand-secondary/20 rounded-[3.5rem] rotate-3 transition-transform group-hover:rotate-0"></div>
                  <div className="relative aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
                    <img 
                      src={f.imageUrl || f.image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop'} 
                      alt={f.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
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
                  <span className="bg-brand-accent/10 text-brand-accent px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                    {f.designation}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-brand-primary heading-serif italic leading-tight">
                    {f.name}
                  </h2>
                  <p className="text-xl font-bold text-slate-400 mt-2">{f.qualification}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-secondary" />
                      Experience
                    </h4>
                    <p className="font-bold text-slate-700 text-lg">{f.experience}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-secondary" />
                      Specialization
                    </h4>
                    <p className="font-bold text-slate-700 text-lg">{f.specialization}</p>
                  </div>
                </div>

                {/* Optional philosophy and achievements sections */}
                {(f.philosophy || f.achievements) && (
                <div className="space-y-6">
                  {f.philosophy && (
                  <div>
                    <h4 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] mb-3">Teaching Philosophy</h4>
                    <p className="text-slate-600 leading-relaxed italic font-medium text-lg">"{f.philosophy}"</p>
                  </div>
                  )}
                  {f.achievements && (
                  <div>
                    <h4 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] mb-3">Notable Achievements</h4>
                    <p className="text-slate-600 leading-relaxed font-medium text-lg">{f.achievements}</p>
                  </div>
                  )}
                </div>
                )}

                <div className="pt-4">
                  <Link to="/contact" className="w-fit bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 hover:translate-y-[-2px]">
                    Discuss Your Future
                    <Phone size={20} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
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
