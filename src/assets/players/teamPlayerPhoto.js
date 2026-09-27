import part1 from "./team-player-1.txt?raw";
import part2 from "./team-player-2.txt?raw";
import part3 from "./team-player-3.txt?raw";
import part4 from "./team-player-4.txt?raw";
import part5 from "./team-player-5.txt?raw";
import part6 from "./team-player-6.txt?raw";
import part7 from "./team-player-7.txt?raw";
import part8 from "./team-player-8.txt?raw";

const encodedPhoto = [
  part1,
  part2,
  part3,
  part4,
  part5,
  part6,
  part7,
  part8,
]
  .join("")
  .replace(/\s+/g, "");

const sharedPlayerPortrait = `data:image/webp;base64,${encodedPhoto}`;

export default sharedPlayerPortrait;
