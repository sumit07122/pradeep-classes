import React from 'react';
import { motion } from 'motion/react';
import { Award, Users, Phone, Trophy, CheckCircle2, BookOpen, Target, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Counter from '../components/Counter';
import { ADVANTAGES, FACULTY } from '../constants';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 skew-x-[-12deg] translate-x-1/4"></div>
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
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
              <h1 className="text-4xl md:text-6xl font-black text-brand-primary leading-[1.1] heading-serif italic">
                Empowering <span className="text-brand-accent">Future</span> Leaders at Pradeep Classes.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                Dedicated coaching for <span className="font-bold text-brand-primary">Class 1st to 12th</span>. Special batches for Navodaya, Sainik School, and IIT/NEET Foundation.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/contact" className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-primary/90 hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl shadow-brand-primary/30 flex items-center gap-2">
                  Start Your Journey
                  <Phone size={18} />
                </Link>
                <Link to="/results" className="bg-white text-brand-primary border-2 border-brand-primary/10 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                  View Results
                  <Trophy size={18} />
                </Link>
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
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-slate-200 rounded-[3rem] overflow-hidden relative shadow-2xl group border-8 border-white">
                <img 
                  src={FACULTY[0].image} 
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
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-secondary rounded-full flex items-center justify-center p-4 text-center shadow-lg border-4 border-white rotate-12">
                <p className="text-[10px] font-black text-brand-primary uppercase leading-tight">
                  Registration <br /> <span className="text-xl">OPEN</span> <br /> 2026-27
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision (New Content) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-black text-brand-primary heading-serif italic">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Our mission is to provide high-quality education and mentorship to every student, regardless of their background. 
                We aim to simplify complex concepts and build a strong foundation for lifelong learning and success in competitive exams.
              </p>
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-accent shadow-sm">
                  <Target size={24} />
                </div>
                <p className="font-bold text-brand-primary">Targeting Excellence in every student.</p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-black text-brand-primary heading-serif italic">Our Vision</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                We envision a society where every child has access to the right direction and resources to achieve their dreams. 
                Pradeep Classes strives to be the guiding light for future engineers, doctors, and civil servants of our nation.
              </p>
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-secondary shadow-sm">
                  <GraduationCap size={24} />
                </div>
                <p className="font-bold text-brand-primary">Building Leaders of Tomorrow.</p>
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

      {/* Free Education Banner */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-primary z-0">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_20%_50%,#fff_0%,transparent_10%)] bg-[length:40px_40px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
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
            </div>
            <div className="w-full md:w-1/3 bg-brand-primary rounded-[3rem] p-10 text-white text-center space-y-4">
              <h4 className="text-2xl font-black text-brand-secondary">Entrance Exam Ready</h4>
              <div className="space-y-4 text-sm font-bold uppercase tracking-widest">
                <p className="border-b border-white/20 pb-2">Navodaya School</p>
                <p className="border-b border-white/20 pb-2">Shriji Baba School</p>
                <p className="border-b border-white/20 pb-2">Sainik School</p>
                <p className="pb-2">Military School</p>
              </div>
              <Link to="/contact" className="block w-full bg-brand-secondary text-brand-primary py-4 rounded-2xl font-black text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all text-center">
                Join Special Batch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
