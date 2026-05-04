import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, Phone, Mail, Facebook, Instagram, Youtube, MapPin, Sun, Moon, Languages, Bell, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CONTACTS, TRANSLATIONS } from '../constants';
import { useApp } from '../context/AppContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Header() {
  const { language, setLanguage, theme, toggleTheme } = useApp();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const t = TRANSLATIONS[language];

  const [announcement, setAnnouncement] = useState({ text: '', link: '', active: false });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.announcementActive) {
            setAnnouncement({
              text: data.announcementText || '',
              link: data.announcementLink || '',
              active: data.announcementActive
            });
          }
        }
      } catch (error) {
        console.error("Could not load announcement", error);
      }
    };
    fetchAnnouncement();
  }, []);

  const navItems = [
    { name: t.courses, path: '/courses' },
    { name: t.results, path: '/results' },
    { name: t.faculty, path: '/faculty' },
    { name: t.gallery, path: '/gallery' },
    { name: t.blog, path: '/blog' },
    { name: t.resources, path: '/resources' },
    { name: t.contactUs, path: '/contact' }
  ];

  return (
    <header className="z-50">
      {/* Exam Notification Ticker */}
      <AnimatePresence>
        {announcement.active && announcement.text && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-brand-secondary text-brand-primary py-2.5 overflow-hidden relative border-b border-brand-primary/10 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
              <div className="flex-1 overflow-hidden">
                <motion.div 
                  className="whitespace-nowrap flex items-center gap-8"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest shrink-0">
                      <span className="flex items-center justify-center w-6 h-6 bg-brand-primary text-brand-secondary rounded-full">
                        <Bell size={12} className="animate-pulse" />
                      </span>
                      <span>{announcement.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              <Link 
                to={announcement.link || "/contact"} 
                className="shrink-0 bg-brand-primary text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:scale-105 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2 group whitespace-nowrap"
              >
                Enroll Now
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <PlayCircle size={12} />
                </motion.span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="bg-slate-50 text-slate-600 py-2 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-xs gap-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 hover:text-brand-primary transition-colors cursor-default">
            <Phone size={14} className="text-brand-primary" />
            <span>{CONTACTS.phone1}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 hover:text-brand-primary transition-colors cursor-default">
            <Mail size={14} className="text-brand-primary" />
            <span>{CONTACTS.email}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-lg">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded transition-colors font-bold uppercase tracking-tighter text-brand-primary"
              id="lang-toggle"
            >
              <Languages size={14} className="text-brand-primary" />
              {language === 'en' ? 'हिन्दी' : 'English'}
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 text-brand-primary">
            <a href={CONTACTS.socials.facebook} target="_blank" rel="noreferrer" className="hover:text-brand-accent transition-colors"><Facebook size={14} /></a>
            <a href={CONTACTS.socials.instagram} target="_blank" rel="noreferrer" className="hover:text-brand-accent transition-colors"><Instagram size={14} /></a>
            <a href={CONTACTS.socials.youtube} target="_blank" rel="noreferrer" className="hover:text-brand-accent transition-colors"><Youtube size={14} /></a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 overflow-hidden bg-brand-secondary rounded-xl flex items-center justify-center text-brand-primary shadow-lg group-hover:scale-110 transition-transform">
              <img src="https://lh3.googleusercontent.com/d/1-hFy2Dri6g1hYLcNGr0I6dmdg7m1lpG-" alt="Pradeep Classes Logo" className="w-full h-full object-cover" onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }} />
              <GraduationCap size={28} className="hidden" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-brand-primary leading-tight">PRADEEP CLASSES</h1>
              <p className="text-[10px] md:text-xs font-semibold text-brand-accent tracking-[0.2em] uppercase">Your Dreams Need A Direction</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`hover:text-brand-primary transition-colors relative group ${location.pathname === item.path ? 'text-brand-primary' : ''}`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-secondary transition-all group-hover:w-full ${location.pathname === item.path ? 'w-full' : 'w-0'}`}></span>
              </Link>
            ))}

            <Link to="/contact" className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-primary/20">
              {t.admission}
            </Link>
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
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="flex flex-col gap-4 p-4">
                {navItems.map((item) => (
                  <Link 
                    key={item.name} 
                    to={item.path}
                    className={`text-lg font-medium transition-colors ${location.pathname === item.path ? 'text-brand-primary' : 'text-slate-700'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <Link to="/contact" className="w-full block text-center bg-brand-primary text-white py-3 rounded-xl font-bold" onClick={() => setIsMenuOpen(false)}>
                  {t.admission}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
