import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { FileDown, GraduationCap, School, BookOpen, Search, Download } from 'lucide-react';
import { RESOURCES } from '../constants';
import { useApp } from '../context/AppContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Resources() {
  const { language } = useApp();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [cloudResources, setCloudResources] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('year', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      setCloudResources(docs);
    });
    return () => unsubscribe();
  }, []);

  // Merge static constant if cloud is empty, otherwise prefer cloud
  const displayResourcesRaw = cloudResources.length > 0 
    ? cloudResources 
    : RESOURCES.flatMap(cat => cat.papers.map(p => ({ ...p, category: cat.category })));

  // Group by category
  const grouped = displayResourcesRaw.reduce((acc: any, paper: any) => {
    const cat = paper.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(paper);
    return acc;
  }, {});

  const categories = Object.keys(grouped).map(catName => ({
    category: catName,
    papers: grouped[catName].filter((p: any) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.papers.length > 0);

  return (
    <div className="py-24 bg-white min-h-screen">
      <SEO 
        title="Download Resources | Pradeep Classes Mathura"
        description="Access free study materials, previous year question papers for Navodaya, Sainik School, and Board exams (CBSE/UP Board) at Pradeep Classes."
        keywords="download study material, navodaya previous year papers, sainik school entrance papers, board exam sample papers mathura"
        canonical="https://pradeepclasses.in/resources"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-secondary font-black tracking-widest uppercase text-sm mb-4 block">Student Corner</span>
          <h1 className="text-5xl md:text-7xl font-black text-brand-primary leading-tight heading-serif italic mb-6">
            Downloadable <span className="text-brand-accent">Resources</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Access previous year question papers and study materials for Navodaya, Sainik School, and Board Exams.
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16 relative">
          <input 
            type="text" 
            placeholder="Search papers (e.g. Navodaya 2024)..."
            className="w-full bg-slate-50 border border-slate-200 p-6 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium pr-16"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={24} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, catIdx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: catIdx * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-brand-primary/5 h-fit"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-sm">
                  {category.category.includes('Navodaya') && <School size={28} />}
                  {category.category.includes('Sainik School') && <GraduationCap size={28} />}
                  {category.category.includes('Board Exams') && <BookOpen size={28} />}
                </div>
                <h2 className="text-2xl font-black text-brand-primary heading-serif italic">
                  {category.category}
                </h2>
              </div>

              <div className="space-y-4">
                {category.papers.map((paper, pIdx) => (
                  <motion.a
                    key={pIdx}
                    href={paper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 10 }}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-brand-secondary transition-all group"
                  >
                    <div>
                      <h4 className="font-black text-brand-primary group-hover:text-brand-accent transition-colors">
                        {paper.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Year: {paper.year}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <Download size={18} />
                    </div>
                  </motion.a>
                ))}
              </div>
              
              <a 
                href={`https://wa.me/918126180408?text=Hello%20Pradeep%20Classes,%20I%20am%20looking%20for%20more%20papers%20for%20${category.category}.%20Can%20you%20help?`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-sm hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
              >
                Request More Papers
              </a>
            </motion.div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-2xl font-black text-slate-400">No resources found for "{searchTerm}"</h3>
            <p className="text-slate-500 mt-2 font-medium">Try searching for a different keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
}
