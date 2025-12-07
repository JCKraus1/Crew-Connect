
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, User, Clock, CheckCircle, 
  Truck, Play, AlertCircle, Edit2, Save, X, Activity, HardHat,
  Navigation, Camera, Image as ImageIcon, Trash2, StickyNote
} from 'lucide-react';
import { Assignment, User as UserType } from '../types';
import { dataService } from '../services/store';

// Declare Leaflet
declare const L: any;

interface AssignmentDetailsProps {
  currentUser: UserType;
  onUpdateStatus: (id: string, status: any, notes?: string, footage?: number, photos?: string[]) => void;
}

const DetailItem = ({ label, value }: { label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 uppercase font-medium">{label}</span>
      <span className="text-sm text-slate-800 font-semibold">{value}</span>
    </div>
  );
};

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ currentUser, onUpdateStatus }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Assignment>>({});
  
  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusFootage, setStatusFootage] = useState<number>(0);
  const [statusPhotos, setStatusPhotos] = useState<string[]>([]);

  // Map Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  const crews = dataService.getUsersByRole('crew');
  const supervisors = dataService.getUsersByRole('supervisor');

  useEffect(() => {
    if (id) {
      const data = dataService.getAssignment(id);
      setAssignment(data);
      if (data) {
        setEditForm({
          title: data.title,
          address: data.address,
          description: data.description,
          scheduledDate: data.scheduledDate,
          crewId: data.crewId,
          supervisorId: data.supervisorId,
          metrics: { ...data.metrics }
        });
        setStatusFootage(data.metrics.completedFootage);
      }
      setLoading(false);
    }
  }, [id]);

  // Initialize Map
  useEffect(() => {
    if (!loading && assignment && mapRef.current && !leafletMap.current) {
      // Small delay to ensure container size is calculated
      setTimeout(() => {
        const { lat, lng } = assignment.location;
        leafletMap.current = L.map(mapRef.current).setView([lat, lng], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletMap.current);

        L.marker([lat, lng]).addTo(leafletMap.current)
          .bindPopup(`<b>${assignment.title}</b><br>${assignment.address}`)
          .openPopup();
      }, 100);
    }
  }, [loading, assignment]);

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!assignment) return <div className="p-8 text-center">Assignment not found.</div>;

  const handleSaveEdit = () => {
    if (id && editForm) {
      dataService.updateAssignment(id, editForm);
      setAssignment({ ...assignment, ...editForm } as Assignment);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      dataService.deleteAssignment(id!);
      navigate('/assignments');
    }
  };

  const initiateStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setStatusPhotos([]); // Reset photos
    setShowStatusModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
             setStatusPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const confirmStatusChange = () => {
    if (assignment) {
      onUpdateStatus(assignment.id, pendingStatus, statusNotes, statusFootage, statusPhotos);
      // Update local state immediately for better UX
      setAssignment({
        ...assignment,
        status: pendingStatus as any,
        metrics: { ...assignment.metrics, completedFootage: statusFootage },
        history: [
          {
            status: pendingStatus as any,
            timestamp: new Date().toISOString(),
            updatedBy: currentUser.id,
            notes: statusNotes,
            footage: statusFootage,
            photos: statusPhotos
          },
          ...(assignment.history || [])
        ]
      });
      setShowStatusModal(false);
      setStatusNotes('');
      setStatusPhotos([]);
    }
  };

  const openNavigation = () => {
    // Use the actual address string or Area for navigation
    // This provides better results than lat/lng if lat/lng are generic
    const navQuery = assignment.address && assignment.address !== 'Location Pending' 
      ? assignment.address 
      : (assignment.extendedDetails?.area || `${assignment.location.lat},${assignment.location.lng}`);
      
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navQuery)}`, '_blank');
  };

  const assignedCrew = crews.find(c => c.id === assignment.crewId);
  const assignedSupervisor = supervisors.find(s => s.id === assignment.supervisorId);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
           <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft size={18} className="mr-1" /> Back
          </button>
          {isEditing ? (
            <input 
              className="text-2xl font-bold text-slate-900 w-full border-b-2 border-blue-500 outline-none pb-1"
              value={editForm.title}
              onChange={e => setEditForm({...editForm, title: e.target.value})}
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{assignment.title}</h1>
          )}
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
              ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                assignment.status === 'started' ? 'bg-amber-100 text-amber-800' : 
                assignment.status === 'en_route' ? 'bg-blue-100 text-blue-800' : 
                'bg-slate-100 text-slate-800'}`}>
              {assignment.status.replace('_', ' ')}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 font-mono">ID: {assignment.id.toUpperCase()}</span>
          </div>
        </div>

        {currentUser.role !== 'crew' && (
          <div>
            {isEditing ? (
              <div className="flex space-x-2">
                 <button 
                  onClick={handleDelete}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center"
                >
                  <Trash2 size={18} />
                </button>
                 <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Save size={18} />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Edit2 size={18} />
                <span>Edit Job</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card with Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Map Container */}
            <div className="h-64 relative bg-slate-100">
               <div ref={mapRef} className="absolute inset-0 z-0"></div>
               
               {/* Overlay Address Bar */}
               <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur shadow-md rounded-lg p-3 flex justify-between items-center">
                 <div className="flex items-center">
                    <MapPin className="text-red-500 mr-2" size={20} />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {isEditing ? (
                          <input 
                            className="bg-transparent border-b border-slate-400 outline-none w-full"
                            value={editForm.address}
                            onChange={e => setEditForm({...editForm, address: e.target.value})}
                          />
                        ) : assignment.address}
                      </p>
                      <p className="text-xs text-slate-500">Site Location</p>
                    </div>
                 </div>
                 <button 
                   onClick={openNavigation}
                   className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                 >
                   <Navigation size={18} className="mr-1" />
                   <span className="text-sm font-bold">Nav</span>
                 </button>
               </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Scope of Work</h3>
                  {isEditing ? (
                    <textarea 
                      className="w-full border border-slate-300 rounded p-2 text-sm"
                      rows={4}
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-800 leading-relaxed">{assignment.description}</p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Scheduled Date</h3>
                    <div className="flex items-center space-x-2 text-slate-800">
                      <Calendar size={18} className="text-slate-400" />
                      {isEditing ? (
                        <input 
                          type="date"
                          className="border border-slate-300 rounded p-1"
                          value={editForm.scheduledDate}
                          onChange={e => setEditForm({...editForm, scheduledDate: e.target.value})}
                        />
                      ) : (
                        <span className="font-medium">{assignment.scheduledDate}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Assigned Crew</h3>
                      <div className="flex items-center space-x-2 text-slate-800">
                        <User size={18} className="text-slate-400" />
                        {isEditing ? (
                          <select 
                            className="border border-slate-300 rounded p-1 w-full text-sm"
                            value={editForm.crewId}
                            onChange={e => setEditForm({...editForm, crewId: e.target.value})}
                          >
                            {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : (
                          <span className="font-medium">{assignedCrew?.name || 'Unassigned'}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Supervisor</h3>
                      <div className="flex items-center space-x-2 text-slate-800">
                        <HardHat size={18} className="text-slate-400" />
                        {isEditing ? (
                          <select 
                            className="border border-slate-300 rounded p-1 w-full text-sm"
                            value={editForm.supervisorId}
                            onChange={e => setEditForm({...editForm, supervisorId: e.target.value})}
                          >
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        ) : (
                          <span className="font-medium">{assignedSupervisor?.name || 'Unassigned'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Extended Details Grid */}
          {assignment.extendedDetails && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Activity size={20} className="mr-2 text-blue-600" />
                Project Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                 <DetailItem label="Permit" value={assignment.extendedDetails.constructionStatus} />
                 <DetailItem label="Area" value={assignment.extendedDetails.area} />
                 <DetailItem label="Deadline (TSD)" value={assignment.extendedDetails.deadline} />
                 <DetailItem label="Est. Cost" value={assignment.extendedDetails.estimatedCost} />
                 <DetailItem label="Door Tags" value={assignment.extendedDetails.doorTagDate} />
                 <DetailItem label="Locates" value={assignment.extendedDetails.locatesDate} />
                 <DetailItem label="SA's" value={assignment.extendedDetails.hhp} />
                 <DetailItem label="Assigned Date" value={assignment.extendedDetails.dateAssigned} />
                 <DetailItem label="Est. Completion" value={assignment.extendedDetails.completionDate} />
                 <DetailItem label="% Complete" value={assignment.extendedDetails.percentageComplete ? `${assignment.extendedDetails.percentageComplete}%` : undefined} />
              </div>
              
              {/* Separate Sections for Long Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                {assignment.extendedDetails.locateTickets && (
                   <div>
                     <p className="text-xs text-slate-500 uppercase font-medium mb-1 flex items-center">
                       <StickyNote size={12} className="mr-1" /> Locate Tickets
                     </p>
                     <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs h-full">
                       {assignment.extendedDetails.locateTickets}
                     </p>
                   </div>
                )}
                {assignment.extendedDetails.excelNotes && (
                   <div>
                     <p className="text-xs text-slate-500 uppercase font-medium mb-1 flex items-center">
                       <StickyNote size={12} className="mr-1" /> Notes
                     </p>
                     <p className="text-sm text-slate-700 whitespace-pre-line bg-amber-50 p-3 rounded-lg border border-amber-100 h-full">
                       {assignment.extendedDetails.excelNotes}
                     </p>
                   </div>
                )}
              </div>
            </div>
          )}

          {/* Activity/History Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center">
              <Clock size={20} className="mr-2 text-slate-400" /> 
              Activity Timeline
            </h3>
            
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
              {assignment.history && assignment.history.length > 0 ? (
                assignment.history.map((entry, idx) => {
                  const updater = dataService.getAllUsers().find(u => u.id === entry.updatedBy);
                  return (
                    <div key={idx} className="relative pl-8">
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white 
                        ${entry.status === 'completed' ? 'bg-emerald-500' : 
                          entry.status === 'started' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-slate-800 capitalize text-sm">{entry.status.replace('_', ' ')}</p>
                          <p className="text-xs text-slate-500">{updater?.name || 'Unknown User'}</p>
                          {entry.notes && (
                            <div className="mt-2 bg-slate-50 p-3 rounded-lg text-sm text-slate-600 border border-slate-100">
                              "{entry.notes}"
                            </div>
                          )}
                          {/* Display Photos */}
                          {entry.photos && entry.photos.length > 0 && (
                            <div className="flex mt-2 gap-2 overflow-x-auto pb-2">
                              {entry.photos.map((photo, pIdx) => (
                                <img key={pIdx} src={photo} alt="update" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-1 sm:mt-0">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {entry.footage !== undefined && entry.footage > 0 && (
                        <div className="mt-2 inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          <HardHat size={12} className="mr-1" />
                          Footage: {entry.footage}ft
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 pl-8">No history recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Metrics */}
        <div className="space-y-6">
          {/* Metrics Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Production Targets</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Footage Progress</span>
                  <span className="font-bold text-slate-700">
                    {assignment.metrics.completedFootage} / {assignment.metrics.targetFootage} ft
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${Math.min(100, (assignment.metrics.completedFootage / assignment.metrics.targetFootage) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                 <div className="p-3 bg-slate-50 rounded-lg">
                   <p className="text-xs text-slate-400 uppercase">Target</p>
                   <p className="text-lg font-bold text-slate-800">
                     {isEditing ? (
                       <input 
                         type="number"
                         className="w-full bg-white border border-slate-300 rounded text-center text-sm"
                         value={editForm.metrics?.targetFootage}
                         onChange={e => setEditForm({...editForm, metrics: {...editForm.metrics!, targetFootage: Number(e.target.value)}})}
                       />
                     ) : assignment.metrics.targetFootage}
                   </p>
                 </div>
                 <div className="p-3 bg-green-50 rounded-lg">
                   <p className="text-xs text-green-600 uppercase">Completed</p>
                   <p className="text-lg font-bold text-green-700">{assignment.metrics.completedFootage}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Crew Only) */}
          {currentUser.role === 'crew' && currentUser.id === assignment.crewId && assignment.status !== 'completed' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-800 mb-2">Update Status</h3>
              
              {assignment.status === 'pending' && (
                <button 
                  onClick={() => initiateStatusChange('en_route')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Truck size={20} />
                  <span>Start Travel</span>
                </button>
              )}
              
              {assignment.status === 'en_route' && (
                <button 
                  onClick={() => initiateStatusChange('started')}
                  className="w-full flex items-center justify-center space-x-2 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <Play size={20} />
                  <span>Arrived & Start Work</span>
                </button>
              )}
              
              {assignment.status === 'started' && (
                <button 
                  onClick={() => initiateStatusChange('completed')}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle size={20} />
                  <span>Mark Completed</span>
                </button>
              )}
              
              <button className="w-full flex items-center justify-center space-x-2 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors">
                <AlertCircle size={20} />
                <span>Report Issue</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                Update Status: <span className="capitalize text-blue-600">{pendingStatus.replace('_', ' ')}</span>
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Add Note (Optional)</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="Any delays, access codes, or specific completion notes..."
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Show footage input only when updating progress or completing */}
              {(pendingStatus === 'completed' || pendingStatus === 'started') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Footage Completed</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      className="flex-1 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={statusFootage}
                      onChange={e => setStatusFootage(Number(e.target.value))}
                    />
                    <span className="text-slate-500 font-medium">ft</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Target: {assignment.metrics.targetFootage} ft</p>
                </div>
              )}
              
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Attach Photos</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {statusPhotos.map((photo, idx) => (
                    <img key={idx} src={photo} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                  ))}
                  <label className="h-16 w-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-400">
                    <Camera size={20} />
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <button 
                onClick={confirmStatusChange}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-2"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetails;
