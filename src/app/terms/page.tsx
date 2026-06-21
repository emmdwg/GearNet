import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — GearNet",
  description: "The terms and conditions for using GearNet.",
};

const LAST_UPDATED = "June 20, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/90">
        This is a starter template. Have a lawyer review and tailor it before you launch publicly.
      </div>

      <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using GearNet (the &quot;Service&quot;), you agree to these Terms of Service. If you do
            not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Eligibility</h2>
          <p>You must be at least 13 years old (or the minimum age of digital consent in your country) to use GearNet.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Your Account</h2>
          <p>
            You are responsible for safeguarding your login credentials and for all activity under your account. Notify us
            immediately of any unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. User Content</h2>
          <p>
            You retain ownership of the photos, builds, listings, and messages you post. By posting, you grant GearNet a
            non-exclusive license to display and distribute that content within the Service. You are solely responsible for
            content you post and must have the rights to share it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Acceptable Use</h2>
          <p>
            Do not post unlawful, hateful, harassing, or infringing content; do not spam, scrape, or attempt to disrupt the
            Service. Marketplace listings must be accurate and for legal goods. We may remove content or suspend accounts
            that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Marketplace &amp; Transactions</h2>
          <p>
            GearNet provides a platform to connect buyers and sellers but is not a party to transactions between users. We
            do not guarantee the quality, safety, or legality of listed items. Transact at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Termination</h2>
          <p>You may delete your account at any time. We may suspend or terminate access for violations of these terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Disclaimers &amp; Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law,
            GearNet is not liable for indirect or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Changes</h2>
          <p>We may update these terms. Continued use after changes constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">10. Contact</h2>
          <p>Questions? Reach us at support@gearnet.app.</p>
        </section>
      </div>

      <p className="mt-10 text-sm text-zinc-500">
        See also our{" "}
        <Link href="/privacy" className="text-amber-400 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
