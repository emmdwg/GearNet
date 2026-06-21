import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — GearNet",
  description: "How GearNet collects, uses, and protects your data.",
};

const LAST_UPDATED = "June 20, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/90">
        This is a starter template. Have a lawyer review and tailor it (and confirm GDPR/CCPA obligations) before launch.
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
          <p>
            <span className="font-medium text-white">Account info</span> you provide (email, username, display name, bio,
            location, avatar). <span className="font-medium text-white">Content</span> you create (posts, vehicles, build
            logs, listings, messages, comments). <span className="font-medium text-white">Usage data</span> such as device
            and log information collected automatically.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
          <p>
            To operate and improve the Service, authenticate you, deliver notifications you&apos;ve enabled, power features
            like the feed, follows, and chat, and keep the platform safe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. What Others Can See</h2>
          <p>
            Your profile, garage, posts, and listings are visible to other users according to your privacy settings.
            Messages are visible to participants in a conversation. You control visibility in Settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Service Providers</h2>
          <p>
            We use third parties to run GearNet, including Supabase (authentication, database, storage) and may use image
            hosting and error-monitoring providers. They process data on our behalf under their own terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Data Retention</h2>
          <p>
            We keep your data while your account is active. When you delete content or your account, we remove it from the
            Service, subject to backups and legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Your Rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, export, or delete your personal data.
            Contact us to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Security</h2>
          <p>
            We use industry-standard measures to protect your data, but no method of transmission or storage is 100%
            secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Children&apos;s Privacy</h2>
          <p>GearNet is not directed to children under 13, and we do not knowingly collect their data.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Changes</h2>
          <p>We may update this policy and will revise the &quot;last updated&quot; date above.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">10. Contact</h2>
          <p>Questions about your privacy? Email privacy@gearnet.app.</p>
        </section>
      </div>

      <p className="mt-10 text-sm text-zinc-500">
        See also our{" "}
        <Link href="/terms" className="text-amber-400 hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
