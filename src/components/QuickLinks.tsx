import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Trophy, Users } from 'lucide-react';

export default function QuickLinks() {
  const links = [
    { name: 'Navodaya Prep', path: '/courses?type=navodaya', icon: BookOpen },
    { name: 'Sainik School', path: '/courses?type=sainik', icon: GraduationCap },
    { name: 'IIT/NEET Foundation', path: '/courses?type=foundation', icon: Trophy },
    { name: 'Faculty Team', path: '/faculty', icon: Users },
  ];

  return (
    <div className="bg-white py-8 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-secondary transition-all hover:shadow-lg group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-primary group-hover:text-brand-secondary">
                  <Icon size={20} />
                </div>
                <span className="font-bold text-slate-800 text-sm group-hover:text-brand-primary">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
