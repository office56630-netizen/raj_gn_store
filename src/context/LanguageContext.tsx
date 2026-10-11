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
  cashbook: { en: 'Daily Cashbook & Galla', hi: 'दैनिक रोकड़ बही (गल्ला)' },
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

  // Cashbook Terms
  openingCash: { en: 'Morning Galla / Opening Cash', hi: 'सुबह का गल्ला (शुरुआती रोकड़)' },
  directSales: { en: 'Direct Counter Cash Sales', hi: 'दुकान नकद बिक्री' },
  khataCollections: { en: 'Udhar Cash Collections', hi: 'उधार वसूली (नकद)' },
  onlineSales: { en: 'UPI / Online Sales', hi: 'ऑनलाइन / UPI बिक्री' },
  supplierPayments: { en: 'Purchases & Supplier Payments', hi: 'दुकान खरीद व सप्लायर भुगतान' },
  denominations: { en: 'Note & Coin Tally', hi: 'नोट और सिक्का गणना (गल्ला मिलान)' },
  notes: { en: 'Currency Notes', hi: 'कागजी नोट (Notes)' },
  coins: { en: 'Indian Coins', hi: 'भारतीय सिक्के (Coins)' },
  coin10: { en: '₹10 Coin', hi: '₹10 का सिक्का' },
  coin5: { en: '₹5 Coin', hi: '₹5 का सिक्का' },
  coin2: { en: '₹2 Coin', hi: '₹2 का सिक्का' },
  coin1: { en: '₹1 Coin', hi: '₹1 का सिक्का' },
  otherCoins: { en: 'Loose / Other Coins (₹)', hi: 'अन्य खुले सिक्के (कुल ₹)' },
  countedCash: { en: 'Total Physical Cash Counted', hi: 'गल्ले में कुल नकद (गिना गया)' },
  expectedCash: { en: 'Expected Closing Cash', hi: 'खाता अनुसार शेष रोकड़' },
  cashVariance: { en: 'Tally Difference', hi: 'रोकड़ मिलान अंतर' },
  matched: { en: 'Matched (Balanced)', hi: 'हिसाब बराबर' },
  shortage: { en: 'Cash Shortage (Loss/Missing)', hi: 'गल्ला कम है (कमी)' },
  surplus: { en: 'Cash Surplus (Extra)', hi: 'गल्ला अधिक है (फालतू)' },

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

export const LanguageSelector: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-bold shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer text-[11px] sm:text-xs ${
          lang === 'hi'
            ? 'bg-white text-slate-900 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="हिंदी भाषा चुनें"
      >
        {compact ? 'हिं' : 'हिंदी'}
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer text-[11px] sm:text-xs ${
          lang === 'en'
            ? 'bg-white text-slate-900 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Switch to English"
      >
        {compact ? 'EN' : 'English'}
      </button>
    </div>
  );
};
