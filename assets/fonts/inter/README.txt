Place your Inter font files (WOFF2/WOFF/TTF) here.

Recommended weights for web:
- Inter-Regular.woff2 (400)
- Inter-Medium.woff2 (500)
- Inter-SemiBold.woff2 (600)
- Inter-Bold.woff2 (700)

You can download these from https://fonts.google.com/specimen/Inter or https://rsms.me/inter/.

Once added, reference them in your CSS using @font-face.

Example @font-face block:

@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/inter/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

Repeat for each weight/style you want to use.