import { guardRequest } from "../lib/requestGuard.js";

export default function handler(
  request,
  response,
) {
  const result = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
  });

  if (!result.ok) {
    if (result.allow) {
      response.setHeader(
        "Allow",
        result.allow,
      );
    }

    return response
      .status(result.status)
      .json({
        ok: false,
        error: result.error,
      });
  }

  return response.status(200).json({
    ok: true,

    security: {
      methodChecked: true,
      originChecked: true,
      hostChecked: true,
      fetchSiteChecked: true,
      contentTypeChecked: true,
    },
  });
}
