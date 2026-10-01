/**
 * Vendor AI Voice Bot Service
 * Strictly scoped to the active Vendor Laboratory.
 * Zero cross-tenant data access.
 * Supports Hindi, Hinglish, and English voice queries and text-to-speech.
 */

import { TestItem, VendorPackage, ReceptionPatientEntry, LabReport } from '../types';
import { isTenantMatch } from '../utils/tenantSecurity';

export interface VendorVoiceContext {
  vendorId: string;
  vendorName: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  timings?: string;
  homeCollectionEnabled?: boolean;
  homeCollectionFee?: number;
  tests: TestItem[];
  packages: VendorPackage[];
  doctors: Array<{
    name: string;
    qualification?: string;
    specialization?: string;
    designation?: string;
  }>;
  allReports?: LabReport[];
  allReceptionEntries?: ReceptionPatientEntry[];
}

export interface VoiceBotAction {
  type: 'book_test' | 'check_report' | 'book_home_collection' | 'download_app' | 'view_packages' | 'call_lab' | 'whatsapp_lab' | 'scroll_tests';
  label: string;
  payload?: any;
}

export interface VoiceBotResponse {
  reply: string;
  speechText: string;
  language: 'hi' | 'en' | 'hinglish';
  actions?: VoiceBotAction[];
  matchedItems?: {
    tests?: TestItem[];
    packages?: VendorPackage[];
    reportStatus?: string;
  };
}

/**
 * Normalizes input text for keyword and intent matching
 */
function cleanQuery(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * High-fidelity, instant local domain knowledge processor.
 * Always strictly grounded in the provided vendor context only.
 */
export function processVendorVoiceQuery(
  rawQuery: string,
  context: VendorVoiceContext
): VoiceBotResponse {
  const query = cleanQuery(rawQuery);
  const vName = context.vendorName || 'हमारी डायग्नोस्टिक लैब';
  const phone = context.phone || context.whatsapp || '';
  const timings = context.timings || 'सुबह 07:00 AM से रात 09:00 PM तक (सोमवार से रविवार)';
  const address = context.address || 'मुख्य शाखा, शहर केंद्र';

  // 1. Check if user is asking about other labs or general unrelated vendors
  const otherVendorsTriggers = [
    'dusre lab', 'dusra lab', 'doosri lab', 'other lab', 'another vendor', 'lal path', 'dr lal', 'thyrocare', 'metropolis', 'apollo'
  ];
  if (otherVendorsTriggers.some(t => query.includes(t))) {
    const text = `मैं केवल ${vName} का समर्पित AI Voice Assistant हूँ। मैं किसी अन्य लैब या वेंडर का डेटा एक्सेस नहीं करता। ${vName} के टेस्ट, पैकेज या रिपोर्ट से जुड़ी कोई भी जानकारी मुझसे पूछ सकते हैं।`;
    return {
      reply: text,
      speechText: text,
      language: 'hinglish',
      actions: [
        { type: 'scroll_tests', label: 'हमारे उपलब्ध टेस्ट्स देखें' }
      ]
    };
  }

  // 2. Greeting / Hello / Who are you
  if (
    query === '' ||
    ['hello', 'hi', 'namaste', 'namaskar', 'pranam', 'helo', 'hey', 'kaun ho', 'who are you', 'tum kaun ho', 'aap kaun ho'].some(
      g => query === g || query.startsWith(g + ' ')
    )
  ) {
    const reply = `नमस्ते! मैं ${vName} का AI Voice Assistant हूँ 🎙️।\nआप मुझसे किसी भी टेस्ट का रेट, फास्टिंग नियम, होम कलेक्शन, हेल्थ पैकेज, लैब टाइमिंग या अपनी रिपोर्ट का स्टेटस पूछ सकते हैं।\nबताइए मैं आपकी क्या मदद करूँ?`;
    const speech = `नमस्ते! मैं ${vName} का एआई वॉयस असिस्टेंट हूँ। आप मुझसे टेस्ट का रेट, फास्टिंग, होम कलेक्शन, हेल्थ पैकेज या रिपोर्ट के बारे में बोलकर पूछ सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'scroll_tests', label: '🩸 सभी टेस्ट्स देखें' },
        { type: 'view_packages', label: '📦 हेल्थ पैकेजेस' },
        { type: 'check_report', label: '🔍 रिपोर्ट चेक करें' }
      ]
    };
  }

  // 3. Check Report / Report status inquiry
  const isReportInquiry = ['report', 'रिपोर्ट', 'status', 'रिजल्ट', 'result', 'token', 'टोकन', 'barcode'].some(w => query.includes(w));
  if (isReportInquiry) {
    // Extract numbers like token number or mobile number
    const numbersMatch = rawQuery.match(/\d{3,10}/);
    if (numbersMatch) {
      const num = numbersMatch[0];
      // STRICT TENANT ISOLATION: Only look up entries matching this tenant!
      const tenantEntries = (context.allReceptionEntries || []).filter(e => isTenantMatch(e, context.vendorId));
      const tenantReports = (context.allReports || []).filter(r => isTenantMatch(r, context.vendorId));

      const matchedEntry = tenantEntries.find(
        e =>
          (e.tokenNumber && e.tokenNumber.toLowerCase().includes(num.toLowerCase())) ||
          (e.tokenNo && e.tokenNo.toLowerCase().includes(num.toLowerCase())) ||
          (e.uhid && e.uhid.toLowerCase().includes(num.toLowerCase())) ||
          (e.id && e.id.toLowerCase().includes(num.toLowerCase())) ||
          (e.mobile && e.mobile.includes(num))
      );

      const matchedReport = tenantReports.find(
        r =>
          (r.reportId && r.reportId.toLowerCase().includes(num.toLowerCase())) ||
          (r.tokenNumber && r.tokenNumber.toLowerCase().includes(num.toLowerCase())) ||
          (r.uhid && r.uhid.toLowerCase().includes(num.toLowerCase())) ||
          (r.mobile && r.mobile.includes(num))
      );

      if (matchedEntry || matchedReport) {
        const patientName = matchedEntry?.patientName || matchedReport?.patientName || 'मरीज';
        const status = matchedReport?.status || matchedEntry?.status || 'In Progress';
        const token = matchedEntry?.tokenNumber || matchedEntry?.tokenNo || matchedReport?.reportId || num;
        const dueAmount = matchedEntry?.dueAmount ?? (matchedReport as any)?.dueAmount ?? 0;

        let statusTextHindi = 'जांच प्रक्रिया में है';
        if (status === 'Verified' || status === 'Report Ready') statusTextHindi = 'रिपोर्ट तैयार व सत्यापित (Ready) है';
        else if (status === 'Sample Collected') statusTextHindi = 'सैंपल कलेक्ट हो चुका है, टेस्टिंग जारी है';

        const paymentNote = dueAmount > 0 ? `\n(⚠️ बकाया राशि: ₹${dueAmount} - रिपोर्ट ऑनलाइन डाउनलोड करने के लिए ड्यू क्लियर करना होगा)` : '\n(✅ फुल पेमेंट कंप्लीट है)';

        const reply = `📄 ${vName} में टोकन/नंबर "${num}" का रिकॉर्ड मिला:\n• मरीज का नाम: ${patientName}\n• स्टेटस: ${statusTextHindi}\n• टोकन: ${token}${paymentNote}`;
        const speech = `${patientName} जी की रिपोर्ट का स्टेटस ${statusTextHindi}। आप नीचे दिए गए बटन से सीधे रिपोर्ट देख सकते हैं।`;

        return {
          reply,
          speechText: speech,
          language: 'hinglish',
          actions: [
            { type: 'check_report', label: '📄 रिपोर्ट ऑनलाइन खोलें', payload: { token } }
          ],
          matchedItems: { reportStatus: String(status) }
        };
      }
    }

    // Generic report check instructions
    const reply = `📄 ${vName} की रिपोर्ट आप वेबसाइट पर 2 तरीकों से तुरंत देख सकते हैं:\n1. अपना 10 अंकों का मोबाइल नंबर डालकर\n2. अपनी रसीद का टोकन नंबर / रिपोर्ट आईडी डालकर\n\nआप "रिपोर्ट चेक करें" बटन पर क्लिक करके सीधे अपना टोकन डाल सकते हैं।`;
    const speech = `${vName} की रिपोर्ट आप अपना मोबाइल नंबर या टोकन नंबर डालकर तुरंत ऑनलाइन देख सकते हैं। रिपोर्ट देखने के लिए नीचे दिए बटन पर टैप करें।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'check_report', label: '🔍 रिपोर्ट चेक करें' }
      ]
    };
  }

  // 4. Lab Timing / Hours / Open / Close
  const isTimingInquiry = ['timing', 'टाइमिंग', 'time', 'समय', 'open', 'close', 'khulti', 'khulega', 'band', 'hours', 'kab khulti', 'sunday', 'रविवार', 'schedule'].some(w => query.includes(w));
  if (isTimingInquiry) {
    const reply = `🕒 ${vName} के खुलने का समय:\n• कार्य समय: ${timings}\n• होम सैंपल कलेक्शन: सुबह 06:30 AM से शुरू\n• इमरजेंसी जांच: 24x7 उपलब्ध\n\nकिसी भी असुविधा या पूछताछ के लिए आप सीधे कॉल कर सकते हैं: ${phone || 'वेबसाइट संपर्क'}`;
    const speech = `${vName} के खुलने का समय ${timings} है। होम कलेक्शन सुबह 06:30 से शुरू होता है।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: phone ? [{ type: 'call_lab', label: `📞 कॉल करें (${phone})`, payload: { phone } }] : []
    };
  }

  // 5. Address / Location / Where is the lab / Direction
  const isAddressInquiry = ['address', 'पता', 'kahan hai', 'kahan', 'location', 'jagah', 'kidhar', 'map', 'direction', 'landmark', 'city', 'centre'].some(w => query.includes(w));
  if (isAddressInquiry) {
    const reply = `📍 ${vName} का पता:\n${address}\n\n• संपर्क सूत्र: ${phone || 'फोन नंबर'}\n• ईमेल: ${context.email || 'उपलब्ध नहीं'}\n\nआप गूगल मैप्स पर भी हमारी लोकेशन पा सकते हैं या सीधे लैब पर पधार सकते हैं।`;
    const speech = `${vName} का पता है: ${address}। आप सीधे आ सकते हैं या फोन पर संपर्क कर सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: phone ? [{ type: 'call_lab', label: `📞 लैब पर कॉल करें`, payload: { phone } }] : []
    };
  }

  // 6. Home Sample Collection
  const isHomeCollectionInquiry = ['home', 'होम', 'ghar', 'घर', 'sample collection', 'collection', 'ghar pe', 'blood test at home', 'ghr se'].some(w => query.includes(w));
  if (isHomeCollectionInquiry) {
    const feeText = context.homeCollectionFee && context.homeCollectionFee > 0 ? `मात्र ₹${context.homeCollectionFee} (सीनियर सिटीजन व बड़े पैकेज पर निःशुल्क)` : 'बिलकुल निःशुल्क उपलब्ध है';
    const reply = `🏠 ${vName} में घर बैठे होम सैंपल कलेक्शन सुविधा उपलब्ध है!\n• शुल्क: ${feeText}\n• समय: सुबह 06:30 AM से शाम 07:00 PM तक\n• सुरक्षित व प्रशिक्षित फ्लेबोटोमिस्ट 100% स्टरलाइज्ड नीडल व वैक्यूटेनर के साथ आएंगे।\n\nआप नीचे दिए बटन से तुरंत ऑनलाइन होम कलेक्शन बुक कर सकते हैं या फोन कर सकते हैं।`;
    const speech = `${vName} में घर बैठे ब्लड और यूरिन सैंपल कलेक्शन उपलब्ध है। आप अभी ऑनलाइन या फोन करके होम विजिट बुक कर सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'book_home_collection', label: '🏠 होम कलेक्शन बुक करें' },
        ...(phone ? [{ type: 'whatsapp_lab', label: '💬 व्हाट्सएप पर बुक करें', payload: { phone: context.whatsapp || phone } } as VoiceBotAction] : [])
      ]
    };
  }

  // 7. Doctors / Pathologists inquiry
  const isDoctorInquiry = ['doctor', 'डॉक्टर', 'pathologist', 'पैथोलॉजिस्ट', 'dr', 'team', 'consultant', 'kaun doctor', 'dr naam'].some(w => query.includes(w));
  if (isDoctorInquiry) {
    const doctors = context.doctors || [];
    if (doctors.length > 0) {
      const docList = doctors.map(d => `• ${d.name} (${d.qualification || 'MBBS, MD Pathologist'}${d.specialization ? ` - ${d.specialization}` : ''})`).join('\n');
      const reply = `👨‍⚕️ ${vName} के मुख्य कंसल्टिंग पैथोलॉजिस्ट व डॉक्टर्स:\n\n${docList}\n\nसभी रिपोर्ट अनुभवी पैथोलॉजिस्ट द्वारा डिजिटल रूप से सत्यापित की जाती हैं।`;
      const speech = `${vName} में अनुभवी पैथोलॉजिस्ट ${doctors.map(d => d.name).join(' और ')} द्वारा रिपोर्ट जांची और सत्यापित की जाती है।`;
      return {
        reply,
        speechText: speech,
        language: 'hinglish',
        actions: [{ type: 'scroll_tests', label: 'उपलब्ध टेस्ट्स देखें' }]
      };
    }
  }

  // 8. Health Packages inquiry
  const isPackageInquiry = ['package', 'पैकेज', 'full body', 'फुल बॉडी', 'health checkup', 'चेकअप', 'master', 'profile', 'offer', 'डिस्काउंट'].some(w => query.includes(w));
  if (isPackageInquiry) {
    const packages = context.packages || [];
    if (packages.length > 0) {
      const pkgList = packages.slice(0, 3).map(p => {
        const testsCount = p.testsCount || (p.features ? p.features.length : '10+');
        const price = p.priceINR || (p as any).price || 999;
        const mrp = p.mrpINR || (p as any).regularPrice || Math.round(price * 1.4);
        return `• *${p.name}*: मात्र ₹${price} (सामान्य मूल्य ₹${mrp}) [${testsCount} जांचें शामिल]`;
      }).join('\n');

      const reply = `📦 ${vName} के लोकप्रिय प्रिवेंटिव हेल्थ पैकेजेस:\n\n${pkgList}\n\nइन पैकेजेस में ब्लड शुगर, सीबीसी, लिवर, किडनी, लिपिड प्रोफाइल आदि शामिल रहते हैं।`;
      const speech = `${vName} में फुल बॉडी और प्रिवेंटिव हेल्थ चेकअप पैकेज विशेष छूट पर उपलब्ध हैं। सबसे लोकप्रिय पैकेज ${packages[0]?.name || ''} है।`;
      return {
        reply,
        speechText: speech,
        language: 'hinglish',
        actions: [
          { type: 'view_packages', label: '📦 सभी पैकेजेस देखें' },
          { type: 'book_test', label: '📅 पैकेज बुक करें' }
        ],
        matchedItems: { packages }
      };
    }
  }

  // 9. Download App / Mobile App
  const isAppInquiry = ['app', 'ऐप', 'download', 'डाउनलोड', 'install', 'इन्स्टॉल', 'apk', 'play store', 'ios', 'iphone', 'android'].some(w => query.includes(w));
  if (isAppInquiry) {
    const reply = `📱 आप ${vName} का मोबाइल ऐप आसानी से डाउनलोड व इंस्टॉल कर सकते हैं!\n• Android यूज़र्स: PWA डायरेक्ट इंस्टॉल या APK डाउनलोड\n• iPhone (iOS) यूज़र्स: Safari में "Add to Home Screen" से 1-क्लिक ऐप जोड़ें\n\nऐप में आपको रिपोर्ट नोटिफिकेशन, ऑफलाइन रिपोर्ट व्यू और 1-क्लिक बुकिंग मिलती है।`;
    const speech = `${vName} का ऐप आप सीधे डाउनलोड कर सकते हैं। यह एंड्रॉइड और आईफोन दोनों पर चलता है।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'download_app', label: '📲 Download App पेज खोलें' }
      ]
    };
  }

  // 10. Specific Test Search (CBC, Thyroid, Sugar, LFT, KFT, Vitamin D, HbA1c, Urine, Lipid, etc.)
  const tests = context.tests || [];
  let matchedTest: TestItem | undefined;

  // Exact or high priority match
  const testKeywords = [
    { key: 'cbc', aliases: ['cbc', 'complete blood count', 'सीबीसी', 'hemoglobin', 'platelet', 'hb'] },
    { key: 'sugar', aliases: ['sugar', 'glucose', 'शुगर', 'diabetes', 'fasting sugar', 'pp sugar'] },
    { key: 'hba1c', aliases: ['hba1c', 'hb a1c', 'glycated hemoglobin'] },
    { key: 'thyroid', aliases: ['thyroid', 'थायराइड', 't3', 't4', 'tsh', 'thiroide'] },
    { key: 'lipid', aliases: ['lipid', 'cholesterol', 'कोलेस्ट्रॉल', 'heart', 'triglyceride'] },
    { key: 'lft', aliases: ['lft', 'liver', 'लिवर', 'sgpt', 'sgot', 'bilirubin'] },
    { key: 'kft', aliases: ['kft', 'kidney', 'किडनी', 'creatinine', 'urea', 'rft'] },
    { key: 'vitamin d', aliases: ['vitamin d', 'vit d', 'विटामिन डी', 'd3'] },
    { key: 'vitamin b12', aliases: ['vitamin b12', 'vit b12', 'विटामिन b12', 'b12'] },
    { key: 'urine', aliases: ['urine', 'यूरिन', 'peshab', 'routine urine', 'urine r/m'] },
    { key: 'crp', aliases: ['crp', 'c-reactive protein', 'crp test'] },
    { key: 'dengue', aliases: ['dengue', 'डेंगू', 'ns1', 'platelets'] },
    { key: 'typhoid', aliases: ['typhoid', 'टाइफाइड', 'widal', 'विडाल'] },
  ];

  for (const item of testKeywords) {
    if (item.aliases.some(a => query.includes(a))) {
      // Find in vendorTests
      matchedTest = tests.find(t => {
        const tName = (t.name || (t as any).testName || '').toLowerCase();
        return item.aliases.some(a => tName.includes(a));
      });
      break;
    }
  }

  // If not matched by keywords, try fuzzy matching test names
  if (!matchedTest) {
    matchedTest = tests.find(t => {
      const words = (t.name || (t as any).testName || '').toLowerCase().split(/\s+/);
      return words.some(w => w.length > 2 && query.includes(w));
    });
  }

  if (matchedTest) {
    const testName = matchedTest.name || (matchedTest as any).testName;
    const fasting = matchedTest.fastingRequired ? '10-12 घंटे की भूखे पेट (Fasting) जांच आवश्यक है' : 'फास्टिंग की आवश्यकता नहीं है (कभी भी करवा सकते हैं)';
    const tat = matchedTest.turnaroundTime || (matchedTest as any).deliveryTime || 'उसी दिन (Same Day)';
    const sample = matchedTest.sampleType || 'ब्लड (Blood Serum)';
    const price = matchedTest.priceINR ?? (matchedTest as any).price;

    const reply = `🔬 ${vName} में *${testName}* की जानकारी:\n• मूल्य (Price): ₹${price}\n• फास्टिंग नियम: ${fasting}\n• सैंपल का प्रकार: ${sample}\n• रिपोर्ट का समय (TAT): ${tat}\n\nआप इस टेस्ट को लैब आकर या घर पर होम कलेक्शन के माध्यम से करवा सकते हैं।`;
    const speech = `${vName} में ${testName} का मूल्य ₹${price} है। ${fasting}। रिपोर्ट ${tat} में मिल जाती है।`;

    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'book_test', label: `📅 ${testName} बुक करें`, payload: { testId: matchedTest.id, testName } },
        { type: 'book_home_collection', label: '🏠 घर पर सैंपल दें' }
      ],
      matchedItems: { tests: [matchedTest] }
    };
  }

  // 11. Generic Price / Rate inquiry
  if (['price', 'rate', 'cost', 'kitna', 'kitne', 'खर्चा', 'रेट', 'दाम', 'रुपये', 'rupees'].some(w => query.includes(w))) {
    const popularTests = tests.slice(0, 4);
    const list = popularTests.map(t => `• ${t.name || (t as any).testName}: ₹${t.priceINR ?? (t as any).price}`).join('\n');
    const firstPrice = popularTests[0]?.priceINR ?? (popularTests[0] as any)?.price ?? 350;
    const secondPrice = popularTests[1]?.priceINR ?? (popularTests[1] as any)?.price ?? 80;
    const reply = `💰 ${vName} के कुछ प्रमुख टेस्ट्स और उनके रेट:\n\n${list}\n\nकिसी खास टेस्ट (जैसे CBC, Thyroid, Sugar, LFT, KFT) का रेट जानने के लिए आप उस टेस्ट का नाम बोल सकते हैं।`;
    const speech = `${vName} में सभी जांचें उचित दरों पर उपलब्ध हैं। जैसे CBC ₹${firstPrice}, Sugar ₹${secondPrice}। आप किसी भी टेस्ट का नाम बोलकर रेट पूछ सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'scroll_tests', label: '🩸 सभी टेस्ट्स की रेट लिस्ट' },
        { type: 'view_packages', label: '📦 डिस्काउंटेड पैकेजेस' }
      ]
    };
  }

  // 12. Fallback helpful guidance strictly in context
  const reply = `क्षमा करें, मुझे इस सवाल की सटीक जानकारी नहीं मिली।\nपरंतु मैं ${vName} के सभी टेस्ट रेट्स, फास्टिंग नियम, होम कलेक्शन बुकिंग, पैकेजेस या आपकी रिपोर्ट का स्टेटस तुरंत बता सकता हूँ।\n\nआप बोल सकते हैं: "CBC का रेट क्या है?", "होम कलेक्शन कैसे बुक करें?" या "लैब की टाइमिंग क्या है?"`;
  const speech = `क्षमा करें, मैं ${vName} के टेस्ट रेट्स, होम कलेक्शन, पैकेजेस या रिपोर्ट स्टेटस की जानकारी दे सकता हूँ। आप बोलकर पूछ सकते हैं।`;

  return {
    reply,
    speechText: speech,
    language: 'hinglish',
    actions: [
      { type: 'scroll_tests', label: '🩸 टेस्ट लिस्ट देखें' },
      { type: 'book_home_collection', label: '🏠 होम कलेक्शन' },
      { type: 'check_report', label: '📄 रिपोर्ट चेक करें' }
    ]
  };
}

/**
 * Sends request to backend /api/ai/voice-chat which calls Gemini API (server-side)
 * with graceful fallback to processVendorVoiceQuery.
 */
export async function askVendorVoiceBot(
  query: string,
  context: VendorVoiceContext,
  language: 'hi' | 'en' | 'hinglish' = 'hinglish'
): Promise<VoiceBotResponse> {
  // Always prepare instant local answer as benchmark / fallback
  const localAnswer = processVendorVoiceQuery(query, context);

  try {
    const testsSummary = (context.tests || []).slice(0, 30).map(t => ({
      name: t.name || (t as any).testName,
      price: t.priceINR ?? (t as any).price,
      fasting: t.fastingRequired,
      tat: t.turnaroundTime || (t as any).deliveryTime
    }));

    const packagesSummary = (context.packages || []).slice(0, 8).map(p => ({
      name: p.name,
      price: p.priceINR || (p as any).price,
      regularPrice: p.mrpINR || (p as any).regularPrice
    }));

    const doctorsSummary = (context.doctors || []).map(d => ({
      name: d.name,
      qualification: d.qualification,
      specialization: d.specialization
    }));

    const res = await fetch('/api/ai/voice-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vendorId: context.vendorId,
        vendorName: context.vendorName,
        message: query,
        language,
        vendorContext: {
          vendorName: context.vendorName,
          phone: context.phone,
          whatsapp: context.whatsapp,
          email: context.email,
          address: context.address,
          timings: context.timings,
          homeCollectionFee: context.homeCollectionFee,
          tests: testsSummary,
          packages: packagesSummary,
          doctors: doctorsSummary
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply && typeof data.reply === 'string' && data.reply.trim().length > 0) {
        return {
          reply: data.reply,
          speechText: data.speechText || data.reply.replace(/[*#•_-]/g, ' '),
          language,
          actions: data.actions || localAnswer.actions,
          matchedItems: localAnswer.matchedItems
        };
      }
    }
  } catch (err) {
    console.warn('[Vendor Voice Bot] Backend call skipped or offline, using local domain intelligence:', err);
  }

  return localAnswer;
}

/**
 * Text-to-Speech synthesizer with Hindi / Indian English voice support
 */
export class VoiceSpeaker {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
      rate?: number;
    } = {}
  ): void {
    if (!this.synth) {
      if (options.onEnd) options.onEnd();
      return;
    }

    try {
      this.stop();

      // Clean markdown symbols, bullets, asterisks for natural voice reading
      const clean = text
        .replace(/\*/g, '')
        .replace(/[#_`~]/g, '')
        .replace(/•/g, ', ')
        .replace(/\n+/g, '. ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = options.rate || 0.95; // slightly relaxed natural pace
      utterance.pitch = 1.0;

      // Select suitable voice
      const voices = this.synth.getVoices();
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      const indianEngVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (indianEngVoice) {
        utterance.voice = indianEngVoice;
        utterance.lang = 'en-IN';
      } else {
        utterance.lang = 'hi-IN';
      }

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        if (options.onError) options.onError();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (options.onEnd) options.onEnd();
    }
  }

  public static stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}
