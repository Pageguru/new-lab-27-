import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Phone,
  ArrowRight,
  RefreshCw,
  Share2,
  X,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { LabStaffAccount } from '../../types';

interface VendorStaffManagementTabProps {
  initialSubTab?: 'list' | 'add';
  onNavigateView?: (view: any) => void;
}

export const VendorStaffManagementTab: React.FC<VendorStaffManagementTabProps> = ({
  initialSubTab = 'list',
  onNavigateView,
}) => {
  const {
    staffAccounts,
    addStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
    vendorLabSettings,
    currentUser,
  } = useCms();

  const [subTab, setSubTab] = useState<'list' | 'add'>(initialSubTab);
  const [roleFilter, setRoleFilter] = useState<'all' | 'reception' | 'technician'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Password visibility map & copy indicator
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Add Staff Form State
  const [addForm, setAddForm] = useState<{
    name: string;
    role: 'reception' | 'technician';
    username: string;
    phone: string;
    password: string;
    shift: string;
    status: 'active' | 'suspended';
    notes: string;
  }>({
    name: '',
    role: 'reception',
    username: '',
    phone: '',
    password: '',
    shift: 'Morning (7:00 AM – 3:00 PM)',
    status: 'active',
    notes: '',
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit Staff Modal State (Edit Staff — Name & Change Password, / Delete)
  const [editingStaff, setEditingStaff] = useState<LabStaffAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editRole, setEditRole] = useState<'reception' | 'technician'>('reception');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Delete Confirmation Modal State
  const [deletingStaff, setDeletingStaff] = useState<LabStaffAccount | null>(null);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffAccounts.filter((staff) => {
      // Role match
      if (roleFilter !== 'all' && staff.role !== roleFilter) {
        return false;
      }
      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = staff.name.toLowerCase().includes(query);
        const matchUser = staff.username.toLowerCase().includes(query);
        const matchPhone = (staff.phone || '').includes(query);
        return matchName || matchUser || matchPhone;
      }
      return true;
    });
  }, [staffAccounts, roleFilter, searchTerm]);

  // Reception vs Technician counts
  const receptionCount = staffAccounts.filter((s) => s.role === 'reception').length;
  const techCount = staffAccounts.filter((s) => s.role === 'technician').length;

  // Generate Suggested Password
  const generateSuggestedPassword = (name: string, role: string) => {
    const clean = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') || role;
    const randNum = Math.floor(100 + Math.random() * 900);
    return `${clean.charAt(0).toUpperCase() + clean.slice(1)}@${randNum}`;
  };

  // Auto-generate username on name blur
  const handleNameBlur = () => {
    if (addForm.name.trim() && !addForm.username.trim()) {
      const clean = addForm.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const prefix = addForm.role === 'reception' ? 'rec_' : 'tech_';
      const rand = Math.floor(10 + Math.random() * 90);
      setAddForm((prev) => ({
        ...prev,
        username: `${prefix}${clean}_${rand}`,
      }));
    }
  };

  // Handle Add Staff Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddFormError('Please enter the staff member’s full name.');
      return;
    }
    if (!addForm.username.trim()) {
      setAddFormError('Please provide a unique username or login ID.');
      return;
    }
    if (!addForm.password.trim() || addForm.password.length < 4) {
      setAddFormError('Password must be at least 4 characters long.');
      return;
    }

    // Check duplicate username
    const exists = staffAccounts.some(
      (s) => s.username.toLowerCase() === addForm.username.trim().toLowerCase()
    );
    if (exists) {
      setAddFormError('This username is already taken. Please choose another username.');
      return;
    }

    addStaffAccount({
      name: addForm.name.trim(),
      role: addForm.role,
      username: addForm.username.trim(),
      phone: addForm.phone.trim() || undefined,
      password: addForm.password.trim(),
      shift: addForm.shift,
      status: addForm.status,
      notes: addForm.notes.trim() || undefined,
      labId: vendorLabSettings.labShopId || 'lab-apex',
      labName: vendorLabSettings.labName,
    });

    setToastMessage(`Staff member "${addForm.name.trim()}" added successfully!`);
    setAddForm({
      name: '',
      role: 'reception',
      username: '',
      phone: '',
      password: '',
      shift: 'Morning (7:00 AM – 3:00 PM)',
      status: 'active',
      notes: '',
    });
    setAddFormError('');
    setSubTab('list');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (staff: LabStaffAccount) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditPassword(staff.password);
    setEditPhone(staff.phone || '');
    setEditShift(staff.shift || 'General Shift');
    setEditRole(staff.role === 'technician' ? 'technician' : 'reception');
    setEditStatus(staff.status);
    setShowEditPassword(false);
    setEditModalError('');
  };

  // Save Edit Staff
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (!editName.trim()) {
      setEditModalError('Staff name cannot be empty.');
      return;
    }
    if (!editPassword.trim() || editPassword.length < 4) {
      setEditModalError('Password must be at least 4 characters long.');
      return;
    }

    updateStaffAccount(editingStaff.id, {
      name: editName.trim(),
      password: editPassword.trim(),
      phone: editPhone.trim() || undefined,
      shift: editShift,
      role: editRole,
      status: editStatus,
      lastPasswordReset: new Date().toISOString(),
    });

    setToastMessage(`Staff "${editName.trim()}" profile and password updated!`);
    setEditingStaff(null);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (staff: LabStaffAccount) => {
    setDeletingStaff(staff);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStaff) return;
    deleteStaffAccount(deletingStaff.id);
    setToastMessage(`Staff account "${deletingStaff.name}" has been deleted.`);
    setDeletingStaff(null);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Copy Login Credentials
  const handleCopyCredentials = (staff: LabStaffAccount) => {
    const roleName = staff.role === 'reception' ? 'Receptionist (Front Desk)' : 'Lab Technician';
    const text = `*🏥 ${vendorLabSettings.labName || 'Apex Diagnostic Lab'} Portal Access*\n• Role: ${roleName}\n• Staff Name: ${staff.name}\n• Login ID / Username: ${staff.username}\n• Password: ${staff.password}\n• Shift: ${staff.shift || 'General'}\n• Login URL: ${window.location.origin}`;

    navigator.clipboard?.writeText(text);
    setCopiedStaffId(staff.id);
    setToastMessage(`Login credentials for ${staff.name} copied to clipboard!`);
    setTimeout(() => {
      setCopiedStaffId(null);
      setToastMessage('');
    }, 3000);
  };

  // Toggle single staff password visibility in list
  const toggleShowPassword = (staffId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-lg font-black text-[#123B6D]">
              10. Staff Management (Receptionist &amp; Technician)
            </h1>
            <p className="text-xs text-slate-500">
              Add new front desk receptionists &amp; lab technicians, manage login passwords, and control branch access privileges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'list' ? (
            <button
              type="button"
              onClick={() => setSubTab('add')}
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>+ Add New Staff</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSubTab('list')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>View Staff List ({staffAccounts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Pills & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('list')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'list'
                ? 'bg-[#123B6D] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff List</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                subTab === 'list' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {staffAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('add')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'add'
                ? 'bg-[#123B6D] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>Add New Staff</span>
          </button>
        </div>

        {/* Quick Role Badges */}
        <div className="flex items-center gap-2 text-xs font-bold px-2">
          <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
            <span>🖥️ Receptionists:</span>
            <strong>{receptionCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
            <span>🔬 Technicians:</span>
            <strong>{techCount}</strong>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ADD NEW STAFF FORM (subTab === 'add') */}
      {/* ======================================================== */}
      {subTab === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <UserPlus className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Add New Staff Member
                </h2>
                <p className="text-xs text-slate-500">
                  Provision new employee login credentials for Front Desk Reception or Pathology Testing Lab.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Staff Provisioning
            </span>
          </div>

          {addFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addFormError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-5">
            {/* Step 1: Select Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Staff Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Receptionist Card */}
                <div
                  onClick={() => setAddForm({ ...addForm, role: 'reception' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    addForm.role === 'reception'
                      ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl shrink-0">
                    🖥️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Receptionist (Front Desk)
                      </h4>
                      {addForm.role === 'reception' && (
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Patient intake, token queue registration, test billing, cash collection, and WhatsApp report dispensing.
                    </p>
                  </div>
                </div>

                {/* Technician Card */}
                <div
                  onClick={() => setAddForm({ ...addForm, role: 'technician' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    addForm.role === 'technician'
                      ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl shrink-0">
                    🔬
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Lab Technician (Pathology)
                      </h4>
                      {addForm.role === 'technician' && (
                        <Check className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sample barcoding, analyzer test parameters entry, doctor signature sign-off, and PDF report publication.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  onBlur={handleNameBlur}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone / Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Login Credentials (Username & Password) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-black text-slate-800 block">
                2. Login Credentials Configuration
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login ID / Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rec_priya_1"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used by staff to sign in on their dedicated terminal desk.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Login Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAddForm({
                          ...addForm,
                          password: generateSuggestedPassword(addForm.name, addForm.role),
                        })
                      }
                      className="text-[11px] font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Suggest Strong</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 4 characters (e.g. Priya@2026)"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Shift & Working Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Shift Timings
                </label>
                <select
                  value={addForm.shift}
                  onChange={(e) => setAddForm({ ...addForm, shift: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                >
                  <option>Morning (7:00 AM – 3:00 PM)</option>
                  <option>Evening (2:00 PM – 10:00 PM)</option>
                  <option>General Shift (9:00 AM – 6:00 PM)</option>
                  <option>Night Emergency (8:00 PM – 8:00 AM)</option>
                  <option>Part Time / Sunday Special</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={addForm.status}
                  onChange={(e) =>
                    setAddForm({ ...addForm, status: e.target.value as 'active' | 'suspended' })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white font-bold"
                >
                  <option value="active">Active (Can Login)</option>
                  <option value="suspended">Suspended (Access Temporarily Blocked)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubTab('list')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Save &amp; Add Staff Member</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STAFF LIST VIEW (subTab === 'list') */}
      {/* (With Edit Staff — Name & Change Password, / Delete) */}
      {/* ======================================================== */}
      {subTab === 'list' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, username or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Roles ({staffAccounts.length})
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('reception')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'reception'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                🖥️ Receptionists ({receptionCount})
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('technician')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'technician'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                🔬 Technicians ({techCount})
              </button>
            </div>
          </div>

          {/* Staff Cards Grid */}
          {filteredStaff.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-700">No Staff Accounts Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'No staff matched your search query. Try searching for a different name or username.'
                  : 'You have not added any staff accounts yet. Click the button below to add your first staff member.'}
              </p>
              <button
                type="button"
                onClick={() => setSubTab('add')}
                className="px-4 py-2 bg-[#123B6D] text-white text-xs font-bold rounded-xl hover:bg-[#0e2c52] transition cursor-pointer"
              >
                + Add Staff Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStaff.map((staff) => {
                const isReception = staff.role === 'reception';
                const isShowingPassword = !!showPasswordMap[staff.id];
                const isCopied = copiedStaffId === staff.id;

                return (
                  <div
                    key={staff.id}
                    className={`bg-white rounded-2xl border transition p-5 shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                      isReception
                        ? 'border-teal-200/80 hover:border-teal-300'
                        : 'border-purple-200/80 hover:border-purple-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                              isReception
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {isReception ? '🖥️' : '🔬'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-slate-900">
                                {staff.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  isReception
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {isReception ? 'Receptionist' : 'Lab Technician'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>
                                Shift: <strong>{staff.shift || 'General Shift'}</strong>
                              </span>
                              <span>•</span>
                              <span
                                className={`font-semibold flex items-center gap-1 ${
                                  staff.status === 'active' ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    staff.status === 'active'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : 'bg-rose-500'
                                  }`}
                                ></span>
                                {staff.status === 'active' ? 'Active' : 'Suspended'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top Direct Action: Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#123B6D] transition cursor-pointer"
                            title="Edit Staff (Name & Change Password)"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(staff)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Credentials Box */}
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                        {/* Username */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Username / Login ID:</span>
                          <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
                            {staff.username}
                          </span>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Login Password:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 min-w-[70px] text-center select-all">
                              {isShowingPassword ? staff.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(staff.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                              title={isShowingPassword ? 'Hide password' : 'Show password'}
                            >
                              {isShowingPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Phone if available */}
                        {staff.phone && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-slate-500 font-medium">Contact Phone:</span>
                            <span className="font-mono text-slate-700">{staff.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(staff)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Login Info</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(staff)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit &amp; Password</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT STAFF MODAL: NAME & CHANGE PASSWORD, / DELETE */}
      {/* ======================================================== */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Edit Staff — Name &amp; Change Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update profile details and set a new login password for {editingStaff.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              {editModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editModalError}</span>
                </div>
              )}

              {/* Readonly Username */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Login ID / Username (System Protected)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingStaff.username}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600 font-bold cursor-not-allowed"
                />
              </div>

              {/* Edit Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter staff name"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              {/* Change Password */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-amber-950 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change Staff Login Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateSuggestedPassword(editName, editRole))}
                    className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Suggest New</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-900/80">
                  Changing the password here will update the staff's login credential immediately.
                </p>
              </div>

              {/* Role, Shift, Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'reception' | 'technician')}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="reception">Reception Desk</option>
                    <option value="technician">Lab Technician</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as 'active' | 'suspended')
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift</label>
                  <input
                    type="text"
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    placeholder="e.g. Morning (7 AM - 3 PM)"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingStaff;
                    setEditingStaff(null);
                    handleOpenDelete(toDelete);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Staff</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Delete Staff Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong>{deletingStaff.name}</strong> ({deletingStaff.role === 'reception' ? 'Receptionist' : 'Lab Technician'})?
                </p>
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  This user will no longer be able to log in to the diagnostic portal.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
