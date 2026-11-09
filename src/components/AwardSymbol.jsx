import { useId } from "react";

/*
 * A single, optically centred circular medal system.
 * All icons live on the same 120x120 artboard, without duplicated
 * shadow outlines or decorative attachments below the circle.
 */
function AwardGlyph({ code }) {
  switch (code) {
    case "member":
      return <><text x="60" y="68" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="900" fontStyle="italic" letterSpacing="-2" stroke="none" fill="currentColor">ISTe</text><path d="M40 76H80" strokeWidth="2.2" /></>;
    case "verified":
      return <><path d="M60 32 82 41V58C82 72 73 81 60 88 47 81 38 72 38 58V41Z" fill="var(--medal-shadow)" fillOpacity=".26" /><path d="m46 60 10 10 19-21" strokeWidth="5.5" /></>;
    case "month_member":
    case "year_member":
      return <><rect x="36" y="42" width="48" height="43" rx="5" /><path d="M46 35V49M74 35V49M36 53H84" strokeWidth="3.3"/><text x="60" y="76" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="19">{code === "month_member" ? "30" : "1Y"}</text></>;
    case "first_showcase":
      return <><rect x="37" y="49" width="46" height="35" rx="2"/><path d="M35 49 40 37H80L85 49M36 50h48M44 37v12m16-12v12m16-12v12M54 84V65h12v19" /></>;
    case "first_comment":
      return <><path d="M35 43H85V76H59L46 85V76H35Z"/><circle cx="48" cy="59" r="2.6" fill="currentColor" stroke="none"/><circle cx="60" cy="59" r="2.6" fill="currentColor" stroke="none"/><circle cx="72" cy="59" r="2.6" fill="currentColor" stroke="none"/></>;
    case "ten_comments":
      return <><circle cx="60" cy="47" r="8"/><circle cx="40" cy="55" r="6"/><circle cx="80" cy="55" r="6"/><path d="M45 82V76c0-9 6-15 15-15s15 6 15 15v6M27 80v-5c0-8 5-12 13-12m53 17v-5c0-8-5-12-13-12"/></>;
    case "early_member":
      return <path d="m60 32 8.3 17.5 19.2 2.5-14 13.3 3.5 19.2L60 75.3l-17 9.2 3.5-19.2-14-13.3 19.2-2.5Z" fill="var(--medal-main)" fillOpacity=".29"/>;
    case "community_helper":
      return <><path d="M37 60 25 69l16 17 19-8 19 8 16-17-12-9-23 9Z"/><path d="m40 68 20 10 20-10M60 55c-15-10-10-21 0-15 10-6 15 5 0 15Z"/></>;
    case "tournament_winner":
      return <><path d="M42 39H78V63c0 13-7 21-18 21s-18-8-18-21Z"/><path d="M42 46H31v11c0 11 6 16 14 16M78 46h11v11c0 11-6 16-14 16M60 84v9M47 93h26" /><path d="m60 49 4.2 8.5 9.2 1.3-6.7 6.6 1.6 9.2-8.3-4.4-8.3 4.4 1.6-9.2-6.7-6.6 9.2-1.3Z" fill="var(--medal-main)" strokeWidth="1.7"/></>;
    case "partner":
      return <><path d="m27 54 16-12 17 6 17-6 16 12-18 25-15 9-15-9Z"/><path d="M40 58 54 47 67 53 80 48M44 68l18 14m-9-19 18 14m-8-19 18 13"/></>;
    case "creator":
      return <><rect x="34" y="40" width="52" height="42" rx="8"/><path d="m53 51 19 10-19 10Z" fill="currentColor" stroke="none"/></>;
    case "admin":
    case "owner":
      return <><path d="M34 81 29 47 47 58 60 35 73 58 91 47 86 81Z" fill="var(--medal-main)" fillOpacity=".16"/><path d="M35 88H85M60 52V70"/><circle cx="60" cy="76" r="2.6" fill="currentColor" stroke="none"/></>;
    default:
      return <circle cx="60" cy="60" r="18" />;
  }
}

export default function AwardSymbol({ code }) {
  const id = useId().replace(/:/g, "");
  const metal = id + "-metal";
  const inner = id + "-inner";
  const flare = id + "-flare";
  return (
    <svg className="iste-award-medallion" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={metal} x1="5%" y1="2%" x2="94%" y2="98%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".14" stopColor="var(--medal-light)" />
          <stop offset=".3" stopColor="var(--medal-shadow)" />
          <stop offset=".43" stopColor="var(--medal-light)" />
          <stop offset=".6" stopColor="var(--medal-shadow)" />
          <stop offset=".8" stopColor="var(--medal-main)" />
          <stop offset=".92" stopColor="var(--medal-light)" />
          <stop offset="1" stopColor="var(--medal-shadow)" />
        </linearGradient>
        <radialGradient id={inner} cx="50%" cy="30%" r="76%">
          <stop offset="0" stopColor="#26202a" />
          <stop offset=".45" stopColor="#110e16" />
          <stop offset="1" stopColor="#07070c" />
        </radialGradient>
        <radialGradient id={flare}>
          <stop offset="0" stopColor="var(--medal-main)" stopOpacity=".26" />
          <stop offset="1" stopColor="var(--medal-main)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill={"url(#"+flare+")"}/>
      <circle cx="60" cy="60" r="48" fill="#0a080e" stroke="#111017" strokeWidth="3"/>
      <circle cx="60" cy="60" r="46" fill="none" stroke={"url(#"+metal+")"} strokeWidth="5.8"/>
      <circle cx="60" cy="60" r="41.4" fill="none" stroke="#0a0a0f" strokeWidth="3"/>
      <circle cx="60" cy="60" r="38.7" fill={"url(#"+inner+")"} stroke={"url(#"+metal+")"} strokeWidth="1.6"/>
      <circle cx="60" cy="60" r="35.1" fill="none" stroke="var(--medal-light)" strokeOpacity=".18" strokeWidth=".75"/>
      <path d="M26 27A47 47 0 0 1 71 14" fill="none" stroke="#fff" strokeWidth="1.35" strokeOpacity=".69" strokeLinecap="round"/>
      <path d="M94 94A47 47 0 0 1 49 106" fill="none" stroke="var(--medal-main)" strokeWidth="2" strokeOpacity=".7" strokeLinecap="round"/>
      <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <AwardGlyph code={code}/>
      </g>
      <g fill="var(--medal-main)" stroke="var(--medal-light)" strokeWidth=".65">
        <path d="m60 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        <path d="m60 98 1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3-4.3-1.7 4.3-1.7Z" opacity=".8"/>
      </g>
    </svg>
  );
}
