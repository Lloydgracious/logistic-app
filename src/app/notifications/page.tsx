"use client";

import { motion } from "framer-motion";
import { Bell, Package, AlertTriangle, Truck, CheckCircle2, Search, SlidersHorizontal, Settings } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'inventory' | 'fleet' | 'system' | 'alert';
  isRead: boolean;
};

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Critical Low Stock",
    description: "Item 'Brake Pads' has dropped below 10% capacity at Hub A. Immediate restock recommended.",
    time: "2 mins ago",
    type: 'alert',
    isRead: false
  },
  {
    id: "notif-2",
    title: "Fleet Arrival",
    description: "Vehicle #XJ-9020 has successfully arrived at the designated bridge checkpoint.",
    time: "45 mins ago",
    type: 'fleet',
    isRead: false
  },
  {
    id: "notif-3",
    title: "Order Fulfilled",
    description: "Order for 'Acme Corp' has been marked as DELIVERED by the operations team.",
    time: "2 hours ago",
    type: 'inventory',
    isRead: true
  },
  {
    id: "notif-4",
    title: "System Update",
    description: "GarageFlow OS will undergo scheduled maintenance at 00:00 UTC. Expect 15 mins of downtime.",
    time: "1 day ago",
    type: 'system',
    isRead: true
  },
  {
    id: "notif-5",
    title: "Incoming Shipment Delayed",
    description: "Vehicle #BT-140 is reporting a 2-hour delay due to severe weather conditions on Route 4.",
    time: "1 day ago",
    type: 'alert',
    isRead: true
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => 
    activeFilter === 'all' ? true : !n.isRead
  );

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch(type) {
      case 'inventory': return <Package className="w-5 h-5 text-primary" />;
      case 'fleet': return <Truck className="w-5 h-5 text-success" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'system': return <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400 dark:text-slate-500" />;
    }
  };

  const getIconBg = (type: Notification['type']) => {
    switch(type) {
      case 'inventory': return "bg-blue-50 border-blue-100";
      case 'fleet': return "bg-green-50 border-green-100";
      case 'alert': return "bg-red-50 border-red-100";
      case 'system': return "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight outfit flex items-center gap-3">
             <Bell className="w-8 h-8 text-primary" /> Notifications
           </h2>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Review alerts, updates, and messages from the GarageFlow system.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={markAllAsRead} 
             className="px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-50 dark:bg-zinc-900 hover:text-slate-800 dark:text-slate-100 transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark all read
          </button>
          <Link href="/profile" className="px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-50 dark:bg-zinc-900 hover:text-slate-800 dark:text-slate-100 transition-colors shadow-sm flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Settings
          </Link>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="saas-card p-2 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-1 w-full md:w-auto">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-zinc-900'}`}
          >
            All Messages
          </button>
          <button 
            onClick={() => setActiveFilter('unread')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeFilter === 'unread' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-zinc-900'}`}
          >
            Unread
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilter === 'unread' ? 'bg-white dark:bg-black text-primary' : 'bg-primary text-white'}`}>
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="saas-card p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">You&apos;re all caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium text-sm">There are no {activeFilter === 'unread' ? 'unread ' : ''}notifications left to check.</p>
          </div>
         ) : (
          filteredNotifications.map((notif, index) => (
             <motion.div 
               key={notif.id}
               layout
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.05 }}
               className={`saas-card relative overflow-hidden transition-all group hover:border-slate-300 cursor-pointer ${!notif.isRead ? 'bg-white dark:bg-black' : 'bg-slate-50 dark:bg-zinc-900/50'}`}
             >
               {/* Unread indicator line */}
               {!notif.isRead && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
               )}

               <div className="p-5 flex gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-sm ${getIconBg(notif.type)}`}>
                   {getIcon(notif.type)}
                 </div>
                 
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                     <h4 className={`text-base font-black ${!notif.isRead ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                       {notif.title}
                     </h4>
                     <span className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{notif.time}</span>
                   </div>
                   <p className={`text-sm ${!notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                     {notif.description}
                   </p>
                 </div>
               </div>

               {/* Hover Actions */}
               <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button onClick={(e) => deleteNotification(notif.id, e)} className="px-3 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-danger hover:border-red-200 transition-colors shadow-sm">
                   Dismiss
                 </button>
               </div>
             </motion.div>
          ))
         )}
      </div>

    </div>
  );
}
