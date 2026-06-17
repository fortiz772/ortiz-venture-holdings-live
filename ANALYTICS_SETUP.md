# Ortiz Venture Holdings Analytics Setup

The website is analytics-ready. It will start tracking after a Google Analytics 4 Measurement ID is added to `index.html`.

## What You Need To Create

1. Go to https://analytics.google.com
2. Create or select a Google Analytics account.
3. Create a property named `Ortiz Venture Holdings LLC`.
4. Add a Web data stream for:
   `https://www.ortizventureholdings.com`
5. Copy the Measurement ID. It starts with `G-`.
6. Send that `G-...` ID back so it can be placed into:
   `window.OVH_ANALYTICS_ID = "";`

## What The Site Will Track

- Page views
- Navigation clicks
- Consultation button clicks
- Platform access clicks
- Platform showcase clicks
- Email contact clicks
- Traffic sources and referrers
- Device type, browser, and operating system
- Approximate location reporting from Google Analytics

## What It Cannot Track

Analytics cannot show the exact name of a visitor by default. You will only know an exact person if they contact you, submit a form, book a consultation, create an account, or otherwise identify themselves.

## Privacy Note

The site uses IP anonymization in the Google Analytics config. Do not add private home address information or personal legal-name information to analytics labels, form fields, metadata, or public website content.
