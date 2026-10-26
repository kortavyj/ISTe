export const ACADEMY_FACEIT_TEAM = "https://www.faceit.com/ru/teams/32334a69-a46c-496a-a029-060b30a89b13/overview";
// Membership confirmed by team screenshot. Individual ratings/roles are not verified.
export const ACADEMY_PLAYERS = [
  {nickname:"ivan1love",realNameUk:"Іван",realNameEn:"Ivan",role:"RIFLER",strengths:["Вогневий тиск","Ініціатива","Запал"],socials:[{type:"instagram",url:"https://instagram.com/1loveivan"}],portraitUrl:"https://distribution.faceit-cdn.net/images/65d56713-c293-430e-9f59-2e4c6e9baf81.jpg"},
  {nickname:"S1Zapooo",strengths:["ISTe Academy","CS2","Основний склад"]},
  {nickname:"DETT3N",displayName:"D3TTEN",realNameUk:"Назар",realNameEn:"Nazar",isCaptain:true,role:"IGL",strengths:["Читання гри","Емоційний настрій","Адаптивність"],socials:[{type:"instagram",url:"https://instagram.com/pelmenoo"}],portraitUrl:"https://distribution.faceit-cdn.net/images/b1cdce43-4629-4739-af8f-1e4dbfb2107b.jpg"},
  {nickname:"AGREGAT",role:"RIFLER",strengths:["Агресія","Дуелі","Швидкі рішення"],faceitUrl:"https://www.faceit.com/en/players/AGREGAT"},
  {nickname:"syro_S",strengths:["Команда ISTe","Змагальний CS2","FACEIT"]},
].map((player,index)=>({ ...player, playerId:"academy-"+index, rosterStatus:"academy", displayName:player.displayName||player.nickname, faceitUrl:player.faceitUrl||"https://www.faceit.com/ru/players/"+encodeURIComponent(player.nickname), role:player.role||"PLAYER", officialRoster:true, sortOrder:index, strengths:player.strengths||[], socials:player.socials||[] }));

export function centerCaptain(players){
  const others=players.filter(player=>!player.isCaptain);
  const captains=players.filter(player=>player.isCaptain);
  if(!captains.length)return players;
  const center=Math.floor(players.length/2);
  return [...others.slice(0,center),...captains,...others.slice(center)];
}
