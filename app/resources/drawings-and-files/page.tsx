import ContentPage from '../../ContentPage';

export const metadata = {
  title: 'Drawings and files | Qutlas',
  description: 'How to prepare drawings, photos, bills of quantities, and project references for a Qutlas request.',
};

export default function DrawingsAndFilesPage() {
  return <ContentPage eyebrow="Resources" title="Drawings and files" description="A drawing can help explain the requirement, but it is not required to start. Photos, sketches, lists, and plain-language descriptions are also useful." action="Start with a drawing" actionHref="/project?startMode=drawing" sections={[
    { title: 'Include what you have', body: 'Add a drawing, photo, specification sheet, sketch, or bill of quantities that helps show the intended item or scope.' },
    { title: 'Keep dimensions and units clear', body: 'Use metric units where possible. Mark dimensions that are critical and identify details that still need confirmation.' },
    { title: 'You can start without CAD', body: 'Describe how the item will be used, which material you have in mind, and what you need supplied or made.' },
    { title: 'Current file handling', body: 'The current project flow keeps selected files in the browser and lists their names in the request summary. It does not upload files to Qutlas; attach them manually to the email draft before sending.' },
  ]} />;
}