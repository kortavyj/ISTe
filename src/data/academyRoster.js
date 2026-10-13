export const ACADEMY_FACEIT_TEAM = "https://www.faceit.com/ru/teams/32334a69-a46c-496a-a029-060b30a89b13/overview";
// Membership confirmed by team screenshot. Individual ratings/roles are not verified.
export const ACADEMY_PLAYERS = [
  {nickname:"E34-M50B25"},
  {nickname:"S1Zapooo"},
  {nickname:"DETT3N",isCaptain:true,role:"CAPTAIN"},
  {nickname:"SaDaMXynBceM"},
  {nickname:"syro_S"},
].map((player,index)=>({ ...player, playerId:"academy-"+index, rosterStatus:"academy", displayName:player.nickname, faceitUrl:"https://www.faceit.com/ru/players/"+encodeURIComponent(player.nickname), role:player.role||"PLAYER", officialRoster:true, sortOrder:index, strengths:[], socials:[] }));

export function centerCaptain(players){
  const others=players.filter(player=>!player.isCaptain);
  const captains=players.filter(player=>player.isCaptain);
  if(!captains.length)return players;
  const center=Math.floor(players.length/2);
  return [...others.slice(0,center),...captains,...others.slice(center)];
}
