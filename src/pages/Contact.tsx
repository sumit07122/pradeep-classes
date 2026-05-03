import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { CONTACTS } from '../constants';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Contact() {
  const [activeBranch, setActiveBranch] = React.useState(0);
  const [isMapActive, setIsMapActive] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    class: 'Select Class',
    message: ''
  });

  const activeCoords = CONTACTS.branches[activeBranch].coords;
  const googleMapUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3545.0!2d${activeCoords.lng}!3d${activeCoords.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1714570000000!5m2!1sen!2sin&q=${activeCoords.lat},${activeCoords.lng}`;

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      try {
        await addDoc(collection(db, 'inquiries'), {
          name: formData.name,
          phone: formData.phone,
          message: formData.class + " - " + formData.message,
          status: 'new',
          createdAt: serverTimestamp()
        });
        alert('Thank you! Your inquiry has been sent successfully. We will contact you soon.');
        setFormData({ name: '', phone: '', class: 'Select Class', message: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'inquiries');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to send inquiry. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-24 bg-white min-h-screen overflow-hidden">
      <SEO 
        title="Contact Us | Pradeep Classes Mathura Coaching"
        description="Get in touch with Pradeep Classes Mathura. Find our center locations near Goverdhan Chauraha, call us for admissions, or send an inquiry for classes 1st-12th."
        keywords="contact pradeep classes, mathura coaching phone number, coaching center location mathura, admissions help mathura"
        canonical="https://pradeepclasses.in/contact"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2">Contact Us</p>
          <h1 className="text-4xl md:text-6xl font-black text-brand-primary heading-serif italic mb-4">
            Connect With Us
          </h1>
          <p className="text-slate-500 font-medium text-lg">Visit us at our main location or drop by our head office. We are always ready to guide you.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-24">
          <motion.div 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-2 space-y-12"
          >
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-brand-primary heading-serif italic">Our Centers</h2>
              <div className="space-y-6">
                {CONTACTS.branches.map((branch, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => {
                      setActiveBranch(idx);
                      setIsMapActive(false); // Reset interaction on branch change
                    }}
                    className={`flex gap-6 p-6 rounded-[2.5rem] border items-start hover:shadow-xl transition-all group cursor-pointer ${activeBranch === idx ? 'bg-white shadow-xl border-brand-secondary' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-colors ${activeBranch === idx ? 'bg-brand-secondary border-brand-secondary text-brand-primary' : 'bg-white text-brand-primary border-slate-100 group-hover:bg-brand-secondary group-hover:border-brand-secondary group-hover:text-brand-primary'}`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-primary text-base uppercase tracking-tight mb-1">{branch.name}</h4>
                      <p className="text-brand-accent text-xs font-black uppercase tracking-wider mb-3 underline decoration-brand-accent/30 underline-offset-4">{branch.landmark}</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed mb-3">{branch.address}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-8 pt-8 border-t border-slate-100">
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-1">Call Now</h4>
                  <p className="text-3xl font-black text-brand-primary tracking-tighter">{CONTACTS.phone1}</p>
                  <p className="text-3xl font-black text-brand-primary tracking-tighter">{CONTACTS.phone2}</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                  <Mail size={28} />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-1">Email Us</h4>
                  <p className="text-xl font-bold text-slate-800">{CONTACTS.email}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-3 space-y-12"
          >
            {/* Map Section */}
            <div 
              className="bg-slate-100 rounded-[3rem] overflow-hidden h-[500px] shadow-inner border-8 border-white relative z-0 group"
              onMouseLeave={() => setIsMapActive(false)}
            >
              <iframe
                title="Google Maps"
                src={googleMapUrl}
                className={`w-full h-full border-0 transition-opacity duration-300 ${isMapActive ? 'opacity-100' : 'opacity-60 pointer-events-none md:pointer-events-auto'}`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              
              {/* Interaction Overlay for Mobile */}
              {!isMapActive && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-[2px] md:hidden cursor-pointer"
                  onClick={() => setIsMapActive(true)}
                >
                  <div className="bg-white/90 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <MapPin className="text-brand-primary" size={20} />
                    <span className="text-brand-primary font-black text-sm uppercase tracking-widest">Tap to interact with map</span>
                  </div>
                </div>
              )}

              {/* Direction Button Overlay */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-3 items-end">
                <a 
                  href={CONTACTS.branches[activeBranch].mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${CONTACTS.branches[activeBranch].coords.lat},${CONTACTS.branches[activeBranch].coords.lng}`}
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <MapPin size={16} />
                  Get Directions
                </a>
                
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-brand-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg border border-white">
                  <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></span>
                  Precise Location Active
                </div>
              </div>
            </div>

            {/* Enquiry Form */}
            <div className="bg-slate-50 rounded-[3rem] p-8 md:p-12 shadow-inner border border-slate-100">
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-3xl font-black text-brand-primary mb-2">Send an Enquiry</h3>
                  <p className="text-slate-500 font-medium">Fill out the form below and we'll get back to you shortly.</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Full Name</label>
                       <input 
                        required
                        type="text" 
                        placeholder="e.g. John Doe" 
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Phone Number</label>
                       <input 
                        required
                        type="text" 
                        placeholder="e.g. 9876543210" 
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Interested Class</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                      value={formData.class}
                      onChange={(e) => setFormData({...formData, class: e.target.value})}
                    >
                      <option>Select Class</option>
                      <option>Class 9th</option>
                      <option>Class 10th</option>
                      <option>Class 11th</option>
                      <option>Class 12th</option>
                      <option>IIT/NEET Foundation</option>
                      <option>Entrance Exam Batch</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Message</label>
                    <textarea 
                      placeholder="Tell us more about your academic goals..." 
                      rows={4} 
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all shadow-xl shadow-brand-primary/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
