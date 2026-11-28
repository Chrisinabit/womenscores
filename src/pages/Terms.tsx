import { Link } from 'react-router-dom'
import LegalSection from '../components/LegalSection'
import PageHeader from '../components/PageHeader'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brandName, contactEmail, policyLastUpdated } from '../data/site'

export default function Terms() {
  useDocumentTitle('Terms of use')

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <PageHeader
        eyebrow="THE GROUND RULES"
        title="Terms of use"
        lead="The short version: read the scores, enjoy the football, don't treat a broadcast listing as a guarantee, and don't scrape the site."
      />

      <p className="mt-6 text-[10px] font-bold tracking-[.16em] text-gray-500">
        LAST UPDATED <span className="text-emerald-300">{policyLastUpdated.toUpperCase()}</span>
      </p>

      <article className="mt-6 max-w-3xl space-y-7 border border-emerald-400/15 bg-[#08281f]/60 p-6 sm:p-8">
        <LegalSection title="Using this site">
          <p>
            By browsing {brandName} you agree to these terms. If you do not agree, please stop using the site. You may
            use {brandName} for personal, non-commercial purposes — checking scores, lineups, standings and where to
            watch a match.
          </p>
        </LegalSection>

        <LegalSection title="What this site is">
          <p>
            {brandName} is an information service. Scores, lineups, statistics, standings, broadcast listings and news
            headlines are provided for general information and entertainment. Nothing here is betting advice, financial
            advice, or an official record of any competition.
          </p>
        </LegalSection>

        <LegalSection title="No affiliation and trademarks">
          <p>
            {brandName} is independent and unofficial. Unless we say otherwise on a specific page, we are not
            affiliated with, endorsed by or sponsored by any league, club, federation, competition organiser or
            broadcaster — including the WSL, NWSL, UEFA, Liga F, the Frauen-Bundesliga or any international tournament.
          </p>
          <p>
            Club names, competition names, logos, crests, badges and broadcast marks shown on this site are the
            trademarks and copyright of their respective owners. They appear here for identification and reporting
            purposes only. Their use does not imply any partnership, endorsement or licence.
          </p>
        </LegalSection>

        <LegalSection title="Accuracy of scores and schedules">
          <p>
            Match data comes from a licensed third-party provider and broadcast listings are compiled from provider
            records and published schedules. Both can change at short notice, and both can contain errors. Kick-off
            times are moved, matches are postponed, and TV picks are swapped.
          </p>
          <p>
            <strong>Always confirm a fixture, kick-off time and broadcaster with the official source before you travel
            or subscribe to a service.</strong> We are not responsible for a schedule change, a broadcast blackout, a
            geo-restriction or a subscription you bought based on a listing on this site.
          </p>
        </LegalSection>

        <LegalSection title="Intellectual property">
          <p>
            The design, layout, code and original written content of {brandName} belong to us. You may link to any page
            freely. You may quote short excerpts with attribution and a link, but you may not republish substantial
            parts of the site, mirror it, or present our content as your own.
          </p>
          <p>
            News headlines, summaries and images are the property of the publishers they link to. We aggregate and link,
            we do not license that material to you.
          </p>
        </LegalSection>

        <LegalSection title="Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>scrape, crawl or bulk-extract data from the site or its API, or resell it as a data feed;</li>
            <li>attempt to disrupt, overload or gain unauthorised access to the site or its infrastructure;</li>
            <li>frame the site, or reproduce its branding in a way that suggests official status;</li>
            <li>use the site for unlawful purposes or in breach of these terms.</li>
          </ul>
          <p>
            We may limit or block access where we see automated or abusive traffic. If you want to use our data for
            something, ask first — see <Link to="/advertise">partnerships</Link>.
          </p>
        </LegalSection>

        <LegalSection title="Advertising and affiliate links">
          <p>
            The site is supported by advertising and affiliate links. Some outbound links — including{' '}
            <strong>Where to Watch</strong> broadcast and shop links — may earn us a commission at no extra cost to you.
            Sponsored placements are labelled. See our <Link to="/privacy-policy">privacy policy</Link> for the cookies
            involved.
          </p>
        </LegalSection>

        <LegalSection title="Third-party links">
          <p>
            We link to broadcasters, publishers and partners. Those sites are outside our control and have their own
            terms and privacy policies. We are not responsible for their content, availability or how they handle your
            data.
          </p>
        </LegalSection>

        <LegalSection title="Limitation of liability">
          <p>
            The site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind,
            including accuracy, fitness for a particular purpose or uninterrupted availability. To the fullest extent
            permitted by law, we are not liable for indirect or consequential loss, or for any loss arising from reliance
            on scores, statistics, standings or broadcast schedules published here.
          </p>
          <p>
            Nothing in these terms limits liability that cannot be limited by law, including for death or personal
            injury caused by negligence, or for fraud.
          </p>
        </LegalSection>

        <LegalSection title="Changes and governing law">
          <p>
            We may update these terms as the site changes; the date at the top of this page shows the current version,
            and continued use after a change means you accept it. These terms, and any dispute arising out of them, are
            governed by the laws of <strong>the Federal Republic of Nigeria</strong>, without regard to conflict-of-law
            rules. Nothing here removes any mandatory consumer protection you are entitled to in your country of
            residence.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Questions about these terms, permissions or data use:{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </LegalSection>
      </article>
    </main>
  )
}
