# Animated intro

The loading screen is implemented globally in `src/components/layout/SiteIntro.jsx` and `SiteIntro.css`.

It runs once after every full page load, but does not replay while navigating between React routes. The animation can be skipped after a short safety delay with the button, Escape, Enter, or Space.

Duration constants are located at the top of `SiteIntro.jsx`.
