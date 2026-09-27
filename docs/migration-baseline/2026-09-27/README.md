# Visual baseline — 2026-09-27

Source: live https://www.somsouk.fr/ and https://www.somsouk.fr/cabane/.
Repository master at inspection: `ef5113e`. Browser viewport: **1363 × 936**, default Chrome device scale. These are viewport captures, not full-page or 1440px captures. Saved JPEG sizes: homepage 1363×936; Cabane 1348×926 (browser capture bounds differ from the reported viewport).

- [Homepage](homepage-desktop.jpg)
- [Cabane, after images loaded](cabane-desktop.jpg)
- [HTTP observations and response hashes](http-observations.json)

## Observations

Homepage: dark `rgb(11, 8, 38)` background, light `rgb(243, 239, 255)` text, Roboto/sans-serif, 40px name, 20px subtitle, 30px section headings, profile image and violet JS logo. Resume and two project cards remain visible in source and browser; current Melimo copy includes Invidious. Loaded project images are 1024×654 and 800×800. Desktop document scroll width 1348px is within the 1363px viewport.

Cabane: cream dotted background, green text/actions, rounded system-font stack, separate visual identity, two-column illustrated cards at this width. All seven images finished loading: welcome 800×800, six previews 900×463. Share offers “Copier le lien” in this browser. An early screenshot before image decode was discarded; the saved reference is the loaded view. No gameplay comparison is claimed.

## Confirmed legacy error behavior

`/404.html` returns HTTP 200 but renders the resume, not the requested error message. A nonexistent path returns HTTP 404 with the same resume body. This confirms that the remote default layout ignores page content. The replacement must render a real error page; preserving this bug is not required.

## Theme, CSS and license evidence

The live main.css imports Google Roboto, Bootstrap 3.3.5, Font Awesome 5.11.2 and its v4 shims. URLs and CSS SHA-256 are recorded in HTTP observations. They must be accounted for before removing the theme; CSS component replacement must preserve spacing, font metrics and icons. No new framework is proposed.

Upstream `sproogen/modern-resume-theme` inspected at `8901c8bcd4713b5a1fafcf0cccb130b840a8519d`: MIT License, copyright 2018 James Grant. Preserve its notice with any copied theme code. Existing site `docs/LICENSE` is GPL v3; do not overwrite it with the upstream theme license. Individual font/icon license files still require verification before vendoring. Do not infer actual loaded font face solely from computed font-family.

Source breakpoints to capture next: homepage project grid below 768px; Cabane welcome layout below 650px and shared game controls below 551px. Source print rules exist in homepage/theme styles, but source inspection is not print-render validation.

## Outstanding baseline gates

The supported browser API has no viewport-resize or print-emulation method. Exact 1440px, 390px, 320px and print captures remain outstanding. Full-page screenshot timed out; viewport capture worked. Do not mark visual parity or task 3.1 complete using these partial references.

The GitHub connector rejects the Pages settings endpoint as unsupported. `docs/` source is documented in the repository, but account-level Pages source/build mode and rollback settings are not independently confirmed. No settings were changed. Confirm with an available authorized settings surface before cutover.

## CI evidence

GitHub run https://github.com/JeremySomsouk/jeremysomsouk.github.io/actions/runs/36229809216 completed successfully on `5984e0715d1be643d426fb387e110c460762c953` (push, Leptos preview). This closes the previously unverified hosted-CI concern for step 2.3.
