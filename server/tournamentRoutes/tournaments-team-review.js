import { guardRequest } from "../apiLib/requestGuard.js";
import { requireOwner } from "../apiLib/ownerRequest.js";
import { readJsonBody, isUuid } from "../apiLib/requestBody.js";

// Staged owner-only application review; no direct table mutation.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");
  const guard = guardRequest(request, {
    methods: ["POST"], requireJson: true, requireOrigin: true, maxBodyBytes: 2048,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow",guard.allow);
    return response.status(guard.status).json({ok:false,error:guard.error});
  }
  const owner = await requireOwner(request,response);
  if (!owner.ok) return response.status(owner.status).json({
    ok:false,error:owner.error,message:owner.message,
  });
  if (process.env.ISTE_TOURNAMENT_WRITES_ENABLED !== "true")
    return response.status(503).json({ok:false,error:"TOURNAMENT_WRITES_DISABLED"});
  const input = readJsonBody(request);
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).some(k => !["teamId","expectedStatus","decision"].includes(k))
    || !isUuid(input.teamId) || input.expectedStatus !== "pending"
    || !["approve","reject"].includes(input.decision))
    return response.status(400).json({ok:false,error:"INVALID_REVIEW_REQUEST"});
  try {
    const {data,error} = await owner.supabase.rpc("iste_owner_review_team",{
      p_team_id:input.teamId,p_expected_status:input.expectedStatus,p_decision:input.decision,
    });
    if (error) {
      if (["PGRST202","42883"].includes(error.code))
        return response.status(503).json({ok:false,error:"TEAM_REVIEW_RPC_NOT_INSTALLED"});
      return response.status(409).json({ok:false,error:"TEAM_REVIEW_REJECTED",
        message:"Заявка уже рассмотрена или не соответствует условиям турнира."});
    }
    return response.status(200).json({ok:true,review:data});
  } catch {
    return response.status(500).json({ok:false,error:"TEAM_REVIEW_FAILED"});
  }
}
