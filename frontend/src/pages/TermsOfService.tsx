import React from "react";

const TermsOfService: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  return (
    <div className={`max-w-4xl mx-auto p-8 rounded-2xl shadow-xl mt-10 mb-10 ${
      darkMode 
        ? "bg-gray-800 text-white border border-gray-700" 
        : "bg-white text-gray-900 border border-gray-200"
    }`}>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-8">
        Terms of Service
      </h2>
      
      <div className="space-y-6">
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>1. Acceptance of Terms</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            By accessing and using Universal File Search, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>2. Description of Service</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            Universal File Search provides file search and management capabilities. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>3. User Accounts</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            To use certain features of our service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>4. User Conduct</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            You agree not to use our service for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction when using our service.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>5. Intellectual Property</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            All content, features, and functionality of our service are owned by Universal File Search and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>6. Limitation of Liability</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            In no event shall Universal File Search be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits or data, arising out of or in connection with your use of our service.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>7. Changes to Terms</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            We reserve the right to modify these Terms of Service at any time. We will provide notice of significant changes by updating the date at the top of these terms and by maintaining a current version of the terms at our website.
          </p>
        </section>
        
        <section>
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>8. Governing Law</h3>
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
            These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction where Universal File Search operates, without regard to its conflict of law provisions.
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

export default TermsOfService; 