import { useId } from "react";

const SHAPES = {
  verified: <path d="m13.5 23 5 5 11-12" strokeWidth="3.5" />,
  owner: <><path d="m9 25-2-13 9 6 8-10 8 10 9-6-2 13Z" /><path d="M11 30h26" /></>,
  admin: <><path d="M24 9 35 15v11c0 6-5 11-11 14-6-3-11-8-11-14V15Z" /><path d="m18 24 4 4 8-9" /></>,
  member: <><circle cx="24" cy="18" r="6"/><path d="M13 36c0-7 5-11 11-11s11 4 11 11"/></>,
  early_member: <><path d="m24 8 4.5 10 11 .9-8.4 7.3 2.6 10.8L24 31 14.3 37l2.6-10.8-8.4-7.3 11-.9Z"/></>,
  community_helper: <><path d="M15 18c-6-6-14 5-7 12l16 11 16-11c7-7-1-18-7-12l-9 6Z"/><path d="M24 14v14M17 21h14"/></>,
  tournament_winner: <><path d="M14 12h20v10c0 9-5 13-10 13s-10-4-10-13Z"/><path d="M14 15H8v6c0 5 3 7 8 7m18-13h6v6c0 5-3 7-8 7M24 35v6m-8 0h16"/></>,
  partner: <><path d="m8 25 8-8 8 3 8-3 8 8-13 13h-6Z"/><path d="m17 26 7 6 8-7M16 17l5-5h7l4 5"/></>,
  creator: <><path d="m24 8 3 12 12 4-12 4-3 12-3-12-12-4 12-4Z"/><path d="M36 8v7m-4-3.5h8M10 35v5m-2.5-2.5h5"/></>,
  month_member: <><circle cx="24" cy="24" r="12"/><path d="M24 16v9l7 4M24 6v3"/></>,
  year_member: <><path d="M12 32V15l12-7 12 7v17l-12 8Z"/><path d="m18 25 5 5 9-12"/></>,
  first_showcase: <><rect x="12" y="14" width="24" height="21" rx="2"/><circle cx="20" cy="21" r="2"/><path d="m14 31 8-8 5 5 3-3 4 6"/></>,
  first_comment: <><path d="M11 13h26v17H24l-9 7v-7h-4Z"/><path d="M17 20h14M17 25h9"/></>,
  ten_comments: <><path d="M10 16h18v12H19l-6 5v-5h-3Z"/><path d="M22 12h16v15h-6l-4 4M15 21h8"/></>,
};

export default function AwardSymbol({ code }) {
  const gradientId = useId();
  return <svg viewBox="0 0 48 48" width="46" height="46" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={gradientId} x1="5" x2="40" y1="4" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity=".9"/>
        <stop offset="1" stopColor="currentColor" stopOpacity=".35"/>
      </linearGradient>
    </defs>
    <path d="M24 3 40 12v24L24 45 8 36V12Z" fill="#09090c" stroke={`url(#${gradientId})`} strokeWidth="1.5"/>
    <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {SHAPES[code]}
    </g>
  </svg>;
}
