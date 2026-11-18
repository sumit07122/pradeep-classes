import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppFloatingButton from '../components/WhatsAppFloatingButton';
import InquiryPopup from '../components/InquiryPopup';

export default function PublicLayout() {
  return (
    <div className="min-h-screen font-sans flex flex-col selection:bg-brand-secondary selection:text-brand-primary bg-white transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
      <InquiryPopup />
    </div>
  );
}
