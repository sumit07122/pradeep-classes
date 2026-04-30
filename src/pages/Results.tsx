import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, MapPin } from 'lucide-react';
import { TOPPERS, TOPPERS_BY_YEAR as CONSTANT_TOPPERS_BY_YEAR } from '../constants';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Results() {
  const [toppersByYear, setToppersByYear] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchToppers = async () => {
      try {
        const q = query(collection(db, 'toppers'), orderBy('year', 'desc'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fetchedByYear: Record<string, any[]> = {};
          snap.docs.forEach(doc => {
            const data = doc.data();
            if (!fetchedByYear[data.year]) {
              fetchedByYear[data.year] = [];
            }
            fetchedByYear[data.year].push({ id: doc.id, ...data });
          });
          setToppersByYear(fetchedByYear);
        } else {
          setToppersByYear(CONSTANT_TOPPERS_BY_YEAR);
        }
      } catch (err) {
        console.error("Could not load toppers", err);
        setToppersByYear(CONSTANT_TOPPERS_BY_YEAR);
      }
    };
    fetchToppers();
  }, []);

  return (
    <div className="py-24 bg-stone-50 border-y border-stone-200 relative overflow-hidden min-h-screen">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
              Legacy of Excellence
            </h1>
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
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1, type: "spring" }}
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
        {Object.entries(toppersByYear).sort((a,b) => b[0].localeCompare(a[0])).map(([year, students]) => (
          <div key={year} className="mb-24 last:mb-0">
            <div className="flex items-center gap-6 mb-12">
              <h3 className="text-4xl font-black text-brand-primary heading-serif italic">The {year} Batch</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {students.map((topper, idx) => (
                <motion.div 
                  key={topper.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 4) * 0.05 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true }}
                  className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:border-brand-secondary transition-all relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-2 h-0 bg-brand-secondary group-hover:h-full transition-all duration-500"></div>
                  
                  {topper.imageUrl && (
                    <img src={topper.imageUrl} alt={topper.name} className="w-20 h-20 object-cover rounded-full mb-4 border-2 border-slate-100 mx-auto group-hover:border-brand-primary transition-colors" />
                  )}

                  <h4 className="font-black text-brand-primary group-hover:text-brand-accent transition-colors text-lg leading-tight mt-auto">{topper.name}</h4>
                  {topper.score && <p className="text-brand-accent font-black text-xl mt-2">{topper.score}</p>}
                  {topper.rank && <p className="text-brand-primary/60 text-xs font-black mt-1 uppercase tracking-tight">{topper.rank}</p>}
                  {topper.school && (
                    <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full w-fit">
                      <MapPin size={10} className="text-brand-secondary" />
                      <span className="text-[10px] text-slate-500 font-black uppercase line-clamp-1">{topper.school}</span>
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

        {/* Past Legacy Section Fallback (only shown if not fetching from firebase) */}
        {Object.keys(toppersByYear).length > 0 && toppersByYear === CONSTANT_TOPPERS_BY_YEAR && (
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
        )}
      </div>
    </div>
  );
}
