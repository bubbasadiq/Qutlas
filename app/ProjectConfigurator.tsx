
'use client';

import { ChangeEvent, DragEvent, FormEvent, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

export type MaterialId = 'steel' | 'wood' | 'granite' | 'unsure';
type StartMode = 'drawing' | 'description' | 'idea';
type NeedType = 'material' | 'cut' | 'component' | 'assembly' | 'project' | 'custom';

type Field = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: string[];
  unit?: string;
};

type Draft = {
  material: MaterialId;
  startMode: StartMode;
  need: NeedType;
  itemName: string;
  description: string;
  specs: Record<string, string>;
  quantity: string;
  quantityUnit: string;
  files: File[];
  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  delivery: string;
  contactMethod: string;
  instructions: string;
};

const materialLabels: Record<MaterialId, string> = {
  steel: 'Steel',
  wood: 'Wood',
  granite: 'Granite',
  unsure: 'Not sure yet',
};

const materialFields: Partial<Record<MaterialId, Field[]>> = {
  steel: [
    { name: 'form', label: 'Steel product', type: 'select', options: ['Sheet', 'Plate', 'Bar', 'Tube', 'Section', 'Made-to-measure component', 'Not sure'] },
    { name: 'grade', label: 'Grade or type (if known)', placeholder: 'For example, mild steel' },
    { name: 'thickness', label: 'Thickness (optional)', type: 'number', unit: 'mm' },
    { name: 'length', label: 'Length (optional)', type: 'number', unit: 'mm' },
    { name: 'width', label: 'Width or diameter (optional)', type: 'number', unit: 'mm' },
    { name: 'processing', label: 'Work needed', type: 'select', options: ['Supply only', 'Cutting', 'Drilling', 'Bending', 'Welding', 'Finishing', 'More than one service', 'Not sure'] },
  ],
  wood: [
    { name: 'form', label: 'Wood product', type: 'select', options: ['Board or sheet', 'Timber', 'Panel', 'Made-to-measure component', 'Not sure'] },
    { name: 'woodType', label: 'Wood or board type (if known)', placeholder: 'For example, plywood or hardwood' },
    { name: 'thickness', label: 'Thickness (optional)', type: 'number', unit: 'mm' },
    { name: 'length', label: 'Length (optional)', type: 'number', unit: 'mm' },
    { name: 'width', label: 'Width (optional)', type: 'number', unit: 'mm' },
    { name: 'finish', label: 'Cutting or finish needed', type: 'select', options: ['Supply only', 'Cut to size', 'Edge treatment', 'Assembly', 'More than one service', 'Not sure'] },
  ],
  granite: [
    { name: 'application', label: 'What is the granite for?', type: 'select', options: ['Countertop', 'Steps', 'Floor or wall finish', 'Other surface', 'Not sure'] },
    { name: 'colour', label: 'Colour or pattern preference (optional)' },
    { name: 'finish', label: 'Surface finish (if known)', type: 'select', options: ['Polished', 'Honed', 'Other', 'Not sure'] },
    { name: 'length', label: 'Length (optional)', type: 'number', unit: 'mm' },
    { name: 'width', label: 'Width or depth (optional)', type: 'number', unit: 'mm' },
    { name: 'thickness', label: 'Thickness (optional)', type: 'number', unit: 'mm' },
    { name: 'cutouts', label: 'Cut-outs or edge details (optional)', placeholder: 'For example, sink cut-out or edge profile' },
    { name: 'installation', label: 'Installation', type: 'select', options: ['Supply only', 'Installation needed', 'Not sure'] },
  ],
};

const needLabels: Record<NeedType, string> = {
  material: 'Buy material',
  cut: 'Cut material to size',
  component: 'Make a component',
  assembly: 'Fabricate an assembly or finished item',
  project: 'Supply materials for a project',
  custom: 'Discuss a custom requirement',
};

const startModes: { id: StartMode; title: string; body: string }[] = [
  { id: 'drawing', title: 'I have a drawing', body: 'Add a drawing, specification, photo, or bill of quantities.' },
  { id: 'description', title: 'I know what I need', body: 'Describe the item, material, size, and quantity.' },
  { id: 'idea', title: 'I have an idea', body: 'Start with a simple description or reference photo.' },
];

const acceptedExtensions = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'dxf', 'dwg', 'step', 'stp', 'csv', 'xlsx',
]);

const maxFileSize = 10 * 1024 * 1024;
const maxFiles = 8;

function createDraft(material: MaterialId, startMode: StartMode, itemName = ''): Draft {
  return {
    material,
    startMode,
    need: material === 'unsure' ? 'custom' : 'material',
    itemName: itemName.trim().slice(0, 300),
    description: '',
    specs: {},
    quantity: '1',
    quantityUnit: 'pieces',
    files: [],
    name: '',
    company: '',
    phone: '',
    email: '',
    location: '',
    delivery: 'delivery',
    contactMethod: 'phone',
    instructions: '',
  };
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectConfigurator({
  initialMaterial = 'unsure',
  initialStartMode = 'description',
  initialItemName = '',
}: {
  initialMaterial?: string;
  initialStartMode?: string;
  initialItemName?: string;
}) {
  const validMaterial = Object.prototype.hasOwnProperty.call(materialLabels, initialMaterial)
    ? (initialMaterial as MaterialId)
    : 'unsure';

  const validStart = startModes.some(({ id }) => id === initialStartMode)
    ? (initialStartMode as StartMode)
    : 'description';

  const [draft, setDraft] = useState(() => createDraft(validMaterial, validStart, initialItemName));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateSpec = (name: string, value: string) => {
    setDraft((current) => ({
      ...current,
      specs: { ...current.specs, [name]: value },
    }));
  };

  const selectMaterial = (material: MaterialId) => {
    setDraft((current) => ({
      ...current,
      material,
      specs: {},
      quantityUnit: 'pieces',
    }));
  };

  const addFiles = (incoming: FileList | File[]) => {
    const accepted: File[] = [];
    const rejected: string[] = [];

    Array.from(incoming).forEach((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (!acceptedExtensions.has(extension)) {
        rejected.push(`${file.name}: unsupported file type`);
      } else if (file.size < 1 || file.size > maxFileSize) {
        rejected.push(`${file.name}: file must be no larger than 10 MB and cannot be empty`);
      } else if (draft.files.length + accepted.length >= maxFiles) {
        rejected.push(`${file.name}: up to ${maxFiles} files per project`);
      } else {
        accepted.push(file);
      }
    });

    if (accepted.length) {
      updateDraft('files', [...draft.files, ...accepted]);
    }

    setError(rejected.join('. '));
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      addFiles(event.currentTarget.files);
    }
    event.currentTarget.value = '';
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const nextStep = () => {
    setError('');
    setStatus('');

    if (step === 1 && !draft.description.trim()) {
      setError('Describe what you need so we can understand the project.');
      return;
    }

    if (step === 2 && (!draft.quantity || !Number.isFinite(Number(draft.quantity)) || Number(draft.quantity) < 1)) {
      setError('Add a valid quantity of at least 1.');
      return;
    }

    if (
      step === 3 &&
      (!draft.name.trim() || !draft.email.trim() || !draft.phone.trim() || !draft.location.trim())
    ) {
      setError('Add your name, email, phone number, and project location to continue.');
      return;
    }

    if (step === 3 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError('Enter a valid email address so we can reply about your project.');
      return;
    }

    setStep((current) => Math.min(4, current + 1));
  };

  const previousStep = () => {
    setError('');
    setStatus('');
    setStep((current) => Math.max(0, current - 1));
  };

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');
    setStatus('');
    setIsSubmitting(true);

    let reference = '';

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('The submission service is not configured. Please contact Qutlas Support.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = globalThis.crypto.randomUUID();
      }

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          details: {
            material: draft.material,
            startMode: draft.startMode,
            need: draft.need,
            itemName: draft.itemName,
            description: draft.description,
            specs: draft.specs,
            quantity: draft.quantity,
            quantityUnit: draft.quantityUnit,
            name: draft.name,
            company: draft.company,
            phone: draft.phone,
            email: draft.email,
            location: draft.location,
            delivery: draft.delivery,
            contactMethod: draft.contactMethod,
            instructions: draft.instructions,
          },
          files: draft.files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'We could not save your request. Please try again.',
        );
      }

      if (typeof result.reference !== 'string' || !result.reference) {
        throw new Error('The server did not return an enquiry reference.');
      }

      reference = result.reference;

      if (draft.files.length > 0 && result.alreadyCompleted !== true) {
        if (
          typeof result.enquiryId !== 'string' ||
          typeof result.uploadSecret !== 'string' ||
          !Array.isArray(result.uploads) ||
          result.uploads.length !== draft.files.length
        ) {
          throw new Error(
            `Your request ${reference} was saved, but the file upload instructions were incomplete. Please contact Qutlas Support and quote your reference.`,
          );
        }

        for (let index = 0; index < draft.files.length; index++) {
          const file = draft.files[index];
          const upload = result.uploads[index];

          if (
            !upload ||
            typeof upload.path !== 'string' ||
            typeof upload.token !== 'string'
          ) {
            throw new Error(
              `Your request ${reference} was saved, but the upload instructions were invalid. Please contact Qutlas Support and quote your reference.`,
            );
          }

          const { error: uploadError } = await supabase.storage
            .from('qutlas-project-files')
            .uploadToSignedUrl(upload.path, upload.token, file, {
              contentType: file.type || 'application/octet-stream',
              upsert: true,
            });

          if (uploadError) {
            console.error('Qutlas file upload failed:', uploadError);

            throw new Error(
              `Your request ${reference} was saved, but "${file.name}" could not be uploaded. Please contact Qutlas Support and quote your reference.`,
            );
          }
        }

        const completionResponse = await fetch(
          `/api/enquiries/${encodeURIComponent(result.enquiryId)}/complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadSecret: result.uploadSecret }),
          },
        );

        const completion = await completionResponse.json();

        if (!completionResponse.ok || completion.completed !== true) {
          throw new Error(
            `Your request ${reference} was saved, but we could not confirm all file uploads. Please contact Qutlas Support and quote your reference.`,
          );
        }
      }

      setStatus(
        `Your request has been submitted successfully. Your reference is ${reference}. Qutlas will review your requirements and follow up.`,
      );

      setDraft((current) => ({ ...current, files: [] }));
      idempotencyKeyRef.current = null;
    } catch (submissionError) {
      console.error('Qutlas enquiry submission failed:', submissionError);

      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Something went wrong. Please try again.',
      );

      if (reference) {
        setStatus(`Your enquiry reference is ${reference}.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const materialOptions: MaterialId[] = ['steel', 'wood', 'granite', 'unsure'];
  const stepNames = ['Choose', 'Describe', 'Specifications', 'Your details', 'Review'];

  return (
    <main className="project-page">
      <section className="project-shell" id="project-form" aria-labelledby="project-heading">
        <div className="project-heading">
          <a className="project-back" href="/">← Back to Qutlas</a>
          <p className="eyebrow">Project request</p>
          <h1 id="project-heading">Start with what you have.</h1>
          <p>
            Choose a material, describe the job, and add the details you know.
            You can leave uncertain specifications blank.
          </p>
        </div>

        <ol className="progress-steps" aria-label="Project request progress">
          {stepNames.map((name, index) => (
            <li
              key={name}
              className={index === step ? 'is-current' : index < step ? 'is-complete' : ''}
              aria-current={index === step ? 'step' : undefined}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {name}
            </li>
          ))}
        </ol>

        <form className="project-form" onSubmit={handleRequest}>
          {step === 0 && (
            <div className="wizard-step">
              <div className="step-title">
                <span>01</span>
                <div>
                  <h2>What are you working with?</h2>
                  <p>Not sure which material to choose? Tell us what you’re making.</p>
                </div>
              </div>

              <fieldset className="material-picker">
                <legend className="sr-only">Choose your material</legend>
                {materialOptions.map((material) => (
                  <button
                    key={material}
                    type="button"
                    className={`material-choice ${draft.material === material ? 'selected' : ''}`}
                    onClick={() => selectMaterial(material)}
                    aria-pressed={draft.material === material}
                  >
                    <span className={`material-chip chip-${material}`} aria-hidden="true" />
                    <span>{materialLabels[material]}</span>
                  </button>
                ))}
              </fieldset>

              <div className="field-group">
                <label htmlFor="need">What do you need?</label>
                <select
                  id="need"
                  value={draft.need}
                  onChange={(event) => updateDraft('need', event.target.value as NeedType)}
                >
                  {Object.entries(needLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <fieldset className="start-modes">
                <legend>How would you like to start?</legend>
                <div className="mode-options">
                  {startModes.map((mode) => (
                    <label
                      key={mode.id}
                      className={`mode-option ${draft.startMode === mode.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="startMode"
                        value={mode.id}
                        checked={draft.startMode === mode.id}
                        onChange={() => updateDraft('startMode', mode.id)}
                      />
                      <span>
                        <strong>{mode.title}</strong>
                        <small>{mode.body}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {step === 1 && (
            <div className="wizard-step">
              <div className="step-title">
                <span>02</span>
                <div>
                  <h2>Describe the requirement</h2>
                  <p>
                    Describe what you need, or attach a drawing or photo.
                    Include any details that will help us understand the job.
                  </p>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="itemName">Project or item name <span>(optional)</span></label>
                <input
                  id="itemName"
                  value={draft.itemName}
                  onChange={(event) => updateDraft('itemName', event.target.value)}
                  placeholder="For example, workshop storage shelves"
                />
              </div>

              <div className="field-group">
                <label htmlFor="description">What would you like us to make or supply?</label>
                <textarea
                  id="description"
                  rows={5}
                  value={draft.description}
                  onChange={(event) => updateDraft('description', event.target.value)}
                  placeholder="A single part, a list of materials, or a larger project brief"
                  maxLength={3000}
                />
              </div>

              <div className="field-group">
                <span className="field-label">Add drawings or references <span>(optional)</span></span>
                <label
                  className={`upload-zone ${isDragging ? 'is-dragging' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.dxf,.dwg,.step,.stp,.csv,.xlsx"
                    onChange={onFileInput}
                  />
                  <span className="upload-mark" aria-hidden="true">+</span>
                  <strong>Drop files here or choose files</strong>
                  <small>PDF, JPG, PNG, DXF, DWG, STEP, STP, CSV, or XLSX · up to 10 MB each</small>
                </label>

                {draft.files.length > 0 && (
                  <ul className="file-list" aria-label="Selected files">
                    {draft.files.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}-${index}`}>
                        <span>
                          <strong>{file.name}</strong>
                          <small>{formatBytes(file.size)}</small>
                        </span>
                        <button
                          type="button"
                          className="remove-file"
                          aria-label={`Remove ${file.name}`}
                          onClick={() =>
                            updateDraft(
                              'files',
                              draft.files.filter((_, fileIndex) => fileIndex !== index),
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="field-help">
                  Your files will be uploaded securely with your project request.
                  Maximum 8 files, 10 MB per file.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <div className="step-title">
                <span>03</span>
                <div>
                  <h2>{materialLabels[draft.material]} details</h2>
                  <p>
                    Add what you know. If a detail is uncertain, leave it blank
                    and describe the application instead.
                  </p>
                </div>
              </div>

              {draft.material === 'unsure' ? (
                <div className="not-sure-note">
                  <strong>We can help identify the material.</strong>
                  <p>Describe how the item will be used and any appearance, strength, or site requirements.</p>
                </div>
              ) : (
                <div className="spec-grid">
                  {materialFields[draft.material]?.map((field) => (
                    <div className="field-group" key={field.name}>
                      <label htmlFor={`spec-${field.name}`}>{field.label}</label>
                      <div className="input-with-unit">
                        {field.type === 'select' ? (
                          <select
                            id={`spec-${field.name}`}
                            value={draft.specs[field.name] ?? ''}
                            onChange={(event) => updateSpec(field.name, event.target.value)}
                          >
                            <option value="">Choose an option</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`spec-${field.name}`}
                            type={field.type ?? 'text'}
                            min={field.type === 'number' ? '0' : undefined}
                            step={field.type === 'number' ? 'any' : undefined}
                            value={draft.specs[field.name] ?? ''}
                            onChange={(event) => updateSpec(field.name, event.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}
                        {field.unit && <span className="unit-label">{field.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="spec-grid">
                <div className="field-group">
                  <label htmlFor="quantity">Quantity</label>
                  <div className="input-with-unit">
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      step="any"
                      value={draft.quantity}
                      onChange={(event) => updateDraft('quantity', event.target.value)}
                      required
                    />
                    <select
                      aria-label="Quantity unit"
                      value={draft.quantityUnit}
                      onChange={(event) => updateDraft('quantityUnit', event.target.value)}
                    >
                      <option value="pieces">pieces</option>
                      <option value="m²">m²</option>
                      <option value="boxes">boxes</option>
                      <option value="sheets">sheets</option>
                      <option value="lengths">lengths</option>
                      <option value="sets">sets</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="instructions">Extra specification or list (optional)</label>
                  <textarea
                    id="instructions"
                    rows={3}
                    value={draft.instructions}
                    onChange={(event) => updateDraft('instructions', event.target.value)}
                    placeholder="Include several items, finish, or other project details"
                  />
                </div>
              </div>

              <div className="field-group delivery-choice">
                <span className="field-label">How would you like to receive it?</span>
                <div className="inline-options">
                  <label>
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={draft.delivery === 'delivery'}
                      onChange={() => updateDraft('delivery', 'delivery')}
                    />
                    Delivery
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="delivery"
                      value="collection"
                      checked={draft.delivery === 'collection'}
                      onChange={() => updateDraft('delivery', 'collection')}
                    />
                    Collection
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="delivery"
                      value="not-sure"
                      checked={draft.delivery === 'not-sure'}
                      onChange={() => updateDraft('delivery', 'not-sure')}
                    />
                    Not sure
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <div className="step-title">
                <span>04</span>
                <div>
                  <h2>How can we reach you?</h2>
                  <p>We’ll use these details to follow up about this project.</p>
                </div>
              </div>

              <div className="spec-grid">
                <div className="field-group">
                  <label htmlFor="customerName">Full name</label>
                  <input
                    id="customerName"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) => updateDraft('name', event.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="customerEmail">Email address</label>
                  <input
                    id="customerEmail"
                    type="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => updateDraft('email', event.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="customerPhone">Phone number</label>
                  <input
                    id="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+234"
                    value={draft.phone}
                    onChange={(event) => updateDraft('phone', event.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="company">Company <span>(optional)</span></label>
                  <input
                    id="company"
                    autoComplete="organization"
                    value={draft.company}
                    onChange={(event) => updateDraft('company', event.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="location">Project or delivery location</label>
                  <input
                    id="location"
                    autoComplete="street-address"
                    placeholder="Town, area, or site address"
                    value={draft.location}
                    onChange={(event) => updateDraft('location', event.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="contactMethod">Preferred contact</label>
                  <select
                    id="contactMethod"
                    value={draft.contactMethod}
                    onChange={(event) => updateDraft('contactMethod', event.target.value)}
                  >
                    <option value="phone">Phone call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step review-step">
              <div className="step-title">
                <span>05</span>
                <div>
                  <h2>Review your project</h2>
                  <p>Check the details before submitting your quote request.</p>
                </div>
              </div>

              <section className="review-section">
                <h3>Project</h3>
                <dl>
                  <div><dt>Material</dt><dd>{materialLabels[draft.material]}</dd></div>
                  <div><dt>Requirement</dt><dd>{needLabels[draft.need]}</dd></div>
                  <div><dt>Project or item</dt><dd>{draft.itemName || 'Not specified'}</dd></div>
                  <div><dt>Description</dt><dd>{draft.description}</dd></div>
                </dl>
              </section>

              <section className="review-section">
                <h3>Specifications</h3>
                <dl>
                  {Object.entries(draft.specs)
                    .filter(([, value]) => value)
                    .map(([key, value]) => {
                      const field = materialFields[draft.material]?.find((item) => item.name === key);
                      return (
                        <div key={key}>
                          <dt>{field?.label ?? key.replace(/([A-Z])/g, ' $1')}</dt>
                          <dd>{value}{field?.unit ? ` ${field.unit}` : ''}</dd>
                        </div>
                      );
                    })}
                  <div><dt>Quantity</dt><dd>{draft.quantity} {draft.quantityUnit}</dd></div>
                  <div><dt>Delivery or collection</dt><dd>{draft.delivery}</dd></div>
                  {draft.instructions && <div><dt>Additional details</dt><dd>{draft.instructions}</dd></div>}
                </dl>
              </section>

              <section className="review-section">
                <h3>Contact</h3>
                <dl>
                  <div><dt>Name</dt><dd>{draft.name}</dd></div>
                  <div><dt>Email</dt><dd>{draft.email}</dd></div>
                  <div><dt>Phone</dt><dd>{draft.phone}</dd></div>
                  {draft.company && <div><dt>Company</dt><dd>{draft.company}</dd></div>}
                  <div><dt>Location</dt><dd>{draft.location}</dd></div>
                  <div><dt>Preferred contact</dt><dd>{draft.contactMethod}</dd></div>
                </dl>
              </section>

              <section className="review-section">
                <h3>Files</h3>
                {draft.files.length ? (
                  <ul className="review-files">
                    {draft.files.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}-${index}`}>
                        {file.name} <span>{formatBytes(file.size)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No files attached.</p>
                )}
              </section>

              <p className="price-note">
                Get a quote for your project. Price and availability are reviewed against
                the materials, specifications, quantity, and services you need.
              </p>

              <button
                type="submit"
                className="primary-button request-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting your request...' : 'Request My Quote'}
              </button>

              {status && (
                <p className="submission-status" role="status" aria-live="polite">
                  {status}
                </p>
              )}

              <p className="submission-note">
                Your request will be recorded securely. Keep your reference number
                for any follow-up with Qutlas.
              </p>
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="wizard-controls">
            {step > 0 ? (
              <button
                type="button"
                className="secondary-button"
                onClick={previousStep}
                disabled={isSubmitting}
              >
                ← Back
              </button>
            ) : (
              <a className="secondary-button" href="/">Cancel</a>
            )}

            {step < 4 && (
              <button
                type="button"
                className="primary-button"
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Continue <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
