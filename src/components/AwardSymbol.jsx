import { useId } from "react";

const ICONS = {
  verified: <path d="m38 61 15 15 31-32" strokeWidth="8" />,
  member: <><text x="60" y="67" textAnchor="middle" fontSize="27" fontStyle="italic" fontWeight="900" fontFamily="Arial, sans-serif" fill="currentColor" stroke="none">ISTe</text><path d="M39 76h42" stroke="currentColor" strokeWidth="3"/></>,
  month_member: <><rect x="34" y="37" width="52" height="49" rx="7"/><path d="M45 29v16m30-16v16M35 52h50"/><text x="60" y="76" textAnchor="middle" fontSize="23" fontWeight="900" fontFamily="Arial, sans-serif" stroke="none" fill="currentColor">30</text></>,
  year_member: <><rect x="34" y="37" width="52" height="49" rx="7"/><path d="M45 29v16m30-16v16M35 52h50"/><text x="60" y="76" textAnchor="middle" fontSize="23" fontWeight="900" fontFamily="Arial, sans-serif" stroke="none" fill="currentColor">1Y</text></>,
  first_showcase: <><rect x="30" y="45" width="60" height="39" rx="4"/><path d="M30 58h60M34 45l7-16h38l11 16M45 29v16m15-16v16m15-16v16"/><path d="M53 84V65h14v19"/></>,
  first_comment: <><path d="M31 43h58v34H57L44 87V77H31Z"/><circle cx="46" cy="60" r="2.6" fill="currentColor" stroke="none"/><circle cx="60" cy="60" r="2.6" fill="currentColor" stroke="none"/><circle cx="74" cy="60" r="2.6" fill="currentColor" stroke="none"/></>,
  ten_comments: <><circle cx="60" cy="45" r="8"/><path d="M43 76c0-12 7-19 17-19s17 7 17 19"/><circle cx="33" cy="55" r="6"/><circle cx="87" cy="55" r="6"/><path d="M18 77c0-10 5-15 15-15m69 15c0-10-5-15-15-15"/></>,
  community_helper: <><path d="M28 65 45 55l14 6 14-6 19 10-14 14-18 7-18-7Z"/><path d="M37 71c10-7 19-3 23 2 7-8 14-10 23-3"/><path d="M60 50c-19-17-4-27 0-17 5-10 19 0 0 17Z" stroke="currentColor"/></>,
  tournament_winner: <><path d="M39 39h42v22c0 17-10 25-21 25S39 78 39 61Z"/><path d="M39 46H28v12c0 12 9 15 17 15m36-27h11v12c0 12-9 15-17 15M60 86v9m-14 0h28"/><path d="m60 47 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor" stroke="none"/></>,
  partner: <><path d="m22 57 19-16 18 5 18-5 21 16-16 20-17 10-21-10Z"/><path d="m43 58 13-10 10 4 13-3m-33 18 17 14m-9-22 22 20m-9-22 18 14"/></>,
  creator: <><rect x="31" y="43" width="58" height="40" rx="8"/><path d="m54 53 19 10-19 10Z" fill="currentColor" stroke="none"/></>,
  admin: <><path d="m28 76-5-34 22 13 15-27 15 27 22-13-5 34Z"/><path d="M30 84h60"/><circle cx="60" cy="65" r="3" fill="currentColor" stroke="none"/></>,
  owner: <><path d="M31 83 26 41 45 54 60 26 75 54 94 41 89 83Z"/><path d="M34 89h52M60 47v20"/><circle cx="60" cy="73" r="3" fill="#f4bd63" stroke="none"/></>,
  early_member: <><path d="m60 30 9 19 21 3-15 15 4 22-19-11-19 11 4-22-15-15 21-3Z" fill="currentColor" fillOpacity=".12"/></>,
};

const MEDALLION = "M60 12 A48 48 0 1 1 60 108 A48 48 0 1 1 60 12 Z";
const HEXAGON = "M60 8 103 31 103 83 60 110 17 83 17 31 Z";
const PENTAGON = "M60 7 108 40 91 98 60 112 29 98 12 40 Z";
const LAUREL_CODES = new Set(["owner", "verified", "tournament_winner", "early_member", "first_comment", "partner", "creator"]);
const ROUND_CODES = new Set(["member"]);
const SHIELD_CODES = new Set(["month_member", "year_member", "first_showcase", "first_comment", "ten_comments", "verified", "tournament_winner"]);


export default function AwardSymbol({ code }) {
  const gradientId = useId();
  const glowId = useId();
  const medallionPath = ROUND_CODES.has(code) ? MEDALLION : SHIELD_CODES.has(code) ? PENTAGON : HEXAGON;
  const decorated = LAUREL_CODES.has(code);
  return (
    <svg className="iste-award-medallion" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="15" y1="12" x2="111" y2="111" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--medal-light)" />
          <stop offset=".47" stopColor="var(--medal-main)" />
          <stop offset="1" stopColor="var(--medal-shadow)" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.6" />
        </filter>
      </defs>
      <path d={medallionPath} fill="none" stroke="var(--medal-main)" strokeWidth="6" opacity=".42" filter={`url(#${glowId})`} />
      <path d={medallionPath} fill="#100b10" stroke="var(--medal-shadow)" strokeWidth="10" />
      <path d={medallionPath} fill="#120d13" stroke={`url(#${gradientId})`} strokeWidth="5.7" />
      <path d={medallionPath} fill="none" stroke="var(--medal-light)" strokeWidth=".9" opacity=".8" transform="translate(60 60) scale(.84) translate(-60 -60)" />
      <path d="M38 25Q60 15 82 25" fill="none" stroke="var(--medal-light)" strokeWidth="1.5" opacity=".4" />
      {decorated && <g stroke="var(--medal-main)" strokeWidth="2" fill="var(--medal-main)" fillOpacity=".72">
        <path d="M19 88Q7 64 19 41M101 88Q113 64 101 41" fill="none" strokeWidth="2" />
        <path d="M17 82q-12-5-11-15 12 4 11 15Zm-3-15q-11-9-6-18 10 8 6 18Zm3-17q-6-12 3-18 6 11-3 18Zm86 32q12-5 11-15-12 4-11 15Zm3-15q11-9 6-18-10 8-6 18Zm-3-17q6-12-3-18-6 11 3 18Z" stroke="none"/>
      </g>}
      <g stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[code] || ICONS.member}
      </g>
    </svg>
  );
}
