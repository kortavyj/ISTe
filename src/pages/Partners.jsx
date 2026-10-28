import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useState } from "react";

const official = "https://www.cyberion.ua/clubs/cyberion_dnipro_kalynova/";
const insta = "https://www.instagram.com/cyberion_dnipro_kalynova/";
const telegram = "https://t.me/CyberionKalynova";
const maps = "https://maps.app.goo.gl/63wRjufNFefTrydQA";

const specs = [
  ["◈", "30 геймерських ПК з NVIDIA RTX 5070+"],
  ["▤", "32 GB DDR5"],
  ["◉", "AMD Ryzen 5 7500F"],
  ["▣", "Монітори ASUS 24″ / 27″, 310 Hz"],
  ["⌨", "ASUS TUF Gaming K3 Gen II"],
  ["♜", "Ігрові крісла Cougar Armor Elite"],
];

const contactIcons = {
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.7" /></>,
  phone: <><path d="M21 16.4v2.8a2 2 0 0 1-2.2 2 18.3 18.3 0 0 1-8-2.8 18 18 0 0 1-5.5-5.5 18.3 18.3 0 0 1-2.8-8A2 2 0 0 1 4.5 2.7h2.8a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.5 1.5a14 14 0 0 0 5.6 5.6l1.5-1.5a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.4 2Z" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.6 6.4h.01" strokeWidth="2.8" /></>,
  telegram: <><path d="m21.5 3-3.3 17.2-5.7-4.3-3.2 3.2.7-5.4L21.5 3ZM21.5 3 2.5 10.7l6.8 3 12.2-10.7Z" /><path d="m9.3 13.7 8-6.7" /></>,
  web: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21M12 3c-3 3-4.5 6-4.5 9S9 18 12 21" /></>,
};
function ContactIcon({ name }) {
  return <span className="cyberion-detail-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{contactIcons[name]}</svg></span>;
}


export default function Partners() {
  const { language } = useLanguage();
  const uk = language === "uk";
  const [openZone, setOpenZone] = useState(0);
  const zones = [
    { name: "GAMER ZONE", description: "Ігрова зона для щоденних матчів" },
    { name: "PRO ZONE", description: "Зона для змагальної гри" },
    { name: "PRO BOOTCAMP", description: "Простір для командних тренувань" },
    { name: "DOUBLE BOOTCAMP", description: "Зона для спільних командних тренувань" },
  ];
  return (
    <section className="cyberion-partners">
      <style>{`
        .cyberion-partners{color:#fff;min-height:85vh;background:radial-gradient(ellipse at 79% 10%,#4a060e 0%,transparent 43%),linear-gradient(125deg,#070608 0%,#100608 45%,#050506 100%);padding:28px max(24px,calc((100vw - 1320px)/2)) 72px;font-family:inherit;position:relative;isolation:isolate}
        .cyberion-partners:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(4,2,5,.92) 0%,rgba(4,2,5,.6) 51%,rgba(4,2,5,.26) 100%),linear-gradient(0deg,rgba(4,2,5,.87),transparent 52%),url("https://www.cyberion.ua/wp-content/themes/cyberion/assets/img/clubbg.jpg") center top / cover no-repeat;opacity:.96}.cyberion-partners *{box-sizing:border-box}.cyberion-partners a{color:inherit;text-decoration:none}
        .cyberion-breadcrumb{color:#999;font-size:13px;margin-bottom:22px}.cyberion-breadcrumb b{color:#ff363e}
        .cyberion-hero{position:relative;overflow:hidden;border:0;border-radius:0;padding:22px 12px 28px;background:transparent;box-shadow:none}
        .cyberion-kicker{font-size:12px;letter-spacing:.24em;color:#ff424b;font-weight:800;text-transform:uppercase;margin:0 0 24px}
        .cyberion-original-logo{display:block;max-width:min(100%,600px);width:600px;height:auto;object-fit:contain;object-position:left center;margin:0 0 8px;background:transparent;}
        .cyberion-mark{display:inline-flex;position:relative;align-items:center;font-size:31px;letter-spacing:.04em;line-height:1;font-weight:500;padding-bottom:.58em;white-space:nowrap}
        .cyberion-on{border:3px solid #ffe300;border-radius:99px;display:inline-flex;align-items:center;gap:.14em;height:1.1em;padding:0 .14em .03em .12em;color:#fff}
        .cyberion-on i{display:inline-block;background:#ffe300;width:.63em;height:.63em;border-radius:50%;box-shadow:inset 0 -4px 2px #c1ad00}
        .cyberion-mark strong{position:absolute;color:#ffe500;top:.84em;left:21%;font-size:.64em;letter-spacing:-.015em;font-weight:800}
        .cyberion-mark-large{font-size:clamp(36px,5vw,66px);margin-bottom:10px}
        .cyberion-hero h1{font-size:clamp(25px,3vw,40px);margin:20px 0 8px;max-width:800px}.cyberion-muted{color:#b7aeb1}.cyberion-hero p.cyberion-muted{max-width:700px;line-height:1.75;font-size:15px}
        .cyberion-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.cyberion-action{display:inline-flex;align-items:center;justify-content:center;border:1px solid #75232c;padding:13px 20px;border-radius:9px;font-size:14px;font-weight:700;background:#16090d}.cyberion-action-primary{background:#f51425;border-color:#f51425}.cyberion-action:focus-visible,.cyberion-social:focus-visible{outline:2px solid #fff}
        .cyberion-grid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:14px;margin-top:0}
        .cyberion-panel{border:1px solid #66131e;border-radius:14px;background:linear-gradient(140deg,rgba(28,6,10,.94),rgba(8,8,10,.9));backdrop-filter:blur(10px);padding:23px;min-width:0}
        .cyberion-panel h2{font-size:18px;margin:0 0 20px;display:flex;align-items:center;gap:11px}.cyberion-panel h2 span{color:#ff3145}
        .cyberion-detail{display:flex;gap:12px;align-items:flex-start;border:1px solid #282025;border-radius:7px;padding:12px;margin-top:8px;background:#100e10;font-size:13px;overflow-wrap:anywhere}.cyberion-detail i{color:#ff344b;font-style:normal;font-size:18px}
        .cyberion-spec{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid #35252a;font-size:14px}.cyberion-spec:last-child{border:0}.cyberion-spec i{color:#ff344b;font-style:normal;font-size:20px;min-width:24px}
        .cyberion-map{height:260px;background:linear-gradient(25deg,transparent 47%,#34363e 48%,#34363e 51%,transparent 52%),linear-gradient(-38deg,transparent 46%,#252831 47%,#252831 50%,transparent 51%),repeating-linear-gradient(0deg,#12141a 0 29px,#25252e 30px 31px),repeating-linear-gradient(90deg,#17191e 0 49px,#38333c 50px 51px);border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;flex-direction:column;gap:9px;padding:20px}
        .cyberion-map strong{color:white;background:#680d1a;border:1px solid #f43c4e;border-radius:7px;padding:12px;font-size:14px}.cyberion-map small{color:#c9c9d0}.cyberion-map em{color:#f64b5a;font-style:normal;font-size:24px}
        .cyberion-socials{margin-top:16px}.cyberion-social-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cyberion-social{border:1px solid #75212e;border-radius:10px;padding:16px;background:#1b0b10;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:8px}.cyberion-social:hover,.cyberion-action:hover{border-color:#ff4b5a;background:#351018}
        .cyberion-note{font-size:12px;color:#a69a9f;margin:23px 0 0;line-height:1.6}

        /* Three neon information panels */
        .cyberion-grid{display:grid;grid-template-columns:1fr 1fr 1.06fr;gap:18px;margin-top:0;align-items:stretch}
        .cyberion-panel{position:relative;overflow:hidden;min-width:0;padding:30px 27px 31px;border:1px solid #f02b4c;border-radius:19px;background:linear-gradient(145deg,rgba(45,6,15,.93),rgba(11,6,11,.97) 53%,rgba(34,3,10,.94));backdrop-filter:blur(12px);box-shadow:inset 0 1px rgba(255,121,141,.13),0 18px 55px rgba(0,0,0,.32),0 0 20px rgba(205,15,45,.08)}
        .cyberion-panel:before{content:"";position:absolute;right:-64px;top:-90px;width:200px;height:180px;background:radial-gradient(circle,rgba(197,16,43,.16),transparent 70%);pointer-events:none}
        .cyberion-panel h2{position:relative;font-size:clamp(17px,1.6vw,23px);font-weight:800;letter-spacing:-.02em;margin:0 0 28px;display:flex;align-items:center;gap:18px}
        .cyberion-panel h2:after{content:"";position:absolute;bottom:-13px;left:56px;width:62px;height:2px;background:linear-gradient(90deg,#f3294d,transparent)}
        .cyberion-panel h2 span{color:#ff3659;font-size:26px;line-height:1}
        .cyberion-detail{display:flex;align-items:center;gap:18px;border:1px solid #642332;border-radius:13px;padding:13px 17px;margin-top:11px;min-height:67px;background:linear-gradient(105deg,rgba(27,10,17,.98),rgba(23,11,18,.84));font-size:14px;overflow-wrap:anywhere;transition:border-color .18s,background .18s}
        .cyberion-detail:has(a):hover{border-color:#e73355;background:#2b0d18}
        .cyberion-detail i{font-style:normal;font-size:22px;color:#ff4162;display:grid;place-items:center;flex:0 0 53px;height:49px;border:1px solid #8b2538;border-radius:11px;background:radial-gradient(circle at 48% 80%,rgba(245,15,59,.35),rgba(43,11,22,.9));box-shadow:inset 0 0 11px rgba(255,34,67,.16)}
        .cyberion-spec{display:flex;align-items:center;gap:23px;padding:10px 0;border-bottom:1px solid #43202c;font-size:14px;min-height:66px}
        .cyberion-spec:last-child{border:0}.cyberion-spec i{font-style:normal;font-size:24px;color:#fa3354;display:grid;place-items:center;flex:0 0 54px;height:50px;border:1px solid #57202b;border-radius:11px;background:linear-gradient(160deg,#450c1d,#1b0811)}
        .cyberion-spec span{min-width:0}
        .cyberion-map{position:relative;overflow:hidden;isolation:isolate;height:310px;margin-bottom:14px;background:#14141d;border:1px solid #5b2336;border-radius:13px;display:flex;align-items:center;justify-content:center;text-align:center;flex-direction:column;gap:14px;padding:24px;box-shadow:inset 0 0 28px #04030b}
        .cyberion-map:before{content:"";position:absolute;inset:-25%;z-index:-1;opacity:.7;background:repeating-linear-gradient(0deg,transparent 0 47px,rgba(100,104,124,.16) 48px 49px,transparent 50px 100px),repeating-linear-gradient(90deg,transparent 0 48px,rgba(100,104,124,.13) 49px 50px,transparent 51px 100px),linear-gradient(30deg,transparent 39%,#3e303c 39.5%,#302631 43%,transparent 43.5%),linear-gradient(-39deg,transparent 43%,#38303d 43.4%,#38303d 48%,transparent 48.4%);transform:rotate(-12deg) scale(1.2)}
        .cyberion-map strong{color:#fff;background:linear-gradient(125deg,#500e20,#8f1028);border:1px solid #fa3052;border-radius:10px;padding:15px 20px;font-size:16px;box-shadow:0 0 25px rgba(255,23,66,.28)}
        .cyberion-map small{color:#d3cbd0;font-size:12px}.cyberion-map em{color:#ff315c;font-size:33px;font-style:normal;filter:drop-shadow(0 0 12px #ff144b)}
        .cyberion-location-link{display:block;text-decoration:none}
        .cyberion-location-link:hover .cyberion-map{border-color:#ff4b6a}
        .cyberion-location-caption{display:grid;gap:9px;text-align:center;color:#c4b8bf;padding:8px 5px 0;font-size:14px}
        .cyberion-location-caption span:last-child{color:#a6a0aa}

        .cyberion-detail-icon{color:#ff476a;display:grid;place-items:center;flex:0 0 53px;width:53px;height:49px;border:1px solid rgba(255,73,104,.47);border-radius:11px;background:radial-gradient(circle at 45% 83%,rgba(243,24,75,.35),rgba(38,10,23,.95));box-shadow:inset 0 0 15px rgba(255,39,82,.13),0 0 12px rgba(238,22,72,.08);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
        .cyberion-detail:has(a):hover .cyberion-detail-icon{transform:translateY(-1px) scale(1.04);border-color:#ff728c;box-shadow:0 0 20px rgba(255,42,88,.23),inset 0 0 18px rgba(255,55,97,.19)}
        .cyberion-detail-icon svg{display:block;flex-shrink:0}
        @media(max-width:1050px){.cyberion-grid{grid-template-columns:1fr 1fr}.cyberion-grid>.cyberion-panel:last-child{grid-column:1/-1}}
        @media(max-width:650px){.cyberion-grid{grid-template-columns:1fr;gap:14px}.cyberion-grid>.cyberion-panel:last-child{grid-column:auto}.cyberion-panel{padding:22px 17px}.cyberion-detail{padding:10px;font-size:13px}.cyberion-map{height:245px}}

        /* Compact layout matching the provided CYBERION partner mockup */
        .cyberion-partners{padding-top:22px;padding-bottom:40px;min-height:calc(100vh - 64px);background-color:#080508}.cyberion-partners:before{position:fixed;inset:0;background-size:cover;background-position:center center;background-repeat:no-repeat}
        .cyberion-hero{padding:14px 12px 19px}
        .cyberion-kicker{margin-bottom:14px}
        .cyberion-mark-large{font-size:clamp(35px,4.5vw,65px);margin-bottom:0}
        .cyberion-hero h1{font-size:clamp(24px,2.5vw,34px);margin:12px 0 3px}
        .cyberion-hero p.cyberion-muted{font-size:14px;line-height:1.5;margin:6px 0}
        .cyberion-actions{margin-top:20px}
        .cyberion-grid{grid-template-columns:1.17fr .87fr 1.14fr;gap:11px}
        .cyberion-panel{padding:17px 16px;border:1px solid rgba(224,27,56,.75);border-radius:12px;background:linear-gradient(145deg,rgba(32,5,10,.89),rgba(8,7,10,.89));box-shadow:0 12px 38px #0005}
        .cyberion-panel h2{font-size:16px;gap:11px;margin:0 0 14px;letter-spacing:0}
        .cyberion-panel h2:after{display:none}
        .cyberion-panel h2 span{font-size:20px}
        .cyberion-detail{margin-top:6px;min-height:37px;padding:5px 8px;gap:10px;border-radius:8px;border-color:#3f3035;font-size:12px;background:rgba(10,11,16,.95)}
        .cyberion-detail-icon{height:28px;width:28px;flex:0 0 28px;border:0;background:transparent;box-shadow:none;color:#ff2047}
        .cyberion-detail-icon svg{height:21px;width:21px}
        .cyberion-detail:has(a):hover .cyberion-detail-icon{transform:none;box-shadow:none}
        .cyberion-spec{min-height:41px;padding:6px 2px;gap:10px;font-size:12px;border-bottom-color:#3e262d}
        .cyberion-spec i{font-size:18px;min-width:27px;flex:0 0 27px;height:27px;background:transparent;border:0;color:#ff1d45}
        .cyberion-map{height:218px;margin:0;border-radius:9px;padding:14px;gap:8px;background:#15161c}
        .cyberion-map strong{padding:9px 12px;font-size:13px}
        .cyberion-map em{font-size:28px}
        .cyberion-map:before{opacity:.85}
        .cyberion-location-caption{font-size:12px;padding:10px 1px 0;gap:5px}
        .cyberion-socials{display:flex;gap:24px;align-items:center;margin-top:12px;padding:15px 18px}
        .cyberion-socials h2{margin:0;flex:0 0 185px;font-size:15px;white-space:nowrap}
        .cyberion-social-row{flex:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .cyberion-social{background:rgba(21,7,11,.9);border:1px solid #8a202d;border-radius:8px;padding:12px 14px;font-size:12px;line-height:1.35;overflow-wrap:anywhere}
        .cyberion-social strong{display:block;font-size:12px}
        .cyberion-social small{display:block;margin-top:3px;font-size:11px;font-weight:400;color:#bcb3b8}
        .cyberion-social-symbol{font-size:19px;color:#ff3055}
        @media(max-width:1050px){.cyberion-grid{grid-template-columns:1fr 1fr}.cyberion-grid>.cyberion-panel:last-child{grid-column:1/-1}.cyberion-socials{flex-direction:column;align-items:stretch;gap:10px}.cyberion-socials h2{flex:auto}}
        @media(max-width:650px){.cyberion-grid{grid-template-columns:1fr}.cyberion-grid>.cyberion-panel:last-child{grid-column:auto}.cyberion-social-row{grid-template-columns:1fr}.cyberion-socials{padding:14px}}
        @media(max-width:850px){.cyberion-grid{grid-template-columns:1fr}.cyberion-social-row{grid-template-columns:1fr}.cyberion-hero{padding:26px 18px}.cyberion-partners{padding:26px 16px 60px}.cyberion-mark-large{font-size:clamp(30px,8vw,56px)}}
 
        /* Three-panel partner layout matching the supplied design */
        .cyberion-grid-reference{display:grid;grid-template-columns:1fr 1.08fr 1fr;gap:13px;align-items:stretch;margin-top:12px}
        .cyberion-ref-panel{display:flex;flex-direction:column;padding:17px 15px;border:1px solid #e12039;border-radius:11px;background:linear-gradient(145deg,rgba(18,6,10,.97),rgba(5,6,9,.97));min-width:0;box-shadow:inset 0 0 20px #e0172608,0 8px 30px #0009}
        .cyberion-ref-heading{display:flex;align-items:center;gap:12px;margin-bottom:16px;min-height:45px}
        .cyberion-ref-heading>.cyberion-detail-icon,.cyberion-ref-monitor{width:39px;height:39px;flex:0 0 39px;display:grid;place-items:center;border:1px solid #f3284a;border-radius:8px;background:#18060b;color:#ff304f;font-size:25px}
        .cyberion-ref-heading h2{font-size:clamp(15px,1.6vw,21px);margin:0 0 4px;line-height:1.16}
        .cyberion-ref-heading h2:after{display:none}.cyberion-ref-heading p{font-size:11px;line-height:1.45;color:#a6a5af;margin:0}
        .cyberion-ref-contacts{border-top:1px solid #393037;display:grid}
        .cyberion-ref-contact{display:grid;grid-template-columns:27px minmax(62px,.7fr) minmax(0,1.4fr);align-items:center;gap:7px;padding:15px 0;border-bottom:1px solid #29252b;font-size:12px;min-width:0}
        .cyberion-ref-contact>.cyberion-detail-icon{border:0;background:none;box-shadow:none;flex:none;width:25px;height:25px;color:#ff2549}
        .cyberion-ref-contact>.cyberion-detail-icon svg{width:21px;height:21px}
        .cyberion-ref-contact strong{font-weight:650}.cyberion-ref-contact span:last-child,.cyberion-ref-contact a{overflow-wrap:anywhere;color:#c9c5cc;font-size:11px}
        .cyberion-ref-cta{display:flex;justify-content:center;align-items:center;gap:13px;min-height:48px;margin-top:auto;padding:12px;border-radius:8px;border:1px solid #f02446;background:linear-gradient(130deg,#21090f,#0c090c);color:#fff!important;font-size:13px;font-weight:800;text-align:center;box-shadow:0 0 18px #e8172920}
        .cyberion-ref-cta span{margin-left:6px}.cyberion-ref-cta:hover{background:#41111b}
        .cyberion-zones-list{display:grid;gap:6px}
        .cyberion-zone{border:1px solid #474149;border-radius:9px;overflow:hidden;background:#0a0a0d}.cyberion-zone.is-open{border-color:#ed1e3f;box-shadow:0 0 14px #df113721}
        .cyberion-zone-toggle{width:100%;display:flex;align-items:center;gap:11px;padding:8px 10px;background:transparent;color:#fff;text-align:left;border:0;cursor:pointer}
        .cyberion-zone.is-open .cyberion-zone-toggle{background:linear-gradient(90deg,#5e0719,#23080f)}
        .cyberion-zone-number{flex:0 0 27px;width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#f0243e;font-weight:900;font-size:13px}
        .cyberion-zone-label{display:grid;gap:3px;min-width:0;flex:1}.cyberion-zone-label strong{font-size:12px}.cyberion-zone-label small{font-size:10px;color:#b0a9b0;line-height:1.25}
        .cyberion-zone-chevron{font-size:25px;color:#eee}.cyberion-zone-content{padding:9px 13px 12px;background:#08090b}
        .cyberion-zone-spec{display:grid;grid-template-columns:40% 1fr;gap:8px;padding:8px 0;border-bottom:1px solid #28262a;font-size:11px;color:#c5c1c6}
        .cyberion-zone-spec:last-child{border-bottom:0}.cyberion-zone-spec strong{color:#eee;font-weight:650}
        .cyberion-ref-map-link{display:block}.cyberion-ref-map{position:relative;overflow:hidden;display:grid;place-items:center;align-content:center;gap:8px;height:220px;border:1px solid #373d49;border-radius:8px;background:repeating-linear-gradient(29deg,transparent 0 19px,#2c303a 20px 24px,transparent 25px 72px),repeating-linear-gradient(112deg,#10151c 0 35px,#29303b 36px 41px,#11151c 42px 90px);color:#fff}
        .cyberion-ref-map:after{content:"";position:absolute;inset:0;background:linear-gradient(140deg,#06070b40,#0003);pointer-events:none}
        .cyberion-ref-map-pin{z-index:1;display:grid;place-items:center;width:48px;height:48px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#f42645;box-shadow:0 0 20px #f42645;color:#fff;font-size:22px}
        .cyberion-ref-map-name{z-index:1;display:grid;gap:3px;padding:8px 13px;text-align:center;border:1px solid #f42849;border-radius:8px;background:#111016e8;font-size:13px}
        .cyberion-ref-map-name span,.cyberion-ref-map-street{font-size:11px;color:#bac0ca}.cyberion-ref-map-street{z-index:1}.cyberion-ref-address{color:#d2cbd1;font-size:12px;text-align:center;line-height:1.5;margin:13px 0 20px}
        @media(max-width:1040px){.cyberion-grid-reference{grid-template-columns:1fr 1fr}.cyberion-grid-reference>.cyberion-ref-panel:last-child{grid-column:1/-1}}
        @media(max-width:700px){.cyberion-grid-reference{grid-template-columns:1fr}.cyberion-grid-reference>.cyberion-ref-panel:last-child{grid-column:auto}.cyberion-ref-panel{padding:18px}.cyberion-ref-map{height:235px}}

        /* Location panel: fill available height without a separate maps button */
        .cyberion-grid-reference>.cyberion-ref-panel:last-child .cyberion-ref-map-link{display:flex;flex:1;min-height:260px;text-decoration:none}
        .cyberion-grid-reference>.cyberion-ref-panel:last-child .cyberion-ref-map{width:100%;height:100%;min-height:260px;flex:1}
        .cyberion-grid-reference>.cyberion-ref-panel:last-child .cyberion-ref-address{margin:16px 0 2px;padding:9px 5px;text-align:center}
        @media(max-width:700px){.cyberion-grid-reference>.cyberion-ref-panel:last-child .cyberion-ref-map-link,.cyberion-grid-reference>.cyberion-ref-panel:last-child .cyberion-ref-map{min-height:300px}}
      `}</style>
      <div className="cyberion-breadcrumb">ISTe　›　{uk ? "Партнери" : "Partners"}　›　<b>CYBERION KALYNOVA</b></div>
      <div className="cyberion-hero">
        <p className="cyberion-kicker">{uk ? "Наш партнер" : "Our partner"}</p>
        <img className="cyberion-original-logo" src="/cyberion-kalynova-logo.svg" alt="CYBERION KALYNOVA" width="600" height="147" />
        <h1>Кіберклуб CYBERION Дніпро Лівий берег</h1>
        <p className="cyberion-muted">Мережа кіберклубів України · Дніпро, просп. Слобожанський, 89</p>
        <p className="cyberion-muted">Ігровий простір із 30 геймерськими ПК, сучасним обладнанням та можливістю забронювати місце через офіційні канали клубу.</p>
        <div className="cyberion-actions">
          <a className="cyberion-action cyberion-action-primary" href={telegram} target="_blank" rel="noopener noreferrer">↗ {uk ? "Забронювати місце" : "Book a place"}</a>
        </div>
      </div>
      <div className="cyberion-grid cyberion-grid-reference">
        <section className="cyberion-panel cyberion-ref-panel">
          <div className="cyberion-ref-heading"><ContactIcon name="phone" /><div><h2>Контактна інформація</h2><p>Зв’яжіться з клубом або завітайте в гості.</p></div></div>
          <div className="cyberion-ref-contacts">
            <div className="cyberion-ref-contact"><ContactIcon name="location" /><strong>Адреса</strong><span>м. Дніпро, просп. Слобожанський, 89</span></div>
            <div className="cyberion-ref-contact"><ContactIcon name="phone" /><strong>Телефон</strong><a href="tel:+380685551080">+38 (068) 555-10-80</a></div>
            <div className="cyberion-ref-contact"><ContactIcon name="instagram" /><strong>Instagram</strong><a href={insta} target="_blank" rel="noopener noreferrer">@cyberion_dnipro_kalynova</a></div>
            <div className="cyberion-ref-contact"><ContactIcon name="telegram" /><strong>Telegram</strong><a href={telegram} target="_blank" rel="noopener noreferrer">@CyberionKalynova</a></div>
          </div>
          <a className="cyberion-ref-cta" href={maps} target="_blank" rel="noopener noreferrer">↗ Прокласти маршрут <span aria-hidden="true">→</span></a>
        </section>
        <section className="cyberion-panel cyberion-ref-panel cyberion-zones-panel">
          <div className="cyberion-ref-heading"><span className="cyberion-ref-monitor" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4M7 8h10"/></svg></span><div><h2>Ігрові зони клубу</h2><p>Кожна зона має власні характеристики та можливості.</p></div></div>
          <div className="cyberion-zones-list">
            {zones.map((zone,index) => <div key={zone.name} className={`cyberion-zone ${openZone === index ? "is-open" : ""}`}>
              <button type="button" className="cyberion-zone-toggle" aria-expanded={openZone === index} onClick={() => setOpenZone(openZone === index ? -1 : index)}>
                <span className="cyberion-zone-number">{index+1}</span>
                <span className="cyberion-zone-label"><strong>Зона {index+1} — {zone.name}</strong><small>{zone.description}</small></span>
                <span className="cyberion-zone-chevron" aria-hidden="true">{openZone === index ? "⌃" : "⌄"}</span>
              </button>
              {openZone === index && <div className="cyberion-zone-content">
                <div className="cyberion-zone-spec"><strong>ПК та відеокарта</strong><span>Характеристики уточнюються в клубі</span></div>
                <div className="cyberion-zone-spec"><strong>Монітори</strong><span>Залежать від ігрової зони</span></div>
                <div className="cyberion-zone-spec"><strong>Периферія та крісла</strong><span>Комплектацію уточнюйте під час бронювання</span></div>
              </div>}
            </div>)}
          </div>
        </section>
        <section className="cyberion-panel cyberion-ref-panel">
          <div className="cyberion-ref-heading"><ContactIcon name="location" /><div><h2>Розташування</h2><p>Легко знайти. Зручно дістатися.</p></div></div>
          <a className="cyberion-ref-map-link" href={maps} target="_blank" rel="noopener noreferrer" aria-label="Відкрити CYBERION у Google Maps">
            <div className="cyberion-ref-map"><div className="cyberion-ref-map-pin">●</div><div className="cyberion-ref-map-name"><strong>CYBERION</strong><span>Дніпро · Лівий берег</span></div><span className="cyberion-ref-map-street">просп. Слобожанський</span></div>
          </a>
          <p className="cyberion-ref-address">📍 м. Дніпро, просп. Слобожанський, 89</p>
          
        </section>
      </div>
    </section>
  );
}
