import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bell } from 'lucide-react';
import { motion } from 'motion/react';

export default function NoticeBoard() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      try {
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Failed to load notices', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

  if (loading) return null;
  if (!notices || notices.length === 0) return null;

  return (
    <div className="w-full bg-red-50 border-t border-b border-red-100 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center">
        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 z-10 relative">
          <Bell size={14} className="animate-pulse" />
          Notice Board
        </div>
        <div className="flex-1 overflow-hidden ml-4 relative">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...notices, ...notices, ...notices].map((notice, idx) => (
              <div key={`${notice.id}-${idx}`} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                <span className="font-semibold text-red-900">{notice.title}</span>
                <span className="text-sm text-red-600">- {notice.date}</span>
                {notice.createdAt > Date.now() - 3 * 24 * 60 * 60 * 1000 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded uppercase font-bold">New</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
