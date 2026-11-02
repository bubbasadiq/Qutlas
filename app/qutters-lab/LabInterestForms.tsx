'use client';

import { useState, type FormEvent } from 'react';

type FormKind = 'host' | 'participant';

function InterestForm({ kind }: { kind: FormKind }) {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isHost = kind === 'host';
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    const form = event.currentTarget;
    const fields = new FormData(form);
    const response = await fetch('/api/qutters-lab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: kind,
        name: isHost ? fields.get('organisation') : fields.get('name'),
        email: fields.get('email'),
        organisation: isHost ? fields.get('organisation') : '',
        location: fields.get('location'),
        organisationType: fields.get('organisationType'),
        interest: fields.get('interest'),
        message: fields.get('message'),
        website: fields.get('website'),
      }),
    }).catch(() => null);
    const result: unknown = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok || typeof result !== 'object' || result === null || !('reference' in result) || typeof result.reference !== 'string') {
      setError(typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
        ? result.error
        : 'We could not save your interest. Please try again.');
      return;
    }
    setNotice(`Your interest was saved. Reference: ${result.reference}.`);
    form.reset();
  };

  return <form className="lab-interest-form" onSubmit={submit}>
    <div className="lab-form-intro"><span>{isHost ? '01 / INSTITUTIONS & HUBS' : '02 / MAKERS & LEARNERS'}</span><h3>{isHost ? 'Host a Qutters Lab' : 'Get involved'}</h3><p>{isHost ? 'Tell us about your institution or hub and the kind of lab space you want to explore.' : 'Tell us what you want to learn, prototype or build, and how you would like to take part.'}</p></div>
    <label>{isHost ? 'Institution or hub name' : 'Your name'}<input name={isHost ? 'organisation' : 'name'} required maxLength={200} autoComplete={isHost ? 'organization' : 'name'} placeholder={isHost ? 'Organisation name' : 'Full name'} /></label>
    <label>Email address<input type="email" name="email" required maxLength={320} autoComplete="email" placeholder="you@example.com" /></label>
    {isHost ? <><label>Country and city<input name="location" required placeholder="City, country" /></label><label>Type of organisation<select name="organisationType" defaultValue="" required><option value="" disabled>Select an option</option><option>University or college</option><option>Technical or vocational institution</option><option>Innovation hub or makerspace</option><option>Other organisation</option></select></label></> : <><label>What are you interested in?<select name="interest" defaultValue="" required><option value="" disabled>Select an area</option><option>Robotics and mechanics</option><option>Product design and prototyping</option><option>Making and fabrication</option><option>Learning practical skills</option><option>Other</option></select></label><label>Tell us a little more<textarea name="message" rows={3} placeholder="What would you like to explore or build?" /></label></>}
    <label className="sr-only" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Submitting…' : isHost ? 'Register hosting interest' : 'Register interest'}</button>
    {notice && <p className="lab-form-notice" role="status">{notice}</p>}
  </form>;
}

export default function LabInterestForms() {
  return <div className="lab-forms-grid"><section id="host"><InterestForm kind="host" /></section><section id="participate"><InterestForm kind="participant" /></section></div>;
}
