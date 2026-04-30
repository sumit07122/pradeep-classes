import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Facebook, Instagram, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { CONTACTS, TRANSLATIONS } from '../constants';
import { useApp } from '../context/AppContext';

export default function Footer() {
  const { language } = useApp();
  const t = TRANSLATIONS[language];

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-slate-50 border-t border-slate-200 py-16 px-4 md:px-8 mt-auto transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 border-b border-slate-200 pb-12">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-brand-secondary">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-brand-primary uppercase">PRADEEP CLASSES</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Empowering students through quality education and dedicated mentorship. Join us at your nearest coaching center for a brighter future.
            </p>
            <div className="flex gap-4 items-center">
              <a href={CONTACTS.socials.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"><Facebook size={16} /></a>
              <a href={CONTACTS.socials.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"><Instagram size={16} /></a>
              <a href={CONTACTS.socials.youtube} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"><Youtube size={16} /></a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-brand-primary uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="space-y-2">
              {['Home', 'Courses', 'Results', 'Faculty', 'Gallery', 'Blog', 'Resources', 'Contact'].map((item) => (
                <li key={item}>
                  <Link to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="text-slate-500 hover:text-brand-primary text-sm transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/30"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-brand-primary uppercase tracking-wider text-sm">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-500">
                <MapPin size={18} className="text-brand-accent shrink-0" />
                <span>Narsi Vihar, Transport Nagar, Sonkh Road, Mathura</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-500">
                <Phone size={18} className="text-brand-accent shrink-0" />
                <span>{CONTACTS.phone1}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-500 text-xs">
                <Mail size={18} className="text-brand-accent shrink-0" />
                <span>{CONTACTS.email}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400 text-center md:text-left">
          <p className="flex items-center justify-center md:justify-start flex-wrap gap-1">
            © {new Date().getFullYear()} Pradeep Classes. All rights reserved. | Built by{' '}
            <a href="mailto:sumitdevthakur@gmail.com" className="inline-flex items-center gap-1 text-brand-primary font-semibold hover:text-brand-accent transition-colors ml-1">
              Sumit Dev Thakur <Mail size={12} />
            </a>
          </p>
          <div className="flex gap-6">
            <Link to="/admin/login" className="hover:text-brand-primary transition-colors">Admin Login</Link>
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
