import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { CONTACTS } from '../constants';

export default function WhatsAppFloatingButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const phoneNumber = CONTACTS.phone1; // Using Pradeep Sir's main number

  const handleWhatsAppRedirect = (message = "Hello Pradeep Sir, I have an enquiry regarding Pradeep Classes.") => {
    const url = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 w-72 mb-2"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-brand-primary text-lg">WhatsApp Assistant</h4>
                <p className="text-xs text-slate-500 font-medium italic">Direct line to Pradeep Sir</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                id="close-wa-btn"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleWhatsAppRedirect("Hello, I want to know about Class 10th batches.")}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-secondary/20 transition-colors text-sm font-bold text-slate-700 border border-slate-100"
                id="wa-opt-1"
              >
                Class 10th Enquiries
              </button>
              <button
                onClick={() => handleWhatsAppRedirect("Hello, I'm interested in IIT/NEET Foundation courses.")}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-secondary/20 transition-colors text-sm font-bold text-slate-700 border border-slate-100"
                id="wa-opt-2"
              >
                IIT / NEET Foundation
              </button>
              <button
                onClick={() => handleWhatsAppRedirect("Hello, can I get details for Navodaya/Sainik School entrance?")}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-secondary/20 transition-colors text-sm font-bold text-slate-700 border border-slate-100"
                id="wa-opt-3"
              >
                Entrance Special Batches
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 italic text-[10px] text-slate-400 text-center font-medium">
              Typically replies within an hour
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-[#25D366]/40 transition-shadow relative"
        id="wa-main-btn"
      >
        <MessageCircle size={32} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </motion.button>
    </div>
  );
}
