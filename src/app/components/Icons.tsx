import React from "react";

/**
 * SVG icons used by the navigation bar. These are copied from the
 * upstream repository. Each icon accepts standard SVG props so
 * consumers can set className, stroke or size.
 */
export const IconMap = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path d="M12 21s6-4.35 6-9a6 6 0 10-12 0c0 4.65 6 9 6 9z" />
    <circle cx="12" cy="10.5" r="1.3" />
  </svg>
);

export const Coin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M6 12h12" />
  </svg>
);


export const IconQuests = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path d="M12 2l2.9 6.2 6.6.6-5 3.9L18.6 22 12 18.6 5.4 22l1.1-8.7-5-3.9 6.6-.6L12 2z" />
  </svg>
);

export const IconShop = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path d="M3 7h18v13H3z" />
    <path d="M5 7l2-4h10l2 4" />
  </svg>
);

export const IconDiscover = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M10 10l4-2 2 4-4 2-2-4z" />
  </svg>
);

export const IconProfile = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
    <path d="M4 20a8 8 0 0116 0" />
  </svg>
);