import React, { useState } from 'react';
import { AlertTriangle, Camera, Plus, X } from 'lucide-react';
import { Issue, Assignment, User } from '../types';

interface IssuesProps {
  issues: Issue[];
  assignments: Assignment[];
  currentUser: User;
  onCreateIssue: (issue: any) => void;
}

const Issues: React.FC<IssuesProps> = ({ issues, assignments, currentUser, onCreateIssue }) => {
  const [showForm, setShowForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    assignmentId: '',
    type: 'Access Problem',
    priority: 'medium',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateIssue({
      ...newIssue,
      reportedBy: currentUser.id,
      status: 'open'
    });
    setShowForm(false);
    // Reset
    setNewIssue({ assignmentId: '', type: 'Access Problem', priority: 'medium', description: '' });
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800 font-bold',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Issue Log</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-50 rounded-lg mt-1">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider font-medium ${priorityColors[issue.priority as keyof typeof priorityColors]}`}>
                    {issue.priority}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{issue.type}</span>
                </div>
                <p className="text-slate-600 text-sm mb-2">{issue.description}</p>
                <div className="text-xs text-slate-400">
                  Reported: {new Date(issue.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:border-l md:pl-4 border-slate-100">
               <span className={`text-sm px-3 py-1 rounded-full border ${
                 issue.status === 'open' ? 'border-red-200 text-red-700 bg-red-50' : 
                 issue.status === 'resolved' ? 'border-green-200 text-green-700 bg-green-50' : 
                 'border-blue-200 text-blue-700 bg-blue-50'
               }`}>
                 {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
               </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-lg shadow-xl animate-slide-up md:animate-scale-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Report New Issue</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignment</label>
                <select 
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newIssue.assignmentId}
                  onChange={e => setNewIssue({...newIssue, assignmentId: e.target.value})}
                >
                  <option value="">Select Assignment...</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                    value={newIssue.type}
                    onChange={e => setNewIssue({...newIssue, type: e.target.value})}
                  >
                    <option>Access Problem</option>
                    <option>Equipment Failure</option>
                    <option>Material Shortage</option>
                    <option>Safety Hazard</option>
                    <option>Utility Conflict</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                    value={newIssue.priority}
                    onChange={e => setNewIssue({...newIssue, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describe the problem in detail..."
                  value={newIssue.description}
                  onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                ></textarea>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                <Camera size={24} className="mb-2" />
                <span className="text-sm">Tap to add photo evidence</span>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;