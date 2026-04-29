import React from "react";

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 rounded-2xl shadow-xl mt-24 mb-10 bg-surface-container text-on-surface border border-outline-variant/15">
      <h2 className="text-3xl font-bold text-gradient mb-8">Terms of Service</h2>

      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">1. Acceptance of Terms</h3>
          <p className="text-on-surface-variant">
            By accessing and using ZenXplor, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">2. Description of Service</h3>
          <p className="text-on-surface-variant">
            ZenXplor provides file search and management capabilities. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">3. User Accounts</h3>
          <p className="text-on-surface-variant">
            To use certain features of our service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">4. User Conduct</h3>
          <p className="text-on-surface-variant">
            You agree not to use our service for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction when using our service.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">5. Intellectual Property</h3>
          <p className="text-on-surface-variant">
            All content, features, and functionality of our service are owned by ZenXplor and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">6. Limitation of Liability</h3>
          <p className="text-on-surface-variant">
            In no event shall ZenXplor be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits or data, arising out of or in connection with your use of our service.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">7. Changes to Terms</h3>
          <p className="text-on-surface-variant">
            We reserve the right to modify these Terms of Service at any time. We will provide notice of significant changes by updating the date at the top of these terms.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">8. Governing Law</h3>
          <p className="text-on-surface-variant">
            These Terms of Service shall be governed by and construed in accordance with applicable laws.
          </p>
        </section>

        <section className="pt-4">
          <p className="italic text-outline">Last updated: April 2025</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;