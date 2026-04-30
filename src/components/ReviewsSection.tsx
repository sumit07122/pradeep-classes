import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { CONTACTS } from '../constants';
import { Star, MessageSquare, X } from 'lucide-react';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const qReviews = query(
      collection(db, 'reviews'), 
      where('status', '==', 'approved')
    ); // To properly order by createdAt with a where clause on another field, a composite index is needed. Since we can't create one programmatically easily, we will sort in javascript if needed, but we can just use snapshot.docs and sort locally to be safe.
    
    // Instead of where('status', '==', 'approved') and orderBy('createdAt', 'desc') which requires an index, 
    // let's just fetch approved ones using a query, and sort on the client.
    const allReviewsQ = query(collection(db, 'reviews'), where('status', '==', 'approved'));
    
    const unsubscribe = onSnapshot(allReviewsQ, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort on client side
      allDocs.sort((a: any, b: any) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setReviews(allDocs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviews'));

    return () => unsubscribe();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        name: formData.name,
        email: formData.email,
        text: formData.message,
        rating: formData.rating,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitted(false);
        setFormData({ name: '', email: '', message: '', rating: 5 });
      }, 3000);
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 bg-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-brand-primary heading-serif italic mb-4">
            Hear from Our Students
          </h2>
          <p className="text-slate-600 font-medium text-lg max-w-2xl mx-auto mb-8">
            Read what our students and parents have to say about their experience at Pradeep Classes.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
            >
              <MessageSquare size={18} /> Write a Review
            </button>
            <a 
              href={CONTACTS.googleReviews} 
              target="_blank" 
              rel="noreferrer"
              className="bg-white text-brand-primary border-2 border-brand-primary/10 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:border-brand-primary/30 transition-colors"
            >
              <Star size={18} className="text-yellow-400 fill-yellow-400" /> Review on Google
            </a>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, idx) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} 
                    />
                  ))}
                </div>
                <p className="text-slate-700 italic font-medium leading-relaxed mb-6">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary flex items-center justify-center rounded-full font-black text-lg">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-primary">{review.name}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Student/Parent</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
             <p className="text-slate-500 font-medium">No website reviews yet. Be the first to write one!</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-8 relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-brand-primary mb-2">Write a Review</h3>
                  <p className="text-sm text-gray-600 font-medium">Share your experience with Pradeep Classes.</p>
                </div>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="text-2xl font-black text-gray-900 mb-2">Review Submitted!</h4>
                    <p className="text-gray-600 font-medium">Thank you for your feedback. It will appear on the website once approved.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setFormData({...formData, rating: star})}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star size={32} className={star <= formData.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Your Name *</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={100}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-shadow font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email (Optional)</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-shadow font-medium"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Review *</label>
                      <textarea 
                        required 
                        rows={4}
                        maxLength={1000}
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-shadow font-medium resize-none"
                        placeholder="Tell us what you loved..."
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-70 shadow-lg shadow-brand-primary/20"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
