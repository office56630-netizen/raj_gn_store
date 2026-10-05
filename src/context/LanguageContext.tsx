import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'hi' | 'en';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // App Title & Tagline
  appTitle: { en: 'CredEx Khata Book', hi: 'किराना खाता बही' },
  appSubtitle: { en: 'Kirana Store Digital Ledger', hi: 'डिजिटल उधार व जमा खाता' },

  // Navigation
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  customers: { en: 'Customers', hi: 'ग्राहक सूची' },
  transactions: { en: 'Transactions', hi: 'लेनदेन पंजी' },
  products: { en: 'Items & Products', hi: 'सामान व उत्पाद' },
  notifications: { en: 'Notifications', hi: 'सूचनाएं' },
  reports: { en: 'Reports', hi: 'खाता रिपोर्ट' },
  auditLogs: { en: 'Audit Logs', hi: 'ऑडिट लॉग' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },

  // Financial Terms
  credit: { en: 'Credit (Given)', hi: 'उधार दिया' },
  debit: { en: 'Debit (Received)', hi: 'जमा मिला' },
  advance: { en: 'Advance Deposit', hi: 'एडवांस जमा' },
  balance: { en: 'Balance Due', hi: 'बाकी राशि' },
  totalCredit: { en: 'Total Credit', hi: 'कुल दिया (उधार)' },
  totalDebit: { en: 'Total Debit', hi: 'कुल मिला (जमा)' },
  totalAdvance: { en: 'Total Advance', hi: 'कुल एडवांस' },
  netDue: { en: 'Total Outstanding', hi: 'कुल बाकी (लेना है)' },
  advanceBalance: { en: 'Advance Balance', hi: 'एडवांस शेष' },
  settled: { en: 'Settled (Zero)', hi: 'हिसाब बराबर' },

  // Common Actions
  addCredit: { en: '+ Add Credit', hi: '+ उधार जोड़ें' },
  addDebit: { en: '+ Add Debit / Payment', hi: '+ जमा करें' },
  addAdvance: { en: '+ Add Advance', hi: '+ एडवांस जमा' },
  addCustomer: { en: '+ New Account', hi: '+ नया खाता' },
  editBillAmount: { en: 'Edit Bill Amount', hi: 'बिल राशि सुधारें' },
  update: { en: 'Update', hi: 'अपडेट करें' },
  save: { en: 'Save', hi: 'सहेजें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  delete: { en: 'Delete', hi: 'हटाएं' },
  receipt: { en: 'Receipt', hi: 'पर्ची' },
  print: { en: 'Print', hi: 'प्रिंट' },
  search: { en: 'Search...', hi: 'खोजें...' },
  whatsappReminder: { en: 'WhatsApp Reminder', hi: 'WhatsApp तगादा' },
  customerPortal: { en: 'Customer Portal', hi: 'ग्राहक पोर्टल' },
  all: { en: 'All', hi: 'सभी' },

  // Auth / Login
  login: { en: 'Sign In', hi: 'लॉगिन करें' },
  register: { en: 'Create Account', hi: 'नया खाता बनाएं' },
  mobileOrEmail: { en: 'Mobile Number or Email', hi: 'मोबाइल नंबर या ईमेल' },
  mobilePlaceholder: { en: 'e.g. 9876543210 or email@domain.com', hi: 'उदा. 9876543210 या email@example.com' },
  password: { en: 'Password', hi: 'पासवर्ड' },
  passwordPlaceholder: { en: 'Enter your password', hi: 'पासवर्ड दर्ज करें' },
  fullName: { en: 'Full Name', hi: 'पूरा नाम' },
  mobileNumber: { en: 'Mobile Number', hi: 'मोबाइल नंबर' },
  optionalEmail: { en: 'Email (Optional)', hi: 'ईमेल (वैकल्पिक)' },
  role: { en: 'Account Type', hi: 'खाते का प्रकार' },
  shopkeeper: { en: 'Shopkeeper / Admin', hi: 'दुकानदार / एडमिन' },
  customerRole: { en: 'Customer Account', hi: 'ग्राहक खाता' },
  secureLogin: { en: 'Secure Ledger · Mobile or Email Login', hi: 'सुरक्षित डेटाबेस · मोबाइल या ईमेल से लॉगिन' },

  // Legal
  privacyPolicy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  termsConditions: { en: 'Terms & Conditions', hi: 'नियम व शर्तें' },
  legalNotice: { en: 'By signing in, you agree to our Terms & Conditions and Privacy Policy.', hi: 'साइन इन करके आप हमारे नियम व शर्तों तथा गोपनीयता नीति से सहमत होते हैं।' },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'hi',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('credex_lang');
    return saved === 'en' || saved === 'hi' ? saved : 'hi';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('credex_lang', newLang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][lang] || translations[key].hi || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold ${className}`}>
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          lang === 'hi'
            ? 'bg-white text-slate-900 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          lang === 'en'
            ? 'bg-white text-slate-900 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        English
      </button>
    </div>
  );
};
