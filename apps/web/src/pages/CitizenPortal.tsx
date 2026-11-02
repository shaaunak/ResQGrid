import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Upload,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Incident, IncidentCategory, IncidentSeverity } from '../types';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const QUICK_MUMBAI_LOCATIONS = [
  { name: 'Kurla West (Mithi River low-lying)', lat: 19.0726, lon: 72.8845, addr: 'Near Kranti Nagar Bridge, Kurla West, Mumbai' },
  { name: 'Dadar Hindmata Flyover', lat: 19.0178, lon: 72.8478, addr: 'Hindmata Flyover, Dadar East, Mumbai' },
  { name: 'Bandra S.V. Road', lat: 19.0596, lon: 72.8402, addr: 'S.V. Road near Bandra Post Office, Mumbai' },
  { name: 'Dharavi Sector 5', lat: 19.0434, lon: 72.8567, addr: '90 Feet Road, Dharavi Sector 5, Mumbai' },
  { name: 'Andheri Subway', lat: 19.1136, lon: 72.8697, addr: 'Andheri Subway Western Express Highway, Mumbai' },
];

export const CitizenPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('FLOOD');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [affectedPeople, setAffectedPeople] = useState<number>(3);
  const [address, setAddress] = useState(QUICK_MUMBAI_LOCATIONS[0].addr);
  const [lat, setLat] = useState(QUICK_MUMBAI_LOCATIONS[0].lat);
  const [lon, setLon] = useState(QUICK_MUMBAI_LOCATIONS[0].lon);
  const [phone, setPhone] = useState(user?.phone || '+91 98200 11223');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  // Fetch citizen's personal submitted reports
  const { data: myIncidents = [] } = useQuery<Incident[]>({
    queryKey: ['my-incidents'],
    queryFn: () => apiRequest<Incident[]>('/incidents?only_mine=true'),
    enabled: isAuthenticated,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // 1. Create Incident
      const created = await apiRequest<Incident>('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          affected_people: affectedPeople,
          latitude: lat,
          longitude: lon,
          address,
          reporter_phone: phone,
          is_simulated: true,
        }),
      });

      // 2. Upload file if provided
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('incident_id', created.id);
        formData.append('evidence_type', 'CITIZEN_SUBMISSION');

        await apiRequest(`/evidence/upload/incidents/${created.id}/${selectedFile.name}`, {
          method: 'POST',
          body: formData,
        });
      }

      return created;
    },
    onSuccess: (data) => {
      setSubmittedIncident(data);
      queryClient.invalidateQueries({ queryKey: ['my-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setTitle('');
      setDescription('');
      setSelectedFile(null);
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-command-border gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-command-amber" />
            <span>Citizen Emergency Reporting Portal</span>
          </h1>
          <p className="text-xs text-command-muted font-mono mt-0.5">
            Submit simulated emergency requests for municipal flood & disaster dispatch.
          </p>
        </div>

        <Link
          to="/track"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-command-card hover:bg-command-border border border-command-border rounded text-xs font-mono text-command-teal transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Track by Incident ID</span>
        </Link>
      </div>

      {/* Confirmation Banner */}
      {submittedIncident && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-lg flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Emergency Request Transmitted Successfully</h3>
              <p className="text-xs text-slate-300">
                Your incident tracking reference is{' '}
                <span className="font-mono font-bold text-emerald-300 text-sm">{submittedIncident.tracking_id}</span>.
                Control Room operators have been notified.
              </p>
              <div className="pt-1">
                <Link
                  to={`/track?id=${submittedIncident.tracking_id}`}
                  className="text-xs text-command-teal underline font-mono flex items-center space-x-1"
                >
                  <span>View Live Public Tracking Status</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSubmittedIncident(null)}
            className="text-xs text-command-muted hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono pb-2 border-b border-command-border/60">
            1. Emergency Incident Details
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-command-muted font-medium mb-1">Incident Headline / Summary</label>
              <input
                type="text"
                placeholder="e.g. Severe waterlogging trapped family of 5 in Kurla..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-command-teal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-command-muted font-medium mb-1">Disaster Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                >
                  <option value="FLOOD">Urban Flooding</option>
                  <option value="MEDICAL">Medical Emergency</option>
                  <option value="COLLAPSE">Structural Collapse</option>
                  <option value="FIRE">Fire Hazard</option>
                  <option value="EVACUATION">Evacuation Needed</option>
                  <option value="SUPPLIES">Relief Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-command-muted font-medium mb-1">Initial Urgency</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                >
                  <option value="CRITICAL">Critical (Life Danger)</option>
                  <option value="HIGH">High (Urgent)</option>
                  <option value="MEDIUM">Medium (Stable)</option>
                  <option value="LOW">Low (Monitoring)</option>
                </select>
              </div>

              <div>
                <label className="block text-command-muted font-medium mb-1">Number of Affected People</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={affectedPeople}
                  onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-command-muted font-medium mb-1">Detailed Description of Situation</label>
              <textarea
                rows={3}
                placeholder="Describe ground reality: water depth, medical conditions, power outages, landmarks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-command-teal leading-relaxed"
              />
            </div>
          </div>

          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono pt-3 pb-2 border-b border-command-border/60">
            2. Mumbai Location Pin
          </h2>

          <div className="space-y-2">
            <label className="block text-command-muted font-medium">Quick Select Demonstration Landmark</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MUMBAI_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    setAddress(loc.addr);
                    setLat(loc.lat);
                    setLon(loc.lon);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border transition ${
                    lat === loc.lat && lon === loc.lon
                      ? 'bg-command-teal text-white border-command-teal'
                      : 'bg-command-card text-slate-300 border-command-border hover:border-slate-500'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-command-muted font-medium mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-command-muted font-medium mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono pt-3 pb-2 border-b border-command-border/60">
            3. Photographic Evidence (Amazon S3)
          </h2>

          <div>
            <label className="block text-command-muted font-medium mb-1">Attach Incident Photograph (Max 5MB)</label>
            <div className="border-2 border-dashed border-command-border rounded-lg p-4 text-center hover:border-command-teal transition cursor-pointer relative bg-command-darkest/30">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-command-muted mx-auto mb-1" />
              <div className="text-xs text-slate-300">
                {selectedFile ? (
                  <span className="text-command-teal font-medium">{selectedFile.name}</span>
                ) : (
                  <span>Click to select photograph or drag image here</span>
                )}
              </div>
              <span className="text-[10px] text-command-muted block mt-1 font-mono">
                Stored in private S3 bucket via presigned URL upload pipeline
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!title || !description || submitMutation.isPending}
              className="w-full py-2.5 bg-command-teal hover:bg-command-teal-bright disabled:opacity-50 text-white font-semibold rounded text-xs shadow-lg transition flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>
                {submitMutation.isPending ? 'Transmitting to Cloud...' : 'Submit Emergency Help Request'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Personal Submissions */}
        <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-4 text-xs h-fit">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono pb-2 border-b border-command-border/60 flex items-center justify-between">
            <span>My Submitted Reports</span>
            <span className="text-command-teal font-normal text-xs">{myIncidents.length} total</span>
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {myIncidents.length === 0 ? (
              <div className="text-center py-8 text-command-muted font-mono">
                No active personal incidents submitted yet.
              </div>
            ) : (
              myIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 bg-command-card/70 border border-command-border rounded-lg space-y-2 hover:border-slate-500 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs">{inc.tracking_id}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                  <h4 className="text-xs font-medium text-slate-200 truncate">{inc.title}</h4>
                  <div className="flex items-center justify-between text-[10px] font-mono text-command-muted">
                    <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                    <Link
                      to={`/track?id=${inc.tracking_id}`}
                      className="text-command-teal hover:underline flex items-center space-x-1"
                    >
                      <span>Track</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

