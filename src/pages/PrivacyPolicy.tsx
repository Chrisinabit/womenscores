import { Link } from 'react-router-dom'
import LegalSection from '../components/LegalSection'
import PageHeader from '../components/PageHeader'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brandName, contactEmail, policyLastUpdated } from '../data/site'

export default function PrivacyPolicy() {
  useDocumentTitle('Privacy policy')

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <PageHeader
        eyebrow="THE PAPERWORK"
        title="Privacy policy"
        lead={`What we collect, why we collect it, and how you can control the cookies set when you use ${brandName}.`}
      />

      <p className="mt-6 text-[10px] font-bold tracking-[.16em] text-gray-500">
        LAST UPDATED <span className="text-emerald-300">{policyLastUpdated.toUpperCase()}</span>
      </p>

      <article className="mt-6 max-w-3xl space-y-7 border border-emerald-400/15 bg-[#08281f]/60 p-6 sm:p-8">
        <LegalSection title="Who we are">
          <p>
            {brandName} is an independent women&apos;s football live scores website. There is no account system and no
            login — you can read every score, table and broadcast listing without giving us personal information. This
            policy explains the limited data we do handle.
          </p>
        </LegalSection>

        <LegalSection title="Information we collect">
          <ul>
            <li>
              <strong>Basic server and security logs.</strong> Like most websites, our hosting and API infrastructure
              records the requests made to our servers: IP address, browser and device type, the page requested, the
              referring page and a timestamp. We use these logs to keep the site running, detect abuse and fix errors.
            </li>
            <li>
              <strong>Anonymous usage analytics.</strong> We use Google Analytics 4 to understand which pages are used
              and how the site performs. GA4 records aggregated, pseudonymous information such as pages viewed, session
              duration, approximate location (city level or coarser) and device category. We do not use it to identify
              you personally.
            </li>
            <li>
              <strong>Messages you send us.</strong> If you email us — a correction, a data question, an advertising
              enquiry — we receive your email address, the contents of your message and any details you choose to
              include. We keep that correspondence so we can reply and follow up.
            </li>
            <li>
              <strong>Advertising and affiliate cookies.</strong> Our advertising and affiliate partners may set cookies
              or similar identifiers when their ads are shown or their links are clicked. These are described below.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Cookies and similar technologies">
          <p>
            A cookie is a small file stored by your browser. We use four kinds, with different purposes:
          </p>
          <ul>
            <li><strong>Strictly necessary</strong> — needed for the site and its security to work. These cannot be switched off through our site.</li>
            <li><strong>Analytics</strong> — Google Analytics 4 cookies that help us see which pages and competitions people use.</li>
            <li><strong>Advertising</strong> — set by Google AdSense and its partners to limit repetition and, where you consent, personalise ads.</li>
            <li><strong>Affiliate tracking</strong> — set when you click a partner link, so the partner can attribute a referral to us.</li>
          </ul>
          <p>
            You can delete or block cookies at any time in your browser settings. Blocking every cookie will not stop
            scores from loading, but it may make advertising less relevant and break partner attributions.
          </p>
        </LegalSection>

        <LegalSection title="Third-party advertising (Google AdSense)">
          <p>
            We use Google AdSense to display advertising. Third-party vendors, including Google, use cookies to serve
            ads based on your prior visits to this and other websites. Google&apos;s use of advertising cookies enables
            it and its partners to serve ads based on your visits to our site and other sites on the internet.
          </p>
          <p>
            Google uses the DoubleClick advertising cookie to serve and measure ads. You can opt out of personalised
            advertising by visiting{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a>, or opt
            out of a vendor&apos;s use of cookies for personalised advertising at{' '}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">aboutads.info</a> and{' '}
            <a href="https://www.youronlinechoices.com" target="_blank" rel="noreferrer">youronlinechoices.com</a>.
          </p>
          <p>
            Opting out does not remove ads — it means the ads you see are not personalised using your browsing history.
            Where the law requires consent (for example in the UK, the EU and California), non-essential ad cookies are
            only set after you agree through the consent notice.
          </p>
        </LegalSection>

        <LegalSection title="Affiliate links and how we disclose them">
          <p>
            Some links on this site are affiliate links. That includes broadcast and streaming badges in the match
            centre&apos;s <strong>Where to Watch</strong> section, and any shop or ticket links we add. Clicking one may
            set a referral cookie and pass an identifier to the destination so that the partner knows the visit came
            from us.
          </p>
          <p>
            If you sign up, subscribe or buy something after following one of those links, we may earn a commission. It
            does not change the price you pay, and it never determines which broadcasters, competitions or articles we
            show — listings are generated from match data, not from partner deals.
          </p>
          <p>
            In line with the US Federal Trade Commission&apos;s endorsement guides, the UK Competition and Markets
            Authority&apos;s guidance on online endorsements, and EU consumer protection rules, we disclose this
            relationship clearly: <strong>these are paid links and we benefit when you use them.</strong>
          </p>
        </LegalSection>

        <LegalSection title="Links to other websites">
          <p>
            Scores pages link to broadcasters; news cards link to publishers such as BBC Sport and The Guardian. Once
            you leave {brandName}, those sites apply their own privacy and cookie policies, which we do not control.
            Please read them before sharing information.
          </p>
        </LegalSection>

        <LegalSection title="Why we are allowed to process this data">
          <p>
            Under the UK GDPR and EU GDPR we rely on: <strong>legitimate interests</strong> for security logs and for
            keeping the site working; <strong>consent</strong> for analytics and advertising cookies where consent is
            required, which you can withdraw at any time; and <strong>legitimate interests or consent</strong> for
            handling correspondence you send us.
          </p>
          <p>
            We do not sell your personal information. We do not knowingly collect data from children under 13, and the
            site is not directed at children.
          </p>
        </LegalSection>

        <LegalSection title="Your rights">
          <p>
            Depending on where you live, you may have the right to access, correct or delete your personal data, to
            restrict or object to its processing, to withdraw consent, and to receive a portable copy of data you gave
            us. California residents may request disclosure or deletion of personal information and may opt out of the
            sale or sharing of personal information — we do not sell personal information.
          </p>
          <p>
            To make a request, email{' '}
            <a href={`mailto:${contactEmail}?subject=Privacy%20request`}>{contactEmail}</a> with enough detail for us to
            find what you mean. We respond within the timeframe required by the applicable law (usually 30 days). If you
            are in the UK or EU you also have the right to complain to your local data protection authority.
          </p>
        </LegalSection>

        <LegalSection title="Retention and changes to this policy">
          <p>
            Security logs, analytics and correspondence are kept only as long as needed for the purposes above, then
            deleted or aggregated. If we change this policy we will update the date at the top of the page; material
            changes will be noted on the site.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Questions about this policy or your data:{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. For how we use data in general, see{' '}
            <Link to="/about">about {brandName}</Link>; for the rules of using the site, see our{' '}
            <Link to="/terms">terms of use</Link>.
          </p>
        </LegalSection>
      </article>
    </main>
  )
}
