import ContentPage from '../ContentPage';

const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'hello@qutlas.com';

export const metadata = {
  title: 'For business | Qutlas',
  description: 'Organise material and manufacturing requirements for a business or project.',
};

export default function BusinessPage() {
  return <ContentPage eyebrow="For business" title="Source for the work ahead." description="For contractors, workshops, designers, manufacturers, and project teams sourcing materials or requesting made-to-measure work." action="Email business enquiries" actionHref={`mailto:${businessEmail}?subject=${encodeURIComponent('Business enquiry for Qutlas')}`} sections={[
    { title: 'Bring a project list', body: 'Describe the items, materials, quantities, and destination in one project request. Add a bill of quantities or supporting files where available.' },
    { title: 'Request repeat or larger requirements', body: 'Include expected quantities, project phases, and any delivery constraints so the scope can be reviewed.' },
    { title: 'Discuss business requirements', body: `For account, procurement, or ongoing supply discussions, email ${businessEmail}.` },
  ]} />;
}