import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, FlaskConical, Trophy, BookOpen } from 'lucide-react';
import { COURSES, TRANSLATIONS } from '../constants';
import { useApp } from '../context/AppContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function Courses() {
  const { language } = useApp();
  const t = TRANSLATIONS[language];

  return (
    <div className="py-24 bg-white min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16"
        >
          <div className="max-w-2xl">
            <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Our Programs</p>
            <h1 className="text-4xl md:text-5xl font-black text-brand-primary heading-serif italic">
              {t.courses} Specially Designed for Your Success.
            </h1>
          </div>
          <p className="text-slate-500 font-medium">From Foundation to Mastery.</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {COURSES.map((course, idx) => {
            const Icon = course.icon === 'GraduationCap' ? GraduationCap : 
                         course.icon === 'FlaskConical' ? FlaskConical :
                         course.icon === 'Trophy' ? Trophy : BookOpen;
            return (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="p-8 bg-slate-50 rounded-[2.5rem] hover:bg-brand-primary hover:text-white transition-all duration-500 group shadow-sm hover:shadow-2xl hover:shadow-brand-primary/20"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-primary mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight">{course.title}</h3>
                <p className="text-slate-500 group-hover:text-white/80 transition-colors">
                  {course.description}
                </p>
                <div className="mt-8 flex items-center gap-2 font-bold text-sm group-hover:text-brand-secondary transition-colors">
                  Learn More
                  <div className="w-6 h-px bg-current"></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Detailed Course Breakdown */}
        <div className="mt-24 space-y-16">
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <span className="bg-brand-secondary/20 text-brand-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Foundation Level</span>
              <h2 className="text-3xl font-black text-brand-primary heading-serif italic">Class 1st to 8th</h2>
              <p className="text-slate-600 leading-relaxed">
                We focus on building a strong conceptual foundation in Mathematics, Science, and Languages. 
                Our approach encourages curiosity and critical thinking from an early age, preparing students for future academic challenges.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-brand-secondary"></div>
                  Skill-based Learning Modules
                </li>
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-brand-secondary"></div>
                  Regular Assessment & Feedback
                </li>
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-brand-secondary"></div>
                  Foundation for NTSE & Olympiads
                </li>
              </ul>
            </div>
            <div className="bg-slate-100 aspect-video rounded-[3rem] shadow-inner"></div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse"
          >
            <div className="md:order-2 space-y-6">
              <span className="bg-brand-accent/20 text-brand-accent px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Board Mastery</span>
              <h2 className="text-3xl font-black text-brand-primary heading-serif italic">Class 9th to 12th</h2>
              <p className="text-slate-600 leading-relaxed">
                Specialized coaching for Board Exams (CBSE/UP Board) with a focus on high achievement. 
                We cover the entire syllabus with multiple revisions, mock tests, and personalized doubt-clearing sessions.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                  Stream-specific Expertise (Science/Commerce/Humanities)
                </li>
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                  Sample Paper Solving Workshops
                </li>
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                  Career Guidance Sessions
                </li>
              </ul>
            </div>
            <div className="md:order-1 bg-slate-100 aspect-video rounded-[3rem] shadow-inner"></div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-brand-primary heading-serif italic">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {[
              { q: "What is the batch size?", a: "To ensure personalized attention, we keep our batches limited to 20-25 students." },
              { q: "Do you provide study material?", a: "Yes, we provide comprehensive, updated study material and practice sheets for every subject." },
              { q: "Is there any scholarship for bright students?", a: "Yes, we offer merit-based scholarships and special support for underprivileged children." }
            ].map((faq, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="font-black text-brand-primary mb-2">Q: {faq.q}</h4>
                <p className="text-slate-600 font-medium">A: {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
