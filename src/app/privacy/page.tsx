import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Relai',
  description: 'How Relai handles your data.',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Syne', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Lora:ital@0;1&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,.08)', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: '#1a1814', textDecoration: 'none' }}>Relai</a>
        <a href="/terms" style={{ fontSize: 13, color: '#8a8680', textDecoration: 'none' }}>Terms of Use</a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>

        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8680', marginBottom: 12 }}>
          Last updated: April 2, 2026
        </div>

        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.02em', color: '#1a1814', marginBottom: 16, lineHeight: 1.15 }}>
          Privacy Policy
        </h1>

        <p style={{ fontSize: 16, color: '#5f5e5a', lineHeight: 1.8, marginBottom: 40, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Relai is built on a simple principle: your data is yours. We access only what we need to do the job, we never sell it, and we never will.
        </p>

        {[
          {
            title: "1. Who we are",
            body: `Relai ("we," "us," "our") is an AI-powered relationship intelligence platform operated by Relai (prelai.org). We help you automatically build and maintain your professional CRM by reading your Gmail and Google Calendar data with your explicit permission.`
          },
          {
            title: "2. What data we access",
            body: `When you sign in with Google, we request read-only access to:\n\n• Your Gmail email threads (to extract contacts, detect deal signals, and classify relationship sentiment)\n• Your Google Calendar events (to surface meeting context and upcoming conversations)\n• Your basic Google profile (name and email address for your account)\n\nWe request the minimum scopes necessary. We never request write access to your email or calendar. We never read emails marked as personal or social unless you explicitly paste them into the Analyse thread feature.`
          },
          {
            title: "3. How we use your data",
            body: `We use your data solely to provide the Relai service:\n\n• To extract contact profiles from your email threads\n• To detect commercial deal signals and classify urgency\n• To generate your daily relationship digest\n• To populate and maintain your personal pipeline\n\nWe do not use your data to train AI models. We do not sell your data to third parties. We do not use your data for advertising.`
          },
          {
            title: "4. How we store your data",
            body: `Your data is stored in a Supabase (PostgreSQL) database hosted on secure cloud infrastructure. Each user's data is isolated by Row Level Security — only you can access your contacts, deals, and digest history. We store only the extracted intelligence (contact names, deal signals, summaries) — not the full text of your emails.`
          },
          {
            title: "5. AI processing",
            body: `We use Anthropic's Claude API to analyse email threads and generate digests. When you use Relai, relevant email content is sent to Anthropic's API for processing. Anthropic's data handling is governed by their privacy policy at anthropic.com/privacy. We do not send more data than necessary for each specific task.`
          },
          {
            title: "6. Data retention",
            body: `We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by emailing privacy@prelai.org. Upon deletion, all your deals, contacts, and sync history will be permanently removed from our systems within 30 days.`
          },
          {
            title: "7. Third-party services",
            body: `Relai uses the following third-party services:\n\n• Supabase — database and authentication (supabase.com/privacy)\n• Anthropic — AI processing (anthropic.com/privacy)\n• Vercel — hosting and deployment (vercel.com/legal/privacy-policy)\n• Resend — transactional email (resend.com/privacy)\n\nEach of these services has their own privacy policy governing their use of data.`
          },
          {
            title: "8. Your rights",
            body: `You have the right to:\n\n• Access the data we hold about you\n• Correct inaccurate data\n• Request deletion of your data\n• Withdraw consent and disconnect your Google account at any time\n• Export your data in a portable format\n\nTo exercise any of these rights, email us at privacy@prelai.org.`
          },
          {
            title: "9. Security",
            body: `We take security seriously. All data is encrypted in transit (TLS) and at rest. We use Row Level Security to ensure users can only access their own data. We regularly review our security practices and promptly address any vulnerabilities.`
          },
          {
            title: "10. Changes to this policy",
            body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on prelai.org. Your continued use of Relai after changes take effect constitutes your acceptance of the revised policy.`
          },
          {
            title: "11. Contact",
            body: `Questions about this Privacy Policy? We're a small team and we actually read our emails.\n\nEmail: privacy@prelai.org\nWebsite: prelai.org`
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
            Relai · prelai.org · privacy@prelai.org
          </p>
        </div>
      </div>
    </div>
  )
}
