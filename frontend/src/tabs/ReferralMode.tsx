import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, MapPin, Phone, CheckCircle, Loader2, MapPinIcon,
  MessageCircle, CheckSquare, Square, Navigation, AlertCircle
} from 'lucide-react';
import { db, makeClientId } from '../db/offlineDb';
import { API } from '../services/api';
import schemes from '../data/schemes.json';
import facilities from '../data/facilities.json';

interface Facility {
  id: string;
  name: string;
  type: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

const JSSK_BENEFITS = "Under JSSK, transport is FREE for pregnant women. Tell the mother: 'JSSK provides free transport. Use 108 ambulance or JSSK transport service. Don't spend your money.'";

// Utility function to get unique states and districts
const getStatesAndDistricts = (facilities: any[]) => {
  const states = new Set<string>();
  const districtsByState: Record<string, Set<string>> = {};
  
  facilities.forEach(f => {
    if (f.state) {
      states.add(f.state);
      if (!districtsByState[f.state]) {
        districtsByState[f.state] = new Set();
      }
      if (f.district) {
        districtsByState[f.state].add(f.district);
      }
    }
  });
  
  return {
    states: Array.from(states).sort(),
    districtsByState: Object.fromEntries(
      Object.entries(districtsByState).map(([state, districts]) => [
        state,
        Array.from(districts).sort()
      ])
    )
  };
};

interface DistrictSelectorModalProps {
  onSelectDistrict: (state: string, district: string) => void;
  t: any;
  facilities: any[];
}

const DistrictSelectorModal: React.FC<DistrictSelectorModalProps> = ({ 
  onSelectDistrict, t, facilities 
}) => {
  const [selectedState, setSelectedState] = useState('');
  const { states, districtsByState } = getStatesAndDistricts(facilities);
  const districts = selectedState ? districtsByState[selectedState] || [] : [];

  return (
    <Card className="!p-4 space-y-4 bg-blue-50 border-2 border-blue-400 animate-slide-up">
      <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
        <MapPin size={22} className="text-blue-600" />
        {t('referral.select_district', 'Select Your District')}
      </h3>
      
      <p className="text-xs text-gray-700">
        {t('referral.district_help', 'This helps us show hospitals near you. You can change this anytime.')}
      </p>

      {/* State Selection */}
      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">
          {t('referral.select_state', 'State')}
        </label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
        >
          <option value="">{t('referral.choose_state', 'Choose State...')}</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* District Selection */}
      {selectedState && (
        <div className="animate-fade-in">
          <label className="text-sm font-bold text-gray-700 mb-2 block">
            {t('referral.select_district_in_state', `District in ${selectedState}`)}
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {districts.map(district => (
              <button
                key={district}
                onClick={() => onSelectDistrict(selectedState, district)}
                className="w-full p-3 text-left bg-white border-2 border-blue-300 hover:border-blue-600 hover:bg-blue-100 rounded-lg font-bold text-gray-900 transition-all"
              >
                📍 {district}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export const ReferralMode: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useTextToSpeech();

  // State
  const [step, setStep] = useState<'input' | 'facility' | 'checklist' | 'confirm'>('input');
  const [patientName, setPatientName] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [checklist, setChecklist] = useState({
    ifa_tablets: false,
    anc_card: false,
    aadhaar: false,
    cash: false,
  });
  const [smsPreview, setSmsPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [showDistrictSelector, setShowDistrictSelector] = useState(false);

  // Load user profile and check district on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      const profile = await db.userProfile.toCollection().first();
      if (profile) {
        setSelectedDistrict(profile.district);
      } else {
        setShowDistrictSelector(true);
      }
    };
    
    loadUserProfile();
    
    const timer = setTimeout(() => {
      speak(t('referral.voice_intro', 'Emergency Referral Mode. If a pregnant woman needs urgent transport to hospital, this mode will help you arrange it quickly.'));
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Load facilities when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      loadFacilities();
    }
  }, [selectedDistrict]);

  // Update SMS preview when facility changes
  useEffect(() => {
    if (selectedFacility) {
      updateSmsPreview();
    }
  }, [selectedFacility]);

  const loadFacilities = async () => {
    setIsLoadingFacilities(true);
    try {
      // Try API first
      const response = await API.get('/referral/facilities?type=FRU');
      if (response.data.success) {
        const filtered = response.data.facilities.filter((f: Facility & { district?: string }) => 
          !selectedDistrict || f.district === selectedDistrict
        );
        setFacilitiesList(filtered);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      // Fallback to local data
      const frus = (facilities.facilities as any[])
        .filter(f => f.type === 'FRU' && (!selectedDistrict || f.district === selectedDistrict)) as Facility[];
      setFacilitiesList(frus);
    }
    setIsLoadingFacilities(false);
  };

  const updateSmsPreview = () => {
    const facility = selectedFacility;
    const message = `URGENT: Pregnant woman in labor. Name: ${patientName || 'Unknown'}. Transport to ${facility?.name}. ${JSSK_BENEFITS} Call: ${facility?.phone}`;
    setSmsPreview(message);
  };

  const saveDistrictSelection = async (state: string, district: string) => {
    try {
      // Clear old profile if exists
      await db.userProfile.clear();
      // Save new profile
      await db.userProfile.add({
        state,
        district,
        selectedAt: new Date().toISOString(),
      });
      setSelectedDistrict(district);
      setShowDistrictSelector(false);
      speak(t('referral.district_saved', `Selected ${district} in ${state}`));
    } catch (error) {
      console.error('Error saving district:', error);
      speak(t('common.error', 'Error saving district'));
    }
  };

  const resetDistrictSelection = async () => {
    try {
      await db.userProfile.clear();
      setSelectedDistrict('');
      setShowDistrictSelector(true);
      speak(t('referral.district_reset', 'District selector reset. Please choose your district again.'));
    } catch (error) {
      console.error('Error resetting district:', error);
    }
  };

  const handleStartReferral = () => {
    if (!patientName.trim()) {
      speak(t('referral.enter_name', 'Please enter the patient name'));
      return;
    }
    updateSmsPreview();
    setStep('facility');
    speak(t('referral.select_facility', 'Select the nearest hospital or health facility'));
  };

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
    speak(`${facility.name}. ${facility.address}. Phone: ${facility.phone}`);
    setTimeout(() => setStep('checklist'), 500);
  };

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    speak(t(`referral.${key}`, key));
  };

  const handleCall108 = () => {
    speak(t('referral.calling_108', 'Calling 108 ambulance'));
    window.location.href = 'tel:108';
  };

  const handleSendSMS = () => {
    speak(t('referral.sms_sent', 'SMS message opened'));
    const encoded = encodeURIComponent(smsPreview);
    // Open SMS composer with pre-filled message
    const facility = selectedFacility;
    if (facility?.phone) {
      window.location.href = `sms:${facility.phone}?body=${encoded}`;
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(smsPreview);
    speak(t('referral.copied', 'Message copied'));
    setMessage('Copied to clipboard');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSubmitReferral = async () => {
    setIsSubmitting(true);
    try {
      const ashaId = localStorage.getItem('asha_id') || 'demo_asha_001';
      
      const referral = {
        clientId: makeClientId(),
        clientTimestamp: new Date().toISOString(),
        patient_name: patientName,
        facility_id: selectedFacility?.id || '',
        status: 'transported' as const,
        checklist,
        sync_status: 'pending' as const,
      };

      await db.referrals.add(referral);

      // Try to sync immediately if online
      try {
        await API.post('/referral/log', {
          asha_id: ashaId,
          ...referral,
        });
      } catch {
        // Will sync later
      }

      setMessage(t('referral.logged', 'Referral logged successfully'));
      speak(t('referral.logged', 'Referral logged successfully'));

      // Reset form
      setTimeout(() => {
        setStep('input');
        setPatientName('');
        setSelectedFacility(null);
        setChecklist({
          ifa_tablets: false,
          anc_card: false,
          aadhaar: false,
          cash: false,
        });
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error submitting referral:', error);
      setMessage(t('common.error', 'Error logging referral'));
      speak(t('common.error', 'Error logging referral'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const jssk = schemes.schemes.find(s => s.id === 'jssk');
  const checklistItems = [
    { key: 'ifa_tablets', label_en: 'IFA Tablets', label_hi: 'आयरन की गोलियां' },
    { key: 'anc_card', label_en: 'ANC Card', label_hi: 'ANC कार्ड' },
    { key: 'aadhaar', label_en: 'Aadhaar/ID', label_hi: 'आधार/पहचान' },
    { key: 'cash', label_en: 'Emergency Cash (₹200)', label_hi: 'आपातकालीन नकद (₹200)' },
  ];

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('referral.title', 'Emergency Referral')}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{t('referral.subtitle', 'Safe labor escort protocol')}</p>
        </div>
        <AlertTriangle size={32} className="text-red-500" />
      </div>

      {/* District Selector Modal */}
      {showDistrictSelector && (
        <DistrictSelectorModal 
          onSelectDistrict={saveDistrictSelection}
          t={t}
          facilities={facilities.facilities as any[]}
        />
      )}

      {/* Step 1: Patient Input */}
      {step === 'input' && (
        <Card className="!p-4 space-y-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 animate-slide-up">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            {t('referral.pregnant_woman', 'Pregnant woman in labor?')}
          </h3>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">{t('referral.patient_name', 'Patient Name')}</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={t('referral.name_placeholder', 'Full name...')}
              className="w-full px-3 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleStartReferral()}
            />
          </div>

          <button
            onClick={handleStartReferral}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            <AlertTriangle size={20} />
            {t('referral.start_emergency', 'START EMERGENCY REFERRAL')}
          </button>

          {/* JSSK Info */}
          <div className="p-3 bg-white rounded-lg border-2 border-green-300">
            <p className="font-bold text-green-900 mb-1">🆓 {t('referral.jssk_title', 'JSSK Reminder')}</p>
            <p className="text-xs text-green-800">{jssk?.hindi_description || jssk?.description}</p>
          </div>
        </Card>
      )}

      {/* Step 2: Facility Selection */}
      {step === 'facility' && (
        <Card className="!p-4 space-y-4 animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" />
                {t('referral.select_hospital', 'Select Hospital/FRU')}
              </h3>
              {selectedDistrict && (
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  📍 {t('referral.facilities_in', 'Facilities in')} <span className="font-bold text-blue-600">{selectedDistrict}</span>
                </p>
              )}
            </div>
            {selectedDistrict && (
              <button
                onClick={resetDistrictSelection}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition-all"
              >
                {t('referral.wrong_district', 'Wrong district?')}
              </button>
            )}
          </div>

          {isLoadingFacilities ? (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            </div>
          ) : facilitiesList.length === 0 ? (
            <p className="text-sm text-gray-600 p-3 bg-gray-100 rounded">{t('common.loading', 'Loading facilities...')}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {facilitiesList.map(facility => (
                <button
                  key={facility.id}
                  onClick={() => handleFacilitySelect(facility)}
                  className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg transition-all active:scale-95"
                >
                  <div className="flex items-start gap-2">
                    <MapPinIcon size={18} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{facility.name}</p>
                      <p className="text-xs text-gray-700">{facility.address}</p>
                      <p className="text-xs text-blue-600 font-bold mt-1">📞 {facility.phone}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Emergency Service */}
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
            <p className="text-sm font-bold text-red-900 mb-2">{t('referral.ambulance_number', 'Call Ambulance')}</p>
            <button
              onClick={handleCall108}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              108
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Pre-transport Checklist */}
      {step === 'checklist' && selectedFacility && (
        <Card className="!p-4 space-y-4 animate-slide-up">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle size={20} className="text-amber-500" />
            {t('referral.checklist_title', 'Before Leaving - Checklist')}
          </h3>

          <div className="space-y-2">
            {checklistItems.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleChecklistItem(item.key as keyof typeof checklist)}
                className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 font-bold ${
                  checklist[item.key as keyof typeof checklist]
                    ? 'bg-green-100 border-green-500 text-green-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-amber-400'
                }`}
              >
                {checklist[item.key as keyof typeof checklist] ? (
                  <CheckSquare size={20} className="text-green-600 flex-shrink-0" />
                ) : (
                  <Square size={20} className="text-gray-400 flex-shrink-0" />
                )}
                <span>{i18n.language === 'hi' ? item.label_hi : item.label_en}</span>
              </button>
            ))}
          </div>

          {/* JSSK Info Card */}
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-lg space-y-2">
            <p className="font-bold text-emerald-900">🆓 {t('referral.tell_mother', 'Tell the Mother')}</p>
            <p className="text-xs text-emerald-800">{JSSK_BENEFITS}</p>
          </div>

          {/* Facility Info */}
          <div className="p-3 bg-gray-100 rounded-lg space-y-1">
            <p className="text-xs font-bold text-gray-700">{t('referral.destination', 'Destination')}</p>
            <p className="font-bold text-gray-900">{selectedFacility.name}</p>
            <p className="text-xs text-gray-700">{selectedFacility.address}</p>
            <p className="text-xs text-gray-700 font-bold">📞 {selectedFacility.phone}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCall108}
              className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1 text-sm"
            >
              <Phone size={16} />
              Call 108
            </button>
            <button
              onClick={handleSendSMS}
              className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1 text-sm"
            >
              <MessageCircle size={16} />
              Send SMS
            </button>
          </div>

          {/* SMS Preview */}
          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg space-y-2">
            <p className="text-xs font-bold text-gray-700">{t('referral.sms_to', 'SMS to hospital')}</p>
            <p className="text-xs text-gray-800 font-mono leading-snug">{smsPreview}</p>
            <button
              onClick={handleCopyToClipboard}
              className="w-full py-1 px-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded text-xs transition-all"
            >
              {t('referral.copy', 'Copy Message')}
            </button>
          </div>

          <button
            onClick={() => setStep('confirm')}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Navigation size={18} />
            {t('referral.ready_to_go', 'Ready - Log & Close')}
          </button>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && selectedFacility && (
        <Card className="!p-4 space-y-4 animate-slide-up bg-green-50 border-2 border-green-300">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
            <CheckCircle size={24} className="text-green-600" />
            {t('referral.confirm_transport', 'Confirm Transport Completed')}
          </h3>

          <div className="p-3 bg-white rounded-lg space-y-2 border-2 border-green-300">
            <p className="text-xs font-bold text-gray-700">{t('referral.referral_summary', 'Referral Summary')}</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-bold text-gray-900">{t('referral.patient', 'Patient')}:</span> {patientName}</p>
              <p><span className="font-bold text-gray-900">{t('referral.facility', 'Facility')}:</span> {selectedFacility.name}</p>
              <p><span className="font-bold text-gray-900">{t('referral.time', 'Time')}:</span> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Confirmation Buttons */}
          <button
            onClick={handleSubmitReferral}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {t('referral.log_referral', 'Log Referral & Close')}
          </button>

          <button
            onClick={() => setStep('input')}
            className="w-full py-2 px-4 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg transition-all"
          >
            {t('common.cancel', 'Cancel')}
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-center text-sm font-bold ${
              message.includes('successfully') ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
            }`}>
              {message}
            </div>
          )}
        </Card>
      )}

      {/* Emergency Info Banner */}
      <Card className="!p-4 bg-yellow-50 border-yellow-300 space-y-2">
        <p className="font-bold text-yellow-900 flex items-center gap-2">
          <AlertCircle size={18} />
          {t('referral.emergency_reminder', 'Emergency Protocol')}
        </p>
        <ul className="text-xs text-yellow-800 space-y-1 ml-2">
          <li>• {t('referral.steps.1', 'Call 108 ambulance FIRST')}</li>
          <li>• {t('referral.steps.2', 'Inform mother about JSSK free transport')}</li>
          <li>• {t('referral.steps.3', 'Ensure all checklist items with patient')}</li>
          <li>• {t('referral.steps.4', 'Accompany mother to facility')}</li>
          <li>• {t('referral.steps.5', 'Log referral after arrival')}</li>
        </ul>
      </Card>
    </div>
  );
};
