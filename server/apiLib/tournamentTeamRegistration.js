// Strict, pure CS2 team application validation.
// Database must independently enforce tournament capacity, team name uniqueness,
// authenticated captain, per-tournament membership and application status.
const allowed = new Set(["tournamentId","name","captainUserId","members"]);
const memberKeys = new Set(["userId","faceitPlayerId"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const faceit = /^[a-zA-Z0-9_-]{3,64}$/;
const validUuid = v => typeof v === "string" && UUID.test(v);

export function validateTournamentTeamApplication(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some(k => !allowed.has(k))) return {ok:false,error:"INVALID_BODY"};
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g," ") : "";
  if (!validUuid(input.tournamentId)) return {ok:false,error:"INVALID_TOURNAMENT"};
  if (name.length < 2 || name.length > 80 || /[\x00-\x1f\x7f]/.test(name)) return {ok:false,error:"INVALID_TEAM_NAME"};
  if (!validUuid(input.captainUserId)) return {ok:false,error:"INVALID_CAPTAIN"};
  if (!Array.isArray(input.members) || input.members.length < 5 || input.members.length > 7)
    return {ok:false,error:"INVALID_ROSTER_SIZE"};

  const seenIds = new Set();
  const seenFaceit = new Set();
  const members = [];
  for (const member of input.members) {
    if (!member || typeof member !== "object" || Array.isArray(member) ||
        Object.keys(member).some(k=>!memberKeys.has(k))) return {ok:false,error:"INVALID_MEMBER"};
    const userId = member.userId ?? null;
    const faceitPlayerId = member.faceitPlayerId ?? null;
    if (userId !== null && !validUuid(userId)) return {ok:false,error:"INVALID_MEMBER_ID"};
    if (faceitPlayerId !== null && (typeof faceitPlayerId !== "string" || !faceit.test(faceitPlayerId)))
      return {ok:false,error:"INVALID_FACEIT_ID"};
    if (!userId && !faceitPlayerId) return {ok:false,error:"MISSING_MEMBER_IDENTITY"};
    if (userId && seenIds.has(userId.toLowerCase())) return {ok:false,error:"DUPLICATE_MEMBER"};
    if (faceitPlayerId && seenFaceit.has(faceitPlayerId.toLowerCase())) return {ok:false,error:"DUPLICATE_MEMBER"};
    if (userId) seenIds.add(userId.toLowerCase());
    if (faceitPlayerId) seenFaceit.add(faceitPlayerId.toLowerCase());
    members.push({userId,faceitPlayerId,isCaptain:userId?.toLowerCase()===input.captainUserId.toLowerCase()});
  }
  if (members.filter(m=>m.isCaptain).length !== 1) return {ok:false,error:"CAPTAIN_NOT_IN_ROSTER"};
  return {ok:true,value:{tournamentId:input.tournamentId,name,captainUserId:input.captainUserId,members,status:"pending"}};
}
