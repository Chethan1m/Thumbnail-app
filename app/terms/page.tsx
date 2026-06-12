import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ThumbAI Terms of Service — the rules governing your use of the platform.',
}

export default function TermsPage() {
  const updated = 'June 1, 2025'
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="glass-card p-8 md:p-12">
        <h1 className="font-display text-4xl font-bold mb-2 gradient-text">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: {updated}</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By creating an account or using ThumbAI, you agree to be bound by these Terms of Service. If you do not agree, you must not use the service.'
          },
          {
            title: '2. Service Description',
            body: 'ThumbAI provides an AI-powered YouTube thumbnail generation service, including an HTML5 canvas editor, text overlay tools, and high-resolution PNG export. The service is provided "as is" and may be modified or discontinued at any time.'
          },
          {
            title: '3. Accounts and Eligibility',
            body: '• You must be at least 13 years of age to use ThumbAI.\n• One account per person. Creating multiple accounts to circumvent credit limits is prohibited.\n• You are responsible for maintaining the security of your account credentials.'
          },
          {
            title: '4. Free Tier & Credits',
            body: 'Free accounts receive 2 AI thumbnail generation credits per calendar month. Credits are non-transferable and non-refundable. Unused credits do not roll over to the next month. ThumbAI reserves the right to change the free tier allocation at any time.'
          },
          {
            title: '5. Paid Subscriptions',
            body: '• Pro (₹1,500/month): 100 credits/month, high-resolution exports.\n• Elite (₹3,999/month): Unlimited credits, AI background removal.\n• Subscriptions are billed monthly via Stripe. You may cancel at any time from your account settings.\n• Cancellation takes effect at the end of the current billing period. We do not offer prorated refunds.\n• Price changes will be communicated at least 30 days in advance.'
          },
          {
            title: '6. Acceptable Use',
            body: 'You may not use ThumbAI to generate content that: (a) infringes third-party intellectual property rights; (b) is defamatory, obscene, or illegal; (c) violates YouTube\'s Terms of Service or community guidelines; (d) is used for spam, phishing, or deceptive commercial practices.'
          },
          {
            title: '7. Intellectual Property',
            body: 'You retain ownership of any original content you upload (e.g., your personal photo). AI-generated thumbnail images are provided under a royalty-free license for personal and commercial use on YouTube. ThumbAI retains all rights to its software, branding, and AI models.'
          },
          {
            title: '8. Third-Party Services',
            body: 'ThumbAI integrates with Supabase (auth/database), Stripe (billing), Fal.ai (AI generation), and Resend (email). Your use of ThumbAI is also subject to each provider\'s applicable terms and policies.'
          },
          {
            title: '9. Disclaimer of Warranties',
            body: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. THUMBAI DOES NOT GUARANTEE THAT GENERATED THUMBNAILS WILL INCREASE YOUR CHANNEL\'S CLICK-THROUGH RATE OR VIEWS.'
          },
          {
            title: '10. Limitation of Liability',
            body: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THUMBAI\'S LIABILITY IS LIMITED TO THE AMOUNT YOU PAID IN THE 3 MONTHS PRECEDING THE CLAIM.'
          },
          {
            title: '11. Governing Law',
            body: 'These terms are governed by the laws of India. Disputes shall be resolved in the courts of Mumbai, Maharashtra.'
          },
          {
            title: '12. Contact',
            body: 'For terms inquiries: legal@thumbai.app'
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
