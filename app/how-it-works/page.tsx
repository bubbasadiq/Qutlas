import ContentPage from '../ContentPage';

export const metadata = {
  title: 'How it works | Qutlas',
  description: 'How to prepare a materials or custom manufacturing request with Qutlas.',
};

export default function HowItWorksPage() {
  return <ContentPage eyebrow="How it works" title="From requirement to quotation." description="Start with a material, a drawing, or a short description. Add the details you know, then Qutlas can review the scope before a price or timing is confirmed." action="Start a project" sections={[
    { title: '1. Tell us what you need', body: 'Choose steel, wood, granite, or not sure yet. Select material supply, cut-to-size work, a component, an assembly, or project sourcing.' },
    { title: '2. Add useful details', body: 'Describe the requirement, enter relevant dimensions and quantities, add the project location, and include supporting files if you have them.' },
    { title: '3. Review your request', body: 'Check the material, specifications, contact details, and destination before preparing the quote request.' },
    { title: '4. Submit the request for review', body: 'The site saves your enquiry and returns a reference. This is not an order or payment confirmation. Qutlas must confirm scope, availability, price, and timing before an order can be accepted.' },
  ]} />;
}