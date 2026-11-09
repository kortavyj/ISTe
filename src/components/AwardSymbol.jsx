import { useId } from "react";

const ICONS = {
  verified: <><path d="M60 29 88 40V61C88 78 74 87 60 94 46 87 32 78 32 61V40Z" fill="#a01328" stroke="var(--medal-light)" strokeWidth="3.5"/><path d="M43 60 55 71 78 48" stroke="#fff" strokeWidth="7" fill="none"/></>,
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
  early_member: <><path d="m60 28 10 20 22 4-16 15 4 23-20-11-20 11 4-23-16-15 22-4Z" fill="var(--medal-main)" stroke="var(--medal-light)" strokeWidth="3"/><path d="M60 30V78M40 53h40" stroke="#fff" strokeWidth="1" opacity=".45"/></>,
};


/*
 * ISTe Awards Variant 1: the actual metallic-medallion design is SVG,
 * rather than a CSS sketch or a cropped concept poster.
 * Every asset is resolution independent and shared by cards/history.
 */
export default function AwardSymbol({ code }) {
  const id = useId().replace(/:/g, "");
  const steel = `iste-steel-${id}`;
  const rim = `iste-rim-${id}`;
  const inset = `iste-inset-${id}`;
  const glint = `iste-glint-${id}`;
  const shine = `iste-shine-${id}`;
  const bevel = `iste-bevel-${id}`;
  const shadow = `iste-shadow-${id}`;
  const crest = `iste-crest-${id}`;
  return (
    <svg className="iste-award-medallion" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={steel} x1="10%" y1="5%" x2="89%" y2="100%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".12" stopColor="var(--medal-light)" />
          <stop offset=".29" stopColor="var(--medal-shadow)" />
          <stop offset=".42" stopColor="var(--medal-light)" />
          <stop offset=".57" stopColor="#18121b" />
          <stop offset=".74" stopColor="var(--medal-main)" />
          <stop offset=".91" stopColor="#fef1eb" />
          <stop offset="1" stopColor="var(--medal-shadow)" />
        </linearGradient>
        <linearGradient id={rim} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0" stopColor="var(--medal-light)"/>
          <stop offset=".26" stopColor="#22202a"/>
          <stop offset=".48" stopColor="var(--medal-main)"/>
          <stop offset=".65" stopColor="#0a090e"/>
          <stop offset=".84" stopColor="var(--medal-light)"/>
          <stop offset="1" stopColor="var(--medal-shadow)"/>
        </linearGradient>
        <radialGradient id={inset} cx="49%" cy="31%" r="77%">
          <stop offset="0" stopColor="#30212b"/>
          <stop offset=".39" stopColor="#150e15"/>
          <stop offset=".81" stopColor="#09090e"/>
          <stop offset="1" stopColor="#020307"/>
        </radialGradient>
        <linearGradient id={shine} x1="20%" y1="0%" x2="85%" y2="100%">
          <stop stopColor="#fff" stopOpacity=".62"/>
          <stop offset=".24" stopColor="#fff" stopOpacity=".03"/>
          <stop offset=".63" stopColor="#fff" stopOpacity="0"/>
          <stop offset="1" stopColor="#fff" stopOpacity=".2"/>
        </linearGradient>
        <linearGradient id={bevel} x1="0%" y1="0%" x2="88%" y2="100%">
          <stop stopColor="var(--medal-light)"/>
          <stop offset=".46" stopColor="var(--medal-main)"/>
          <stop offset=".62" stopColor="var(--medal-shadow)"/>
          <stop offset="1" stopColor="#fff"/>
        </linearGradient>
        <radialGradient id={glint}><stop stopColor="var(--medal-main)" stopOpacity=".58"/><stop offset="1" stopColor="var(--medal-main)" stopOpacity="0"/></radialGradient>
        <filter id={shadow} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity=".8" />
        </filter>
        <clipPath id={crest}><circle cx="60" cy="57" r="38"/></clipPath>
      </defs>

      <ellipse cx="60" cy="58" rx="56" ry="56" fill={`url(#${glint})`} opacity=".42"/>
      <g filter={`url(#${shadow})`}>
        <circle cx="60" cy="57" r="49.4" fill="#0a080d" stroke="var(--medal-shadow)" strokeWidth="1.5"/>
        <circle cx="60" cy="57" r="47.1" fill="none" stroke={`url(#${steel})`} strokeWidth="5.8"/>
        <circle cx="60" cy="57" r="42.9" fill="none" stroke="#07070b" strokeWidth="3.4"/>
        <circle cx="60" cy="57" r="40.7" fill="none" stroke={`url(#${rim})`} strokeWidth="2.3"/>
        <circle cx="60" cy="57" r="38.2" fill={`url(#${inset})`} stroke="#08090c" strokeWidth="2"/>
        <g clipPath={`url(#${crest})`}>
          <path d="M16 48Q58 3 105 31V53Q59 33 16 74Z" fill={`url(#${shine})`} opacity=".14"/>
          <path d="M28 27 89 91" stroke="#fff" strokeWidth=".55" opacity=".07"/>
          <path d="M26 90 89 27" stroke="#fff" strokeWidth=".55" opacity=".07"/>
          <circle cx="60" cy="57" r="36" fill="none" stroke="#fff" opacity=".18" strokeWidth=".6"/>
        </g>
        <path d="M23 23A48 48 0 0 1 79 12" stroke="#fff" strokeWidth="1.35" fill="none" opacity=".74" strokeLinecap="round"/>
        <path d="M96 84A48 48 0 0 1 37 101" stroke="var(--medal-main)" strokeWidth="2" fill="none" opacity=".88" strokeLinecap="round"/>
        <path d="M15 67A48 48 0 0 0 25 86" stroke="#ff4265" strokeWidth="2.8" fill="none" opacity=".94" strokeLinecap="round"/>
        <path d="M103 47A48 48 0 0 1 104 66" stroke="#ff4265" strokeWidth="2.6" fill="none" opacity=".85" strokeLinecap="round"/>
      </g>

      <g className="iste-medal-laurels" fill={`url(#${bevel})`} stroke="var(--medal-shadow)" strokeWidth=".6">
        <path d="M32 92C18 83 14 72 15 57" fill="none" stroke="var(--medal-main)" strokeWidth="1.4"/>
        <path d="M88 92C102 83 106 72 105 57" fill="none" stroke="var(--medal-main)" strokeWidth="1.4"/>
        <path d="M23 82C12 80 10 75 9 68c9 3 14 8 14 14ZM19 70C10 64 10 58 13 51c8 6 9 12 6 19ZM21 58C16 50 18 43 23 38c4 10 4 14-2 20ZM27 87C18 89 15 85 12 80c8-1 12 2 15 7Z"/>
        <path d="M97 82c11-2 13-7 14-14-9 3-14 8-14 14ZM101 70c9-6 9-12 6-19-8 6-9 12-6 19ZM99 58c5-8 3-15-2-20-4 10-4 14 2 20ZM93 87c9 2 12-2 15-7-8-1-12 2-15 7Z"/>
      </g>

      <g strokeLinecap="round" strokeLinejoin="round">
        <g stroke="#000" strokeWidth="6.2" opacity=".64" transform="translate(0 2)">
          {ICONS[code] || ICONS.member}
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="3.4">
          {ICONS[code] || ICONS.member}
        </g>
      </g>

      <path d="M60 3 64.3 12 73 15 64.3 18 60 27 55.7 18 47 15 55.7 12Z" fill={`url(#${steel})`} stroke="#21141d" strokeWidth=".9"/>
      <path d="M60 7V22M52 15h16" stroke="#fff" strokeWidth=".9" opacity=".55"/>

      <g filter={`url(#${shadow})`}>
        <path d="M44 96 60 90 76 96 76 108 60 116 44 108Z" fill="#09090d" stroke={`url(#${steel})`} strokeWidth="2.8"/>
        <path d="M47 98 60 93 73 98V106L60 112 47 106Z" fill="#1d111a" stroke="var(--medal-main)" strokeWidth=".9"/>
        <text x="60" y="104.6" textAnchor="middle" fontSize="11.5" fontStyle="italic" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="-.65" fill="#fff" stroke="#07070a" strokeWidth="1.7" paintOrder="stroke">ISTe</text>
      </g>
    </svg>
  );
}
