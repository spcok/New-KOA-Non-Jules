import React from 'react';
import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { Building, List, FileText, Users, Activity, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsLayout() {
  const location = useLocation();

  // RBAC BYPASS: Permissions stripped out for rapid foundation building
  const tabs = [
    { id: 'organization', path: '/admin/settings/organization', label: 'Organisation Profile', icon: Building },
    { id: 'lists', path: '/admin/settings/lists', label: 'Operational Lists', icon: List },
    { id: 'zla', path: '/admin/settings/zla', label: 'ZLA Vault', icon: FileText },
    { id: 'directory', path: '/admin/settings/directory', label: 'Staff Directory', icon: Users },
    { id: 'health', path: '/admin/settings/health', label: 'System Health', icon: Activity },
  ];

  return (
    <div className="max-w-[1600px] mx-auto font-sans pb-12 space-y-8">
      
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <SettingsIcon size={28} className="text-slate-500 animate-[spin_6s_linear_infinite]" /> 
            System Configuration
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Facility Parameters & Application Infrastructure
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Settings Navigation Sidebar */}
        <nav className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">Configuration Modules</h3>
          
          {tabs.map((tab) => {
            const isActive = location.pathname.includes(tab.path);
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner' 
                    : 'text-slate-500 hover:bg-[#0A0B0E] hover:text-slate-300 border border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-600'} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
        
      </div>
    </div>
  );
}