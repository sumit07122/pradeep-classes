import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export default function AdminDashboard() {
  const { user, isSuperAdmin, logout } = useAuth();
  const [notices, setNotices] = React.useState<any[]>([]);
  const [inquiries, setInquiries] = React.useState<any[]>([]);
  const [reviews, setReviews] = React.useState<any[]>([]);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = React.useState('');
  const [noticeContent, setNoticeContent] = React.useState('');
  const [noticeDate, setNoticeDate] = React.useState('');
  const [editingNoticeId, setEditingNoticeId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const qNotices = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeNotices = onSnapshot(qNotices, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notices'));

    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeInquiries = onSnapshot(qInquiries, (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'inquiries'));

    const qReviews = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviews'));

    return () => {
      unsubscribeNotices();
      unsubscribeInquiries();
      unsubscribeReviews();
    };
  }, []);

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

  const [activeTab, setActiveTab] = React.useState('notices');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-primary">Admin Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Welcome, <span className="text-brand-accent">{user?.email}</span> {isSuperAdmin && '(Super Admin)'}</p>
        </div>
        <button onClick={logout} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 cursor-pointer transition-colors">
          Logout
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 -space-y-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sticky top-24">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-4 pt-2">Menu</h3>
            <button 
              onClick={() => setActiveTab('notices')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'notices' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Notices
            </button>
            <button 
              onClick={() => setActiveTab('inquiries')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'inquiries' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Inquiries
            </button>
            <button 
              onClick={() => setActiveTab('reviews')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'reviews' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Reviews
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Site Settings
            </button>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 mt-4 px-4 pt-2">Content</h3>
            <button 
              onClick={() => setActiveTab('faculties')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'faculties' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Faculties
            </button>
            <button 
              onClick={() => setActiveTab('toppers')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'toppers' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Toppers
            </button>
            <button 
              onClick={() => setActiveTab('gallery')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'gallery' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
            >
              Photos
            </button>
            {isSuperAdmin && (
              <>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 mt-4 px-4 pt-2">Admin</h3>
                <button 
                  onClick={() => setActiveTab('admins')} 
                  className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'admins' ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-gray-600 hover:bg-brand-secondary/30 hover:text-brand-primary'}`}
                >
                  Manage Admins
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-full min-w-0">
          <div className="grid grid-cols-1 gap-8">
            {activeTab === 'notices' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Manage Notices</h2>
                
                <form onSubmit={handleAddNotice} className="mb-8 space-y-4 max-w-xl bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">{editingNoticeId ? 'Edit Notice' : 'Create New Notice'}</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                    <input type="text" required value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Content</label>
                    <textarea required value={noticeContent} onChange={e => setNoticeContent(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date String (e.g., May 15, 2026)</label>
                    <input type="text" required value={noticeDate} onChange={e => setNoticeDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none hover:border-gray-300 transition-colors" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 font-bold cursor-pointer transition-colors shadow-lg shadow-brand-primary/20">
                      {editingNoticeId ? 'Update Notice' : 'Add Notice'}
                    </button>
                    {editingNoticeId && (
                      <button type="button" onClick={cancelEditNotice} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold cursor-pointer transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Recent Notices & Announcements</h3>
                  {notices.length === 0 ? <p className="text-gray-500 italic py-4">No notices exist.</p> : null}
                  <div className="grid grid-cols-1 gap-4">
                    {notices.map(notice => (
                      <div key={notice.id} className="p-5 border rounded-xl bg-white shadow-sm flex justify-between items-start group hover:border-brand-secondary transition-all">
                        <div>
                          <h4 className="font-black text-brand-primary text-lg">{notice.title}</h4>
                          <p className="text-sm text-gray-600 mt-2 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{notice.content}</p>
                          <p className="text-xs text-brand-accent mt-3 font-bold uppercase tracking-wider">{notice.date}</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditNotice(notice)} className="text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 text-sm cursor-pointer text-center bg-blue-50 rounded-lg font-bold transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteNotice(notice.id)} className="text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 text-sm cursor-pointer text-center bg-red-50 rounded-lg font-bold transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inquiries Section */}
            {activeTab === 'inquiries' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Recent Inquiries</h2>
              
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {inquiries.length === 0 ? (
                  <p className="text-gray-500 italic py-4">No inquiries found.</p>
                ) : null}
                {inquiries.map(inq => (
                  <div key={inq.id} className="p-5 border rounded-xl flex flex-col gap-3 bg-white hover:border-brand-secondary transition-colors shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-black text-gray-900 text-lg">{inq.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-sm font-bold text-brand-primary bg-brand-secondary/30 px-3 py-1 rounded-full">{inq.phone}</p>
                          {inq.email && <p className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{inq.email}</p>}
                        </div>
                        <p className="text-sm text-gray-700 mt-4 bg-gray-50 p-4 rounded-lg font-medium border border-gray-100">{inq.message}</p>
                      </div>
                      <span className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg shrink-0
                        ${inq.status === 'new' ? 'bg-green-100 text-green-700' : ''}
                        ${inq.status === 'contacted' ? 'bg-blue-100 text-blue-700' : ''}
                        ${inq.status === 'resolved' ? 'bg-gray-100 text-gray-600' : ''}
                      `}>
                        {inq.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 items-center mt-2 pt-4 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-500">Update Status:</span>
                      <select 
                        value={inq.status} 
                        onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                        className="text-sm font-bold border-2 border-gray-200 rounded-lg px-3 py-1.5 bg-white cursor-pointer focus:border-brand-primary outline-none"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}

            {/* Reviews Section */}
            {activeTab === 'reviews' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Manage Reviews</h2>
              
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 italic py-4">No reviews found.</p>
                ) : null}
                {reviews.map(review => (
                  <div key={review.id} className="p-5 border rounded-xl flex flex-col gap-3 bg-white hover:border-brand-secondary transition-colors shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-black text-gray-900 text-lg">{review.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-bold text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md">{review.rating} ★</span>
                          {review.email && <span className="text-sm text-gray-500">{review.email}</span>}
                        </div>
                        <p className="text-sm text-gray-700 mt-4 bg-gray-50 p-4 rounded-lg font-medium border border-gray-100">"{review.text}"</p>
                      </div>
                      <span className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg shrink-0
                        ${review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                      `}>
                        {review.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-gray-500">Status:</span>
                        <select 
                          value={review.status} 
                          onChange={(e) => updateReviewStatus(review.id, e.target.value)}
                          className="text-sm font-bold border-2 border-gray-200 rounded-lg px-3 py-1.5 bg-white cursor-pointer focus:border-brand-primary outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold"
                      >
                        Delete
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

            {/* Manage Admins Section */}
            {isSuperAdmin && activeTab === 'admins' && (
              <AdminsPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericPanel({ title, collectionName, fields }: { title: string, collectionName: string, fields: any[] }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState<any>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);

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
        alert(`${title} updated successfully.`);
      } else {
        await addDoc(collection(db, collectionName), { ...dataToSave, createdAt: serverTimestamp() });
        setFormData({});
        alert(`${title} added successfully.`);
      }
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, collectionName);
    }
  };

  const handleEditItem = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormData({});
    setEditingId(null);
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      
      <form onSubmit={handleAddItem} className="mb-8 space-y-4 max-w-xl">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input 
              type="text" 
              required={!field.label.includes('Optional') && field.name !== 'imageUrl' && field.name !== 'details' && field.name !== 'school' && field.name !== 'score' && field.name !== 'qualification' && field.name !== 'specialization' && field.name !== 'experience' && field.name !== 'philosophy' && field.name !== 'achievements'}
              value={formData[field.name] || ''} 
              onChange={e => setFormData({...formData, [field.name]: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none" 
            />
            {field.name === 'imageUrl' && formData[field.name] && (
              <div className="mt-2 text-center bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                <p className="text-xs text-gray-500 mb-2 font-medium">Image Preview</p>
                <img src={formData[field.name]} alt="Preview" className="h-32 object-contain mx-auto rounded shadow-sm border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 font-medium cursor-pointer">
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium cursor-pointer">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Existing Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="p-4 border rounded-lg bg-gray-50 relative group">
              <div className="absolute top-2 right-2 flex gap-1 bg-white/90 backdrop-blur shadow-sm rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-gray-100">
                <button 
                  onClick={() => handleEditItem(item)}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors text-xs font-semibold"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
              {item.imageUrl && (
                <div className="group/img relative mb-3">
                  <img src={item.imageUrl} alt="preview" className="w-full h-40 object-cover rounded shadow-sm border border-gray-200" />
                  <a href={item.imageUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded opacity-0 group-hover/img:opacity-100 transition-opacity text-xs font-medium backdrop-blur">
                    View Full
                  </a>
                </div>
              )}
              <h4 className="font-medium text-brand-primary line-clamp-2 md:line-clamp-1 mb-2">{item.name || item.title}</h4>
              {fields.map(f => f.name !== 'name' && f.name !== 'title' && f.name !== 'imageUrl' && item[f.name] && (
                <p key={f.name} className="text-sm text-gray-600 line-clamp-1 truncate mb-1">
                  <span className="font-medium text-gray-700">{f.label}:</span> {item[f.name]}
                </p>
              ))}
            </div>
          ))}
        </div>
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

  // Load settings on mount
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
      alert('Settings saved successfully. Refresh the homepage to see changes.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/general');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6">Site Settings</h2>
      <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">Hero Section (Home Page)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
            <input type="text" required value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
            <textarea required value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none" />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">Top Announcement Bar</h3>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="announcementActive" checked={announcementActive} onChange={e => setAnnouncementActive(e.target.checked)} className="w-4 h-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary" />
            <label htmlFor="announcementActive" className="text-sm font-medium text-gray-700 cursor-pointer">Show announcement bar at top of website</label>
          </div>
          {announcementActive && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Text</label>
                <input type="text" placeholder="e.g. Navodaya Entrance Registration Open!" value={announcementText} onChange={e => setAnnouncementText(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                <input type="text" placeholder="https://..." value={announcementLink} onChange={e => setAnnouncementLink(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none" />
              </div>
            </>
          )}
        </div>
        <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 font-medium cursor-pointer">
          Save Settings
        </button>
      </form>
    </div>
  );
}

function AdminsPanel() {
  const [admins, setAdmins] = React.useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = React.useState('');

  React.useEffect(() => {
    const qAdmins = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qAdmins, (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'admins'));

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
      alert('Admin added successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${adminEmail}`);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (window.confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'admins', email));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${email}`);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6">Manage Admins</h2>
      
      <form onSubmit={handleAddAdmin} className="mb-8 space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Admin Email</label>
          <div className="flex gap-2">
            <input type="email" required placeholder="admin@example.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none" />
            <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 font-medium cursor-pointer">
              Add
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4 max-w-2xl">
        <h3 className="font-semibold text-gray-800">Current Admins</h3>
        {admins.map(admin => (
          <div key={admin.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
            <span className="font-medium text-gray-900">{admin.email}</span>
            <button onClick={() => handleRemoveAdmin(admin.id)} className="text-red-500 hover:text-red-700 text-sm cursor-pointer p-2">
              Revoke Access
            </button>
          </div>
        ))}
        {admins.length === 0 && <p className="text-sm text-gray-500 italic">No additional admins found.</p>}
      </div>
    </div>
  );
}
