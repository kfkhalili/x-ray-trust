/**
 * Privacy Policy page.
 *
 * Why placeholder? MVP focus. Full privacy policy should be reviewed by a lawyer
 * and comply with GDPR, CCPA, and other applicable regulations before production.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Privacy Policy</h1>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6 text-gray-300">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-400">
              <strong>Legal Disclaimer:</strong> This Privacy Policy is a template. For production use, please have this reviewed by a legal professional to ensure compliance with GDPR, CCPA, and other applicable privacy regulations.
            </p>
          </div>
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">1. Information We Collect</h2>
            <p className="mb-3">
              We collect information you provide directly to us, such as when you create an account,
              make a purchase, or contact us. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email addresses (for authentication and communication)</li>
              <li>Payment information (processed securely through Stripe - we do not store payment card details)</li>
              <li>Account usage data (credits, verification history)</li>
              <li>IP addresses (for free lookup tracking and security)</li>
            </ul>
            <p className="mt-3">
              <strong>Legal Basis (GDPR Article 6):</strong> We process your data based on:
              (1) Contract performance (providing the service), (2) Legitimate interests (security, fraud prevention),
              and (3) Your consent (where applicable).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services,
              process transactions, and communicate with you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase. We implement appropriate technical
              and organizational measures to protect your personal information in accordance with
              GDPR Article 32 (Security of Processing).
            </p>
            <p className="mt-2">
              Data is stored within the European Economic Area (EEA) where possible. When data is
              processed outside the EEA, we ensure adequate safeguards are in place as required
              by GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">4. Third-Party Services</h2>
            <p>
              We use third-party services including Supabase (authentication and database),
              Stripe (payments), and twitterapi.io (data source). These services have their own
              privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">5. Your Rights (GDPR/CCPA)</h2>
            <p className="mb-3">Under applicable data protection laws, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">6. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to provide our services
              and comply with legal obligations under German law and GDPR:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li><strong>Account data:</strong> Retained while your account is active. Deleted within 30 days of account deletion request.</li>
              <li><strong>Payment records:</strong> Retained for 10 years as required by German tax law (GoBD - Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff).</li>
              <li><strong>IP addresses (free lookups):</strong> Stored in memory only, cleared on server restart. Not persisted long-term.</li>
              <li><strong>Verification history:</strong> Not stored - only displayed temporarily in your session.</li>
            </ul>
            <p className="mt-3">
              You can request deletion of your account and associated data at any time, subject to
              legal retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">7. Data Breaches</h2>
            <p>
              In the event of a data breach that may affect your personal information, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Notify the relevant supervisory authority (in Germany: Bundesbeauftragte für den Datenschutz und die Informationsfreiheit) within 72 hours as required by GDPR Article 33</li>
              <li>Notify affected users without undue delay if the breach poses a high risk to their rights and freedoms, as required by GDPR Article 34</li>
              <li>Document all breaches and our response measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">8. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries outside the European Economic Area (EEA).
              When we transfer your data outside the EEA, we ensure appropriate safeguards are in place,
              such as Standard Contractual Clauses (SCCs) approved by the European Commission, to protect
              your data in accordance with GDPR requirements.
            </p>
            <p className="mt-2">
              Our service providers (Supabase, Stripe, twitterapi.io) may process data in various locations.
              We ensure all transfers comply with GDPR and applicable German data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">9. Cookies</h2>
            <p>
              We use cookies for authentication and session management. See our Cookie Policy
              for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">10. Supervisory Authority</h2>
            <p>
              If you are not satisfied with how we handle your personal data, you have the right
              to lodge a complaint with a supervisory authority. In Germany, this is:
            </p>
            <p className="mt-2 ml-4">
              <strong>Die Bundesbeauftragte für den Datenschutz und die Informationsfreiheit</strong><br />
              Graurheindorfer Str. 153<br />
              53117 Bonn, Germany<br />
              Website: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">www.bfdi.bund.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">11. Contact</h2>
            <p>
              For questions about this Privacy Policy or to exercise your rights under GDPR, please contact us
              at: <a href="mailto:privacy@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">privacy@xtrustradar.com</a>
            </p>
            <p className="mt-2 text-sm text-gray-400">
              (Note: Update this email address with your actual contact information before production deployment)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

