import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LabReport, VendorLabSettings } from '../types';
import { determineParameterStatus, EvaluatedParameterResult } from './statusLogic';
import {
  generateQrDataUrl,
  generateLaboratoryLogoWatermark,
} from './reportAssets';

export interface DynamicVendorReportMeta {
  labName: string;
  address: string;
  phone: string;
  email: string;
  domain: string;
  openingHours: string;
  emergencyHours: string;
  nablNumber: string;
}

/**
 * Dynamically resolves vendor details for the report to ensure time, domain, phone,
 * and email address match the vendor's dashboard details in real time.
 */
export function resolveDynamicVendorReportMeta(
  report: LabReport,
  customSettings?: Partial<VendorLabSettings>
): DynamicVendorReportMeta {
  let vendorSettings: Partial<VendorLabSettings> | null = customSettings ? { ...customSettings } : null;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const mapRaw = localStorage.getItem('cms_vendor_lab_settings_map');
      if (mapRaw) {
        const settingsMap: Record<string, VendorLabSettings> = JSON.parse(mapRaw);
        if (report.labId && settingsMap[report.labId]) {
          vendorSettings = { ...settingsMap[report.labId], ...vendorSettings };
        } else {
          const activeTenantId = localStorage.getItem('active_tenant_id');
          if (activeTenantId && activeTenantId !== 'all' && settingsMap[activeTenantId]) {
            vendorSettings = { ...settingsMap[activeTenantId], ...vendorSettings };
          } else {
            const matchKey = Object.keys(settingsMap).find((k) => {
              const s = settingsMap[k];
              return (
                (s.labName && report.labName && s.labName.toLowerCase() === report.labName.toLowerCase()) ||
                (s.name && report.labName && s.name.toLowerCase() === report.labName.toLowerCase())
              );
            });
            if (matchKey && settingsMap[matchKey]) {
              vendorSettings = { ...settingsMap[matchKey], ...vendorSettings };
            } else if (settingsMap['lab-apex']) {
              vendorSettings = { ...settingsMap['lab-apex'], ...vendorSettings };
            }
          }
        }
      }

      if (!vendorSettings) {
        const singleRaw = localStorage.getItem('cms_vendor_lab_settings');
        if (singleRaw) {
          const parsed = JSON.parse(singleRaw);
          vendorSettings = { ...parsed, ...vendorSettings };
        }
      }
    } catch (err) {
      console.warn('Could not read dynamic vendor lab settings from localStorage:', err);
    }
  }

  // 1. Dynamic Lab Name (from vendor dashboard, report, or fallback)
  const labName = (
    vendorSettings?.labName ||
    vendorSettings?.name ||
    report.labName ||
    'LAB 1 DIAGNOSTIC CENTRE'
  ).toUpperCase();

  // 2. Dynamic Physical Address
  const address =
    vendorSettings?.address ||
    report.labAddress ||
    'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001';

  // 3. Dynamic Phone Number
  const rawPhone =
    vendorSettings?.phone ||
    vendorSettings?.helplinePhone ||
    vendorSettings?.whatsapp ||
    report.labPhone ||
    '7087033009';
  const cleanPhoneDigits = (rawPhone || '').replace(/\D/g, '');
  const phone =
    cleanPhoneDigits.length >= 10
      ? `+91 ${cleanPhoneDigits.slice(-10)}`
      : rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`;

  // 4. Dynamic Email Address
  const email =
    vendorSettings?.email ||
    report.labEmail ||
    'care@lab1diagnostics.com';

  // 5. Dynamic Domain Name / Website URL
  let rawDomain =
    vendorSettings?.websiteDomain ||
    vendorSettings?.domainPreview ||
    vendorSettings?.websiteUrl ||
    report.labWebsite ||
    'www.lab1diagnostics.com';
  // Strip protocol and trailing slashes for clean presentation on report
  const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  // 6. Dynamic Laboratory Operating Timings
  const openingHours =
    vendorSettings?.openingHours ||
    report.labTimings ||
    'Mon – Sat: 07:00 AM – 09:00 PM | Sunday: 07:00 AM – 02:00 PM';

  // 7. Dynamic Emergency Services
  const emergencyHours =
    vendorSettings?.emergencyHours ||
    'Emergency: 24x7 Support';

  // 8. Dynamic NABL / License Number
  const nablNumber =
    vendorSettings?.nablAccreditationNo ||
    vendorSettings?.nablNumber ||
    report.nablAccreditationNo ||
    'MC-1020';

  return {
    labName,
    address,
    phone,
    email,
    domain,
    openingHours,
    emergencyHours,
    nablNumber,
  };
}

/**
 * Builds the canonical A4 Portrait medical diagnostic lab report PDF document
 * in strict accordance with the Diagnostic Report specification with dynamic vendor dashboard details.
 */
export async function buildCanonicalReportPdf(
  report: LabReport,
  customSettings?: Partial<VendorLabSettings>
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // 186 mm

  // Dynamically resolve vendor details from live vendor dashboard
  const meta = resolveDynamicVendorReportMeta(report, customSettings);
  const labDisplayName = meta.labName;

  // 1. Prepare Verification URL (Single Canonical QR Code destination)
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://labreport.online';
  const verifyUrl = `${currentOrigin}/verify?id=${encodeURIComponent(
    report.reportId
  )}&uhid=${encodeURIComponent(report.uhid)}&auth=${encodeURIComponent(
    (report.verificationHash || 'VERIFIED').slice(0, 16)
  )}`;

  // 2. Official Booking Receipt Number
  const rawIdDigits = (report.reportId || '').replace(/\D/g, '');
  const receiptNumberSuffix = rawIdDigits ? rawIdDigits.slice(-6) : '824476';
  const bookingReceiptText = `Official Booking Receipt LAB-2026-${receiptNumberSuffix}`;

  // Solid Navy Blue / Dark Blue Theme for Header and Footer Bars
  const navyBlueRgb: [number, number, number] = [15, 39, 68]; // #0F2744

  // 3. Generate Assets in Parallel:
  // - ONE QR Code ONLY (top header)
  // - Dynamic Diagonal Laboratory Watermark (center of page, 45° rotation, light/faded opacity)
  const [headerQrDataUrl, watermarkDataUrl] = await Promise.all([
    generateQrDataUrl(verifyUrl, { size: 320, darkColor: '#0F2744' }),
    generateLaboratoryLogoWatermark(labDisplayName, meta.phone),
  ]);

  // 4. Automatically Evaluate Parameters & Determine Exact Statuses
  const evaluatedItems = (report.items || []).map((item) => {
    const evaluation = determineParameterStatus(
      item.parameter,
      item.result,
      item.referenceRange,
      item.unit,
      item.isAbnormal
    );
    return {
      ...item,
      evaluation,
    };
  });

  const criticalItems = evaluatedItems.filter((i) => i.evaluation.isCritical);

  // Group items by Department / Test
  interface DepartmentGroup {
    departmentName: string;
    testTitle: string;
    items: typeof evaluatedItems;
  }

  const departmentGroups: DepartmentGroup[] = [];
  evaluatedItems.forEach((item) => {
    const rawTestName = item.testName || 'Complete Blood Count (CBC)';
    let dept = 'DEPARTMENT OF BIOCHEMISTRY & PATHOLOGY';
    const lower = rawTestName.toLowerCase();
    if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemogram') || lower.includes('platelet') || lower.includes('esr')) {
      dept = 'DEPARTMENT OF HEMATOLOGY & CLINICAL PATHOLOGY';
    } else if (lower.includes('lipid') || lower.includes('glucose') || lower.includes('hba1c') || lower.includes('sugar') || lower.includes('cholesterol')) {
      dept = 'DEPARTMENT OF CLINICAL BIOCHEMISTRY';
    } else if (lower.includes('lft') || lower.includes('liver')) {
      dept = 'DEPARTMENT OF BIOCHEMISTRY • LIVER FUNCTION TESTS (LFT)';
    } else if (lower.includes('kft') || lower.includes('kidney') || lower.includes('renal')) {
      dept = 'DEPARTMENT OF BIOCHEMISTRY • RENAL FUNCTION TESTS (KFT)';
    } else if (lower.includes('thyroid') || lower.includes('hormone')) {
      dept = 'DEPARTMENT OF IMMUNOASSAY & ENDOCRINOLOGY';
    } else if (lower.includes('urine')) {
      dept = 'DEPARTMENT OF CLINICAL PATHOLOGY & URINALYSIS';
    }

    let existing = departmentGroups.find((g) => g.departmentName === dept && g.testTitle === rawTestName);
    if (!existing) {
      existing = {
        departmentName: dept,
        testTitle: rawTestName,
        items: [],
      };
      departmentGroups.push(existing);
    }
    existing.items.push(item);
  });

  // Fallback single group if empty
  if (departmentGroups.length === 0) {
    departmentGroups.push({
      departmentName: 'DEPARTMENT OF BIOCHEMISTRY & PATHOLOGY',
      testTitle: 'Complete Blood Count (CBC)',
      items: evaluatedItems,
    });
  }

  // ==========================================
  // CANONICAL HEADER RENDERING FUNCTION
  // (Repeated on Every Page for Multi-page Reports)
  // ==========================================
  const drawCanonicalReportHeader = (targetDoc: jsPDF): number => {
    // --- 1. TOP HEADER BAR (Solid Navy Blue / Dark Blue with Clean White Text) ---
    const headerBarHeight = 35; // mm
    const rightRightEdge = pageWidth - marginX; // 198 mm

    // Solid Navy Blue Top Bar across full page width
    targetDoc.setFillColor(navyBlueRgb[0], navyBlueRgb[1], navyBlueRgb[2]);
    targetDoc.rect(0, 0, pageWidth, headerBarHeight, 'F');

    // === LEFT SIDE: Lab Name ("LAB 1 DIAGNOSTIC CENTRE"), Address, Contact Details, Email ===
    let leftY = 8.5;

    // Lab Name (Clean White, Bold)
    targetDoc.setTextColor(255, 255, 255);
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(13);
    const labTitleLines = targetDoc.splitTextToSize(labDisplayName, 115);
    targetDoc.text(labTitleLines, marginX, leftY);
    leftY += labTitleLines.length * 5.0 + 1.2;

    // Address (Clean White text)
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(7.4);
    targetDoc.setTextColor(245, 250, 255);
    const addressLines = targetDoc.splitTextToSize(meta.address, 115);
    targetDoc.text(addressLines, marginX, leftY);
    leftY += addressLines.length * 3.5 + 0.6;

    // Contact Details (Clean White text)
    targetDoc.text(`Contact: ${meta.phone}  |  ${meta.emergencyHours}`, marginX, leftY);
    leftY += 3.7;

    // Email (Clean White text)
    targetDoc.text(`Email: ${meta.email}`, marginX, leftY);

    // === RIGHT SIDE: Report ID, UHID, and QR Code only ===
    const qrSize = 22; // mm
    const qrX = rightRightEdge - qrSize;
    const qrY = 6.5;

    // QR Code Container with crisp white background for high camera contrast
    targetDoc.setFillColor(255, 255, 255);
    targetDoc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 1.5, 1.5, 'F');
    if (headerQrDataUrl) {
      try {
        targetDoc.addImage(headerQrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
      } catch (err) {
        console.warn('Could not render header QR code:', err);
      }
    }

    // Report ID & UHID strictly to the left of QR Code (Clean White text, right-aligned)
    const rightTextX = qrX - 5; // 171 mm

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(7.2);
    targetDoc.setTextColor(220, 235, 255);
    targetDoc.text('REPORT ID:', rightTextX, 13, { align: 'right' });
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(8.5);
    targetDoc.setTextColor(255, 255, 255);
    targetDoc.text(report.reportId, rightTextX, 17.5, { align: 'right' });

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(7.2);
    targetDoc.setTextColor(220, 235, 255);
    targetDoc.text('UHID:', rightTextX, 23.5, { align: 'right' });
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(8.5);
    targetDoc.setTextColor(255, 255, 255);
    targetDoc.text(report.uhid || 'UHID-101', rightTextX, 28, { align: 'right' });

    // --- 2. PATIENT INFORMATION BOX (Unchanged) ---
    // Clean bordered box with two columns (Patient Details | Report Details)
    const pBoxY = headerBarHeight + 3.5;
    const pBoxH = 26;
    const pBoxW = contentWidth;

    // Outer Box Frame
    targetDoc.setFillColor(248, 250, 252); // Soft clinical slate-50
    targetDoc.setDrawColor(203, 213, 225);
    targetDoc.setLineWidth(0.3);
    targetDoc.roundedRect(marginX, pBoxY, pBoxW, pBoxH, 1.5, 1.5, 'FD');

    // Vertical Center Column Divider
    const colDividerX = marginX + pBoxW / 2;
    targetDoc.setDrawColor(226, 232, 240);
    targetDoc.line(colDividerX, pBoxY, colDividerX, pBoxY + pBoxH);

    // Column 1: Patient Details
    const c1LabelX = marginX + 4;
    const c1ValX = marginX + 34;

    targetDoc.setFontSize(7.2);
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('PATIENT NAME:', c1LabelX, pBoxY + 6);
    targetDoc.text('AGE / GENDER:', c1LabelX, pBoxY + 12);
    targetDoc.text('CONTACT NO:', c1LabelX, pBoxY + 18);
    targetDoc.text('BARCODE / UHID:', c1LabelX, pBoxY + 23.5);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42); // Slate-900
    targetDoc.text(report.patientName.toUpperCase(), c1ValX, pBoxY + 6);
    targetDoc.text(report.ageGender || '45 Y / Male', c1ValX, pBoxY + 12);
    targetDoc.text(`+91 ${report.mobile}`, c1ValX, pBoxY + 18);
    targetDoc.text(report.barcode || report.uhid || 'BC-789218', c1ValX, pBoxY + 23.5);

    // Column 2: Report Details
    const c2LabelX = colDividerX + 4;
    const c2ValX = colDividerX + 32;

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('REFERRED BY:', c2LabelX, pBoxY + 6);
    targetDoc.text('SPECIMEN:', c2LabelX, pBoxY + 12);
    targetDoc.text('COLLECTED ON:', c2LabelX, pBoxY + 18);
    targetDoc.text('REPORTED ON:', c2LabelX, pBoxY + 23.5);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42);
    targetDoc.text(report.doctor || 'Self / Dr. O. P. Sharma (MD)', c2ValX, pBoxY + 6);
    targetDoc.text('EDTA Whole Blood / Serum', c2ValX, pBoxY + 12);
    targetDoc.text(report.sampleCollectedAt || report.reportedAt, c2ValX, pBoxY + 18);
    targetDoc.text(report.reportedAt, c2ValX, pBoxY + 23.5);

    return pBoxY + pBoxH + 4;
  };

  // Measure exact Header Height & draw onto Page 1
  const headerTotalHeight = drawCanonicalReportHeader(doc);
  let cursorY = headerTotalHeight;

  // --- 3 & 4. DEPARTMENT SECTIONS & MAIN TEST TABLES (REPORT BODY) ---
  departmentGroups.forEach((group, gIdx) => {
    // If remaining space on current page is not enough for section header + 2 rows, break to new page
    if (cursorY > pageHeight - 50) {
      doc.addPage();
      cursorY = headerTotalHeight + 2;
    }

    // Department Section Header Bar
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(marginX, cursorY, contentWidth, 6.5, 'F');

    // Navy Accent Indicator on Left
    doc.setFillColor(18, 59, 109);
    doc.rect(marginX, cursorY, 2.5, 6.5, 'F');

    doc.setTextColor(18, 59, 109);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${group.departmentName.toUpperCase()} • ${group.testTitle.toUpperCase()}`, marginX + 5, cursorY + 4.5);

    cursorY += 7.5;

    // Table rows
    const tableData = group.items.map((item) => {
      const statusBadge = item.evaluation.style.badgeLabel;
      return [
        item.parameter,
        item.result,
        item.unit || '-',
        item.referenceRange || '-',
        statusBadge,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: {
        top: headerTotalHeight, // Ensures subsequent pages start below the repeated header
        bottom: 24,            // Ensures table stops before the footer
        left: marginX,
        right: marginX,
      },
      head: [['Investigation / Parameter', 'Observed Value', 'Unit', 'Bio Reference Interval', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.8,
        textColor: [30, 41, 59],
        cellPadding: 2.2,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [18, 59, 109],
        textColor: [255, 255, 255],
        fontSize: 7.8,
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 54, fontStyle: 'bold' },
        1: { cellWidth: 32, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 46 },
        4: { cellWidth: 28, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index >= 0) {
          const item = group.items[data.row.index];
          if (item?.evaluation) {
            const ev = item.evaluation;

            // Highlight Observed Value & Status column based on determined status
            if (ev.status === 'CRITICAL') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.fillColor = [254, 226, 226]; // Rose-100
                data.cell.styles.textColor = [190, 18, 60]; // Rose-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'HIGH') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [180, 83, 9]; // Amber-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'LOW') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [29, 78, 216]; // Blue-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'ABNORMAL') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [185, 28, 28]; // Red-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'PENDING') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [100, 116, 139];
                data.cell.styles.fontStyle = 'normal';
              }
            }
          }
        }
      },
    });

    // @ts-expect-error autoTable adds lastAutoTable property
    cursorY = (doc.lastAutoTable?.finalY || cursorY + 20) + 4;
  });

  // --- 5. CRITICAL / ABNORMAL ALERT BOX (REPORT BODY) ---
  if (criticalItems.length > 0) {
    if (cursorY > pageHeight - 65) {
      doc.addPage();
      cursorY = headerTotalHeight + 2;
    }

    const alertH = 15;
    doc.setFillColor(255, 241, 242); // Rose-50
    doc.setDrawColor(225, 29, 72); // Rose-600
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, cursorY, contentWidth, alertH, 1.5, 1.5, 'FD');

    // Warning Header
    doc.setTextColor(190, 18, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CRITICAL / PANIC LAB VALUE ALERT:', marginX + 4, cursorY + 5);

    // Standard clinical wording
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(136, 19, 55);
    const alertMsg =
      'One or more reported values require immediate clinical attention. Please correlate with clinical findings and contact the laboratory/ordering clinician as appropriate.';
    const splitAlert = doc.splitTextToSize(alertMsg, contentWidth - 8);
    doc.text(splitAlert, marginX + 4, cursorY + 9.5);

    cursorY += alertH + 4;
  }

  // --- 6. REPORT END SEPARATOR (REPORT BODY) ---
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = headerTotalHeight + 2;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX + 20, cursorY + 2, pageWidth - marginX - 20, cursorY + 2);
  doc.setLineDashPattern([], 0);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('— END OF REPORT —', pageWidth / 2, cursorY + 2.5, { align: 'center' });

  cursorY += 8;

  // --- 8. CLINIC NOTE SECTION (Dedicated section ABOVE the Signatures Block) ---
  const footerBarHeight = 12; // mm
  const clinicNoteH = 22; // mm
  const signaturesHeight = 16; // mm
  const totalBottomBlockHeight = clinicNoteH + signaturesHeight + footerBarHeight + 12; // ~62 mm

  if (cursorY > pageHeight - totalBottomBlockHeight) {
    doc.addPage();
    cursorY = headerTotalHeight + 4;
  }

  // Clinic Note positioned strictly ABOVE the signatures block
  const clinicNoteY = Math.max(cursorY + 2, pageHeight - footerBarHeight - signaturesHeight - clinicNoteH - 8);
  const clinicNoteW = contentWidth;

  // Background box with clean subtle border
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, clinicNoteY, clinicNoteW, clinicNoteH, 1.5, 1.5, 'FD');

  // Solid Navy Blue Accent bar on the left
  doc.setFillColor(navyBlueRgb[0], navyBlueRgb[1], navyBlueRgb[2]);
  doc.roundedRect(marginX, clinicNoteY, 2.5, clinicNoteH, 1, 1, 'F');

  // Clinic Note Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(navyBlueRgb[0], navyBlueRgb[1], navyBlueRgb[2]);
  doc.text('CLINIC NOTE', marginX + 5, clinicNoteY + 4.5);

  // Clinic Note Content Lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.setTextColor(71, 85, 105);

  const clinicNoteLines = [
    '• Clinical Correlation: Reported findings must be correlated clinically with patient symptoms, physical examination, and other diagnostic data by the attending physician.',
    '• Specimen Findings: Results relate strictly to the tested specimen received at the laboratory. Unexpected or discordant results warrant immediate clinical re-evaluation.',
    '• Digital Authentication: This computerized report is authenticated under NABL accreditation protocols. Physical ink signature is not required.',
    report.clinicalImpression
      ? `• Impression: ${report.clinicalImpression}`
      : '• Quality Assurance: All analyzers and reagents are calibrated under daily internal QC and external quality assessment schemes (ISO 15189).',
  ];

  let noteLineY = clinicNoteY + 8.2;
  clinicNoteLines.forEach((line) => {
    doc.text(line, marginX + 5, noteLineY);
    noteLineY += 3.3;
  });

  // --- 7. SIGNATURE SECTION (Positioned BELOW Clinic Note and ABOVE Footer) ---
  const signatureY = clinicNoteY + clinicNoteH + 5;

  // Left Signature: Prepared / Verified By
  const leftSignX = marginX + 6;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PREPARED / VERIFIED BY', leftSignX, signatureY);

  // Vector Verification Stamp Line
  doc.setDrawColor(18, 59, 109);
  doc.setLineWidth(0.3);
  doc.line(leftSignX, signatureY + 1.5, leftSignX + 48, signatureY + 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text('S. Verma, M.Sc., DMLT', leftSignX, signatureY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Senior Medical Laboratory Technologist', leftSignX, signatureY + 10);
  doc.text('Batch Quality Control Verified', leftSignX, signatureY + 13.5);

  // Right Signature: Laboratory Authorized Signatory
  const rightSignX = pageWidth - marginX - 6;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('LABORATORY AUTHORIZED SIGNATORY', rightSignX, signatureY, { align: 'right' });

  // Vector Signature Curve
  doc.setDrawColor(18, 59, 109);
  doc.setLineWidth(0.5);
  doc.lines(
    [
      [3, -5],
      [5, 4],
      [6, -6],
      [7, 5],
      [5, -3],
      [8, 4],
    ],
    rightSignX - 40,
    signatureY - 2
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(18, 59, 109);
  doc.text(report.pathologist || 'Dr. Rajesh Sharma, MD', rightSignX, signatureY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(report.pathologistDegrees || 'Consultant Pathologist & Lab Director (Reg No: MCI-PB-48192)', rightSignX, signatureY + 10, { align: 'right' });

  // --- 7 & 9. MULTI-PAGE SYNCHRONIZATION: REPEAT HEADER, WATERMARK & FOOTER ON EVERY PAGE ---
  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Apply Diagonal Watermark on every page (Unchanged)
    if (watermarkDataUrl) {
      try {
        const wmSize = 160;
        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2;
        doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
      } catch {}
    }

    // Repeat Exact Header on pages 2+ (On page 1 it was drawn at start)
    if (pageNum > 1) {
      drawCanonicalReportHeader(doc);
    }

    // --- 7. FOOTER SECTION (Solid Blue Bottom Bar with Clean White Text) ---
    const footerBarY = pageHeight - footerBarHeight;

    // Solid Navy Blue Footer Bar
    doc.setFillColor(navyBlueRgb[0], navyBlueRgb[1], navyBlueRgb[2]);
    doc.rect(0, footerBarY, pageWidth, footerBarHeight, 'F');

    // Clean White text inside footer bar
    doc.setTextColor(255, 255, 255);

    // Line 1: Lab Operating Timings (Left) & Lab Domain Name / Website URL (Right)
    // Line 1: Dynamic Lab Operating Timings (Left) & Dynamic Lab Domain Name / Website URL (Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    const timingsText = `LAB OPERATING TIMINGS: ${meta.openingHours.toUpperCase()}`;
    doc.text(timingsText, marginX, footerBarY + 4.8);

    doc.text(`WEBSITE: ${meta.domain.toUpperCase()}`, pageWidth - marginX, footerBarY + 4.8, { align: 'right' });

    // Line 2: Diagnostic Record Notice (Left) & Dynamic Page X of Y (Right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(225, 238, 255);

    const footerNotice = `Certified Diagnostic Record • ${labDisplayName} • Emergency Support 24x7`;
    doc.text(footerNotice, marginX, footerBarY + 9.2);

    const pageText = totalPages > 1 ? `Page ${pageNum} of ${totalPages}` : 'Page 1 of 1';
    doc.text(pageText, pageWidth - marginX, footerBarY + 9.2, { align: 'right' });
  }

  return doc;
}

/**
 * Returns the exact canonical PDF Blob, Object URL, Data URI, ArrayBuffer, and filename
 * for rendering in the canonical preview or embedding with live vendor dashboard details.
 */
export async function getCanonicalReportPdfBlob(
  report: LabReport,
  customSettings?: Partial<VendorLabSettings>
): Promise<{
  blob: Blob;
  blobUrl: string;
  dataUri: string;
  arrayBuffer: ArrayBuffer;
  filename: string;
  doc: jsPDF;
}> {
  const doc = await buildCanonicalReportPdf(report, customSettings);
  const safePatientName = (report.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${report.reportId}_${safePatientName}_Report.pdf`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const dataUri = doc.output('datauristring');
  const arrayBuffer = doc.output('arraybuffer');
  return { blob, blobUrl, dataUri, arrayBuffer, filename, doc };
}

/**
 * Downloads the exact same canonical PDF file (conditioned on complete payment)
 */
export async function downloadReportPdf(
  report: LabReport,
  prebuiltDoc?: jsPDF,
  customSettings?: Partial<VendorLabSettings>
): Promise<boolean> {
  try {
    const statusLower = (report.paymentStatus || '').toLowerCase();
    const isDuePending = Boolean(
      (report.dueAmount !== undefined && report.dueAmount > 0) ||
      statusLower === 'pending' ||
      statusLower === 'partial' ||
      statusLower === 'due' ||
      (report.paymentStatus !== undefined &&
        statusLower !== 'full payment' &&
        statusLower !== 'paid' &&
        statusLower !== 'completed' &&
        (report.dueAmount ?? 0) > 0)
    );

    if (isDuePending) {
      console.warn(`[SECURITY] Cannot download report ${report.reportId}: Full payment is pending (Due: ₹${report.dueAmount || 0}).`);
      return false;
    }

    const doc = prebuiltDoc || (await buildCanonicalReportPdf(report, customSettings));
    const safePatientName = (report.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${report.reportId}_${safePatientName}_Report.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('PDF download error:', error);
    return false;
  }
}

/**
 * Backward compatibility alias for downloadReportPdf
 */
export const generateReportPdf = downloadReportPdf;

/**
 * Prints the exact canonical PDF document directly using browser iframe (conditioned on complete payment)
 */
export async function printCanonicalReportPdf(
  report: LabReport,
  existingBlobUrl?: string,
  customSettings?: Partial<VendorLabSettings>
): Promise<boolean> {
  try {
    const statusLower = (report.paymentStatus || '').toLowerCase();
    const isDuePending = Boolean(
      (report.dueAmount !== undefined && report.dueAmount > 0) ||
      statusLower === 'pending' ||
      statusLower === 'partial' ||
      statusLower === 'due' ||
      (report.paymentStatus !== undefined &&
        statusLower !== 'full payment' &&
        statusLower !== 'paid' &&
        statusLower !== 'completed' &&
        (report.dueAmount ?? 0) > 0)
    );

    if (isDuePending) {
      console.warn(`[SECURITY] Cannot print report ${report.reportId}: Full payment is pending.`);
      return false;
    }

    let url = existingBlobUrl;
    let cleanup = false;
    if (!url) {
      const res = await getCanonicalReportPdfBlob(report, customSettings);
      url = res.blobUrl;
      cleanup = true;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.src = url;

    document.body.appendChild(iframe);

    return new Promise((resolve) => {
      let isResolved = false;

      const triggerPrint = () => {
        if (isResolved) return;
        isResolved = true;
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            if (cleanup && url) URL.revokeObjectURL(url);
            resolve(true);
          }, 3000);
        } catch (e) {
          console.warn('Iframe PDF direct print blocked or failed, falling back:', e);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          downloadReportPdf(report);
          resolve(false);
        }
      };

      iframe.onload = () => {
        setTimeout(triggerPrint, 500);
      };

      setTimeout(() => {
        if (!isResolved) {
          triggerPrint();
        }
      }, 2500);
    });
  } catch (err) {
    console.error('Print canonical PDF error:', err);
    await downloadReportPdf(report);
    return false;
  }
}

/**
 * Generates the filename strictly in the format: #TokenNumber_LabName_Time_Date.pdf
 * Example: #231_ABCLab_03-21-PM_27-09-2026.pdf
 */
export function getReceiptPdfFilename(entry: any, labNameRaw?: string): string {
  const rawToken = entry?.tokenNumber || entry?.tokenNo || '231';
  const cleanToken = String(rawToken).replace(/^#/, '');
  const tokenPart = `#${cleanToken}`;

  const rawLab = labNameRaw || 'ApexLab';
  let cleanLab = rawLab.replace(/[^a-zA-Z0-9]/g, '');
  if (!cleanLab) cleanLab = 'ABCLab';

  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}-${minutes}-${ampm}`;

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  return `${tokenPart}_${cleanLab}_${timeStr}_${dateStr}.pdf`;
}

/**
 * Builds the exact receipt PDF matching the popup modal design pixel-for-pixel.
 * Returns the jsPDF instance, formatted filename, Blob, and File objects.
 */
export async function buildReceiptInvoicePdf(
  entry: any,
  labNameRaw?: string
): Promise<{ doc: jsPDF; filename: string; blob: Blob; file: File }> {
  const resolvedLabName = labNameRaw || 'Apex Diagnostic & Pathology Laboratory';
  const filename = getReceiptPdfFilename(entry, resolvedLabName);

  const tests = Array.isArray(entry?.tests)
    ? entry.tests
    : typeof entry?.tests === 'string'
    ? [entry.tests]
    : ['Diagnostic Investigation'];

  const discount = Number(entry?.discountINR) || 0;
  const gross = Number(entry?.totalAmount) || 0;
  const net = Math.max(0, gross - discount);
  const paid = Number(entry?.paidAmount) || 0;
  const due = entry?.dueAmount !== undefined ? Number(entry.dueAmount) : Math.max(0, net - paid);

  // Dynamic height calculation based on number of tests
  const baseHeight = 168;
  const extraTestsHeight = Math.max(0, tests.length - 2) * 5;
  const discountHeight = discount > 0 ? 5 : 0;
  const pageHeight = Math.max(168, baseHeight + extraTestsHeight + discountHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, pageHeight],
  });

  // Background & outer subtle border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 105, pageHeight, 'F');
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.4);
  doc.roundedRect(4, 4, 97, pageHeight - 8, 4, 4, 'D');

  // 1. Green Success Badge at Top (matches popup: Entry Submitted)
  const badgeText = 'Entry Submitted';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const badgeTextWidth = doc.getTextWidth(badgeText);
  const iconWidth = 3;
  const iconGap = 1.8;
  const paddingX = 4.5;
  const badgeW = iconWidth + iconGap + badgeTextWidth + paddingX * 2;
  const badgeH = 6.8;
  const badgeX = (105 - badgeW) / 2;
  const badgeY = 8.5;

  doc.setFillColor(236, 253, 245); // #ECFDF5
  doc.setDrawColor(167, 243, 208); // #A7F3D0
  doc.setLineWidth(0.35);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3.4, 3.4, 'FD');

  // Vector checkmark (guarantees crisp rendering without font encoding/overflow issues)
  const checkX = badgeX + paddingX;
  const checkCenterY = badgeY + badgeH / 2;
  doc.setDrawColor(5, 150, 105); // #059669
  doc.setLineWidth(0.5);
  doc.line(checkX, checkCenterY, checkX + 0.9, checkCenterY + 1.0);
  doc.line(checkX + 0.9, checkCenterY + 1.0, checkX + 2.6, checkCenterY - 1.1);

  // Badge text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70); // #065F46
  doc.text(badgeText, checkX + iconWidth + iconGap, badgeY + 4.6);

  // 2. Header Title: Token & Invoice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('Token & Invoice', 52.5, 22, { align: 'center' });

  // Subtitle: Lab Name • Date
  const displayDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748B
  const subtitle = `${resolvedLabName.slice(0, 34)} • ${displayDate}`;
  doc.text(subtitle, 52.5, 26.5, { align: 'center' });

  // 3. Generated Token Number Display Card (Blue tinted card)
  doc.setFillColor(240, 247, 255); // #F0F7FF
  doc.setDrawColor(18, 59, 109); // #123B6D
  doc.setLineWidth(0.6);
  doc.roundedRect(8, 30, 89, 31, 3.5, 3.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 59, 109);
  doc.text('GENERATED TOKEN NUMBER', 52.5, 35.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(18, 59, 109);
  doc.text(String(entry?.tokenNumber || 'TK-101'), 52.5, 49, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `UHID: ${entry?.uhid || 'LAB-2026-9041'}   •   Time: ${entry?.registeredAt || 'Morning Shift'}`,
    52.5,
    57,
    { align: 'center' }
  );

  // 4. Patient Information Box (2 Columns)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(8, 64, 89, 19, 3, 3, 'FD');

  // Left: Patient details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text('PATIENT', 12, 69);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const pName = entry?.patientName ? String(entry.patientName).slice(0, 24) : 'Patient';
  doc.text(pName, 12, 74);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${entry?.age || '-'} Yrs / ${entry?.gender || '-'}`, 12, 79);

  // Right: Mobile & Ref Doctor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MOBILE & REF DOCTOR', 93, 69, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`+91 ${entry?.mobile || '-'}`, 93, 74, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const docName = entry?.referringDoctor ? `Dr: ${String(entry.referringDoctor).slice(0, 22)}` : 'Dr: Self';
  doc.text(docName, 93, 79, { align: 'right' });

  // 5. Prescribed Diagnostic Tests
  let curY = 88;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`PRESCRIBED DIAGNOSTIC TESTS (${tests.length})`, 8, curY);
  curY += 4.5;

  tests.forEach((t: string, idx: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const displayTest = String(t).length > 44 ? String(t).slice(0, 42) + '...' : String(t);
    doc.text(`${idx + 1}.  ${displayTest}`, 10, curY);
    curY += 4.5;
  });

  curY += 2;

  // 6. Bill Financial Breakdown Box
  const breakdownHeight = discount > 0 ? 37 : 32;
  doc.setFillColor(250, 250, 250); // #FAFAFA
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(8, curY, 89, breakdownHeight, 3, 3, 'FD');

  let bY = curY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Gross Test Amount:', 12, bY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${gross}`, 93, bY, { align: 'right' });

  if (discount > 0) {
    bY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('Discount / Concession:', 12, bY);
    doc.setFont('helvetica', 'bold');
    doc.text(`-Rs. ${discount}`, 93, bY, { align: 'right' });
  }

  bY += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, bY, 93, bY);
  bY += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Net Payable:', 12, bY);
  doc.setFontSize(10.5);
  doc.setTextColor(18, 59, 109);
  doc.text(`Rs. ${net}`, 93, bY, { align: 'right' });

  bY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  if (paid > 0) {
    doc.text(`Amount Paid (${entry?.paymentMode || 'Cash'}):`, 12, bY);
  } else {
    doc.text('Amount Paid:', 12, bY);
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${paid}`, 93, bY, { align: 'right' });

  bY += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, bY, 93, bY);
  bY += 5.5;

  if (due > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(225, 29, 72); // Rose
    doc.text('Balance Due:', 12, bY);
    doc.setFontSize(10);
    doc.text(`Rs. ${due}`, 93, bY, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105); // Emerald
    doc.text('Payment Status:', 12, bY);
    doc.text('Full Payment Cleared', 93, bY, { align: 'right' });
  }

  curY += breakdownHeight + 5;

  // 7. Footer Strip
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(8, curY, 97, curY);
  doc.setLineDashPattern([], 0);
  curY += 3.5;

  if (entry?.bookingSource === 'Website') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('Booking submitted. Final confirmation after Lab Owner approval.', 52.5, curY, { align: 'center' });
    curY += 3.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Online reports available on official lab portal', 52.5, curY, { align: 'center' });
  curY += 3.5;
  doc.text(`Keep this slip safe for report collection  •  ${resolvedLabName.slice(0, 36)}`, 52.5, curY, {
    align: 'center',
  });

  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  return { doc, filename, blob, file };
}

/**
 * Downloads the receipt PDF directly using the exact design
 */
export async function generateThermalReceiptPdf(entry: any, labNameRaw?: string): Promise<void> {
  const { doc, filename } = await buildReceiptInvoicePdf(entry, labNameRaw);
  doc.save(filename);
}

