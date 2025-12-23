/**
 * Cookie Policy page.
 *
 * Why placeholder? MVP focus. Full cookie policy should comply with GDPR and other
 * applicable regulations. This provides basic structure for compliance.
 */
export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Cookie Policy</h1>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6 text-gray-300">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-400">
              <strong>Note:</strong> This is a template policy. For production use, please have this reviewed by a legal professional to ensure compliance with all applicable regulations (GDPR, CCPA, etc.).
            </p>
          </div>
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website.
              They help us provide you with a better experience by remembering your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">2. How We Use Cookies</h2>
            <p>
              We use cookies for authentication and session management. These are essential cookies
              required for the service to function properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">3. Types of Cookies</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Essential Cookies:</strong> Required for authentication and session management.
                These cannot be disabled.
              </li>
              <li>
                <strong>Functional Cookies:</strong> Used to remember your preferences and improve
                your experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">4. Third-Party Cookies</h2>
            <p>
              We use Supabase for authentication, which may set cookies for session management.
              We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">5. Managing Cookies</h2>
            <p>
              You can control cookies through your browser settings. However, disabling essential
              cookies may affect the functionality of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">6. Contact</h2>
            <p>
              For questions about our use of cookies, please contact us at: <a href="mailto:privacy@xraytrust.com" className="text-emerald-400 hover:text-emerald-300 underline">privacy@xraytrust.com</a>
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

