"use client";


import { User, Mail, Bell, Shield, MapPin, Camera, Save, ArrowLeft } from "lucide-react";

import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.back()} className="text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-2 text-sm font-bold mb-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight outfit">
            Profile Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 font-medium text-sm">
            Manage your account settings and preferences.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:shadow-md hover:bg-primaryHover transition-all flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Sidebar Navigation & Quick Info */}
        <div className="space-y-6">
          <div className="saas-card p-6 flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden relative">
                <div 
                  className="w-full h-full bg-cover bg-center group-hover:opacity-80 transition-opacity"
                  style={{ backgroundImage: `url('https://i.pravatar.cc/150?img=11')` }}
                  aria-label="John Smith"
                />
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white w-6 h-6" />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                 <div className="w-2 h-2 bg-white dark:bg-black rounded-full"></div>
              </div>
            </div>
            
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 outfit">John Smith</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mb-4">Logistics Manager</p>
            
            <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-700 mb-4"></div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider w-full text-left mb-2">Account Status</p>
            <div className="w-full flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Plan</span>
              <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Enterprise</span>
            </div>
          </div>

          <div className="saas-card p-3">
            <div className="space-y-1">
              {[
                { icon: User, label: "Personal Info", active: true },
                { icon: Bell, label: "Notifications", active: false },
                { icon: Shield, label: "Security", active: false },
              ].map((item) => (
                <button 
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${item.active ? 'bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-zinc-900 hover:text-slate-700 dark:text-slate-200 border border-transparent'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="saas-card p-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="firstName">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input type="text" id="firstName" defaultValue="John" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="lastName">Last Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input type="text" id="lastName" defaultValue="Smith" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-slate-100" />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input type="email" id="email" defaultValue="john@logistics.inc" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-slate-100" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Changing your email address will require re-verification.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="location">Facility Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <select id="location" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-slate-100 appearance-none">
                  <option>North America - Hub A</option>
                  <option>North America - Hub B</option>
                  <option>Europe - Hub A</option>
                  <option>Asia Pacific - Hub A</option>
                </select>
              </div>
            </div>
          </div>

          <div className="saas-card p-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-zinc-900">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Critical Inventory Alerts</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Receive instant notifications when stock runs below 10%.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-black after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success shadow-inner"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-zinc-900">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Fleet Arrival Summaries</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Daily email digest of all shipments that arrived.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-black after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
