import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, User, ChevronRight, Play, CheckSquare, Truck, AlertCircle, Plus, X, RefreshCw, Clock, Globe, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Assignment, User as UserType } from '../types';
import { dataService } from '../services/store';

interface AssignmentsProps {
  assignments: Assignment[];
  currentUser: UserType;
  onUpdateStatus: (id: string, status: any, notes?: string, footage?: number) => void;
}

const statusColors = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  en_route: 'bg-blue-50 text-blue-700 border-blue-200',
  started: 'bg-amber-50 text-amber-700 border-amber-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusLabels = {
  pending: 'Not Started',
  en_route: 'En Route',
  started: 'Working',
  blocked: 'Blocked',
  completed: 'Done',
};

const Assignments: React.FC<AssignmentsProps> = ({ assignments, currentUser, onUpdateStatus }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const crews = dataService.getUsersByRole('crew');
  const supervisors = dataService.getUsersByRole('supervisor');
  
  useEffect(() => {
    const time = dataService.getLastSyncTime();
    if (time) {
      setLastSyncTime(new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  // Create Assignment Form State
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    address: '',
    crewId: '',
    supervisorId: currentUser.role === 'supervisor' ? currentUser.id : '',
    scheduledDate: new Date().toISOString().split('T')[0],
    description: '',
    targetFootage: 0
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.createAssignment({
      title: newAssignment.title,
      address: newAssignment.address,
      location: { lat: 39.7817, lng: -89.6501 }, // Mock location default
      crewId: newAssignment.crewId,
      supervisorId: newAssignment.supervisorId || currentUser.id,
      scheduledDate: newAssignment.scheduledDate,
      description: newAssignment.description,
      metrics: {
        targetFootage: Number(newAssignment.targetFootage),
        completedFootage: 0
      }
    });
    setShowCreateModal(false);
    // Reset form
    setNewAssignment({
      title: '',
      address: '',
      crewId: '',
      supervisorId: currentUser.role === 'supervisor' ? currentUser.id : '',
      scheduledDate: new Date().toISOString().split('T')[0],
      description: '',
      targetFootage: 0
    });
    // Trigger reload
    window.location.reload();
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    // Use the URL provided
    const result = await dataService.syncProjectsFromExcel('https://jckraus1.github.io/Tillman-Dashboard/tillman-project.xlsx');
    setIsSyncing(false);
    if (result.success) {
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      alert(`Sync Complete!\nNew Assignments: ${result.newAssignments}\nNew Users Created: ${result.newUsers}`);
      window.location.reload();
    } else {
      alert(`Sync Failed: ${result.error}`);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      dataService.deleteAssignment(id);
      window.location.reload();
    }
  };

  const displayedAssignments = assignments.filter(a => {
    if (currentUser.role === 'crew') return a.crewId === currentUser.id;
    return true;
  }).filter(a => filter === 'all' || a.status === filter);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {currentUser.role === 'crew' ? 'My Assignments' : 'Field Assignments'}
          </h2>
          {lastSyncTime && (
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <Clock size={12} className="mr-1" /> Data updated: {lastSyncTime}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex p-1 bg-slate-200 rounded-lg overflow-x-auto">
            {['all', 'pending', 'started', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                  filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          {(currentUser.role === 'manager' || currentUser.role === 'executive') && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors whitespace-nowrap disabled:opacity-70"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
              <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Projects'}</span>
            </button>
          )}

          {currentUser.role !== 'crew' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              <span className="hidden md:inline">New Assignment</span>
              <span className="md:hidden">New</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {displayedAssignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
              <Plus size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No assignments found</h3>
            <p className="text-slate-500 text-sm mt-1">Check back later or adjust your filters.</p>
          </div>
        ) : (
          displayedAssignments.map((assignment) => (
            <div 
              key={assignment.id} 
              onClick={() => navigate(`/assignments/${assignment.id}`)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                       <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[assignment.status]}`}>
                        {statusLabels[assignment.status]}
                      </div>
                      {/* Show Market badge for Managers/Execs */}
                      {['manager', 'executive'].includes(currentUser.role) && assignment.market && (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <Globe size={10} className="mr-1" />
                          {assignment.market}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{assignment.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Delete Button for Admin/Supervisor */}
                    {currentUser.role !== 'crew' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(assignment.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                        title="Delete Assignment"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{assignment.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{assignment.scheduledDate}</span>
                  </div>
                  {currentUser.role !== 'crew' && (
                     <div className="flex items-center space-x-2">
                      <User size={16} className="text-slate-400" />
                      <span>Assigned to: {crews.find(c => c.id === assignment.crewId)?.name || 'Unknown'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                   <span className="text-sm text-slate-500 truncate max-w-[70%]">{assignment.description}</span>
                   <span className="text-xs font-medium text-blue-600">View Details</span>
                </div>

                {/* Progress Bar if started */}
                {assignment.status === 'started' && (
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${(assignment.metrics.completedFootage / assignment.metrics.targetFootage) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Title / NTP</label>
                <input 
                  required
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Fiber Drop - 123 Main St"
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address/Location</label>
                <input 
                  required
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Full address"
                  value={newAssignment.address}
                  onChange={e => setNewAssignment({...newAssignment, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Crew</label>
                  <select 
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                    value={newAssignment.crewId}
                    onChange={e => setNewAssignment({...newAssignment, crewId: e.target.value})}
                  >
                    <option value="">Select Crew...</option>
                    {crews.map(crew => (
                      <option key={crew.id} value={crew.id}>{crew.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Schedule Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                    value={newAssignment.scheduledDate}
                    onChange={e => setNewAssignment({...newAssignment, scheduledDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Supervisor Selection (Visible if creating new users or for Managers) */}
              {['manager', 'executive'].includes(currentUser.role) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Supervisor</label>
                  <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                    value={newAssignment.supervisorId}
                    onChange={e => setNewAssignment({...newAssignment, supervisorId: e.target.value})}
                  >
                    <option value="">Select Supervisor...</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              )}

               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Footage (ft)</label>
                <input 
                  type="number"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  value={newAssignment.targetFootage}
                  onChange={e => setNewAssignment({...newAssignment, targetFootage: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scope of Work</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the work required..."
                  value={newAssignment.description}
                  onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;