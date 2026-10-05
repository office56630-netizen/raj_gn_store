import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, Store } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const { lang } = useLanguage();
  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                isPrivacy ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {isPrivacy ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isPrivacy
                  ? lang === 'hi'
                    ? 'गोपनीयता नीति (Privacy Policy)'
                    : 'Privacy Policy'
                  : lang === 'hi'
                  ? 'नियम एवं शर्तें (Terms & Conditions)'
                  : 'Terms & Conditions'}
              </h3>
              <p className="text-[11px] text-slate-500">
                CredEx Kirana Store Digital Khata &amp; Ledger Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
          {isPrivacy ? (
            /* PRIVACY POLICY */
            <>
              {lang === 'hi' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      आपकी व्यक्तिगत जानकारी और खाते का बही-खाता पूरी तरह सुरक्षित व गोपनीय है।
                    </span>
                  </div>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">1. एकत्र की जाने वाली जानकारी (Data We Collect)</h4>
                    <p>
                      किराना खाता बही का उपयोग करते समय हम केवल आवश्यक व्यावसायिक जानकारी एकत्र करते हैं:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>ग्राहक का नाम, मोबाइल नंबर, और दुकान का पता।</li>
                      <li>उधार (Credit), जमा (Debit), और अग्रिम (Advance) लेनदेन का विवरण एवं तारीख।</li>
                      <li>बिल की पर्ची संख्या, खरीदे गए सामान का नाम एवं मात्रा।</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">2. जानकारी का उपयोग (Purpose of Data Use)</h4>
                    <p>
                      हम आपकी जानकारी का उपयोग केवल निम्नलिखित कार्यों के लिए करते हैं:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>दुकान और ग्राहक के बीच सटीक हिसाब-किताब बनाए रखना।</li>
                      <li>व्हाट्सएप (WhatsApp) या एसएमएस द्वारा शेष बाकी राशि की सूचना भेजना।</li>
                      <li>पारदर्शी खाता विवरण (Digital Ledger) और रसीद उपलब्ध कराना।</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">3. डेटा सुरक्षा व गोपनीयता (Data Protection)</h4>
                    <p>
                      हमारा सिस्टम उद्योग मानक एन्क्रिप्शन (Bcrypt, JWT) और सुरक्षित डेटाबेस का उपयोग करता है। हम किसी भी तीसरे पक्ष (Third Party) या विज्ञापन कंपनी को आपका डेटा न तो बेचते हैं और न ही साझा करते हैं।
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">4. आपके अधिकार (Your Rights)</h4>
                    <p>
                      प्रत्येक ग्राहक को अपने मोबाइल नंबर से लॉगिन करके अपने खाते का संपूर्ण विवरण देखने, पर्ची डाउनलोड करने, या किसी विसंगति की स्थिति में सुधार का अनुरोध करने का पूर्ण अधिकार है।
                    </p>
                  </section>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your personal ledger and accounting records are strictly encrypted and confidential.</span>
                  </div>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">1. Information We Collect</h4>
                    <p>
                      When utilizing CredEx Digital Khata, we collect only essential commercial and accounting data:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Customer name, contact phone number, and store/address details.</li>
                      <li>Credit (Udhar), Debit (Jama), and Advance payment entries with timestamps.</li>
                      <li>Itemized invoice references, descriptions, and audit history.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">2. How We Use Your Information</h4>
                    <p>We use this data exclusively for:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Maintaining accurate real-time balance calculations between merchant and customer.</li>
                      <li>Generating digital receipts, invoices, and automated payment reminders via WhatsApp/SMS.</li>
                      <li>Audit logging for transparent transaction verification.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">3. Security & Non-Disclosure</h4>
                    <p>
                      All customer records and merchant credentials are protected using industry-grade password hashing (Bcrypt) and secure token authorization. We do not sell, rent, or share personal data with external third parties.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">4. User Rights</h4>
                    <p>
                      Customers have the right to access their complete running ledger statement anytime using their registered mobile number, verify invoice receipts, and request corrections for discrepancies.
                    </p>
                  </section>
                </div>
              )}
            </>
          ) : (
            /* TERMS & CONDITIONS */
            <>
              {lang === 'hi' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      किराना स्टोर डिजिटल खाता बही के उपयोग संबंधी नियम व शर्तें।
                    </span>
                  </div>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">1. खाता एवं सेवा का उपयोग (Account Usage)</h4>
                    <p>
                      यह डिजिटल प्लेटफॉर्म किराना दुकानदारों और ग्राहकों के बीच सामान उधार (Credit) तथा भुगतान (Debit) का डिजिटल रिकॉर्ड संधारित करने के लिए प्रदान किया गया है।
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">2. उधार (Credit) एवं भुगतान की शर्तें (Repayment Terms)</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>दुकानदार द्वारा दर्ज किया गया उधार सामान ग्राहक की सहमति से खाते में दर्ज होता है।</li>
                      <li>ग्राहक द्वारा समय पर या तय की गई समय सीमा के भीतर बकाया राशि चुकाना आवश्यक है।</li>
                      <li>प्रत्येक भुगतान (Debit) दर्ज होते ही ग्राहक के कुल बकाया बैलेंस में तुरंत कमी हो जाती है।</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">3. अग्रिम जमा (Advance Deposit Policy)</h4>
                    <p>
                      यदि कोई ग्राहक दुकान पर अग्रिम (Advance) राशि जमा करता है, तो वह राशि उसके खाते में सुरक्षित जमा रहेगी और भविष्य में की जाने वाली खरीद में स्वतः समायोजित कर दी जाएगी।
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">4. बिल राशि में संशोधन (Bill Amount Modifications)</h4>
                    <p>
                      यदि किसी बिल या पर्ची में त्रुटिवश गलत राशि या विवरण दर्ज हो जाता है, तो अधिकृत दुकानदार को सिस्टम में ऑडिट लॉग के साथ बिल राशि सुधारने (Edit Bill Amount) का अधिकार है।
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">5. विवाद समाधान (Dispute Resolution)</h4>
                    <p>
                      किसी भी प्रविष्टि में विसंगति होने पर डिजिटल खाता बही में दर्ज तारीख और रिफरेंस नंबर को प्राथमिक प्रमाण माना जाएगा, जिसे ग्राहक एवं दुकानदार आपसी सहमति से सत्यापित कर सकते हैं।
                    </p>
                  </section>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Terms and Conditions governing the use of CredEx Kirana Digital Ledger.</span>
                  </div>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">1. Acceptance of Terms</h4>
                    <p>
                      By creating an account or recording transactions in this application, storekeepers and customers agree to adhere to these operating terms and store credit conventions.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">2. Store Credit & Payment Settlement</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Goods delivered on credit represent customer financial liability to the merchant.</li>
                      <li>Payment installments (Debit entries) are immediately reflected in running balances upon receipt.</li>
                      <li>Customers agree to settle outstanding dues within mutually agreed payment periods.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">3. Advance Payments (Peshgi)</h4>
                    <p>
                      Advance deposits deposited by a customer remain as a positive credit balance in the customer's favor and automatically offset subsequent grocery purchases.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">4. Invoice & Bill Amount Adjustments</h4>
                    <p>
                      Authorized administrators have the capability to correct or edit bill amounts for clerical errors, with full change tracking logged in immutable audit records.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">5. Record Verification</h4>
                    <p>
                      Timestamped transaction ledger receipts and audit trails serve as the verified commercial record for accounts reconciliation.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Store className="w-4 h-4 text-slate-400" />
            <span>CredEx Retail Ledger Systems</span>
          </div>

          <button
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'समझ गया / बंद करें' : 'I Understand / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
