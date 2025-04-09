import React from "react";

const PrivacyPolicy: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  return (
    <div className={`max-w-4xl mx-auto p-8 rounded-2xl shadow-xl mt-10 mb-10 ${
      darkMode 
        ? "bg-gray-800 text-white border border-gray-700" 
        : "bg-white text-gray-900 border border-gray-200"
    }`}>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-8">
        Privacy Policy
      </h2>
      
      <div className="space-y-6">
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>1. Information We Collect</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We collect information you provide directly to us, such as when you create an account, update your profile, use interactive features, or contact us for support. This may include your name, email address, profile picture, and any other information you choose to provide.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>2. How We Use Your Information</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We use the information we collect to provide, maintain, and improve our services, to process and complete transactions, and to respond to your inquiries and requests. We may also use the information to communicate with you about our service, send you technical notices, and provide customer support.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>3. Information Sharing</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We do not share your personal information with third parties except as described in this privacy policy. We may share information with third-party vendors, consultants, and other service providers who need access to such information to perform work on our behalf.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>4. Data Security</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no data transmission over the Internet or storage system can be guaranteed to be 100% secure.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>5. Your Choices</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            You may update, correct, or delete your account information at any time by logging into your account. If you wish to delete your account, please contact us, and we will respond within a reasonable time.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>6. Cookies</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We use cookies and similar technologies to collect information about your browsing activities and to distinguish you from other users of our service. This helps us to provide you with a good experience when you browse our service and also allows us to improve it.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>7. Changes to Privacy Policy</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new privacy policy on this page.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>8. Contact Us</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@universalfilesearch.com.
          </p>
        </section>
        
        <section className="pt-4">
          <p className={`italic ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
            Last updated: April 2025
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 