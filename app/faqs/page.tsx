import ContentPage from '../ContentPage';

export const metadata = {
  title: 'FAQs | Qutlas',
  description: 'Answers about Qutlas material and custom manufacturing requests.',
};

export default function FaqPage() {
  return <ContentPage eyebrow="FAQs" title="Questions before you start?" description="A few details about preparing a Qutlas project request." action="Start a project" sections={[
    { title: 'Do I need a CAD drawing?', body: 'No. You can start with a drawing, photo, sketch, bill of quantities, or a plain-language description.' },
    { title: 'Can I request more than one material?', body: 'Use the project description and additional instructions to list a wider requirement. Add enough detail for the team to understand each item.' },
    { title: 'Will I see a price immediately?', body: 'No. The site does not calculate live prices. Scope, material availability, processing, and delivery requirements need review before a quote can be confirmed.' },
    { title: 'Does submitting the form send my request?', body: 'The current site downloads a request summary and opens an email draft to support@qutlas.com. You must review and send the email. A request is not received until you send it.' },
    { title: 'Are my files uploaded?', body: 'No. Selected files stay in your browser session. Attach them to the email draft yourself; the site does not upload or store them.' },
  ]} />;
}