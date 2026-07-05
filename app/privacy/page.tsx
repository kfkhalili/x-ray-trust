/**
 * Privacy Policy page.
 *
 * Comprehensive privacy policy covering data collection, usage, storage, and user rights.
 * Complies with GDPR, CCPA, and German data protection laws. Should be reviewed by a legal
 * professional before production deployment.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Privacy Policy</h1>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6 text-gray-300">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-400">
              <strong>Legal Disclaimer:</strong> This Privacy Policy should be reviewed by a legal professional before production use to ensure compliance with GDPR, CCPA, and other applicable privacy regulations in your jurisdiction.
            </p>
          </div>
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">1. Introduction</h2>
            <p className="mb-3">
              X Trust Radar ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our trust verification service for X (formerly Twitter) accounts.
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">2.1 Information You Provide Directly</h3>
            <p className="mb-3">The Service does not require an account. There is no sign-up, no login, and no payment. The only information you actively provide is:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>X Username:</strong> The public X (Twitter) handle you ask us to analyze. We use it solely to look up publicly available account data and generate a trust report.</li>
              <li><strong>Communication Data:</strong> If you contact us via email or support channels, we collect the content of your communications and contact information.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">2.2 Information Collected Automatically</h3>
            <p className="mb-3">When you use our Service, we automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>IP Addresses:</strong> We use your IP address to enforce a per-IP rate limit that prevents abuse. It is held in server memory only and cleared automatically; it is not stored in a database.</li>
              <li><strong>Usage Data:</strong> We may log which usernames are looked up and whether a cached or fresh result was served, to keep the Service running and prevent abuse.</li>
              <li><strong>Device and Browser Information:</strong> We may collect information about your device, browser type, and operating system for security and compatibility purposes.</li>
              <li><strong>Session Storage:</strong> Your browser's session storage is used to preserve your most recent search result during your visit. This stays in your browser and is not sent to us.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">2.3 Public Data from Third Parties</h3>
            <p className="mb-3">
              When you request a verification, we fetch publicly available data about X accounts from a third-party data provider accessed via RapidAPI. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Account metadata (username, display name, profile picture, bio)</li>
              <li>Account statistics (follower count, following count, tweet count)</li>
              <li>Account status (verification status, account type, creation date)</li>
              <li>Engagement metrics (likes, media posts, favorites)</li>
            </ul>
            <p>
              This data is publicly available on X and is not considered personal information under privacy laws. However, we process it to generate trust reports, which are cached in server memory for up to 24 hours to improve service performance.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">2.4 Legal Basis for Processing (GDPR Article 6)</h3>
            <p className="mb-3">We process your personal data based on the following legal bases:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Contract Performance:</strong> Processing necessary to provide the Service, i.e. verification processing.</li>
              <li><strong>Legitimate Interests:</strong> Processing for security, fraud prevention, service improvement, and enforcing a per-IP rate limit.</li>
              <li><strong>Consent:</strong> Where you have provided explicit consent, such as for optional marketing communications (if applicable).</li>
              <li><strong>Legal Obligations:</strong> Processing required to comply with legal obligations, such as tax record keeping under German law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>Provide the Service:</strong> Process verification requests and deliver trust reports.</li>
              <li><strong>Enforce Usage Limits:</strong> Apply a per-IP rate limit to prevent abuse and ensure fair access to the Service.</li>
              <li><strong>Improve Service Quality:</strong> Analyze usage patterns, optimize caching strategies, and enhance the trust scoring algorithm.</li>
              <li><strong>Ensure Security:</strong> Detect and prevent fraud, unauthorized access, and other security threats.</li>
              <li><strong>Communicate with You:</strong> Send authentication emails, respond to support requests, and notify you of important service updates.</li>
              <li><strong>Comply with Legal Obligations:</strong> Maintain records as required by law, including tax records under German GoBD requirements.</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">4. Data Storage and Security</h2>
            <p className="mb-3">
              The Service is stateless: we do not operate a user database. Verification results (public X data and trust reports) are held in server memory for up to 24 hours and then discarded. We implement appropriate technical and organizational measures in accordance with GDPR Article 32 (Security of Processing), including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>No long-term storage of personal data or account credentials</li>
              <li>Regular security assessments and updates</li>
            </ul>
            <p className="mb-3">
              <strong>Data Location:</strong> Data is stored within the European Economic Area (EEA) where possible. When data is processed outside the EEA, we ensure adequate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission, to protect your data in accordance with GDPR requirements.
            </p>
            <p>
              Despite our security measures, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">5. Data Sharing and Third-Party Services</h2>
            <p className="mb-3">We share information with a single third-party service provider:</p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">5.1 RapidAPI</h3>
            <p className="mb-3">
              We use a third-party X (Twitter) data API accessed through RapidAPI to fetch publicly available account data. We send the username you ask us to check; the provider returns public account metadata. RapidAPI's privacy policy: <a href="https://rapidapi.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">https://rapidapi.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">5.2 Other Disclosures</h3>
            <p className="mb-3">We may disclose your information in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users or others</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
              <li><strong>With Your Consent:</strong> When you have provided explicit consent for specific disclosures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">6. Your Privacy Rights</h2>
            <p className="mb-3">Under applicable data protection laws (GDPR, CCPA, and others), you have the following rights:</p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.1 Right to Access (GDPR Article 15, CCPA)</h3>
            <p className="mb-3">
              You have the right to request a copy of your personal data that we hold. This includes information about what data we have, why we have it, and who we share it with.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.2 Right to Rectification (GDPR Article 16)</h3>
            <p className="mb-3">
              You have the right to request correction of inaccurate or incomplete personal data. You can update your email address and account information through the Service interface or by contacting us.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.3 Right to Erasure (GDPR Article 17, "Right to be Forgotten")</h3>
            <p className="mb-3">
              You have the right to request deletion of your personal data. We will delete your account and associated data within 30 days, subject to legal retention requirements (e.g., tax records must be retained for 10 years under German law).
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.4 Right to Restrict Processing (GDPR Article 18)</h3>
            <p className="mb-3">
              You have the right to request that we limit how we use your personal data in certain circumstances, such as when you contest the accuracy of the data.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.5 Right to Data Portability (GDPR Article 20)</h3>
            <p className="mb-3">
              You have the right to receive your personal data in a structured, commonly used, and machine-readable format, and to transmit that data to another service provider.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.6 Right to Object (GDPR Article 21)</h3>
            <p className="mb-3">
              You have the right to object to processing of your personal data based on legitimate interests. We will stop processing unless we can demonstrate compelling legitimate grounds that override your interests.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.7 Right to Withdraw Consent (GDPR Article 7)</h3>
            <p className="mb-3">
              Where processing is based on consent, you have the right to withdraw consent at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.
            </p>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.8 CCPA-Specific Rights (California Residents)</h3>
            <p className="mb-3">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-100 mb-3 mt-4">6.9 Exercising Your Rights</h3>
            <p className="mb-3">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">privacy@xtrustradar.com</a>. We will respond to your request within 30 days (or as required by applicable law).
            </p>
            <p>
              We may need to verify your identity before processing your request to protect your privacy and security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">7. Data Retention</h2>
            <p className="mb-3">
              We retain your personal data only for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>IP Addresses:</strong> Held in server memory only and cleared automatically. Not persisted to a database. Used solely for enforcing the rate limit.</li>
              <li><strong>Verification Results:</strong> Public verification data (X account metadata and trust reports) is cached in server memory for up to 24 hours to improve performance. This data is publicly accessible and not considered personal information.</li>
              <li><strong>Communication Records:</strong> Support emails and communications are retained for up to 3 years for customer service and legal purposes.</li>
            </ul>
            <p>
              After the retention period expires, we will securely delete or anonymize your personal data, except where we are required to retain it for legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="mb-3">
              We use cookies and similar technologies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>Session Storage:</strong> Used to preserve your most recent search result during your session. Cleared when you close your browser.</li>
              <li><strong>Local Storage:</strong> Used to remember your cookie consent preference.</li>
            </ul>
            <p className="mb-3">
              We do not use tracking cookies, advertising cookies, or analytics cookies that track you across websites. For more details, see our <a href="/cookies" className="text-emerald-400 hover:text-emerald-300 underline">Cookie Policy</a>.
            </p>
            <p>
              You can control cookies through your browser settings. However, disabling essential cookies may prevent the Service from functioning properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">9. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under the age of 16 (or the age of majority in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">10. Data Breaches</h2>
            <p className="mb-3">
              In the event of a data breach that may affect your personal information, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Notify the relevant supervisory authority (in Germany: Bundesbeauftragte für den Datenschutz und die Informationsfreiheit) within 72 hours as required by GDPR Article 33</li>
              <li>Notify affected users without undue delay if the breach poses a high risk to their rights and freedoms, as required by GDPR Article 34</li>
              <li>Document all breaches and our response measures</li>
              <li>Take immediate steps to contain and remediate the breach</li>
            </ul>
            <p>
              We maintain incident response procedures and regularly review our security measures to prevent breaches.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">11. International Data Transfers</h2>
            <p className="mb-3">
              Your data may be transferred to and processed in countries outside the European Economic Area (EEA). When we transfer your data outside the EEA, we ensure appropriate safeguards are in place, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Other legally recognized transfer mechanisms</li>
            </ul>
            <p className="mb-3">
              Our service providers may process data in various locations:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>RapidAPI (and the underlying X data provider):</strong> May process requests in various locations. See RapidAPI&apos;s privacy policy for details.</li>
            </ul>
            <p>
              We ensure all transfers comply with GDPR and applicable German data protection laws. If you have questions about specific data transfers, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Updating the "Last updated" date at the top of this page</li>
              <li>Posting a notice on our Service</li>
              <li>Sending an email notification (for significant changes)</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy. If you do not agree with the changes, you should stop using the Service and request deletion of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">13. Supervisory Authority</h2>
            <p className="mb-3">
              If you are not satisfied with how we handle your personal data, you have the right to lodge a complaint with a supervisory authority. In Germany, this is:
            </p>
            <p className="mb-3 ml-4">
              <strong>Die Bundesbeauftragte für den Datenschutz und die Informationsfreiheit</strong><br />
              Graurheindorfer Str. 153<br />
              53117 Bonn, Germany<br />
              Website: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">www.bfdi.bund.de</a>
            </p>
            <p>
              If you are located in another EU member state, you may also lodge a complaint with your local data protection authority.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">14. Contact Information</h2>
            <p className="mb-3">
              For questions about this Privacy Policy, to exercise your privacy rights, or to report a privacy concern, please contact us at:
            </p>
            <p className="mb-3">
              <strong>Privacy Inquiries:</strong> <a href="mailto:privacy@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">privacy@xtrustradar.com</a>
            </p>
            <p className="mb-3">
              <strong>General Support:</strong> <a href="mailto:support@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">support@xtrustradar.com</a>
            </p>
            <p className="text-sm text-gray-400">
              (Note: Update these email addresses with your actual contact information before production deployment)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

