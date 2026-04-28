import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 rounded-2xl shadow-xl mt-24 mb-10 bg-surface-container text-on-surface border border-outline-variant/15">
      <h2 className="text-3xl font-bold text-gradient mb-8">Privacy Policy</h2>

      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">1. Information We Collect</h3>
          <p className="text-on-surface-variant">
            We collect information you provide directly to us, such as when you create an account, update your profile, use interactive features, or contact us for support. This may include your name, email address, profile picture, and any other information you choose to provide.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">2. How We Use Your Information</h3>
          <p className="text-on-surface-variant">
            We use the information we collect to provide, maintain, and improve our services, to process and complete transactions, and to respond to your inquiries and requests.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">3. Information Sharing</h3>
          <p className="text-on-surface-variant">
            We do not share your personal information with third parties except as described in this privacy policy. We may share information with third-party vendors who need access to such information to perform work on our behalf.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">4. Data Security</h3>
          <p className="text-on-surface-variant">
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">5. Your Choices</h3>
          <p className="text-on-surface-variant">
            You may update, correct, or delete your account information at any time by logging into your account. If you wish to delete your account, please contact us.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">6. Cookies</h3>
          <p className="text-on-surface-variant">
            We use cookies and similar technologies to collect information about your browsing activities and to distinguish you from other users of our service.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">7. Changes to Privacy Policy</h3>
          <p className="text-on-surface-variant">
            We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-on-surface">8. Contact Us</h3>
          <p className="text-on-surface-variant">
            If you have any questions about this privacy policy, please contact us at privacy@zenxplor.ai.
          </p>
        </section>

        <section className="pt-4">
          <p className="italic text-outline">Last updated: April 2025</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;