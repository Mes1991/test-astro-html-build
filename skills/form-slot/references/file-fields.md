# File fields — an adapter capability, not a core guarantee

> **Opt-in provider recipe.** This contract describes a capability that depends entirely on the
> chosen form provider. It is an extension, not product core. The canonical contract defines the
> obligation; the concrete behavior belongs to the adapter.

A file field renders as a dropzone and enforces its type, size and required rules in the visitor's
browser. **Whether the selected file is actually delivered — sent with the submission, stored, or
attached to a notification — is a property of the chosen provider, not of this contract.**

Read that twice before using one. A file field can look complete: the visitor picks a file, the name
appears, validation passes, the form submits and the success message shows. Nothing on the page
indicates whether the file went anywhere.

## The obligation

**Verify delivery end-to-end before relying on a file field.** A provider may validate a file in the
browser and still not transmit it. The only proof is a real submission whose file arrives at the
destination the project expects.

- **Browser-side validation is user experience, not security.** It tells an honest visitor their
  file is too large, and it stops nothing else.
- **Do not assume a file field is delivered because it validates.** Confirm it with the provider's
  documentation and with a real submission.
- **If the provider does not deliver files, do not ship a file field as though it worked.** Use the
  workaround below, or choose a provider that delivers.

## The workaround, when files are not delivered

Ask for the file by reply. Put a `textarea` or a short `text` field in the form asking the visitor
to mention that they have a document to send, and let the client request it in their reply to the
notification email.

**That reply only reaches the visitor if the adapter's documented reply mechanism is active.** Having
an email field is not enough and nothing infers it: how a field is marked, what an absent mark does,
and where an unmarked reply goes are the adapter's behaviour, not this contract's. **The adapter
must document and validate that mechanism — including whether more than one marked field is rejected
and what its limit is — before this workaround is relied on.** The rule is section 3.1 of
[form-schema.md](./form-schema.md); this page only tells you that this workaround depends on it.

## What this contract does not define

- **The provider's upload, storage or retention behavior.** Those are the adapter's, and they must
  be documented by the adapter, not assumed here.
- **The provider's field syntax.** The concrete keys a file field uses belong to the adapter's
  schema, not to this canonical contract.
