
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Truck, 
  Play, 
  User, 
  ArrowRight,
  HardHat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Assignment, Issue, User as UserType } from '../types';
import { dataService } from '../services/store';

interface DashboardProps {
  assignments: Assignment[];
  issues: Issue[];
}

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const CrewDashboard = ({ user, assignments }: { user: UserType, assignments: Assignment[] }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const myAssignments = assignments.filter(a => a.crewId === user.id);
  const todaysAssignment = myAssignments.find(a => a.scheduledDate === today) || myAssignments.find(a => a.status !== 'completed');
  
  // Filter for upcoming assignments (not today, status pending, future dates)
  const upcomingAssignments = myAssignments.filter(a => 
    a.id !== todaysAssignment?.id && 
    a.status === 'pending'
  ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const handleStatusUpdate = (id: string, status: any) => {
    dataService.updateAssignmentStatus(id, status, user.id, 'Updated from Dashboard');
    window.location.reload(); // Simple reload to refresh data for MVP
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Good Morning, {user.name.split(' ')[0]}</h2>
          <p className="text-slate-300">Ready to crush today's goals? Stay safe out there.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-blue-600/20 transform skew-x-12"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-xl text-slate-800 flex items-center">
            <MapPin className="mr-2 text-blue-600" /> Current Assignment
          </h3>
          
          {todaysAssignment ? (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                      {todaysAssignment.status.replace('_', ' ')}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{todaysAssignment.title}</h3>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm text-slate-500">Job ID</p>
                    <p className="font-mono font-medium text-slate-700">#{todaysAssignment.id.toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-slate-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Location</p>
                        <p className="text-slate-800 font-medium">{todaysAssignment.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="text-slate-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Schedule</p>
                        <p className="text-slate-800 font-medium">{todaysAssignment.scheduledDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm font-medium text-slate-500 mb-2">Scope of Work</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{todaysAssignment.description}</p>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Target: {todaysAssignment.metrics.targetFootage}ft</span>
                      <span className="text-sm font-bold text-blue-600">{todaysAssignment.metrics.completedFootage}ft Done</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => navigate(`/assignments/${todaysAssignment.id}`)}
                    className="col-span-2 border border-slate-300 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-bold flex items-center justify-center transition-colors"
                  >
                    View Full Details & History
                  </button>

                  {todaysAssignment.status === 'pending' && (
                    <button 
                      onClick={() => handleStatusUpdate(todaysAssignment.id, 'en_route')}
                      className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Truck className="mr-2" /> Start Travel
                    </button>
                  )}
                  {todaysAssignment.status === 'en_route' && (
                    <button 
                      onClick={() => handleStatusUpdate(todaysAssignment.id, 'started')}
                      className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Play className="mr-2" /> Arrived & Start Work
                    </button>
                  )}
                  {todaysAssignment.status === 'started' && (
                    <button 
                      onClick={() => handleStatusUpdate(todaysAssignment.id, 'completed')}
                      className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                      <CheckCircle className="mr-2" /> Mark Complete
                    </button>
                  )}
                  {todaysAssignment.status === 'completed' && (
                    <div className="col-span-2 bg-emerald-50 text-emerald-800 py-4 rounded-xl font-bold text-lg flex items-center justify-center border border-emerald-100">
                      <CheckCircle className="mr-2" /> Work Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-800">No Assignments Today</h3>
              <p className="text-slate-500">Enjoy your day off!</p>
            </div>
          )}

          {/* Upcoming Schedule for Crews */}
          {upcomingAssignments.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Upcoming Schedule</h3>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                {upcomingAssignments.map(assignment => (
                  <div key={assignment.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/assignments/${assignment.id}`)}>
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg font-bold text-center min-w-[3rem]">
                        <p className="text-xs uppercase">{new Date(assignment.scheduledDate).toLocaleString('default', { month: 'short' })}</p>
                        <p className="text-lg">{new Date(assignment.scheduledDate).getDate()}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{assignment.title}</h4>
                        <p className="text-sm text-slate-500 truncate max-w-xs">{assignment.address}</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-xl text-slate-800">My Stats</h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Weekly Footage</p>
              <div className="flex items-end justify-between">
                <h4 className="text-3xl font-bold text-slate-800">2,450 <span className="text-sm text-slate-400 font-normal">ft</span></h4>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+12% vs last wk</span>
              </div>
            </div>
            <div className="h-px bg-slate-100"></div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Hours Worked</p>
              <h4 className="text-3xl font-bold text-slate-800">34.5 <span className="text-sm text-slate-400 font-normal">hrs</span></h4>
            </div>
            <div className="h-px bg-slate-100"></div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Safety Score</p>
              <h4 className="text-3xl font-bold text-slate-800">100%</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SupervisorDashboard = ({ assignments, issues, user }: { assignments: Assignment[], issues: Issue[], user: UserType }) => {
  const activeAssignments = assignments.filter(a => ['en_route', 'started'].includes(a.status));
  const completedToday = assignments.filter(a => a.status === 'completed').length;
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const criticalIssues = issues.filter(i => i.status !== 'resolved');
  const crews = dataService.getUsersByRole('crew').filter(c => c.market === user.market);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operations Overview</h2>
          <p className="text-slate-500 text-sm">Market: {user.market || 'General'}</p>
        </div>
        <span className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm mt-2 md:mt-0">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Crews" 
          value={activeAssignments.length} 
          icon={Truck} 
          color="bg-blue-500" 
          subtext="Currently in field"
        />
        <StatCard 
          title="Completed Today" 
          value={completedToday} 
          icon={CheckCircle} 
          color="bg-emerald-500"
          subtext="Daily target: 8"
        />
        <StatCard 
          title="Pending Jobs" 
          value={pendingAssignments.length} 
          icon={Calendar} 
          color="bg-amber-500" 
          subtext="Scheduled for today"
        />
        <StatCard 
          title="Open Issues" 
          value={criticalIssues.length} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          subtext={`${criticalIssues.filter(i => i.priority === 'high' || i.priority === 'critical').length} high priority`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Active Assignments List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">Active Field Assignments</h3>
            <a href="#/assignments" className="text-sm text-blue-600 font-medium hover:underline flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project / Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Crew</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.slice(0, 5).map((assignment) => {
                    const crewMember = crews.find(c => c.id === assignment.crewId);
                    const progress = assignment.metrics.targetFootage > 0 
                      ? Math.round((assignment.metrics.completedFootage / assignment.metrics.targetFootage) * 100) 
                      : 0;

                    return (
                      <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{assignment.title}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{assignment.address}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-2">
                              {crewMember?.name.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm text-slate-700">{crewMember?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                              assignment.status === 'started' ? 'bg-amber-100 text-amber-800' : 
                              assignment.status === 'en_route' ? 'bg-blue-100 text-blue-800' : 
                              'bg-slate-100 text-slate-800'}`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 w-24">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{progress}%</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {assignments.length === 0 && (
              <div className="p-8 text-center text-slate-500">No active assignments found.</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Priority Issues</span>
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{criticalIssues.length}</span>
            </h3>
            <div className="space-y-3">
              {criticalIssues.slice(0, 3).map(issue => (
                <div key={issue.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-red-700 uppercase">{issue.priority}</span>
                    <span className="text-xs text-red-400">{new Date(issue.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mb-1">{issue.type}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{issue.description}</p>
                </div>
              ))}
              {criticalIssues.length === 0 && (
                <p className="text-sm text-slate-500 italic">No open issues. Great job!</p>
              )}
            </div>
            <button className="w-full mt-4 text-sm text-slate-600 font-medium hover:text-blue-600 transition-colors">
              View Issue Log
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Crew Roster</h3>
            <div className="space-y-4">
              {crews.map(crew => (
                <div key={crew.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                      {crew.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{crew.name}</p>
                      <p className="text-xs text-slate-400">Crew Lead</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${Math.random() > 0.3 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ assignments, issues }: { assignments: Assignment[], issues: Issue[] }) => {
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const inProgressCount = assignments.filter(a => a.status === 'started' || a.status === 'en_route').length;
  const activeIssues = issues.filter(i => i.status !== 'resolved').length;
  
  const weeklyData = [
    { name: 'Mon', footage: 1200 },
    { name: 'Tue', footage: 1450 },
    { name: 'Wed', footage: 980 },
    { name: 'Thu', footage: 1600 },
    { name: 'Fri', footage: 1100 },
  ];

  const statusData = [
    { name: 'Completed', value: completedCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Pending', value: assignments.length - completedCount - inProgressCount },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#94a3b8'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Executive Overview</h2>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full mt-2 md:mt-0 w-fit">
          Last updated: Just now
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Assignments" 
          value={assignments.length} 
          icon={MapPin} 
          color="bg-blue-500" 
          subtext="Across all markets"
        />
        <StatCard 
          title="Completion Rate" 
          value={`${Math.round((completedCount / assignments.length) * 100)}%`} 
          icon={CheckCircle} 
          color="bg-emerald-500"
          subtext="Vs 85% Target"
        />
        <StatCard 
          title="Critical Issues" 
          value={activeIssues} 
          icon={AlertTriangle} 
          color="bg-amber-500" 
          subtext="Requiring immediate action"
        />
        <StatCard 
          title="Weekly Footage" 
          value="4,250 ft" 
          icon={Clock} 
          color="bg-purple-500" 
          subtext="Total production"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-lg text-slate-800 mb-6">Weekly Production Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} 
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="footage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-lg text-slate-800 mb-2">Network Status</h3>
          <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{assignments.length}</span>
              <span className="text-xs text-slate-400">Total Orders</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {statusData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ assignments, issues }) => {
  const user = dataService.getCurrentUser();

  if (!user) return null;

  if (user.role === 'crew') {
    return <CrewDashboard user={user} assignments={assignments} />;
  }

  if (user.role === 'supervisor') {
    return <SupervisorDashboard assignments={assignments} issues={issues} user={user} />;
  }

  return <ManagerDashboard assignments={assignments} issues={issues} />;
};

export default Dashboard;
