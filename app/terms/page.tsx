/**
 * Terms of Service page.
 *
 * Comprehensive terms covering service usage, payments, credits, and user responsibilities.
 * These terms should be reviewed by a legal professional before production deployment.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Terms of Service</h1>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6 text-gray-300">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-400">
              <strong>Legal Disclaimer:</strong> These Terms of Service should be reviewed by a legal professional before production use to ensure compliance with all applicable laws and regulations in your jurisdiction.
            </p>
          </div>
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-3">
              By accessing and using X Trust Radar ("the Service"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be notified by updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">2. Service Description</h2>
            <p className="mb-3">
              X Trust Radar provides trustworthiness verification services for X (formerly Twitter) accounts using advanced metadata analysis. Our service analyzes behavioral signals including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Account age and creation date</li>
              <li>Follower-to-following ratios</li>
              <li>Account activity and engagement metrics</li>
              <li>Verification status and account type indicators</li>
              <li>Other publicly available metadata</li>
            </ul>
            <p className="mb-3">
              The Service generates trust scores and reports based on algorithmic analysis of publicly available data. The Service is provided "as is" without warranties of any kind, express or implied.
            </p>
            <p>
              <strong>Important:</strong> Trust scores are estimates based on available data and should not be the sole factor in making decisions about account trustworthiness. We do not guarantee the accuracy, completeness, or reliability of any verification results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">3. Account Registration and User Responsibilities</h2>
            <p className="mb-3">
              To access certain features of the Service, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information to keep it accurate</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p>
              You are responsible for maintaining the security of your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">4. Free Lookups and Credit System</h2>
            <p className="mb-3">
              The Service operates on a credit-based system:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>Free Lookups:</strong> All users (authenticated and unauthenticated) receive 3 free lookups per hour, tracked by IP address. Free lookups reset 1 hour after the first lookup in each period.</li>
              <li><strong>Credits:</strong> Authenticated users can purchase credits to perform additional verifications. Each verification consumes one credit.</li>
              <li><strong>Caching:</strong> Verifications are cached for 24 hours. Viewing cached results does not consume credits or free lookups.</li>
            </ul>
            <p className="mb-3">
              We reserve the right to modify free lookup limits, credit pricing, or caching policies at any time. Changes will be communicated through the Service interface or via email.
            </p>
            <p>
              Credits are non-transferable and cannot be exchanged for cash or other services. Unused credits do not expire unless your account is terminated for violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">5. Payment and Refunds</h2>
            <p className="mb-3">
              All payments are processed securely through Stripe, a third-party payment processor. We do not store or have access to your full payment card details.
            </p>
            <p className="mb-3">
              <strong>Credit Purchases:</strong> Credits are generally non-refundable once purchased. However, we may provide refunds in exceptional circumstances, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Service unavailability due to technical issues on our end that prevent you from using purchased credits</li>
              <li>Duplicate charges or billing errors</li>
              <li>Unauthorized transactions on your account</li>
              <li>Other circumstances at our sole discretion</li>
            </ul>
            <p className="mb-3">
              To request a refund, please contact us at <a href="mailto:support@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">support@xtrustradar.com</a> within 30 days of purchase. Refund requests are reviewed on a case-by-case basis and may take up to 10 business days to process.
            </p>
            <p>
              <strong>EU Consumer Rights:</strong> If you are a consumer resident in the European Union, you have the right to withdraw from a distance contract within 14 days of purchase under EU consumer protection law. However, if you have already used the credits, this right may be limited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">6. Acceptable Use</h2>
            <p className="mb-3">
              You agree not to use the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>For any illegal purpose or in violation of any laws or regulations</li>
              <li>To harass, abuse, or harm others</li>
              <li>To transmit any malicious code, viruses, or harmful software</li>
              <li>To attempt to gain unauthorized access to the Service or its systems</li>
              <li>To scrape, crawl, or systematically extract data from the Service</li>
              <li>To interfere with or disrupt the Service or servers</li>
              <li>To impersonate any person or entity</li>
              <li>To use automated systems (bots, scripts) to access the Service without permission</li>
            </ul>
            <p>
              Violation of these restrictions may result in immediate termination of your account and forfeiture of any unused credits, without refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">7. Intellectual Property</h2>
            <p className="mb-3">
              The Service, including its software, algorithms, design, text, graphics, and other content, is owned by X Trust Radar and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-3">
              You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal or commercial purposes in accordance with these Terms. You may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Copy, modify, or create derivative works of the Service</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Remove or alter any copyright, trademark, or proprietary notices</li>
              <li>Use the Service to build a competing service</li>
            </ul>
            <p>
              Verification results and trust reports generated by the Service may be used for your personal or commercial purposes, subject to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">8. Third-Party Services</h2>
            <p className="mb-3">
              The Service integrates with third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>Supabase:</strong> Used for authentication and data storage</li>
              <li><strong>Stripe:</strong> Used for payment processing</li>
              <li><strong>twitterapi.io:</strong> Used as a data source for X account metadata</li>
            </ul>
            <p>
              Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the availability, accuracy, or practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">9. Service Availability and Modifications</h2>
            <p className="mb-3">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Scheduled maintenance</li>
              <li>Technical issues or failures</li>
              <li>Third-party service outages</li>
              <li>Force majeure events</li>
            </ul>
            <p className="mb-3">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We are not liable for any loss or damage resulting from such actions.
            </p>
            <p>
              We may also impose limits on usage, restrict access to certain features, or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">10. Limitation of Liability</h2>
            <p className="mb-3">
              To the maximum extent permitted by applicable law, X Trust Radar and its operators shall not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Errors or inaccuracies in verification results</li>
              <li>Decisions made based on trust scores or reports</li>
              <li>Service interruptions or unavailability</li>
              <li>Third-party service failures</li>
            </ul>
            <p className="mb-3">
              Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or €100, whichever is greater.
            </p>
            <p>
              <strong>EU Consumer Rights:</strong> Nothing in these Terms limits or excludes our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law. If you are a consumer, you have legal rights that cannot be limited by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless X Trust Radar and its operators from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">12. Termination</h2>
            <p className="mb-3">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Extended period of inactivity</li>
              <li>At our sole discretion</li>
            </ul>
            <p>
              Upon termination, your right to use the Service will cease immediately. Any unused credits may be forfeited unless termination is due to our breach of these Terms. You may terminate your account at any time by contacting us or deleting your account through the Service interface.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">13. Dispute Resolution</h2>
            <p className="mb-3">
              <strong>EU Consumers:</strong> If you are a consumer resident in the European Union, you may bring proceedings in the courts of your country of residence or in the courts of Germany, at your choice.
            </p>
            <p className="mb-3">
              <strong>Business Users:</strong> For business users and non-EU consumers, any disputes arising from or related to these Terms or the Service shall be governed by and construed in accordance with the laws of Germany, without regard to conflict of law principles.
            </p>
            <p>
              Disputes shall be resolved in the competent courts of Germany, unless you are an EU consumer, in which case you may choose the courts of your country of residence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">14. General Provisions</h2>
            <p className="mb-3">
              <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and X Trust Radar regarding the Service and supersede all prior agreements.
            </p>
            <p className="mb-3">
              <strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </p>
            <p className="mb-3">
              <strong>Waiver:</strong> Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision or any other provision.
            </p>
            <p>
              <strong>Assignment:</strong> You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">15. Contact Information</h2>
            <p className="mb-3">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-3">
              <strong>Email:</strong> <a href="mailto:legal@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">legal@xtrustradar.com</a>
            </p>
            <p className="mb-3">
              <strong>Support:</strong> <a href="mailto:support@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">support@xtrustradar.com</a>
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

