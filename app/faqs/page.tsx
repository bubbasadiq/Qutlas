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
    { title: 'Does submitting the form send my request?', body: 'Yes. The project form sends your request to Qutlas and shows a reference when it has been saved. This is an enquiry, not an order or payment confirmation. Scope, availability, price, and timing still need review.' },
    { title: 'Are my files uploaded?', body: 'Supported files you attach are uploaded to private project storage and checked after upload. They are part of your enquiry; uploading a file does not place an order.' },
  ]} />;
}