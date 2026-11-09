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
  const innerId = useId();
  const shineId = useId();
  const shadowId = useId();
  const ringId = useId();
  const isRound = ROUND_CODES.has(code);
  return (
    <svg className="iste-award-medallion" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="14" y1="9" x2="101" y2="111" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--medal-light)" />
          <stop offset=".18" stopColor="var(--medal-main)" />
          <stop offset=".36" stopColor="var(--medal-shadow)" />
          <stop offset=".54" stopColor="var(--medal-light)" />
          <stop offset=".75" stopColor="var(--medal-main)" />
          <stop offset="1" stopColor="var(--medal-shadow)" />
        </linearGradient>
        <radialGradient id={innerId} cx="50%" cy="30%" r="75%">
          <stop offset="0" stopColor="#30202a" />
          <stop offset=".48" stopColor="#190f17" />
          <stop offset="1" stopColor="#08070b" />
        </radialGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".58"/>
          <stop offset=".28" stopColor="#fff" stopOpacity=".04"/>
          <stop offset=".72" stopColor="#fff" stopOpacity=".02"/>
          <stop offset="1" stopColor="#fff" stopOpacity=".22"/>
        </linearGradient>
        <linearGradient id={ringId} x1="0" y1="0" x2=".9" y2="1">
          <stop stopColor="var(--medal-light)" />
          <stop offset=".28" stopColor="#24202a" />
          <stop offset=".52" stopColor="var(--medal-light)" />
          <stop offset=".7" stopColor="var(--medal-shadow)" />
          <stop offset="1" stopColor="var(--medal-main)" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4.6" />
        </filter>
        <filter id={shadowId} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity=".8" />
        </filter>
      </defs>
      <path d={medallionPath} fill="none" stroke="var(--medal-main)" strokeWidth="9" opacity=".42" filter={`url(#${glowId})`} />
      <g filter={`url(#${shadowId})`}>
        <path d={medallionPath} fill="#050509" stroke="#211620" strokeWidth="10" strokeLinejoin="round" />
        <path d={medallionPath} fill={`url(#${innerId})`} stroke={`url(#${gradientId})`} strokeWidth="7.6" strokeLinejoin="round" />
        <path d={medallionPath} fill="none" stroke="#fff" strokeWidth=".95" opacity=".54" transform="translate(60 60) scale(.91) translate(-60 -60)" />
        <path d={medallionPath} fill="none" stroke={`url(#${shineId})`} strokeWidth="2" transform="translate(60 60) scale(.8) translate(-60 -60)" />
      </g>
      {isRound && <>
        <circle cx="60" cy="60" r="44" fill="none" stroke={`url(#${ringId})`} strokeWidth="3.6" />
        <circle cx="60" cy="60" r="37.5" fill="none" stroke="var(--medal-light)" strokeWidth=".7" opacity=".48" />
        <path d="M30 28 38 22 M83 96 91 89" stroke="#fff" opacity=".72" strokeWidth="2.4" />
      </>}
      {decorated && <g stroke="var(--medal-main)" fill="var(--medal-main)" fillOpacity=".88">
        <path d="M21 92C9 75 8 56 18 39M99 92c12-17 13-36 3-53" fill="none" strokeWidth="1.8" />
        <path d="M18 84C5 80 5 71 8 65c10 6 11 13 10 19Zm-4-18C4 59 6 50 12 45c6 9 5 16 2 21Zm0-21c-5-12 1-19 8-22 2 11-1 18-8 22Zm88 39c13-4 13-13 10-19-10 6-11 13-10 19Zm4-18c10-7 8-16 2-21-6 9-5 16-2 21Zm0-21c5-12-1-19-8-22-2 11 1 18 8 22Z" stroke="none" />
      </g>}
      <g stroke="#09070b" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 2)" opacity=".76">
        {ICONS[code] || ICONS.member}
      </g>
      <g>
        <g stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[code] || ICONS.member}
        </g>
      </g>
      <path d="M31 25Q59 11 86 27" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".32" />
    </svg>
  );
}
