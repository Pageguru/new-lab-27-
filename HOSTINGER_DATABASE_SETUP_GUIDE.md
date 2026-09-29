# INDIANLALAJI.COM - Hostinger Server & Database Setup Guide
**100% Hostinger Native - Zero Firebase Dependency**

---

## 🚀 Overview (ओवरव्यू)
आपका सॉफ़्टवेयर अब **पूरी तरह से Hostinger Server और Database से कनेक्ट** है। इसमें Firebase का कोई इस्तेमाल नहीं हो रहा है।
जो भी बदलाव (Images, Text, Add, Edit, Delete, Update, Lab Settings, Products/Packages, Tests, Reception Token, Reports) होंगे:
1. वे सीधे **Hostinger Server / Database** में सुरक्षित सेव होंगे।
2. **Auto Multi-Device Real-Time Sync:** हर 2.5 सेकंड में ऑटो-सिंक एक्टिव रहता है। जैसे ही काउंटर 1 (Device A) पर कोई नया टोकन या टेस्ट ऐड होगा, काउंटर 2 (Device B / Technician) और पैथोलॉजिस्ट डेस्क पर बिना पेज रीलोड किए तुरंत नया डेटा दिख जाएगा।
3. **Image & File Uploads:** लैब लोगो, डॉक्टर के डिजिटल सिग्नेचर, प्रिस्क्रिप्शन और टेस्ट इमेज सीधे Hostinger के `uploads/` फ़ोल्डर में सेव होते हैं।

---

## 📁 Dist Folder Contents (Hostinger `public_html` में अपलोड के लिए)
जब आप `dist` फ़ोल्डर को Hostinger के File Manager में `public_html` के अंदर अपलोड करेंगे:
- `index.html` → मुख्य ऐप
- `assets/` → सभी CSS, JS और ऑप्टिमाइज़्ड इमेजेस
- `api/` → Hostinger PHP API:
  - `config.php` → डेटाबेस क्रेडेंशियल्स और कनेक्शन
  - `sync.php` → रियल-टाइम मल्टी-डिवाइस डेटा सिंक इंजन
  - `upload.php` → इमेज व सिग्नेचर अपलोड हैंडलर
  - `status.php` → सर्वर हेल्थ व स्टेटस चेक
- `uploads/` → अपलोड की गई सभी इमेजेस का फ़ोल्डर
- `.htaccess` → Apache / LiteSpeed रूटिंग व स्पीड ऑप्टिमाइज़ेशन

---

## 🗄️ Database Options on Hostinger (दो विकल्प)

### Option 1: Zero-Config Auto Mode (तुरंत चालू - बिना किसी सेटअप के)
- आपको कुछ भी कॉन्फ़िगर करने की ज़रूरत नहीं है!
- सॉफ़्टवेयर में **हाई-परफ़ॉर्मेंस JSON डेटाबेस इंजन (`api/data/`)** अंतर्निहित (built-in) है।
- जैसे ही आप फ़ाइलें `public_html` में डालेंगे, यह तुरंत काम करना शुरू कर देगा। सभी ऐड, एडिट, डिलीट, इमेज अपलोड 100% सुरक्षित सेव होंगे।

### Option 2: Hostinger MySQL Database (अनुशंसित)
यदि आप Hostinger का MySQL डेटाबेस इस्तेमाल करना चाहते हैं:
1. **Hostinger hPanel** में जाएं → **Databases** पर क्लिक करें।
2. एक नया Database और User बनाएं (उदा. `u123456_healthcare` और यूजर `u123456_user`).
3. **phpMyAdmin** खोलें और रूट डायरेक्टरी में मौजूद `hostinger_database_schema.sql` फ़ाइल को **Import** करें।
4. `api/config.php` फ़ाइल में अपने क्रेडेंशियल्स दर्ज करें:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_mysql_username');
   define('DB_PASS', 'your_mysql_password');
   define('DB_NAME', 'your_mysql_database_name');
   ```

---

## ⚡ Multi-Device Real-Time Sync कैसे काम करता है?
1. जब रिसेप्शनिस्ट काउंटर पर पेशेंट का टोकन जनरेट करता है:
   - डेटा तुरंत Hostinger API (`/api/sync.php`) पर सेव होता है।
2. लैब में बैठे टेक्नीशियन और पैथोलॉजिस्ट का कंप्यूटर हर 2-3 सेकंड में सर्वर से नया डेटा ऑटोमैटिक पुल कर लेता है।
3. किसी भी डिवाइस पर पेज रिफ्रेश (F5) करने की ज़रूरत नहीं है, सब कुछ लाइव अपडेट होता है।
