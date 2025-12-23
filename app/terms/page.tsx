/**
 * Terms of Service page.
 *
 * Why placeholder? MVP focus. Full legal terms should be reviewed by a lawyer
 * before production. This provides basic structure and compliance placeholder.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Terms of Service</h1>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6 text-gray-300">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-400">
              <strong>Legal Disclaimer:</strong> This Terms of Service is a template. For production use, please have this reviewed by a legal professional to ensure it complies with all applicable laws and regulations in your jurisdiction.
            </p>
          </div>
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using X Trust Radar, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">2. Service Description</h2>
            <p>
              X Trust Radar provides trustworthiness verification services for X (Twitter) accounts
              using metadata analysis. The service is provided "as is" without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">3. User Responsibilities</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their account credentials
              and for all activities that occur under their account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">4. Payment and Credits</h2>
            <p>
              All payments are processed through Stripe. Credits are generally non-refundable once purchased.
              However, we may provide refunds in exceptional circumstances, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Service unavailability due to technical issues on our end</li>
              <li>Duplicate charges or billing errors</li>
              <li>Other circumstances at our sole discretion</li>
            </ul>
            <p className="mt-3">
              To request a refund, please contact us within 30 days of purchase. Refund requests
              are reviewed on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">5. Limitation of Liability</h2>
            <p>
              X Trust Radar shall not be liable for any indirect, incidental, special, or consequential
              damages resulting from the use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">6. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Germany.
              Any disputes shall be resolved in the courts of Germany. If you are a consumer
              resident in the European Union, you also benefit from any mandatory provisions of
              the law of your country of residence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">7. Contact</h2>
            <p>
              For questions about these Terms, please contact us at: <a href="mailto:legal@xtrustradar.com" className="text-emerald-400 hover:text-emerald-300 underline">legal@xtrustradar.com</a>
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

