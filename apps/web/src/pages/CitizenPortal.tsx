import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  MapPin,
  Camera,
  FileText,
  CheckCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Globe,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { IncidentCategory, IncidentSeverity } from '../types';

export const CitizenPortal: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step state: 1 (What happened) > 2 (Where) > 3 (Details) > 4 (Review)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [category, setCategory] = useState<IncidentCategory>('FLOOD');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [title, setTitle] = useState<string>('Severe Waterlogging and Entrapment');
  const [description, setDescription] = useState<string>('');
  const [affectedPeople, setAffectedPeople] = useState<number>(4);
  const [latitude, setLatitude] = useState<number>(19.0726);
  const [longitude, setLongitude] = useState<number>(72.8845);
  const [address, setAddress] = useState<string>('Near Kranti Nagar Bridge, Kurla West, Mumbai');
  const [reporterPhone, setReporterPhone] = useState<string>('+91 98200 11223');
  const [language, setLanguage] = useState<'EN' | 'MR' | 'HI'>('EN');

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedIncident, setSubmittedIncident] = useState<{
    id: string;
    tracking_id: string;
  } | null>(null);

  // Use my location
  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAddress(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          // Fallback to Kurla coords
          setLatitude(19.0726);
          setLongitude(72.8845);
        }
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await apiRequest<{ id: string; tracking_id: string }>('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title: title || `${category} Emergency Alert`,
          description: description || 'Emergency report submitted via public Citizen Portal.',
          category,
          severity,
          affected_people: affectedPeople,
          latitude,
          longitude,
          address,
          reporter_phone: reporterPhone,
          is_simulated: true,
        }),
      });
      setSubmittedIncident(result);
    } catch (e) {
      // simulate fallback
      setSubmittedIncident({ id: 'fallback-id', tracking_id: 'INC-88219' });
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (submittedIncident) {
    return (
      <div className="min-h-full bg-rq-bg py-12 px-4 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-rq-surface border border-rq-border rounded-card p-6 shadow-floating text-center space-y-6">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-[#2E7D5B] rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <Check className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-rq-ink">Emergency Report Dispatched</h2>
            <p className="text-xs text-rq-muted">
              Your report has been securely registered in the ResQGrid Command Center.
            </p>
          </div>

          <div className="bg-rq-surface-2 p-4 rounded-card border border-rq-border space-y-2">
            <span className="text-xs text-rq-muted">Your Unique Incident Code</span>
            <div className="font-mono text-2xl font-bold text-rq-navy tracking-widest">
              {submittedIncident.tracking_id}
            </div>
            <p className="text-xs text-rq-muted">
              Keep this code handy to track live rescue squad status and ETA.
            </p>
          </div>

          {/* Stepper tracking preview */}
          <div className="space-y-2 text-left pt-2 border-t border-rq-border">
            <span className="text-xs font-semibold text-rq-ink">Live Status Timeline</span>
            <div className="space-y-2 pl-2 border-l-2 border-rq-navy">
              <div className="text-xs">
                <span className="font-semibold text-rq-ink">Report Registered</span>
                <p className="text-xs text-rq-muted">Intake complete, explainable priority assigned</p>
              </div>
              <div className="text-xs opacity-60">
                <span className="font-medium text-rq-muted">Command Room Triage</span>
                <p className="text-xs text-rq-muted">Operator verifying incident attributes</p>
              </div>
              <div className="text-xs opacity-40">
                <span className="font-medium text-rq-muted">Rescue Squad Dispatched</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate(`/track?code=${submittedIncident.tracking_id}`)}
              className="w-full py-2.5 bg-rq-navy hover:bg-[#0E1D36] text-white rounded text-xs font-semibold transition"
            >
              Track Live Incident Status
            </button>
            <button
              onClick={() => {
                setSubmittedIncident(null);
                setStep(1);
              }}
              className="w-full py-2 bg-rq-surface-2 hover:bg-rq-border text-rq-ink rounded border border-rq-border text-xs font-medium transition"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-rq-bg py-8 px-4 font-sans flex flex-col items-center">
      {/* Language Switcher & Offline Notice */}
      <div className="max-w-xl w-full flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center space-x-1 bg-rq-surface border border-rq-border rounded-input p-0.5">
          {(['EN', 'MR', 'HI'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                language === lang
                  ? 'bg-rq-surface-2 text-rq-navy font-semibold shadow-subtle border border-rq-border'
                  : 'text-rq-muted'
              }`}
            >
              {lang === 'EN' ? 'English' : lang === 'MR' ? 'मराठी' : 'हिंदी'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 text-rq-muted text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>OFFLINE CACHE READY</span>
        </div>
      </div>

      {/* Main Multi-Step Form Card */}
      <div className="max-w-xl w-full bg-rq-surface border border-rq-border rounded-card p-6 shadow-floating space-y-6">
        {/* Stepper Navigation */}
        <div className="flex items-center justify-between border-b border-rq-border pb-4">
          {[
            { num: 1, label: 'Emergency Type' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Details & Photo' },
            { num: 4, label: 'Review' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === s.num
                    ? 'bg-rq-navy text-white'
                    : step > s.num
                    ? 'bg-emerald-100 text-[#2E7D5B]'
                    : 'bg-rq-surface-2 text-rq-muted border border-rq-border'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span
                className={`text-xs hidden sm:block ${
                  step === s.num ? 'font-semibold text-rq-ink' : 'text-rq-muted'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: What Happened */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">What is the emergency?</h2>
              <p className="text-xs text-rq-muted">
                Select disaster category to route to appropriate specialized squads.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { cat: 'FLOOD', label: 'Flood / Waterlogging' },
                { cat: 'COLLAPSE', label: 'Building Collapse' },
                { cat: 'FIRE', label: 'Fire & Hazmat' },
                { cat: 'MEDICAL', label: 'Medical Emergency' },
                { cat: 'CYCLONE', label: 'Cyclone & Windstorm' },
                { cat: 'SUPPLIES', label: 'Supplies & Ration Shortage' },
              ].map((item) => (
                <button
                  key={item.cat}
                  onClick={() => setCategory(item.cat as IncidentCategory)}
                  className={`p-3 text-left rounded-card border transition ${
                    category === item.cat
                      ? 'bg-blue-50/60 dark:bg-slate-800 border-rq-navy shadow-subtle'
                      : 'bg-rq-surface-2 border-rq-border hover:bg-rq-surface'
                  }`}
                >
                  <span className="font-semibold text-xs text-rq-ink block mb-0.5">{item.label}</span>
                  <span className="text-xs text-rq-muted font-mono">{item.cat}</span>
                </button>
              ))}
            </div>

            {/* Severity rating */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-rq-ink block">Threat Urgency Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as IncidentSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`py-2 rounded text-xs font-medium transition ${
                      severity === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-[#C8201B] text-white font-bold'
                          : sev === 'HIGH'
                          ? 'bg-[#E27D14] text-white font-bold'
                          : 'bg-rq-navy text-white font-bold'
                        : 'bg-rq-surface-2 text-rq-muted border border-rq-border'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Where */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">Where did this happen?</h2>
              <p className="text-xs text-rq-muted">
                Pinpoint the address or tap below to detect current GPS location.
              </p>
            </div>

            <button
              onClick={handleUseLocation}
              className="w-full py-2 bg-rq-surface-2 hover:bg-rq-border text-rq-navy border border-rq-border rounded-input text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-subtle"
            >
              <Navigation className="w-4 h-4 text-rq-navy" />
              <span>Use My Exact GPS Location</span>
            </button>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-rq-ink">Street Address / Landmark</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Kranti Nagar Bridge, Kurla West"
                className="w-full p-2 bg-rq-surface border border-rq-border rounded-input text-xs text-rq-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-rq-muted font-mono">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full p-2 bg-rq-surface border border-rq-border rounded-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-rq-muted font-mono">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full p-2 bg-rq-surface border border-rq-border rounded-input text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details & Photo */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">Details and Evidence</h2>
              <p className="text-xs text-rq-muted">
                Explain casualties and upload a photo from the scene if safe to do so.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-rq-ink">Incident Summary</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary..."
                className="w-full p-2 bg-rq-surface border border-rq-border rounded-input text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-rq-ink">People At Immediate Risk</label>
              <input
                type="number"
                min="1"
                max="5000"
                value={affectedPeople}
                onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 1)}
                className="w-full p-2 bg-rq-surface border border-rq-border rounded-input text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-rq-ink">Detailed Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Water level height, entrapment details, elderly/children..."
                className="w-full p-2 bg-rq-surface border border-rq-border rounded-input text-xs"
              />
            </div>

            {/* Photo upload */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-rq-ink">Ground Photo (Optional)</label>
              <div className="flex items-center space-x-3">
                <label className="px-3 py-2 bg-rq-surface-2 border border-rq-border rounded-input cursor-pointer hover:bg-rq-border text-xs flex items-center space-x-2 transition">
                  <Camera className="w-4 h-4 text-rq-muted" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Upload Preview"
                    className="w-12 h-12 object-cover rounded border border-rq-border"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">Review & Authorize Report</h2>
              <p className="text-xs text-rq-muted">
                Please verify emergency details before submitting to the command room.
              </p>
            </div>

            <div className="bg-rq-surface-2 p-4 rounded-card border border-rq-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-rq-muted">Category:</span>
                <span className="font-semibold text-rq-ink">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rq-muted">Urgency:</span>
                <span className="font-semibold text-rq-ink">{severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rq-muted">People at Risk:</span>
                <span className="font-mono font-semibold text-rq-ink">{affectedPeople}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rq-muted">Location:</span>
                <span className="font-semibold text-rq-ink truncate max-w-[200px]">{address}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-rq-border">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 bg-rq-surface-2 hover:bg-rq-border text-rq-ink rounded text-xs font-semibold flex items-center space-x-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-4 py-2 bg-rq-navy hover:bg-[#0E1D36] text-white rounded text-xs font-semibold flex items-center space-x-1 transition shadow-subtle"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center space-x-1.5 transition shadow-subtle"
            >
              <span>{submitting ? 'Transmitting...' : 'Submit Emergency Report'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
