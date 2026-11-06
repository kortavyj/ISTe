import Hero from "../components/home/Hero.jsx";
import Match from "../components/home/Match.jsx";
import Explore from "../components/home/Explore.jsx";
import Media from "../components/home/Media.jsx";
import Roster from "../components/home/Roster.jsx";

export default function Home() {
  return (
    <>
      <Hero />
      <Explore />
      <Roster />
      <Match />
      <Media />
    </>
  );
}
