import { db } from '../src/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  VENDOR_LABS_DIRECTORY, 
  DEFAULT_VENDOR_SETTINGS_MAP, 
  DEFAULT_ALL_VENDOR_PACKAGES, 
  DEFAULT_ALL_VENDOR_DOCTORS,
  DEFAULT_STAFF_ACCOUNTS,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_PORTAL_SECTIONS
} from '../src/context/CmsContext';

async function main() {
  console.log('Seeding Super Admin rkmehra331996@gmail.com...');
  const rkStaff = {
    id: 'staff-rkmehra-admin',
    name: 'R. K. Mehra',
    role: 'admin',
    username: 'rkmehra331996@gmail.com',
    email: 'rkmehra331996@gmail.com',
    phone: '+91 7087033009',
    password: 'admin123',
    status: 'active',
    labId: 'all',
    labName: 'Central Diagnostic & Multi-Lab Global Network',
    branchId: 'branch-1',
    branchName: 'Main Diagnostic Hub',
    lastPasswordReset: new Date().toLocaleDateString('en-IN'),
    shift: '24x7 Master Administrator',
    notes: 'Primary Account Owner & Super Admin (rkmehra331996@gmail.com)',
    _updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'lab_staff', 'staff-rkmehra-admin'), rkStaff, { merge: true });
  console.log('-> rkmehra331996@gmail.com seeded successfully.');

  console.log('Seeding vendor labs...');
  for (const lab of VENDOR_LABS_DIRECTORY) {
    await setDoc(doc(db, 'vendor_labs', lab.id), { ...lab, _updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log('-> ' + VENDOR_LABS_DIRECTORY.length + ' vendor labs seeded.');

  console.log('Seeding lab settings...');
  for (const [labId, s] of Object.entries(DEFAULT_VENDOR_SETTINGS_MAP)) {
    await setDoc(doc(db, 'lab_settings', labId), { ...s, labId, _updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log('-> Lab settings map seeded.');

  console.log('Seeding packages...');
  for (const pkg of DEFAULT_ALL_VENDOR_PACKAGES) {
    await setDoc(doc(db, 'lab_packages', pkg.id), { ...pkg, _updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log('-> ' + DEFAULT_ALL_VENDOR_PACKAGES.length + ' packages seeded.');

  console.log('Seeding doctors...');
  for (const d of DEFAULT_ALL_VENDOR_DOCTORS) {
    await setDoc(doc(db, 'lab_doctors', d.id), { ...d, _updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log('-> ' + DEFAULT_ALL_VENDOR_DOCTORS.length + ' doctors seeded.');

  console.log('Seeding staff...');
  for (const st of DEFAULT_STAFF_ACCOUNTS) {
    await setDoc(doc(db, 'lab_staff', st.id), { ...st, _updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log('-> Staff seeded.');

  console.log('Seeding company settings & portal...');
  await setDoc(doc(db, 'company_settings', 'main'), { ...DEFAULT_COMPANY_SETTINGS, _updatedAt: new Date().toISOString() }, { merge: true });
  await setDoc(doc(db, 'portal_sections', 'main'), { ...DEFAULT_PORTAL_SECTIONS, _updatedAt: new Date().toISOString() }, { merge: true });

  console.log('COMPLETED ALL SEEDING SUCCESSFULLY!');
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
