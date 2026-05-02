import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { 
  Bell, 
  MessageSquare, 
  Star, 
  Settings, 
  Users, 
  Trophy, 
  Image as ImageIcon, 
  FileImage, 
  ShieldCheck, 
  CheckCircle2,
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  ChevronRight,
  PlusCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { user, isSuperAdmin, logout } = useAuth();
  const [notices, setNotices] = React.useState<any[]>([]);
  const [inquiries, setInquiries] = React.useState<any[]>([]);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('notices');

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = React.useState('');
  const [noticeContent, setNoticeContent] = React.useState('');
  const [noticeDate, setNoticeDate] = React.useState('');
  const [editingNoticeId, setEditingNoticeId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (activeTab !== 'notices') return;
    const qNotices = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeNotices = onSnapshot(qNotices, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notices'));

    return () => unsubscribeNotices();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== 'inquiries') return;
    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeInquiries = onSnapshot(qInquiries, (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'inquiries'));

    return () => unsubscribeInquiries();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== 'reviews') return;
    const qReviews = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviews'));

    return () => unsubscribeReviews();
  }, [activeTab]);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingNoticeId) {
        await updateDoc(doc(db, 'notices', editingNoticeId), {
          title: noticeTitle,
          content: noticeContent,
          date: noticeDate,
        });
        setEditingNoticeId(null);
        alert('Notice updated successfully');
      } else {
        await addDoc(collection(db, 'notices'), {
          title: noticeTitle,
          content: noticeContent,
          date: noticeDate,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });
        alert('Notice added successfully');
      }
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeDate('');
    } catch (error) {
      handleFirestoreError(error, editingNoticeId ? OperationType.UPDATE : OperationType.CREATE, 'notices');
    }
  };

  const handleEditNotice = (notice: any) => {
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeDate(notice.date);
    setEditingNoticeId(notice.id);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEditNotice = () => {
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeDate('');
    setEditingNoticeId(null);
  };

  const handleDeleteNotice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `notices/${id}`);
      }
    }
  };

  const updateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inquiries/${id}`);
    }
  };

  const updateReviewStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reviews', id), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${id}`);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
      }
    }
  };

  const MENU_ITEMS = [
    { id: 'notices', label: 'Notices', icon: Bell, color: 'text-blue-500' },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, color: 'text-green-500' },
    { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-yellow-500' },
    { id: 'resources', label: 'Resources', icon: BookOpen, color: 'text-orange-500' },
    { id: 'settings', label: 'Site Settings', icon: Settings, color: 'text-purple-500' },
  ];

  const CONTENT_ITEMS = [
    { id: 'faculties', label: 'Faculties', icon: Users, color: 'text-indigo-500' },
    { id: 'toppers', label: 'Toppers', icon: Trophy, color: 'text-orange-500' },
    { id: 'gallery', label: 'Photos', icon: ImageIcon, color: 'text-pink-500' },
    { id: 'images', label: 'Site Images', icon: FileImage, color: 'text-cyan-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-primary">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tight">Admin CMS</h2>
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Pradeep Classes</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-8">
            <div>
              <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</h3>
              <div className="space-y-1">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group ${
                      activeTab === item.id 
                        ? 'bg-brand-primary/10 text-brand-primary shadow-sm' 
                        : 'text-gray-600 hover:bg-brand-primary/5 hover:text-brand-primary'
                    }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? 'text-brand-primary' : item.color} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Content Management</h3>
              <div className="space-y-1">
                {CONTENT_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group ${
                      activeTab === item.id 
                        ? 'bg-brand-primary/10 text-brand-primary shadow-sm' 
                        : 'text-gray-600 hover:bg-brand-primary/5 hover:text-brand-primary'
                    }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? 'text-brand-primary' : item.color} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </div>
            </div>

            {isSuperAdmin && (
              <div>
                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">System</h3>
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group ${
                    activeTab === 'admins' 
                      ? 'bg-brand-primary/10 text-brand-primary shadow-sm' 
                      : 'text-gray-600 hover:bg-brand-primary/5 hover:text-brand-primary'
                  }`}
                >
                  <ShieldCheck size={20} className="text-red-400" />
                  <span className="flex-1 text-left">Managers</span>
                </button>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="bg-gray-50 p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-black uppercase">
                  {user?.email?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-slate-900">{user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate italic">{isSuperAdmin ? 'Super Admin' : 'Editor'}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black transition-all"
              >
                <LogOut size={14} />
                Logout Session
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-black text-slate-900 border-l-4 border-brand-primary pl-4 capitalize">
              {activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <p className="text-xs font-black text-slate-900">Admin Live</p>
              <p className="text-[10px] font-bold text-slate-400">Mathura Campus</p>
            </div>
            {/* Quick Actions or Status Indicators can go here */}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl"
            >
              <div className="grid grid-cols-1 gap-8 pb-12">
            {activeTab === 'notices' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Notices</h2>
                    <p className="text-slate-500 font-medium mt-1">Broadcast news and important updates to the main website.</p>
                  </div>
                  {editingNoticeId === null && (
                    <button 
                      onClick={() => setEditingNoticeId('new')}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <PlusCircle size={20} />
                      <span>Post New Notice</span>
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {editingNoticeId !== null && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900">{editingNoticeId === 'new' ? 'Broadcast Notice' : 'Update Notice'}</h3>
                        <button onClick={cancelEditNotice} className="text-slate-400 hover:text-red-500 p-2 rounded-xl transition-colors">
                          <X size={24} />
                        </button>
                      </div>
                      <form onSubmit={handleAddNotice} className="space-y-6 max-w-2xl">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notice Headline</label>
                          <input type="text" required value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-primary transition-all" placeholder="e.g. Navodaya Entrance 2026 Registry Open" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Announcement Body</label>
                          <textarea required value={noticeContent} onChange={e => setNoticeContent(e.target.value)} rows={3} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-700 outline-none focus:border-brand-primary transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Display Date (e.g. May 15, 2026)</label>
                          <input type="text" required value={noticeDate} onChange={e => setNoticeDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-primary transition-all" />
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" className="flex-1 px-8 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            {editingNoticeId === 'new' ? 'Publish Notice' : 'Sync Changes'}
                          </button>
                          <button type="button" onClick={cancelEditNotice} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">
                            Discard
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notices.length === 0 && <p className="col-span-full py-12 text-center text-slate-400 font-bold italic">No active notices.</p>}
                  {notices.map(notice => (
                    <div key={notice.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditNotice(notice)} className="p-2 bg-slate-50 hover:bg-brand-primary hover:text-white rounded-xl text-blue-500 transition-all shadow-sm border border-slate-100">
                          <Settings size={16} />
                        </button>
                        <button onClick={() => handleDeleteNotice(notice.id)} className="p-2 bg-slate-50 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all shadow-sm border border-slate-100">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="mb-4">
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/10 px-2 py-1 rounded-full mb-2 inline-block">Flash Update</span>
                        <h4 className="font-black text-slate-900 text-lg group-hover:text-brand-primary transition-colors leading-tight">{notice.title}</h4>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex-1 border border-slate-100/50">
                        <p className="text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed">{notice.content}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{notice.date}</span>
                        <Bell size={14} className="text-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inquiries Section */}
            {activeTab === 'inquiries' && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recent Inquiries</h2>
                    <p className="text-slate-500 font-medium mt-1">Direct inquiries from the website contact forms.</p>
                  </div>
                  <div className="bg-brand-secondary/30 px-4 py-2 rounded-xl border border-brand-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-xs font-black text-brand-primary uppercase tracking-wider">{inquiries.length} Total</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {inquiries.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                      <p className="text-slate-400 font-medium italic">No inquiries found in the records.</p>
                    </div>
                  ) : null}
                  {inquiries.map(inq => (
                    <div key={inq.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all group overflow-hidden relative">
                      <div className={`absolute top-0 left-0 w-1 h-full ${
                        inq.status === 'new' ? 'bg-green-500' : 
                        inq.status === 'contacted' ? 'bg-blue-500' : 'bg-slate-300'
                      }`} />
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-slate-900 text-xl">{inq.name}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-secondary/50 text-brand-primary rounded-full text-xs font-black ring-1 ring-brand-primary/20">
                                {inq.phone}
                              </span>
                              {inq.email && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black ring-1 ring-slate-200">
                                  {inq.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border
                            ${inq.status === 'new' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                            ${inq.status === 'contacted' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                            ${inq.status === 'resolved' ? 'bg-slate-50 text-slate-500 border-slate-100' : ''}
                          `}>
                            {inq.status}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50">
                          <p className="text-slate-700 font-medium leading-relaxed italic">"{inq.message}"</p>
                        </div>
                      </div>
                      
                      <div className="md:w-56 shrink-0 flex flex-col justify-end bg-slate-50 md:bg-white rounded-2xl md:rounded-none p-4 md:p-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Update Status</p>
                        <select 
                          value={inq.status} 
                          onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                          className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer"
                        >
                          <option value="new">Action Required (New)</option>
                          <option value="contacted">Currently Contacted</option>
                          <option value="resolved">Resolved / Finished</option>
                        </select>
                        <p className="text-[9px] text-slate-400 mt-3 text-right font-bold italic">
                          Received {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Parent Reviews</h2>
                    <p className="text-slate-500 font-medium mt-1">Approve or moderate parent testimonials.</p>
                  </div>
                  <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 flex items-center gap-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-black text-yellow-700 uppercase tracking-wider">{reviews.length} Total</span>
                  </div>
                </div>

                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl overflow-hidden mb-8">
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                           <Star size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900">Website Reviews vs. Google Reviews</h3>
                           <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                              Reviews here are submitted directly via your website. Once you click <strong>Approve Now</strong>, they appear instantly on your home page. 
                              To manage your official <strong>Google Business Reviews</strong>, please visit your Google Maps profile directly.
                           </p>
                        </div>
                     </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.length === 0 ? (
                    <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                      <p className="text-slate-400 font-medium italic">No reviews found.</p>
                    </div>
                  ) : null}
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative group h-full flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-slate-900 text-lg">{review.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-slate-200"} />
                              ))}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{review.email}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                          ${review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                        `}>
                          {review.status}
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm font-medium text-slate-600 mb-6 italic">
                        "{review.text}"
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          {review.status === 'pending' ? (
                            <button 
                              onClick={() => updateReviewStatus(review.id, 'approved')}
                              className="px-4 py-1.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-md shadow-green-500/20 flex items-center gap-1.5"
                            >
                              <ShieldCheck size={12} />
                              Approve Now
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                              <CheckCircle2 size={12} className="text-green-500" />
                              Live on Site
                            </div>
                          )}
                          <select 
                            value={review.status} 
                            onChange={(e) => updateReviewStatus(review.id, e.target.value)}
                            className="bg-transparent text-xs font-black text-slate-400 uppercase tracking-widest outline-none cursor-pointer focus:text-brand-primary transition-colors ml-2"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => handleDeleteReview(review.id)}
                          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Review"
                        >
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Site Settings Section */}
            {activeTab === 'settings' && (
              <SettingsPanel />
            )}

            {/* Resources Section */}
            {activeTab === 'resources' && (
              <GenericPanel title="Downloadable Resources" collectionName="resources" fields={[{name:'category', label:'Category (e.g. Navodaya)'}, {name:'year', label:'Year'}, {name:'title', label:'Paper Title'}, {name:'link', label:'Download URL'}]} />
            )}

            {/* Faculties Section */}
            {activeTab === 'faculties' && (
              <GenericPanel title="Manage Faculties" collectionName="faculties" fields={[{name:'name', label:'Name'}, {name:'designation', label:'Designation'}, {name:'qualification', label:'Qualification (Optional)'}, {name:'specialization', label:'Specialization'}, {name:'experience', label:'Experience'}, {name:'philosophy', label:'Teaching Philosophy (Optional)'}, {name:'achievements', label:'Notable Achievements (Optional)'}, {name: 'imageUrl', label: 'Photo URL'}]} />
            )}

            {/* Toppers Section */}
            {activeTab === 'toppers' && (
              <GenericPanel title="Manage Toppers" collectionName="toppers" fields={[{name:'name', label:'Name'}, {name:'year', label:'Year'}, {name:'score', label:'Score/Rank (e.g. 98.4%)'}, {name:'rank', label:'Subtitle/Position (Optional, e.g. District Topper)'}, {name:'school', label:'School (Optional)'}, {name:'details', label:'Details (Optional)'}, {name: 'imageUrl', label: 'Photo URL (Optional)'}]} />
            )}

            {/* Gallery Section */}
            {activeTab === 'gallery' && (
              <GenericPanel title="Manage Photos" collectionName="gallery" fields={[{name:'title', label:'Image Title'}, {name:'imageUrl', label:'Image URL'}]} />
            )}

            {/* Site Images Section */}
            {activeTab === 'images' && (
              <SiteImagesPanel />
            )}

            {/* Manage Admins Section */}
            {isSuperAdmin && activeTab === 'admins' && (
              <AdminsPanel />
            )}
          </div>
          {/* End Switch */}
        </motion.div>
      </AnimatePresence>
    </div>
  </main>
</div>
);
}

function GenericPanel({ title, collectionName, fields }: { title: string, collectionName: string, fields: any[] }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState<any>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    const qItems = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qItems, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, collectionName));

    return () => unsubscribe();
  }, [collectionName]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      
      // Clean up empty strings to avoid breaking validation
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === '') delete dataToSave[key];
      });

      if (editingId) {
        const { id, createdAt, ...updateData } = dataToSave;
        await updateDoc(doc(db, collectionName, editingId), updateData);
        setEditingId(null);
        setFormData({});
        setIsFormOpen(false);
        alert(`${title} updated successfully.`);
      } else {
        await addDoc(collection(db, collectionName), { ...dataToSave, createdAt: serverTimestamp() });
        setFormData({});
        setIsFormOpen(false);
        alert(`${title} added successfully.`);
      }
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, collectionName);
    }
  };

  const handleEditItem = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormData({});
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-slate-500 font-medium mt-1">Manage {collectionName} entries for the website.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <PlusCircle size={20} />
            <span>Add New Entry</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">{editingId ? 'Edit Entry' : 'Create New Entry'}</h3>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-red-500 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(field => (
                <div key={field.name} className={field.name === 'details' || field.name === 'philosophy' || field.name === 'achievements' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
                  {field.name === 'details' || field.name === 'philosophy' || field.name === 'achievements' ? (
                    <textarea 
                      rows={3}
                      value={formData[field.name] || ''} 
                      onChange={e => setFormData({...formData, [field.name]: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-700 outline-none focus:border-brand-primary transition-all" 
                    />
                  ) : (
                    <input 
                      type="text" 
                      required={!field.label.includes('Optional') && field.name !== 'imageUrl' && field.name !== 'details' && field.name !== 'school' && field.name !== 'score' && field.name !== 'qualification' && field.name !== 'specialization' && field.name !== 'experience' && field.name !== 'philosophy' && field.name !== 'achievements'}
                      value={formData[field.name] || ''} 
                      onChange={e => setFormData({...formData, [field.name]: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-700 outline-none focus:border-brand-primary transition-all" 
                    />
                  )}
                  {field.name === 'imageUrl' && formData[field.name] && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-block group relative">
                      <img src={formData[field.name]} alt="Preview" className="h-24 rounded-xl object-cover shadow-sm" />
                       <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-black">Image Preview</div>
                    </div>
                  )}
                </div>
              ))}
              <div className="md:col-span-2 flex gap-3 pt-4">
                <button type="submit" className="flex-1 md:flex-none px-12 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
                  Discard Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative h-full">
            <div className="absolute top-4 right-4 z-10 flex gap-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <button onClick={() => handleEditItem(item)} className="w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-blue-500 shadow-lg border border-slate-100 hover:bg-blue-500 hover:text-white transition-all">
                <Settings size={18} />
              </button>
              <button onClick={() => handleDeleteItem(item.id)} className="w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-red-500 shadow-lg border border-slate-100 hover:bg-red-500 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {item.imageUrl && (
              <div className="mb-6 rounded-2xl overflow-hidden shadow-sm aspect-square bg-slate-50 border border-slate-100 group-hover:border-brand-primary/20 transition-all">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="font-black text-slate-900 text-xl mb-3 tracking-tight group-hover:text-brand-primary transition-colors">
                {item.name || item.title}
              </h4>
              <div className="space-y-2">
                {fields.map(f => {
                   if (f.name === 'name' || f.name === 'title' || f.name === 'imageUrl') return null;
                   if (!item[f.name]) return null;
                   return (
                    <div key={f.name} className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{f.label}</span>
                      <p className="text-sm font-bold text-slate-600 line-clamp-2">{item[f.name]}</p>
                    </div>
                   );
                })}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
              <ImageIcon size={14} className="text-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteImagesPanel() {
  const [images, setImages] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState<any>({ key: '', url: '' });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    const qImages = query(collection(db, 'siteImages'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(qImages, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'siteImages'));

    return () => unsubscribe();
  }, []);

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'siteImages', editingId), {
          url: formData.url,
          updatedAt: serverTimestamp()
        });
        alert('Image updated');
      } else {
        await addDoc(collection(db, 'siteImages'), {
          key: formData.key,
          url: formData.url,
          updatedAt: serverTimestamp()
        });
        alert('Image added');
      }
      setFormData({ key: '', url: '' });
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'siteImages');
    }
  };

  const handleEdit = (img: any) => {
    setFormData({ key: img.key, url: img.url });
    setEditingId(img.id);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Site Assets</h2>
          <p className="text-slate-500 font-medium mt-1">Manage static brand images and photos used across the site.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <PlusCircle size={20} />
            <span>Map New Asset</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">{editingId ? 'Update Asset' : 'Register New Asset'}</h3>
              <button onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({key:'', url:''}); }} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveImage} className="space-y-6 max-w-2xl">
              {!editingId && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Asset Key (Code Reference)</label>
                  <input type="text" required value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-primary transition-all" placeholder="e.g., about_sir_photo" />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Public Image URL</label>
                <input type="text" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-700 outline-none focus:border-brand-primary transition-all" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-8 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingId ? 'Sync Updates' : 'Confirm Registration'}
                </button>
                <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({key:'', url:''}); }} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.length === 0 && <p className="col-span-full text-center py-12 text-slate-400 font-bold italic">No assets mapped yet.</p>}
        {images.map(img => (
          <div key={img.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
            <div className="flex justify-between items-center mb-4">
               <div>
                <h4 className="font-black text-slate-900 group-hover:text-brand-primary transition-colors">{img.key}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Asset</p>
               </div>
               <button onClick={() => handleEdit(img)} className="text-brand-primary hover:text-brand-accent font-black text-xs uppercase tracking-wider">
                  Edit Mapping
               </button>
            </div>
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
              <img src={img.url} alt={img.key} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Last updated {img.updatedAt?.toDate()?.toLocaleDateString()}</span>
              <FileImage size={14} className="text-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [heroTitle, setHeroTitle] = React.useState('Your Path to Academic Excellence Starts Here');
  const [heroSubtitle, setHeroSubtitle] = React.useState('Expert faculty, comprehensive study material, and a proven track record of success in CBSE and competitive exams.');
  const [announcementText, setAnnouncementText] = React.useState('');
  const [announcementLink, setAnnouncementLink] = React.useState('');
  const [announcementActive, setAnnouncementActive] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
          if (data.announcementText) setAnnouncementText(data.announcementText);
          if (data.announcementLink) setAnnouncementLink(data.announcementLink);
          if (data.announcementActive !== undefined) setAnnouncementActive(data.announcementActive);
        }
      } catch (error) {
        console.error("Could not load settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        heroTitle,
        heroSubtitle,
        announcementText,
        announcementLink,
        announcementActive,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Settings published live.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/general');
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400 font-black animate-pulse">Loading Global Configurations...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Core Configurations</h2>
          <p className="text-slate-500 font-medium mt-1">Control major website content and global alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
               <LayoutDashboard size={20} className="text-brand-primary" />
               Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Main Heading</label>
                <input type="text" required value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-primary transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Secondary Text / Intro</label>
                <textarea required value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={3} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-700 outline-none focus:border-brand-primary transition-all" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Bell size={20} className="text-orange-500" />
                Live Announcement Bar
              </h3>
              <div 
                onClick={() => setAnnouncementActive(!announcementActive)}
                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${announcementActive ? 'bg-orange-500' : 'bg-slate-200'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${announcementActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>

            {announcementActive && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Scrolling Text</label>
                  <input type="text" placeholder="e.g. New Batch Admissions Open!" value={announcementText} onChange={e => setAnnouncementText(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-primary transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Action Link (Click URL)</label>
                  <input type="text" placeholder="https://..." value={announcementLink} onChange={e => setAnnouncementLink(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-700 outline-none focus:border-brand-primary transition-all" />
                </div>
              </motion.div>
            )}
          </div>

          <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all text-lg tracking-tight">
            Publish Changes to Website
          </button>
        </form>

        <div className="lg:col-span-5 sticky top-8">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <h3 className="font-black text-white/40 uppercase tracking-widest text-xs mb-6">Live Preview Rendering</h3>
            <div className="relative space-y-6">
              {announcementActive && (
                <div className="bg-orange-500 text-white text-[10px] py-1.5 px-4 rounded-full inline-block font-black uppercase tracking-widest animate-pulse">
                  {announcementText || "Announcement Active"}
                </div>
              )}
              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{heroTitle}</h1>
                <p className="text-white/60 text-sm leading-relaxed font-medium">{heroSubtitle}</p>
              </div>
              <div className="h-12 w-40 bg-brand-primary rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminsPanel() {
  const [admins, setAdmins] = React.useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const qAdmins = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qAdmins, (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admins');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    const adminEmail = newAdminEmail.trim().toLowerCase();
    
    try {
      await setDoc(doc(db, 'admins', adminEmail), {
        email: adminEmail,
        createdAt: serverTimestamp()
      });
      setNewAdminEmail('');
      alert('Access granted.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${adminEmail}`);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (window.confirm(`Revoke all access for ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'admins', email));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${email}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h2>
          <p className="text-slate-500 font-medium mt-1">Manage users with administrative permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
               <PlusCircle size={20} className="text-brand-primary" />
               New Permission
            </h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input type="email" required placeholder="staff@pradeepclasses.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-primary transition-all" />
              </div>
              <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                Grant Access
              </button>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-4">
                * Note: New admins must be already registered with an account or will need to sign in with Google using this email.
              </p>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-red-500" />
                  Active Managers
                </h3>
             </div>
             <div className="divide-y divide-slate-50">
               {isLoading ? (
                 <div className="p-8 text-center text-slate-400 font-bold">Checking registry...</div>
               ) : admins.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 font-bold italic">No secondary admins registered.</div>
               ) : (
                 admins.map(admin => (
                   <div key={admin.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center text-brand-primary font-black uppercase shadow-sm">
                         {admin.email.charAt(0)}
                       </div>
                       <div>
                         <p className="font-black text-slate-900 tracking-tight">{admin.email}</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Full Editor Access</p>
                       </div>
                     </div>
                     <button onClick={() => handleRemoveAdmin(admin.id)} className="px-4 py-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all opacity-0 group-hover:opacity-100">
                       Revoke
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
