import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DMCA Policy',
  description: 'ThumbAI DMCA Policy — how to submit copyright infringement notices.',
}

export default function DmcaPage() {
  const updated = 'June 1, 2025'
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="glass-card p-8 md:p-12">
        <h1 className="font-display text-4xl font-bold mb-2 gradient-text">DMCA Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: {updated}</p>

        {[
          {
            title: '1. Overview',
            body: 'ThumbAI respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act (DMCA). We will respond promptly to valid notices of claimed copyright infringement.'
          },
          {
            title: '2. What ThumbAI Generates',
            body: 'ThumbAI generates AI thumbnail images using user-supplied YouTube URLs and text prompts. The YouTube video thumbnails used as reference are publicly accessible assets (img.youtube.com). AI-generated outputs are derivative synthetic images — not copies of copyrighted works.\n\nThumbAI does not host user-uploaded videos or third-party copyrighted media.'
          },
          {
            title: '3. Reporting Copyright Infringement',
            body: 'If you believe content on ThumbAI infringes your copyright, please send a DMCA takedown notice to dmca@thumbai.app containing:\n\n1. Your full legal name, address, phone number, and email\n2. Identification of the copyrighted work claimed to be infringed\n3. Identification of the allegedly infringing material and its location on our platform\n4. A statement that you have a good-faith belief that the disputed use is not authorized\n5. A statement under penalty of perjury that the information in the notice is accurate and you are the copyright owner or authorized to act on their behalf\n6. Your physical or electronic signature'
          },
          {
            title: '4. Counter-Notification',
            body: 'If you believe your content was removed in error, you may send a counter-notification to dmca@thumbai.app. Counter-notices must include:\n\n1. Your full legal name and contact information\n2. Identification of the removed material and its prior location\n3. A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake\n4. Consent to jurisdiction of the relevant federal or Indian court\n5. Your physical or electronic signature'
          },
          {
            title: '5. Repeat Infringers',
            body: 'ThumbAI will terminate accounts of users who are found to be repeat infringers of third-party intellectual property rights.'
          },
          {
            title: '6. DMCA Agent Contact',
            body: 'DMCA Agent: ThumbAI Legal Team\nEmail: dmca@thumbai.app\n\nWe respond to valid DMCA notices within 5 business days.'
          },
        ].map(s => (
          <section key={s.title} className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">{s.title}</h2>
            <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
