# Qutlas enquiry retry fix

Extract this ZIP into `C:\Users\bubba\Projects\qutlas` and overwrite the listed file.

Fix: the project configurator now reuses an idempotency key only when the full request payload is unchanged. If the user edits their details, specifications, or attached-file list after a failed submission, the next submission gets a fresh key instead of receiving a misleading HTTP 409 conflict. Identical retries still reuse the key to avoid duplicate enquiries.

No dependencies, environment files, database records, or Git history are changed.
