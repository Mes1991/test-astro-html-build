# Embed tracking — the adapter's event surface

> **Opt-in provider recipe.** This contract describes the observable surface of an embedded form
> produced by a third-party form provider. It is an extension, not product core, and it is
> **deny-by-default**: a site with no measurement activated needs nothing from it.

Hand this file to whatever configures Google Tag Manager, GA4, or any other measurement on a page
that carries one of these forms.

The other two contracts describe what the form **is**: [form-schema.md](./form-schema.md) the schema that builds it,
[embed-styling.md](./embed-styling.md) the DOM and classes it emits. This one describes what it **does that can be
observed** — the network calls, the messages, and which DOM hooks are safe to hang a trigger on.

## Start here

**The adapter owns the concrete surface.** The event names, the message marker, the transport, the
endpoints and the DOM hooks are all properties of the chosen provider. This canonical contract does
not fix any of them; it states the obligations an adapter must satisfy and the traps that apply to
any provider.

Three facts decide almost every question below, so read them before anything else.

**1. Server acceptance is the only conversion truth.** A click proves an activation. A CSS class
proves a rendered state. Neither proves that a submission reached the server and was accepted. The
adapter must expose a signal that corresponds to server acceptance, and section 6 says how to use it.

**2. The adapter must document its observable surface.** Before writing a trigger, read the
adapter's own documentation for: the transport it uses, the endpoints it calls, the messages it
posts, and the DOM hooks it emits. Do not infer any of these from another provider's contract.

**3. A client-side marker is not a credential.** Any marker inside a message payload can be forged
by any code that can post to the window. The adapter must document the check that cannot be forged
(for example, the message source), and the host must apply it.

## 1. The transport

The adapter must document, for each call it makes:

- **the endpoint and method**, so a transport-level trigger can match it;
- **the request shape** (content type, credentials policy), so a trigger inherited from a
  same-origin plugin does not silently stop matching;
- **whether the request is cross-origin**, because a trigger scoped to the client's own hostname
  will not match a cross-origin call;
- **what counts as success** — an HTTP status alone is not acceptance unless the adapter says so.

**One visitor action can produce more than one request.** A provider may retry after a server
rejection. A transport-level listener can therefore see more than one completion for one logical
attempt; deduplicate on your side, using the adapter's documented retry behavior.

## 2. The message envelope

If the adapter posts messages, it must document:

- **the marker** that identifies its messages, and the fact that the marker alone is not a
  credential;
- **the check that cannot be forged** (for example, comparing the message source to the window);
- **the message types** it emits, and what each one means;
- **which types carry an identifier**, so a page with two embeds can attribute a message.

**Both checks are required, and the source check is the security check.** A listener that checks
only the marker fires a conversion for any frame that can post to the window. Whatever the tag does
next — count a lead, notify a CRM, report a sale — it does on the say-so of a frame you do not
control.

**`detail` is not analytics-safe as-is.** Fields that come from the form's own settings may carry
anything the form's owner typed. Project the fields you want; do not forward the object.

### What emits nothing

- **A form that fails to load.** A dead embed is invisible unless the adapter documents a failure
  signal.
- **A repeated submit while one is in flight.** The adapter may drop the second and third
  activations with no message.
- **A submit blocked before any request is issued.** A client-side failure can fire an error
  message while no request ever leaves the browser.

## 3. The JavaScript callbacks

If the adapter exposes callbacks, it must document which ones fire, when, and whether the
auto-mount path passes them. **Do not assume a callback is available on the auto-mount path**; if
the adapter does not pass it there, use the message surface in section 2.

## 4. Identifying which form

The adapter must document how a mounted form is identified — the attribute on the mount container,
or the absence of one — so a trigger can resolve identity from an ancestor. Do not invent an
identifier the adapter does not emit.

## 5. Click-shaped signals

The adapter must document which DOM hooks are safe to hang a trigger on, and which are not:

- **which element carries the submit activation**, and whether keyboard submission is covered;
- **whether a control's label wraps its input**, because that produces two bubbling click events
  per action;
- **which classes are hover states rather than committed values**, so a trigger does not read a
  transient state as a choice.

## 6. What is not conversion truth

| Hook | Proves | Does not prove |
|---|---|---|
| A submit click | an activation | validation passed, or a request left the browser |
| An in-flight class or attribute | a submission is in flight | any outcome |
| An invalid-state class | a control is displaying a validation failure | which attempt, or whether a retry succeeded |
| A visible success box | the runtime rendered the thank-you box | nothing beyond that, and it can be missed |

Use the adapter's server-acceptance signal. Do not use Element Visibility on a success box as the
conversion source.

## 7. Traps that silently break a tag

**Success may destroy the form.** On acceptance the runtime may empty the mount container, so the
form and every listener bound to it leave the document. Bind click handlers by delegation from an
ancestor that survives.

**A redirect races your tag.** When the form redirects on success, the navigation can run in the
same task as the success message, and `postMessage` delivery is asynchronous. For a redirecting
form, prefer a transport-level signal, or accept the loss and measure on the destination page.

**Conditional reveals are not click-shaped.** Fields appear and disappear by toggling attributes and
classes. Only an Element Visibility trigger or a `MutationObserver` sees it.

**File selection is not click-shaped either.** It is a `change` on the file input, or a `drop` on
the zone. No native GTM trigger covers it.

## 8. What this contract does not cover

- **Whether your tag actually fires.** Nothing here can tell you a trigger matched, a consent state
  allowed it, or a variable resolved. Only GTM Preview closes that.
- **How to inject the container itself.** Snippet placement, `dataLayer` initialisation order, a
  renamed `dataLayer`, and consent bootstrapping are general HTML concerns and belong to
  [gtm-injection.md](../../site-build/references/gtm-injection.md).
- **Campaign parameters.** UTM shape, canonical collisions and paid-landing-page indexing are owned
  by [seo-offpage.md](../../static-site-seo/references/seo-offpage.md) section 4. Nothing about them is restated here.
- **A privacy review of what you send onward.** This document says what the adapter exposes; which
  of it may enter an analytics payload is a decision for whoever owns the data policy.
- **The adapter's concrete event names and payloads.** Those are the adapter's to document and to
  test; this contract does not assert them.
