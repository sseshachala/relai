import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — Relai',
  description: 'Terms and conditions for using Relai.',
}

export default function TermsPage() {
  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Syne', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Lora:ital@0;1&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,.08)', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: '#1a1814', textDecoration: 'none' }}>Relai</a>
        <a href="/privacy" style={{ fontSize: 13, color: '#8a8680', textDecoration: 'none' }}>Privacy Policy</a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>

        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8680', marginBottom: 12 }}>
          Last updated: April 2, 2026
        </div>

        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.02em', color: '#1a1814', marginBottom: 16, lineHeight: 1.15 }}>
          Terms of Use
        </h1>

        <p style={{ fontSize: 16, color: '#5f5e5a', lineHeight: 1.8, marginBottom: 40, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          These are the rules of using Relai. They're written to be read by humans, not just lawyers.
        </p>

        {[
          {
            title: "1. Acceptance of terms",
            body: `By accessing or using Relai at prelai.org (the "Service"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Service. We may update these terms from time to time — continued use after changes means you accept the updated terms.`
          },
          {
            title: "2. What Relai is",
            body: `Relai is an AI-powered relationship intelligence platform. It reads your Gmail and Google Calendar data (with your permission) to automatically build and maintain your professional CRM — extracting contacts, detecting deal signals, and generating daily briefings.`
          },
          {
            title: "3. Your account",
            body: `You must sign in with a valid Google account to use Relai. You are responsible for maintaining the security of your account. You must not share your account credentials with others. You must be at least 18 years old to use the Service. One person may not maintain multiple accounts.`
          },
          {
            title: "4. Acceptable use",
            body: `You agree to use Relai only for lawful purposes and in accordance with these Terms. You must not:\n\n• Use the Service to process email data belonging to others without their consent\n• Attempt to reverse-engineer, scrape, or extract data from the Service\n• Use the Service to send spam or unsolicited communications\n• Attempt to gain unauthorised access to any part of the Service\n• Use the Service in any way that violates applicable laws or regulations`
          },
          {
            title: "5. Google data",
            body: `By connecting your Google account, you authorise Relai to access your Gmail and Google Calendar data on a read-only basis as described in our Privacy Policy. You can revoke this access at any time through your Google Account settings at myaccount.google.com/permissions. Revoking access will stop new syncs but will not automatically delete data already processed — contact us at privacy@prelai.org to request data deletion.`
          },
          {
            title: "6. AI-generated content",
            body: `Relai uses AI (Anthropic's Claude) to analyse your email data and generate insights, summaries, and recommendations. This content is generated automatically and may contain errors or inaccuracies. You should use your own judgement when acting on AI-generated insights. Relai is not responsible for decisions you make based on AI-generated content.`
          },
          {
            title: "7. Subscription and payment",
            body: `Relai offers a free trial period followed by paid subscription plans. Current pricing is available at prelai.org. Subscriptions are billed monthly or annually. You may cancel at any time — cancellation takes effect at the end of your current billing period. We do not offer refunds for partial periods except where required by law.`
          },
          {
            title: "8. Intellectual property",
            body: `The Relai platform, including its code, design, and branding, is our intellectual property. Your data remains yours. We do not claim ownership over contacts, deals, or other content generated from your email data. You grant us a limited licence to process your data solely to provide the Service.`
          },
          {
            title: "9. Service availability",
            body: `We aim to keep Relai available at all times but cannot guarantee uninterrupted access. We may perform maintenance, updates, or experience outages. We will endeavour to notify users of planned downtime. We are not liable for any losses arising from service unavailability.`
          },
          {
            title: "10. Limitation of liability",
            body: `To the fullest extent permitted by law, Relai is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability to you for any claim arising from use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.`
          },
          {
            title: "11. Termination",
            body: `We reserve the right to suspend or terminate your account if you violate these Terms. You may terminate your account at any time by contacting us at privacy@prelai.org. Upon termination, your right to use the Service ceases immediately.`
          },
          {
            title: "12. Governing law",
            body: `These Terms are governed by the laws of Singapore. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of Singapore.`
          },
          {
            title: "13. Contact",
            body: `Questions about these Terms?\n\nEmail: legal@prelai.org\nWebsite: prelai.org`
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1814', marginBottom: 10, letterSpacing: '-.01em' }}>
              {section.title}
            </h2>
            <div style={{ fontSize: 15, color: '#3d3d3a', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {section.body}
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid rgba(0,0,0,.08)', paddingTop: 32, marginTop: 20 }}>
          <p style={{ fontSize: 13, color: '#8a8680', lineHeight: 1.7 }}>
            Relai · prelai.org · legal@prelai.org
          </p>
        </div>
      </div>
    </div>
  )
}
