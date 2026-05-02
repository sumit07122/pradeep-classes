import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { Newspaper, Lightbulb, Clock, ArrowRight, ExternalLink, RefreshCw, Sparkles, Brain } from 'lucide-react';
import { getGeminiDailyContent, GsFact, CareerTip } from '../services/geminiService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NewsItem {
  title: string;
  pubDate: string;
  link: string;
  thumbnail: string;
  description: string;
  enclosure?: {
    link: string;
  };
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('education');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [facts, setFacts] = useState<GsFact[]>([]);
  const [tips, setTips] = useState<CareerTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFacts, setLoadingFacts] = useState(true);

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

  const fetchNews = async (categoryKey = activeCategory) => {
    setLoading(true);
    try {
      const feedUrl = categories[categoryKey as keyof typeof categories].url;
      const newsRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
      const newsData = await newsRes.json();
      const articles = newsData.items?.slice(0, 10) || [];
      setNews(articles);
    } catch (err) {
      console.error("Failed to fetch news updates", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGSContent = async (forceRefresh = false) => {
    setLoadingFacts(true);
    let docSnap = null;
    const docRef = doc(db, 'automated_content', 'daily_gs');

    try {
      docSnap = await getDoc(docRef);
    } catch (err) {
      console.warn("Firestore fetch failed for GS content, attempting fresh generation", err);
      // We don't throw here, just proceed to fresh generation if needed
    }

    try {
      let shouldUpdate = forceRefresh;
      
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        const lastUpdated = data.lastUpdated?.toDate();
        const now = new Date();
        if (!lastUpdated || (now.getTime() - lastUpdated.getTime() > 3600000)) {
          shouldUpdate = true;
        } else {
          setFacts(data.gsFacts || []);
          setTips(data.careerTips || []);
          setLoadingFacts(false);
          if (!forceRefresh) return; // use cached data
        }
      } else {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        const freshContent = await getGeminiDailyContent();
        if (freshContent) {
          setFacts(freshContent.gsFacts);
          setTips(freshContent.careerTips);
          
          try {
            await setDoc(docRef, {
              gsFacts: freshContent.gsFacts,
              careerTips: freshContent.careerTips,
              lastUpdated: serverTimestamp()
            });
          } catch (writeErr) {
            console.warn("Database cache update skipped (insufficient permissions/not admin).");
          }
        } else {
          // Fallbacks for AI failure
          setFacts([
            { category: "Indian Constitution", fact: "The Constitution of India is the longest written constitution of any sovereign country in the world.", explanation: "It contains 448 articles in 25 parts and 12 schedules." },
            { category: "Science", fact: "Light travels at a speed of approximately 300,000 km/s.", explanation: "It takes about 8 minutes and 20 seconds for light to travel from the Sun to Earth." }
          ]);
          setTips([
            { subject: "Revision", tip: "Revise same-day concepts before sleeping for 20% better recall." }
          ]);
        }
      }
    } catch (err) {
      console.error("General error in fetchGSContent:", err);
      setFacts([{ category: "Notice", fact: "Educational content updating...", explanation: "Daily facts will refresh shortly. Please check back soon." }]);
    } finally {
      setLoadingFacts(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchGSContent();
    
    // Auto-refresh news every 30 mins, facts every 1 hour
    const newsInterval = setInterval(() => fetchNews(), 1800000);
    const factsInterval = setInterval(() => fetchGSContent(), 3600000);
    
    return () => {
      clearInterval(newsInterval);
      clearInterval(factsInterval);
    };
  }, []);

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    fetchNews(key);
  };

  return (
    <div className="py-24 bg-stone-50 min-h-screen">
      <SEO 
        title="Educational News & Insights | Pradeep Classes Mathura"
        description="Stay ahead with automated educational news, current affairs, and daily general studies facts. Curated for competitive exam aspirants at Pradeep Classes."
        keywords="educational newsletter mathura, current affairs for students, gs preparation mathura, board exam news, scholarship alerts"
        canonical="https://pradeepclasses.in/blog"
      />
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
                  // categorize images for fallback
                  const fallbackImages = {
                    education: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop',
                    national: 'https://images.unsplash.com/photo-1532375811409-caac3341bed7?q=80&w=2070&auto=format&fit=crop',
                    international: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=2070&auto=format&fit=crop',
                    finance: 'https://images.unsplash.com/photo-1611974714014-4986a23a31bc?q=80&w=2070&auto=format&fit=crop'
                  };

                  const imgSrc = item.thumbnail || 
                                 item.enclosure?.link || 
                                 fallbackImages[activeCategory as keyof typeof fallbackImages];
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
              <div className="bg-brand-primary text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl shadow-brand-primary/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="flex items-center justify-between mb-8 relative">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-brand-secondary w-7 h-7" />
                    <h2 className="text-2xl font-black">GS Daily Capsule</h2>
                  </div>
                  <Brain className="text-white/20 w-8 h-8" />
                </div>
                
                <div className="space-y-6 relative">
                  {loadingFacts ? (
                    <div className="flex flex-col items-center py-6">
                      <RefreshCw className="w-8 h-8 text-brand-secondary animate-spin mb-2" />
                      <p className="text-white/60 text-xs">Generating fresh facts...</p>
                    </div>
                  ) : (
                    <>
                      {facts.map((fact, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 group"
                        >
                          <div className="text-[10px] uppercase tracking-widest text-brand-secondary font-bold mb-2 opacity-70">
                            {fact.category}
                          </div>
                          <p className="font-bold text-white leading-relaxed text-sm mb-2">
                             {fact.fact}
                          </p>
                          {fact.explanation && (
                            <p className="text-white/60 text-xs leading-relaxed italic">
                              {fact.explanation}
                            </p>
                          )}
                        </motion.div>
                      ))}

                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-black text-brand-secondary uppercase tracking-widest mb-4">Study Strategy</h3>
                        {tips.map((tip, idx) => (
                          <div key={idx} className="flex gap-3 mb-4 last:mb-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 shrink-0"></div>
                            <p className="text-sm text-white/80"><span className="font-bold text-white">{tip.subject}:</span> {tip.tip}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                <button 
                  onClick={() => { fetchNews(); fetchGSContent(true); }}
                  className="w-full mt-6 bg-brand-secondary text-brand-primary font-bold py-3 rounded-xl hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> Update Now
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
