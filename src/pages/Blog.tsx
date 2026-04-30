import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Newspaper, Lightbulb, Clock, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';

interface NewsItem {
  title: string;
  pubDate: string;
  link: string;
  thumbnail: string;
  description: string;
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('education');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = {
    national: {
      name: 'National',
      url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms'
    },
    international: {
      name: 'International',
      url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms'
    },
    finance: {
      name: 'Finance & Business',
      url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms'
    },
    education: {
      name: 'Education & Career',
      url: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms'
    }
  };

  const fetchNewsAndFacts = async (categoryKey = activeCategory) => {
    setLoading(true);
    try {
      const feedUrl = categories[categoryKey as keyof typeof categories].url;
      const newsRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
      const newsData = await newsRes.json();
      
      const articles = newsData.items?.slice(0, 10) || [];
      
      // Fetch some random facts for the "GS/Facts" section
      const factsPromises = Array(3).fill(0).map(() => 
        fetch('https://uselessfacts.jsph.pl/api/v2/facts/random').then(r => r.json())
      );
      const factsData = await Promise.all(factsPromises);
      
      setNews(articles);
      setFacts(factsData.map(f => f.text));
    } catch (err) {
      console.error("Failed to fetch blog content", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsAndFacts();
    
    // Auto-refresh every 1 hour (3600000ms)
    const intervalId = setInterval(() => {
      fetchNewsAndFacts();
    }, 3600000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    fetchNewsAndFacts(key);
  };

  return (
    <div className="py-24 bg-stone-50 min-h-screen">
      <Helmet>
        <title>Educational News & Updates | Pradeep Classes Mathura</title>
        <meta name="description" content="Stay updated with the latest educational news, current affairs, and daily facts to prepare for competitive exams with Pradeep Classes Mathura." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Automated Feed</p>
          <h1 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
            News & Current Affairs
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">
            Stay updated with the latest news from around the world, national events, finance, and daily facts to boost your General Studies knowledge.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`px-6 py-2.5 rounded-full font-bold transition-all ${
                activeCategory === key
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105'
                  : 'bg-white text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary hover:scale-105 border border-slate-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main News Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <Newspaper className="text-brand-primary w-6 h-6" />
              <h2 className="text-2xl font-black text-brand-primary">{categories[activeCategory as keyof typeof categories].name} News</h2>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
                 <RefreshCw className="w-10 h-10 text-brand-secondary animate-spin mb-4" />
                 <p className="text-slate-500 font-medium">Fetching the latest updates...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.map((item, idx) => {
                  // clean up description HTML
                  const cleanDesc = item.description.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
                  // use a placeholder if no thumbnail
                  const imgSrc = item.thumbnail || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=2070&auto=format&fit=crop';
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group hover:shadow-xl transition-all flex flex-col h-full"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                        <img 
                          src={imgSrc} 
                          alt="Article thumbnail" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=2070&auto=format&fit=crop' }}
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-xs text-brand-accent font-bold uppercase tracking-wider mb-3">
                          <Clock size={12} />
                          {new Date(item.pubDate).toLocaleDateString()}
                        </div>
                        <h3 className="font-black text-brand-primary text-xl leading-tight mb-3 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">
                          {cleanDesc}
                        </p>
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-accent transition-colors mt-auto"
                        >
                          Read Full Article <ArrowRight size={16} />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar (Facts/GS) */}
          <div className="space-y-8">
              <div className="bg-brand-primary text-white p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="flex items-center gap-3 mb-8 relative">
                  <Lightbulb className="text-brand-secondary w-7 h-7" />
                  <h2 className="text-2xl font-black">Daily Facts & GS</h2>
                </div>
                
                <div className="space-y-6 relative">
                  {facts.map((fact, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (idx * 0.1) }}
                      className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10"
                    >
                      <p className="font-medium text-white/90 leading-relaxed text-sm">
                        "{fact}"
                      </p>
                    </motion.div>
                  ))}
                  
                <button 
                  onClick={() => fetchNewsAndFacts(activeCategory)}
                  className="w-full mt-6 bg-brand-secondary text-brand-primary font-bold py-3 rounded-xl hover:bg-brand-secondary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> Refresh News & Facts
                </button>
              </div>
            </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-brand-primary text-xl mb-4">Important Links</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="https://ncert.nic.in/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-brand-accent font-medium transition-colors">
                      <ExternalLink size={14} /> NCERT Official
                    </a>
                  </li>
                  <li>
                    <a href="https://www.cbse.gov.in/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-brand-accent font-medium transition-colors">
                      <ExternalLink size={14} /> CBSE Board
                    </a>
                  </li>
                  <li>
                    <a href="https://navodaya.gov.in/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-brand-accent font-medium transition-colors">
                      <ExternalLink size={14} /> Navodaya Vidyalaya
                    </a>
                  </li>
                  <li>
                    <a href="https://sainikschooladmission.in/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-brand-accent font-medium transition-colors">
                      <ExternalLink size={14} /> Sainik School
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
