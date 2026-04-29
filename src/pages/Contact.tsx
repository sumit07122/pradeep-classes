import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { CONTACTS } from '../constants';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function Contact() {
  return (
    <div className="py-24 bg-white min-h-screen overflow-hidden">
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
                    className="flex gap-6 p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 items-start hover:bg-white hover:shadow-xl transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-primary shrink-0 shadow-sm border border-slate-100 group-hover:bg-brand-secondary group-hover:border-brand-secondary group-hover:text-brand-primary transition-colors">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-primary text-base uppercase tracking-tight mb-1">{branch.name}</h4>
                      <p className="text-brand-accent text-xs font-black uppercase tracking-wider mb-3 underline decoration-brand-accent/30 underline-offset-4">{branch.landmark}</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{branch.address}</p>
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
            <div className="bg-slate-100 rounded-[3rem] overflow-hidden h-[450px] shadow-inner border-8 border-white relative z-0">
              <MapContainer 
                center={[27.4890, 77.6555]} 
                zoom={13} 
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {CONTACTS.branches.map((branch, idx) => (
                  <Marker key={idx} position={[branch.coords.lat, branch.coords.lng]}>
                    <Popup>
                      <div className="p-1">
                        <h4 className="font-bold text-brand-primary m-0">{branch.name}</h4>
                        <p className="text-[10px] text-brand-accent font-bold uppercase mt-1 mb-2">{branch.landmark}</p>
                        <p className="text-xs text-slate-600 leading-tight m-0">{branch.address}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Enquiry Form */}
            <div className="bg-slate-50 rounded-[3rem] p-8 md:p-12 shadow-inner border border-slate-100">
              <div className="max-w-xl mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-3xl font-black text-brand-primary mb-2">Send an Enquiry</h3>
                  <p className="text-slate-500 font-medium">Fill out the form below and we'll get back to you shortly.</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Full Name</label>
                       <input type="text" placeholder="e.g. John Doe" className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Phone Number</label>
                       <input type="text" placeholder="e.g. +91 98765 43210" className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-primary uppercase ml-2 tracking-wide">Interested Class</label>
                    <select className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium">
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
                    <textarea placeholder="Tell us more about your academic goals..." rows={4} className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"></textarea>
                  </div>
                  <button className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all shadow-xl shadow-brand-primary/20 mt-4">
                    Submit Details
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
