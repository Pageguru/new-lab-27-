import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

interface VendorAdminSettingsTabProps {
  onNavigateView?: (view: any) => void;
}

export const VendorAdminSettingsTab: React.FC<VendorAdminSettingsTabProps> = ({
  onNavigateView,
}) => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    updateVendorLabCredentials,
    vendorLabsList,
    currentUser,
    activeTenantId,
  } = useCms();

  // Determine current active lab
  const currentLabId =
    vendorLabSettings?.labId ||
    (currentUser?.role !== 'admin' ? currentUser?.labId : 'lab-apex') ||
    'lab-apex';

  const currentLab =
    vendorLabsList.find((l) => l.id === currentLabId) ||
    vendorLabsList.find((l) => l.id === 'lab-apex') ||
    vendorLabsList[0];

  const initialPassword =
    vendorLabSettings.ownerPassword || currentLab?.password || 'owner123';
  const initialPin =
    vendorLabSettings.ownerPin || currentLab?.pin || '123456';

  // Form State
  const [newPassword, setNewPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialPassword);
  const [newPin, setNewPin] = useState(initialPin);
  const [confirmPin, setConfirmPin] = useState(initialPin);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedField, setCopiedField] = useState<'pass' | 'pin' | 'phone' | null>(null);

  // Sync if settings change externally
  useEffect(() => {
    const pass = vendorLabSettings.ownerPassword || currentLab?.password || 'owner123';
    const pin = vendorLabSettings.ownerPin || currentLab?.pin || '123456';
    setNewPassword(pass);
    setConfirmPassword(pass);
    setNewPin(pin);
    setConfirmPin(pin);
  }, [vendorLabSettings.ownerPassword, vendorLabSettings.ownerPin, currentLab]);

  // Password Strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 30, label: 'Fair', color: 'bg-amber-400' };
    if (score <= 4) return { score: 70, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(newPassword);

  // Quick Password Suggestion
  const handleSuggestPassword = () => {
    const prefixes = ['Apex', 'Diagnostic', 'LabPro', 'CareSafe', 'PathoCore'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `${randomPrefix}@${randomNum}#`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setErrorMessage('');
  };

  // Quick PIN Suggestion
  const handleSuggestPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPin(randomPin);
    setConfirmPin(randomPin);
    setErrorMessage('');
  };

  // Copy helper
  const handleCopy = (text: string, type: 'pass' | 'pin' | 'phone') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Save handler
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!newPassword.trim()) {
      setErrorMessage('Please provide an Admin Password');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New Password and Confirm Password do not match');
      return;
    }

    const cleanPin = newPin.replace(/\D/g, '');
    if (!cleanPin) {
      setErrorMessage('Please provide a 6-digit Security PIN Code');
      return;
    }
    if (cleanPin.length !== 6) {
      setErrorMessage('Security PIN Code must be exactly 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage('Security PIN and Confirm PIN do not match');
      return;
    }

    // Apply updates
    const cleanPass = newPassword.trim();
    updateVendorLabCredentials(currentLabId, cleanPass, cleanPin);
    updateVendorLabSettings({
      ownerPassword: cleanPass,
      ownerPin: cleanPin,
    });

    setSuccessToast(`Admin PIN Code & Password updated successfully! New password: "${cleanPass}" | PIN: "${cleanPin}"`);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
            <ShieldAlert className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-[#123B6D]">
                8. Admin Settings
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                PIN Code &amp; Password
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Master credentials for Laboratory Owner login, elevation, and administrative control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">
            Lab ID: <strong className="font-mono text-[#123B6D]">{currentLabId}</strong>
          </span>
          <span className="text-slate-300 hidden sm:inline-block">•</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted</span>
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* CURRENT CREDENTIALS OVERVIEW CARD */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-[#123B6D] to-[#0A2547] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-2 right-4 text-amber-400 opacity-20">
          <KeyRound className="w-32 h-32" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-sm font-black text-white">
                Active Lab Owner Master Credentials
              </h2>
            </div>
            <span className="text-[11px] font-bold text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full">
              {vendorLabSettings.labName || currentLab?.name || 'Apex Diagnostic Central'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* 1. Login Mobile / Username */}
            <div className="bg-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Registered Mobile (Login ID)
              </span>
              <div className="flex items-center justify-between font-mono font-bold text-sm">
                <span>{currentLab?.phone || vendorLabSettings.phone || '9876543210'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentLab?.phone || vendorLabSettings.phone || '9876543210', 'phone')}
                  className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                  title="Copy Mobile Login ID"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-300 block">Used to log in as Lab Owner</span>
            </div>

            {/* 2. Current Master Password */}
            <div className="bg-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Master Password
              </span>
              <div className="flex items-center justify-between font-mono font-bold text-sm">
                <span>
                  {showCurrentPassword
                    ? vendorLabSettings.ownerPassword || currentLab?.password || 'owner123'
                    : '••••••••••••'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                    title={showCurrentPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(vendorLabSettings.ownerPassword || currentLab?.password || 'owner123', 'pass')
                    }
                    className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'pass' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold block">● Active &amp; Synced to Cloud</span>
            </div>

            {/* 3. Security 6-Digit PIN */}
            <div className="bg-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Security PIN Code (6 Digits)
              </span>
              <div className="flex items-center justify-between font-mono font-bold text-sm tracking-wider">
                <span>
                  {showCurrentPin
                    ? vendorLabSettings.ownerPin || currentLab?.pin || '123456'
                    : '••••••'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                    title={showCurrentPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showCurrentPin ? (
                      <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(vendorLabSettings.ownerPin || currentLab?.pin || '123456', 'pin')
                    }
                    className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                    title="Copy PIN Code"
                  >
                    {copiedField === 'pin' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-slate-300 block">Quick Authorization &amp; Report Approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PIN CODE & PASSWORD — EDIT FORM */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <KeyRound className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                PIN Code &amp; Password — Edit Credentials
              </h2>
              <p className="text-xs text-slate-500">
                Update your authentication secret keys. Changes apply immediately across all authorized devices.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Section 8
          </span>
        </div>

        <form onSubmit={handleSaveCredentials} className="p-6 space-y-6">
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PART 1: MASTER PASSWORD EDIT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#123B6D]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  1. Master Password Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSuggestPassword}
                className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggest Strong Password</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Password Strength:</span>
                    <span className={strength.label === 'Strong' ? 'text-emerald-600' : 'text-slate-700'}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Re-type new password to confirm"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match validation badge */}
                <div className="mt-2">
                  {newPassword && confirmPassword && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {newPassword === confirmPassword ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PART 2: 6-DIGIT SECURITY PIN EDIT */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  2. 6-Digit Security PIN Code
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSuggestPin}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Generate Random PIN</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New PIN Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New 6-Digit PIN Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="e.g. 123456"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Digits only (6 numbers). Used for quick verification on handheld tablets.
                </p>
              </div>

              {/* Confirm PIN Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm 6-Digit PIN Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="Re-type 6-digit PIN"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match validation badge */}
                <div className="mt-2">
                  {newPin && confirmPin && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        newPin === confirmPin ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {newPin === confirmPin ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>PINs match (6 digits verified)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>PINs do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PART 3: SECURITY ADVISORY & STAFF NOTICE */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Security Best Practices for Laboratory Owners</span>
            </div>
            <ul className="text-[11px] text-amber-900/90 list-disc list-inside space-y-1 leading-relaxed">
              <li>
                <strong>Master Admin Privileges:</strong> This PIN Code &amp; Password provides total control over financial accounts, doctor commissions, patient records, and website branding.
              </li>
              <li>
                <strong>Do NOT share with Desk Staff:</strong> Create dedicated Reception Desk or Technician accounts via the <strong>Staff Passwords &amp; Access</strong> section so their activity is tracked separately.
              </li>
              <li>
                <strong>Instant Effect:</strong> Once saved, you must use this new password and PIN code the next time you log into the Lab Owner portal.
              </li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Changes sync directly to Firestore database for <strong className="text-slate-600">{currentLabId}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const pass = vendorLabSettings.ownerPassword || currentLab?.password || 'owner123';
                  const pin = vendorLabSettings.ownerPin || currentLab?.pin || '123456';
                  setNewPassword(pass);
                  setConfirmPassword(pass);
                  setNewPin(pin);
                  setConfirmPin(pin);
                  setErrorMessage('');
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Reset Changes
              </button>

              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save &amp; Apply PIN &amp; Password</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
