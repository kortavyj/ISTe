// Single Vercel Hobby serverless entrypoint for ISTe Tournaments V2.
// Routing retains existing endpoints through explicit vercel.json rewrites.
// All endpoint-specific guards, owner/MFA checks and disabled-write flags
// are preserved in the imported request handlers.
import owner from "../server/tournamentRoutes/tournaments-owner.js";
import confirm from "../server/tournamentRoutes/tournaments-match-confirm.js";
import teamApply from "../server/tournamentRoutes/tournaments-team-apply.js";
import teamReview from "../server/tournamentRoutes/tournaments-team-review.js";
import teamList from "../server/tournamentRoutes/tournaments-team-list.js";
import myInvitations from "../server/tournamentRoutes/tournaments-my-invitations.js";
import rosterResponse from "../server/tournamentRoutes/tournaments-roster-response.js";
import replacementInvite from "../server/tournamentRoutes/tournaments-replacement-invite.js";
import bracketGenerate from "../server/tournamentRoutes/tournaments-bracket-generate.js";
import bracketRead from "../server/tournamentRoutes/tournaments-bracket.js";
import statusTransition from "../server/tournamentRoutes/tournaments-status-transition.js";

const routes = Object.freeze({
  owner,
  "match-confirm": confirm,
  "team-apply": teamApply,
  "team-review": teamReview,
  "team-list": teamList,
  "my-invitations": myInvitations,
  "roster-response": rosterResponse,
  "replacement-invite": replacementInvite,
  "bracket-generate": bracketGenerate,
  bracket: bracketRead,
  "status-transition": statusTransition,
});

export default function handler(request, response) {
  const route = request.query?.route;
  const routeName = typeof route === "string" ? route : "";
  const selected = Object.hasOwn(routes, routeName) ? routes[routeName] : null;
  if (!selected) {
    response.setHeader("Cache-Control", "no-store, private");
    return response.status(404).json({ ok: false, error: "TOURNAMENT_ROUTE_NOT_FOUND" });
  }
  return selected(request, response);
}
