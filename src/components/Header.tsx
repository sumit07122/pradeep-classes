import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, Phone, Mail, Facebook, Instagram, Youtube, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CONTACTS } from '../constants';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Results', path: '/results' },
    { name: 'Faculty', path: '/faculty' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <header className="z-50">
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
            <a href={CONTACTS.socials.facebook} target="_blank" rel="noreferrer" className="hover:text-brand-secondary transition-colors"><Facebook size={14} /></a>
            <a href={CONTACTS.socials.instagram} target="_blank" rel="noreferrer" className="hover:text-brand-secondary transition-colors"><Instagram size={14} /></a>
            <a href={CONTACTS.socials.youtube} target="_blank" rel="noreferrer" className="hover:text-brand-secondary transition-colors"><Youtube size={14} /></a>
          </div>
          <MapPin size={14} className="text-brand-secondary shrink-0" />
          <span className="truncate">Near Shriji Baba School & Narsi Vihar Colony, Mathura</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-brand-secondary shadow-lg group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
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
              Admission Open
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
                <Link to="/contact" className="w-full block text-center bg-brand-primary text-white py-3 rounded-xl font-bold">
                  Admission Open
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
