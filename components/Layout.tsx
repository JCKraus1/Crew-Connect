import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  AlertTriangle, 
  MessageSquare, 
  Settings, 
  Menu,
  HardHat,
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Assignments', icon: ClipboardList, path: '/assignments' },
    { label: 'Issues', icon: AlertTriangle, path: '/issues' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'Assistant', icon: Sparkles, path: '/assistant' },
  ];

  // Add Users menu for Admin roles
  if (['manager', 'executive', 'supervisor'].includes(user.role)) {
    navItems.push({ label: 'Users', icon: Users, path: '/users' });
  }

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.label : 'CrewConnect';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
          <div className="bg-blue-600 p-2 rounded-lg">
            <HardHat size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CrewConnect</h1>
            <p className="text-xs text-slate-400">Field Ops Hub</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 p-2 rounded text-sm text-slate-300 transition-colors"
          >
            <LogOut size={16} />
            <span>Switch User</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        <header className="md:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center space-x-2">
             <div className="bg-blue-600 p-1.5 rounded-lg">
              <HardHat size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg text-slate-800">{getPageTitle()}</h1>
          </div>
          <button onClick={onLogout} className="text-slate-500">
            <Settings size={24} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 flex justify-around items-center safe-area-bottom">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full py-3 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`
              }
            >
              <item.icon size={22} className="mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;