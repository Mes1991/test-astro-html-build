# Google Tag Manager — installing it without breaking the page

Hand this file to whatever adds a tag manager to a static site.

This document is about **installing and operating the container**. It says nothing about which
interactions are worth measuring on any particular site — that decision belongs to whoever owns the
analytics, and the answer changes per project.

## Start here

A container is two snippets, one object, and one rule about order:

1. `window.dataLayer` must exist **before** the container loads.
2. The loader goes in `<head>`.
3. The `<noscript>` iframe goes immediately after `<body>` opens.

Get the order wrong and nothing errors. The container loads, tags fire, and the events pushed
before it was ready are gone. **Every failure in this document is silent.** That is the whole
reason it exists: there is no console warning for a tag manager that is installed almost correctly.

## 1. The two snippets

Replace `GTM-XXXXXXX` with the real container id, and nothing else.

**In `<head>`, as early as possible — after `<meta charset>` and the title, before stylesheets:**

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**Immediately after `<body>`:**

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

The first block is separate on purpose. The `dataLayer` initialiser and `gtag` shim have to exist
before **anything** — including a consent default (section 3) — pushes to them.

**Do not `defer` or `async` the inline loader.** It is already asynchronous internally: it injects
`gtm.js` with `async=true`. Deferring the wrapper only delays the injection, and pushes made in the
meantime sit in an array the container has not yet read.

That is the one place this document asks for something [browser-support.md](../../astro-craft/references/browser-support.md) section 5 otherwise
forbids — a third-party script in `<head>`, not deferred. It is written there as an explicit
exception rather than left as a conflict, and it is narrow for the reason above: the only thing
this snippet does synchronously is create an array and append a tag. Nothing is fetched over the
network before the parser moves on.

**Do not self-host `gtm.js`.** It is versioned server-side and changes when the container is
published. A copied file is a container frozen at the moment it was copied.

## 2. The renamed `dataLayer`

The snippet's last argument is the global's name. Some hosts, some consent plugins, and some
security configurations rename it:

```js
})(window,document,'script','myDataLayer','GTM-XXXXXXX');
```

When they do, **`window.dataLayer` is not read by anything**. A script pushing to `dataLayer` on
such a page creates a fresh array nobody consumes: no events, no error, no clue.

Before writing a single push, read the real snippet on the page and confirm the fourth argument.
If it is not `dataLayer`, every push in the project uses that name instead. Never assume; the
default is common enough that assuming is right most of the time, which is exactly what makes the
exception expensive.

## 3. Consent, and what not to invent

If the site has a consent management platform, **its default state must be pushed before the
container loads** — that is the entire point of a default. Google's Consent Mode v2 default looks
like this, and goes in the same `<head>` block as the `dataLayer` initialiser, above the loader:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
</script>
```

Three rules, and the first is the one that gets broken:

- **Do not write a consent default the project has not decided on.** Denying storage by default
  changes what every tag on the site is allowed to do. If nobody has told you the policy, install
  the container without a default and say so — an undecided default is a decision made silently.
- **A CMP owns the `update` call, not you.** If a platform is installed, it pushes the update when
  the visitor chooses. Writing a second one races it.
- **Consent gates tags, not `dataLayer`.** Pushing an event while consent is denied is not a leak
  by itself; the tag reading it is what is gated. Whether an event may be pushed pre-consent is a
  policy question for the project, and the two answers look identical in Preview until a tag fires.

## 4. Custom HTML tags

- **The content must be wrapped in `<script>…</script>`.** A Custom HTML tag holds markup, not
  JavaScript. Pasting bare JS injects text nodes; the tag reports as fired and nothing runs. This
  is the single most common wasted hour in a container.
- **`document.write` is not available** in a tag firing after load. Use DOM insertion.
- **A Custom HTML tag can fire more than once** — on history navigation, on a re-triggered page
  view, or simply because two triggers matched. Anything that patches a global, binds a listener,
  or installs a wrapper must be idempotent, and must key its guard on the thing it installed rather
  than on a boolean it set. A flag says "I ran"; only an identity check says "my wrapper is still
  the one in place", and other scripts do restore globals.

## 5. The jQuery Ajax listener, and when it applies

A widely-copied Custom HTML recipe binds `$(document).on('ajaxComplete', …)` and pushes an
`ajaxComplete` event with the request's URL, status, headers and response body.

It works, and its scope is narrower than almost everyone assumes: **jQuery's global Ajax events
fire only for requests jQuery itself issued.** Anything using `fetch` or a bare `XMLHttpRequest` —
which is most code written in the last decade, and all code written without jQuery — is invisible
to it. A container relying on that listener measures the subset of the page that happens to go
through jQuery, and reports nothing at all for the rest, with no signal that it is only seeing
part of the picture.

Before reusing it on a site, establish which transport the interaction you care about actually
uses. If it is not jQuery, the listener is not a starting point to adapt — it is the wrong seam,
and a `fetch` wrapper is a different piece of code with different failure modes:

- it must not consume the response body the application is about to read — clone it;
- it must not delay, alter, or swallow the application's request or its errors;
- it must match on the specific request it cares about, by **host as well as path**, or it will
  count an unrelated call on the same page;
- it must survive another script replacing `window.fetch` after it installed.

Each of those is a silent failure if missed, and the last two are the ones that produce plausible,
wrong numbers rather than no numbers.

## 6. Single-page navigation

On a site where navigation replaces the document, `gtm.js` runs once per page and the page-view
trigger is enough. On a site that swaps content client-side — a framework router, or view
transitions — the container is loaded once and never again.

Use GTM's **History Change** trigger for the page view, and make sure it does not double-count the
initial load, which fires both `gtm.js` and the router's first navigation on some setups. Confirm
the count in Preview rather than reasoning about it.

## 7. Verifying, before calling it done

In Preview, on the real page:

| Check | What proves it |
|---|---|
| the container loaded | the Preview badge connects and `gtm.js` appears in the Tags fired list |
| `dataLayer` is the right global | the snippet's fourth argument, read from the page source |
| initialisation order | the consent default appears **above** `gtm.js` in the event stream |
| a tag fires exactly once | the event stream, not the tag's own reporting |
| nothing fires that should not | a Custom HTML tag reporting "fired" is not evidence that its code ran |

**"The tag fired" and "the tag did what it was for" are different claims.** The first is in the
Preview panel. The second needs the destination — the analytics realtime view, or a network
request you can see leaving.
