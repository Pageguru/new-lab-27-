import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Zap,
  Printer,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  User,
  FlaskConical,
  Stethoscope,
  ChevronDown,
  Edit3,
  Lock,
} from 'lucide-react';
import { Patient, LabReport, ReportItem } from '../types';
import { TEST_TEMPLATES, TestTemplate, checkIsAbnormal } from '../data/testTemplates';
import { useCms } from '../context/CmsContext';
import { ErrorBoundary } from './ErrorBoundary';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients?: Patient[];
  preSelectedPatient?: Patient | null;
  preselectedPatient?: Patient | null;
  existingReport?: LabReport | null;
  onReportCreated: (report: LabReport, patientId?: string) => void;
  onOpenReportPreview?: (reportId: string, mobile: string) => void;
  allowNewPatientEntry?: boolean;
}

interface EditableParam {
  id: string;
  testName: string;
  parameter: string;
  result: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  notes?: string;
  minNormal?: number;
  maxNormal?: number;
  isNumeric?: boolean;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  patients = [],
  preSelectedPatient,
  preselectedPatient,
  existingReport,
  onReportCreated,
  onOpenReportPreview,
  allowNewPatientEntry,
}) => {
  const {
    vendorLabSettings,
    addLabReport,
    updateLabReport,
    getReportById,
    reports,
    patients: cmsPatients,
    receptionEntries,
    currentUser: cmsUser,
    activeTenantId,
  } = useCms();

  const isTechnician = cmsUser?.role === 'technician';
  const canCreateNewPatient = allowNewPatientEntry !== undefined ? allowNewPatientEntry : !isTechnician;

  // Combine provided patients with CMS patients and reception entries so registered patients are always available
  const basePatients = patients && patients.length > 0 ? patients : cmsPatients;
  const receptionAsPatients: Patient[] = (receptionEntries || []).map((e) => {
    const rawTests = e.tests;
    const testsList: string[] = Array.isArray(rawTests)
      ? rawTests
      : typeof rawTests === 'string'
      ? (rawTests as string).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    return {
      id: e.id,
      name: e.patientName || 'Unknown Patient',
      age: Number(e.age) || 30,
      gender: e.gender || 'Male',
      mobile: e.mobile || '',
      referringDoctor: e.referringDoctor || 'Direct / Walk-In',
      tests: testsList,
      uhid: e.uhid || `UHID-${e.id}`,
      reportId: e.reportId,
      status: (e.status === 'Report Ready' ? 'Report Ready' : 'In Lab') as any,
      registeredAt: e.registeredAt || 'Today',
      city: 'Ludhiana, PB',
      totalBill: e.totalAmount || 0,
      paidAmount: e.paidAmount || 0,
      dueAmount: e.dueAmount || 0,
      paymentMode: (e.paymentMode as any) || 'UPI',
    };
  });

  // Merge unique by UHID/id
  const combinedList = [...basePatients];
  receptionAsPatients.forEach((rp) => {
    if (!combinedList.some((p) => (p.uhid && p.uhid === rp.uhid) || p.id === rp.id)) {
      combinedList.push(rp);
    }
  });
  const availablePatients = combinedList;

  // Edit Mode Flag
  const [isEditMode, setIsEditMode] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Mode: existing patient vs walk-in
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('45');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientMobile, setPatientMobile] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('Dr. S. K. Gupta, MD (Med)');
  const [uhid, setUhid] = useState('');
  const [reportId, setReportId] = useState('');
  const [sampleCollectedAt, setSampleCollectedAt] = useState('Today, 08:30 AM');
  const [reportedAt, setReportedAt] = useState('Today, Just Now');

  // Selected Test Panels
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(['cbc']);

  // Parameters list
  const [params, setParams] = useState<EditableParam[]>([]);

  // Clinical Impression / Pathologist
  const [clinicalImpression, setClinicalImpression] = useState(
    'Parameters are within biological reference intervals for age and gender.'
  );
  const [pathologistName, setPathologistName] = useState('Dr. Rohit Sharma, MD (Pathology)');
  const [pathologistDegrees, setPathologistDegrees] = useState('Consultant Pathologist • Reg No: PMC-48192');

  // Custom Param form
  const [showCustomParamForm, setShowCustomParamForm] = useState(false);
  const [customTestName, setCustomTestName] = useState('Custom Test');
  const [customParamName, setCustomParamName] = useState('');
  const [customResult, setCustomResult] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customRange, setCustomRange] = useState('');

  // Notification / Success
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize or update when modal opens, existingReport changes, or patient changes
  useEffect(() => {
    if (!isOpen) return;

    setSaveSuccess(false);
    const activePatient = preSelectedPatient || preselectedPatient;

    // Check if there is an existing report to edit
    let targetReport: LabReport | null | undefined = existingReport;
    if (!targetReport && activePatient?.reportId) {
      targetReport = getReportById(activePatient.reportId) || reports.find((r) => r.reportId === activePatient.reportId);
    }

    if (targetReport) {
      // -------------------------------------------------------------
      // EDIT MODE: Populate state with the existing report's actual data
      // -------------------------------------------------------------
      setIsEditMode(true);
      setReportId(targetReport.reportId);
      setUhid(targetReport.uhid || (activePatient ? activePatient.uhid : ''));
      setPatientName(targetReport.patientName || (activePatient ? activePatient.name : ''));

      if (activePatient) {
        setPatientAge(String(activePatient.age || 30));
        setPatientGender(activePatient.gender || 'Male');
        setSelectedPatientId(activePatient.id);
      } else if (targetReport.ageGender) {
        const ageMatch = targetReport.ageGender.match(/(\d+)/);
        if (ageMatch) setPatientAge(ageMatch[1]);
        if (targetReport.ageGender.toLowerCase().includes('female')) setPatientGender('Female');
        else if (targetReport.ageGender.toLowerCase().includes('other')) setPatientGender('Other');
        else setPatientGender('Male');

        const matched = availablePatients.find((p) => p.reportId === targetReport?.reportId || p.uhid === targetReport?.uhid);
        if (matched) setSelectedPatientId(matched.id);
      }

      setPatientMobile(targetReport.mobile || (activePatient ? activePatient.mobile : '') || '');
      setReferringDoctor(targetReport.doctor || (activePatient ? (activePatient.referringDoctor || (activePatient as any).doctor) : 'Dr. Self / Direct') || 'Dr. Self / Direct');
      setSampleCollectedAt(targetReport.sampleCollectedAt || 'Today, 08:30 AM');
      setReportedAt(targetReport.reportedAt || 'Today, Just Now');
      setPathologistName(targetReport.pathologist || 'Dr. Rohit Sharma, MD (Pathology)');
      setPathologistDegrees(targetReport.pathologistDegrees || 'Consultant Pathologist • Reg No: PMC-48192');
      if (targetReport.clinicalImpression) {
        setClinicalImpression(targetReport.clinicalImpression);
      }

      // Populate parameters directly from the existing report items
      if (targetReport.items && Array.isArray(targetReport.items) && targetReport.items.length > 0) {
        const loadedParams: EditableParam[] = targetReport.items.map((item, idx) => ({
          id: `edit-param-${idx}-${Date.now()}-${Math.random()}`,
          testName: item.testName || 'Test',
          parameter: item.parameter || 'Parameter',
          result: item.result || '',
          unit: item.unit || '',
          referenceRange: item.referenceRange || '',
          isAbnormal: !!item.isAbnormal,
          notes: item.notes,
        }));
        setParams(loadedParams);
      } else {
        loadTemplatesIntoParams(['cbc']);
      }
      return;
    }

    // -------------------------------------------------------------
    // CREATE MODE: Brand new report generation
    // -------------------------------------------------------------
    setIsEditMode(false);
    const rptNum = Math.floor(1000 + Math.random() * 9000);
    setReportId(`RPT-2026-${rptNum}`);
    setSampleCollectedAt(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' 08:30 AM');
    setReportedAt(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

    if (activePatient) {
      setSelectedPatientId(activePatient.id || '');
      setPatientName(activePatient.name || '');
      setPatientAge(String(activePatient.age || 30));
      setPatientGender(activePatient.gender || 'Male');
      setPatientMobile(activePatient.mobile || '');
      setReferringDoctor(activePatient.referringDoctor || (activePatient as any).doctor || 'Dr. Self / Walk-in');
      setUhid(activePatient.uhid || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      if (activePatient.reportId) {
        setReportId(activePatient.reportId);
      }

      // Try to match patient tests to template IDs (safely handle array or comma string)
      const rawTests = activePatient.tests;
      const testsList: string[] = Array.isArray(rawTests)
        ? rawTests
        : typeof rawTests === 'string'
        ? (rawTests as string).split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const matchedTemplates: string[] = [];
      testsList.forEach((t) => {
        if (!t) return;
        const lower = String(t).toLowerCase();
        if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemogram')) matchedTemplates.push('cbc');
        if (lower.includes('diabet') || lower.includes('sugar') || lower.includes('hba1c') || lower.includes('fbs') || lower.includes('rbs')) matchedTemplates.push('diabetes');
        if (lower.includes('lipid') || lower.includes('cholesterol')) matchedTemplates.push('lipid');
        if (lower.includes('lft') || lower.includes('liver') || lower.includes('bilirubin')) matchedTemplates.push('lft');
        if (lower.includes('kft') || lower.includes('kidney') || lower.includes('renal') || lower.includes('creatinine') || lower.includes('urea')) matchedTemplates.push('kft');
        if (lower.includes('thyroid') || lower.includes('t3') || lower.includes('t4') || lower.includes('tsh')) matchedTemplates.push('thyroid');
        if (lower.includes('urine')) matchedTemplates.push('urine_rm');
        if (lower.includes('dengue')) matchedTemplates.push('dengue');
        if (lower.includes('widal') || lower.includes('typhoid')) matchedTemplates.push('widal');
        if (lower.includes('vitamin')) matchedTemplates.push('vitamins');
      });

      if (matchedTemplates.length > 0) {
        const unique = Array.from(new Set(matchedTemplates));
        setSelectedTemplateIds(unique);
        loadTemplatesIntoParams(unique);
      } else {
        setSelectedTemplateIds(['cbc']);
        loadTemplatesIntoParams(['cbc']);
      }
    } else if (availablePatients.length > 0 && !selectedPatientId) {
      const first = availablePatients[0];
      if (first) {
        setSelectedPatientId(first.id || '');
        setPatientName(first.name || '');
        setPatientAge(String(first.age || 30));
        setPatientGender(first.gender || 'Male');
        setPatientMobile(first.mobile || '');
        setReferringDoctor(first.referringDoctor || 'Dr. Self / Walk-in');
        setUhid(first.uhid || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
        
        const rawTests = first.tests;
        const testsList: string[] = Array.isArray(rawTests)
          ? rawTests
          : typeof rawTests === 'string'
          ? (rawTests as string).split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        const matchedTemplates: string[] = [];
        testsList.forEach((t) => {
          if (!t) return;
          const lower = String(t).toLowerCase();
          if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemogram')) matchedTemplates.push('cbc');
          if (lower.includes('diabet') || lower.includes('sugar') || lower.includes('hba1c') || lower.includes('fbs') || lower.includes('rbs')) matchedTemplates.push('diabetes');
          if (lower.includes('lipid') || lower.includes('cholesterol')) matchedTemplates.push('lipid');
          if (lower.includes('lft') || lower.includes('liver') || lower.includes('bilirubin')) matchedTemplates.push('lft');
          if (lower.includes('kft') || lower.includes('kidney') || lower.includes('renal') || lower.includes('creatinine') || lower.includes('urea')) matchedTemplates.push('kft');
          if (lower.includes('thyroid') || lower.includes('t3') || lower.includes('t4') || lower.includes('tsh')) matchedTemplates.push('thyroid');
          if (lower.includes('urine')) matchedTemplates.push('urine_rm');
          if (lower.includes('dengue')) matchedTemplates.push('dengue');
          if (lower.includes('widal') || lower.includes('typhoid')) matchedTemplates.push('widal');
          if (lower.includes('vitamin')) matchedTemplates.push('vitamins');
        });

        if (matchedTemplates.length > 0) {
          const unique = Array.from(new Set(matchedTemplates));
          setSelectedTemplateIds(unique);
          loadTemplatesIntoParams(unique);
        } else {
          setSelectedTemplateIds(['cbc']);
          loadTemplatesIntoParams(['cbc']);
        }
      }
    } else {
      setUhid(`LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setSelectedTemplateIds(['cbc']);
      loadTemplatesIntoParams(['cbc']);
    }
  }, [isOpen, preSelectedPatient, preselectedPatient, existingReport]);

  const loadTemplatesIntoParams = (templateIds: string[]) => {
    const newParams: EditableParam[] = [];
    const validIds = Array.isArray(templateIds) && templateIds.length > 0 ? templateIds : ['cbc'];
    validIds.forEach((tmplId) => {
      const tmpl = TEST_TEMPLATES.find((t) => t.id === tmplId);
      if (tmpl && Array.isArray(tmpl.parameters)) {
        tmpl.parameters.forEach((p, idx) => {
          newParams.push({
            id: `${tmpl.id}-${idx}-${Date.now()}-${Math.random()}`,
            testName: tmpl.name,
            parameter: p.name,
            result: p.defaultNormalValue || '',
            unit: p.unit || '',
            referenceRange: p.referenceRange || '',
            isAbnormal: false,
            notes: p.notes,
            minNormal: p.minNormal,
            maxNormal: p.maxNormal,
            isNumeric: p.isNumeric,
          });
        });
      }
    });
    setParams(newParams);
  };

  const handlePatientSelectChange = (patId: string) => {
    if (!canCreateNewPatient && patId === 'new_walkin') {
      return;
    }
    setSelectedPatientId(patId);
    if (patId === 'new_walkin') {
      setIsEditMode(false);
      setPatientName('');
      setPatientAge('35');
      setPatientGender('Male');
      setPatientMobile('');
      setReferringDoctor('Dr. Self / Direct Consultation');
      setUhid(`LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setReportId(`RPT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      loadTemplatesIntoParams(['cbc']);
    } else {
      const found = availablePatients.find((p) => p.id === patId);
      if (found) {
        setPatientName(found.name || '');
        setPatientAge(String(found.age || 30));
        setPatientGender(found.gender || 'Male');
        setPatientMobile(found.mobile || '');
        setReferringDoctor(found.referringDoctor || 'Dr. Self / Walk-in');
        setUhid(found.uhid || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
        if (found.reportId) {
          setReportId(found.reportId);
          // Check if this patient already has a report
          const existing = getReportById(found.reportId) || reports.find((r) => r.reportId === found.reportId);
          if (existing && existing.items && Array.isArray(existing.items) && existing.items.length > 0) {
            setIsEditMode(true);
            setParams(
              existing.items.map((item, idx) => ({
                id: `edit-param-${idx}-${Date.now()}-${Math.random()}`,
                testName: item.testName || 'Test',
                parameter: item.parameter || 'Parameter',
                result: item.result || '',
                unit: item.unit || '',
                referenceRange: item.referenceRange || '',
                isAbnormal: !!item.isAbnormal,
                notes: item.notes,
              }))
            );
            return;
          }
        }
        // Match templates from patient's tests
        const rawTests = found.tests;
        const testsList: string[] = Array.isArray(rawTests)
          ? rawTests
          : typeof rawTests === 'string'
          ? (rawTests as string).split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        const matchedTemplates: string[] = [];
        testsList.forEach((t) => {
          if (!t) return;
          const lower = String(t).toLowerCase();
          if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemogram')) matchedTemplates.push('cbc');
          if (lower.includes('diabet') || lower.includes('sugar') || lower.includes('hba1c') || lower.includes('fbs') || lower.includes('rbs')) matchedTemplates.push('diabetes');
          if (lower.includes('lipid') || lower.includes('cholesterol')) matchedTemplates.push('lipid');
          if (lower.includes('lft') || lower.includes('liver') || lower.includes('bilirubin')) matchedTemplates.push('lft');
          if (lower.includes('kft') || lower.includes('kidney') || lower.includes('renal') || lower.includes('creatinine') || lower.includes('urea')) matchedTemplates.push('kft');
          if (lower.includes('thyroid') || lower.includes('t3') || lower.includes('t4') || lower.includes('tsh')) matchedTemplates.push('thyroid');
          if (lower.includes('urine')) matchedTemplates.push('urine_rm');
          if (lower.includes('dengue')) matchedTemplates.push('dengue');
          if (lower.includes('widal') || lower.includes('typhoid')) matchedTemplates.push('widal');
          if (lower.includes('vitamin')) matchedTemplates.push('vitamins');
        });

        if (matchedTemplates.length > 0) {
          const unique = Array.from(new Set(matchedTemplates));
          setSelectedTemplateIds(unique);
          loadTemplatesIntoParams(unique);
        } else {
          setSelectedTemplateIds(['cbc']);
          loadTemplatesIntoParams(['cbc']);
        }
      }
    }
  };

  const toggleTestTemplate = (tmplId: string) => {
    let next: string[];
    if (selectedTemplateIds.includes(tmplId)) {
      if (selectedTemplateIds.length === 1) return; // keep at least one
      next = selectedTemplateIds.filter((id) => id !== tmplId);
    } else {
      next = [...selectedTemplateIds, tmplId];
    }
    setSelectedTemplateIds(next);
    loadTemplatesIntoParams(next);
  };

  const handleParamValueChange = (id: string, newResult: string) => {
    setParams((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const abnormal = checkIsAbnormal(item.parameter, newResult, {
            name: item.parameter,
            unit: item.unit,
            referenceRange: item.referenceRange,
            defaultNormalValue: '',
            minNormal: item.minNormal,
            maxNormal: item.maxNormal,
            isNumeric: item.isNumeric,
          });
          return { ...item, result: newResult, isAbnormal: abnormal };
        }
        return item;
      })
    );
  };

  const handleParamUnitChange = (id: string, newUnit: string) => {
    setParams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unit: newUnit } : item))
    );
  };

  const handleParamRangeChange = (id: string, newRange: string) => {
    setParams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, referenceRange: newRange } : item))
    );
  };

  const handleToggleAbnormal = (id: string) => {
    setParams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAbnormal: !item.isAbnormal } : item))
    );
  };

  const handleAutoFillNormalValues = () => {
    setParams((prev) =>
      prev.map((item) => {
        let def = item.result;
        for (const tmpl of TEST_TEMPLATES) {
          const matched = tmpl.parameters.find((p) => p.name === item.parameter);
          if (matched) {
            def = matched.defaultNormalValue;
            break;
          }
        }
        return {
          ...item,
          result: def,
          isAbnormal: false,
        };
      })
    );
    setClinicalImpression('All tested parameters are within normal biological limits for patient age and sex.');
  };

  const handleRemoveParam = (id: string) => {
    setParams((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCustomParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customParamName.trim()) return;

    const newParam: EditableParam = {
      id: `custom-${Date.now()}`,
      testName: customTestName || 'Special Test',
      parameter: customParamName,
      result: customResult || 'Normal',
      unit: customUnit,
      referenceRange: customRange || 'Normal',
      isAbnormal: false,
    };
    setParams((prev) => [...prev, newParam]);
    setCustomParamName('');
    setCustomResult('');
    setCustomUnit('');
    setCustomRange('');
    setShowCustomParamForm(false);
  };

  const buildLabReportObject = (): LabReport => {
    const reportItems: ReportItem[] = params.map((p) => ({
      testName: p.testName,
      parameter: p.parameter,
      result: p.result,
      unit: p.unit,
      referenceRange: p.referenceRange,
      isAbnormal: p.isAbnormal,
      notes: p.notes,
    }));

    const finalReport: LabReport = {
      reportId: reportId || `RPT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      uhid: uhid || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName || 'Patient Name',
      ageGender: `${patientAge} Yrs / ${patientGender}`,
      mobile: patientMobile || '9876543210',
      doctor: referringDoctor || 'Dr. Self',
      sampleCollectedAt,
      reportedAt,
      labName: vendorLabSettings.labName || 'APEX DIAGNOSTICS & PATHOLOGY LABORATORY',
      labAddress: vendorLabSettings.address || 'SCO 42, Green Park Avenue, Near Civil Hospital, Ludhiana, Punjab - 141001',
      labPhone: vendorLabSettings.phone || '+91 7087033009',
      nablAccreditationNo: vendorLabSettings.nablAccreditationNo || 'MC-2849',
      pathologist: pathologistName,
      pathologistDegrees: pathologistDegrees,
      barcode: '||||| | |||| ||| |||||| ||||| |||',
      verified: true,
      verificationHash: `SHA256: ${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      items: reportItems,
      clinicalImpression,
      labId: activeTenantId !== 'all' ? activeTenantId : (existingReport?.labId || 'lab-apex'),
    };

    return finalReport;
  };

  const handleSaveReport = (action: 'view' | 'whatsapp' | 'saveOnly') => {
    setValidationError('');

    if (!canCreateNewPatient && (!selectedPatientId || selectedPatientId === 'new_walkin')) {
      setValidationError('Lab Technicians cannot create new patient registrations. Please select an existing patient registered at the Reception Desk.');
      return;
    }

    if (!patientName.trim() || !patientMobile.trim()) {
      setValidationError('Please provide the patient name and a valid 10-digit mobile number.');
      return;
    }

    if (params.length === 0) {
      setValidationError('Please include at least one test parameter in the report.');
      return;
    }

    const reportObj = buildLabReportObject();

    // 1. Save / Update to global CmsContext
    if (isEditMode) {
      updateLabReport(reportObj.reportId, reportObj);
    } else {
      addLabReport(reportObj);
    }

    // 2. Notify parent LabSoftwareApp
    onReportCreated(reportObj, selectedPatientId !== 'new_walkin' ? selectedPatientId : undefined);

    setSaveSuccess(true);

    if (action === 'view') {
      onClose();
      if (onOpenReportPreview) {
        onOpenReportPreview(reportObj.reportId, reportObj.mobile);
      }
    } else if (action === 'whatsapp') {
      const reportUrl = `${window.location.origin}?report=${reportObj.reportId}`;
      const text = encodeURIComponent(
        `Hello ${reportObj.patientName}, your authenticated diagnostic report (${reportObj.reportId}) from ${reportObj.labName} is ready. View & download without login: ${reportUrl}`
      );
      window.open(`https://wa.me/91${reportObj.mobile}?text=${text}`, '_blank');
      setTimeout(() => {
        onClose();
        if (onOpenReportPreview) {
          onOpenReportPreview(reportObj.reportId, reportObj.mobile);
        }
      }, 500);
    } else {
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    }
  };

  if (!isOpen) return null;

  const abnormalCount = params.filter((p) => p.isAbnormal).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#123B6D] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isEditMode ? 'bg-amber-400 text-slate-900' : 'bg-emerald-400 text-slate-900'} flex items-center justify-center font-bold shadow-xs`}>
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {isEditMode ? 'Edit Diagnostic Test Report' : 'Create Diagnostic Test Report'}
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isEditMode
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {isEditMode ? `Editing: ${reportId}` : 'NABL Standard'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isEditMode
                  ? 'Modify observed test results, adjust biological reference intervals, and save the updated authentic report.'
                  : 'Enter observed laboratory values, verify abnormal flags, and dispatch authentic NABL reports.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
            <button
              onClick={() => setValidationError('')}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F8FAFC]">
          {/* EDIT MODE BANNER */}
          {isEditMode && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <strong>Edit Mode Active:</strong> Editing report <span className="font-mono font-bold bg-amber-200/60 px-1 py-0.5 rounded">{reportId}</span> for <strong>{patientName}</strong>. All changes will be saved directly into this report.
                </div>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                Report ID Preserved
              </span>
            </div>
          )}

          {/* STEP 1: PATIENT DEMOGRAPHICS & DOCTOR */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            {/* Technician restriction notification */}
            {!canCreateNewPatient && (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#123B6D] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-extrabold text-[#123B6D]">Technician Access Policy:</span> Patient registration is restricted exclusively to the <strong>Reception Desk</strong>. Patient identity and demographics are locked. Select a registered patient from the queue above to enter or modify their clinical test results below.
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#123B6D]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B6D]">
                  Step 1: Patient Details & Lab Reference
                </h3>
                {!canCreateNewPatient && (
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Locked to Registered Patient
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-[#123B6D]/10 text-[#123B6D] px-2.5 py-1 rounded-md font-bold border border-[#123B6D]/20">
                  UHID: {uhid || 'Registered Patient'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Patient Full Name <span className="text-rose-500">*</span></span>
                  {!canCreateNewPatient && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  type="text"
                  required
                  readOnly={!canCreateNewPatient}
                  disabled={!canCreateNewPatient}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Verma"
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold ${
                    !canCreateNewPatient
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed'
                      : 'bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Age & Gender <span className="text-rose-500">*</span></span>
                  {!canCreateNewPatient && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    readOnly={!canCreateNewPatient}
                    disabled={!canCreateNewPatient}
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Age"
                    className={`w-18 px-2.5 py-2 rounded-lg text-xs font-semibold ${
                      !canCreateNewPatient
                        ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed'
                        : 'bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none'
                    }`}
                  />
                  <select
                    value={patientGender}
                    disabled={!canCreateNewPatient}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold ${
                      !canCreateNewPatient
                        ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed'
                        : 'bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none cursor-pointer'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>10-Digit Mobile (WhatsApp) <span className="text-rose-500">*</span></span>
                  {!canCreateNewPatient && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  readOnly={!canCreateNewPatient}
                  disabled={!canCreateNewPatient}
                  value={patientMobile}
                  onChange={(e) => setPatientMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold font-mono ${
                    !canCreateNewPatient
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed'
                      : 'bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Referring Doctor</span>
                  {!canCreateNewPatient && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  type="text"
                  readOnly={!canCreateNewPatient}
                  disabled={!canCreateNewPatient}
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="Dr. S. K. Gupta, MD"
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${
                    !canCreateNewPatient
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed'
                      : 'bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  UHID Number
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={uhid}
                  onChange={(e) => setUhid(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Report ID / Barcode
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#123B6D] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sample Collection Time
                </label>
                <input
                  type="text"
                  value={sampleCollectedAt}
                  onChange={(e) => setSampleCollectedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reporting Time
                </label>
                <input
                  type="text"
                  value={reportedAt}
                  onChange={(e) => setReportedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* PARAMETER VALUES ENTRY TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>Enter Observed Parameter Values ({params.length} Parameters)</span>
                  {abnormalCount > 0 ? (
                    <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {abnormalCount} Abnormal Flag{abnormalCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      All Normal
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Values outside biological reference ranges are highlighted in red automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* 1-Click Fill Normal Values */}
                <button
                  type="button"
                  onClick={handleAutoFillNormalValues}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Auto-fills all parameters with standard normal values for rapid entry"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Auto-Fill Normal Values</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustomParamForm(!showCustomParamForm)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Custom Test</span>
                </button>
              </div>
            </div>

            {/* Custom Parameter Quick Drawer */}
            {showCustomParamForm && (
              <form onSubmit={handleAddCustomParam} className="p-4 bg-amber-50/60 border-b border-amber-200 text-xs">
                <div className="font-bold text-amber-900 mb-2">Add Custom Parameter to this Report:</div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    placeholder="Test Panel Name"
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={customParamName}
                    onChange={(e) => setCustomParamName(e.target.value)}
                    placeholder="Parameter (e.g. Ferritin)"
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={customResult}
                    onChange={(e) => setCustomResult(e.target.value)}
                    placeholder="Result Value (e.g. 45.2)"
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="Unit (e.g. ng/mL)"
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customRange}
                      onChange={(e) => setCustomRange(e.target.value)}
                      placeholder="Range (e.g. 20-250)"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Parameters Table */}
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Test & Investigation</th>
                    <th className="py-2.5 px-4 w-44">Observed Value</th>
                    <th className="py-2.5 px-3 w-28">Unit</th>
                    <th className="py-2.5 px-4">Biological Reference Interval</th>
                    <th className="py-2.5 px-3 text-center w-24">Status</th>
                    <th className="py-2.5 px-3 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {params.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        item.isAbnormal ? 'bg-rose-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="py-2 px-4">
                        <div className="font-bold text-slate-900">{item.parameter}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{item.testName}</div>
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={item.result}
                          onChange={(e) => handleParamValueChange(item.id, e.target.value)}
                          className={`w-full px-2.5 py-1 rounded font-bold font-mono text-xs focus:outline-none border ${
                            item.isAbnormal
                              ? 'bg-rose-50 border-rose-400 text-rose-800 focus:ring-2 focus:ring-rose-400/30'
                              : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#123B6D]/20'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleParamUnitChange(item.id, e.target.value)}
                          placeholder="Unit"
                          className="w-full px-1.5 py-1 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded text-slate-700 text-xs font-medium focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={item.referenceRange}
                          onChange={(e) => handleParamRangeChange(item.id, e.target.value)}
                          placeholder="Reference Interval"
                          className="w-full px-1.5 py-1 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded text-slate-700 font-mono text-[11px] focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAbnormal(item.id)}
                          title="Click to toggle Normal / Abnormal"
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            item.isAbnormal
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                          }`}
                        >
                          {item.isAbnormal ? '⚠️ ABNORMAL' : '✓ NORMAL'}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Remove Parameter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="font-bold text-slate-900">{patientName || 'Patient'}</span>
            <span>• {params.length} tests</span>
            {isEditMode && (
              <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px]">
                Modifying {reportId}
              </span>
            )}
            {saveSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isEditMode ? 'Report Updated Successfully!' : 'Report Saved & Sent to Reception Desk!'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveReport('saveOnly')}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isEditMode ? 'Update & Save Report' : 'Complete & Send to Reception Desk'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
