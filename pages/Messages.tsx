import React from 'react';
import { Search, UserCircle, Bell } from 'lucide-react';
import { Message, User } from '../types';

interface MessagesProps {
  messages: Message[];
  currentUser: User;
}

const Messages: React.FC<MessagesProps> = ({ messages, currentUser }) => {
  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            <div className="bg-blue-50 p-3 rounded-lg cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-slate-800">North Market Channel</span>
                <span className="text-xs text-slate-500">10:42 AM</span>
              </div>
              <p className="text-sm text-slate-600 truncate">Alex: Team, remember safety brief...</p>
            </div>
            
            <div className="hover:bg-slate-50 p-3 rounded-lg cursor-pointer transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-slate-800">HQ Announcements</span>
                <span className="text-xs text-slate-500">Yesterday</span>
              </div>
              <p className="text-sm text-slate-600 truncate">Mike: New equipment arriving Thurs...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
               #
             </div>
             <div>
               <h3 className="font-bold text-slate-800">North Market Channel</h3>
               <p className="text-xs text-slate-500">24 Members • 3 Online</p>
             </div>
          </div>
          <Bell size={20} className="text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
           {messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
               <div className={`flex flex-col max-w-[70%] ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                 <div className="flex items-center space-x-2 mb-1">
                   {msg.senderId !== currentUser.id && (
                     <span className="text-xs font-bold text-slate-600">{msg.senderName}</span>
                   )}
                   <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 <div className={`p-3 rounded-lg shadow-sm ${
                   msg.senderId === currentUser.id 
                     ? 'bg-blue-600 text-white rounded-br-none' 
                     : 'bg-white text-slate-800 rounded-bl-none'
                 }`}>
                   <p className="text-sm">{msg.content}</p>
                 </div>
               </div>
             </div>
           ))}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Placeholder for detail view */}
      <div className="md:hidden flex-1 flex items-center justify-center p-8 text-center bg-slate-50">
        <p className="text-slate-400">Select a conversation to view messages</p>
      </div>
    </div>
  );
};

export default Messages;