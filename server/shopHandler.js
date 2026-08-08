import {
  createHmac,
  randomUUID,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { guardRequest } from "../api/lib/requestGuard.js";
import {
  isUuid,
  readJsonBody,
  readQueryString,
} from "../api/lib/requestBody.js";
import { requireOwner } from "../api/lib/ownerRequest.js";

const PRODUCT_COLUMNS = [
  "id",
  "slug",
  "name",
  "collection",
  "short_description",
  "description",
  "price_uah",
  "status",
  "image_url",
  "visual_variant",
  "sizes",
  "sort_order",
].join(", ");

const PUBLIC_STATUSES = new Set([
  "live",
  "soldout",
]);

const OWNER_PRODUCT_STATUSES = new Set([
  "draft",
  "live",
  "soldout",
  "hidden",
]);

const OWNER_VISUAL_VARIANTS = new Set([
  "tee",
  "hoodie",
  "jersey",
]);

const ALLOWED_LOCALES = new Set([
  "uk",
  "ru",
  "en",
]);

const MAX_BODY_BYTES = 8 * 1024;
const PREORDER_RATE_LIMIT = 5;
const PREORDER_RATE_WINDOW_SECONDS =
  60 * 60;
const MIN_FORM_FILL_TIME_MS = 1200;

let adminClient = null;

function getSupabaseAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim();

  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !secretKey) {
    throw Object.assign(
      new Error(
        "Supabase admin configuration is missing.",
      ),
      {
        code: "SHOP_SECURITY_NOT_CONFIGURED",
      },
    );
  }

  if (!adminClient) {
    adminClient = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return adminClient;
}

function setSecurityHeaders(response) {
  response.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );

  response.setHeader(
    "X-Frame-Options",
    "DENY",
  );

  response.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );

  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

function sendGuardError(
  response,
  guard,
) {
  if (guard.allow) {
    response.setHeader(
      "Allow",
      guard.allow,
    );
  }

  return response.status(guard.status).json({
    ok: false,
    error: guard.error,
    message:
      "Запрос отклонён сервером.",
  });
}

function sendError(
  response,
  status,
  error,
  message,
) {
  return response.status(status).json({
    ok: false,
    error,
    message,
  });
}

function normalizeProduct(row) {
  const rawPrice = row?.price_uah;
  const numericPrice =
    rawPrice === null ||
    rawPrice === undefined
      ? null
      : Number(rawPrice);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    collection: row.collection,
    shortDescription:
      row.short_description || "",
    description:
      row.description || "",
    priceUah:
      Number.isFinite(numericPrice)
        ? numericPrice
        : null,
    status: row.status,
    imageUrl: row.image_url || "",
    visualVariant:
      row.visual_variant || "tee",
    sizes: Array.isArray(row.sizes)
      ? row.sizes
      : [],
    sortOrder:
      Number.isFinite(
        Number(row.sort_order),
      )
        ? Number(row.sort_order)
        : 0,
  };
}

function getHeader(
  request,
  name,
) {
  const value =
    request.headers?.[
      name.toLowerCase()
    ];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string"
    ? value
    : "";
}

function getClientAddress(request) {
  const forwarded = getHeader(
    request,
    "x-forwarded-for",
  );

  if (forwarded.trim()) {
    return forwarded
      .split(",")[0]
      .trim()
      .slice(0, 96);
  }

  const realIp = getHeader(
    request,
    "x-real-ip",
  );

  return realIp.trim()
    ? realIp.trim().slice(0, 96)
    : "unknown";
}

function getUserAgent(request) {
  return getHeader(
    request,
    "user-agent",
  )
    .trim()
    .slice(0, 320) || "unknown";
}

function createRateLimitKey(request) {
  const secret =
    process.env
      .SHOP_RATE_LIMIT_SECRET
      ?.trim();

  if (!secret || secret.length < 32) {
    throw Object.assign(
      new Error(
        "Shop rate limit secret is missing.",
      ),
      {
        code:
          "SHOP_SECURITY_NOT_CONFIGURED",
      },
    );
  }

  return createHmac(
    "sha256",
    secret,
  )
    .update(
      `${getClientAddress(
        request,
      )}|${getUserAgent(
        request,
      )}|preorder`,
    )
    .digest("hex");
}

async function consumePreorderRateLimit(
  supabase,
  request,
) {
  const key =
    createRateLimitKey(request);

  const {
    data,
    error,
  } = await supabase.rpc(
    "shop_consume_rate_limit",
    {
      p_key: key,
      p_limit:
        PREORDER_RATE_LIMIT,
      p_window_seconds:
        PREORDER_RATE_WINDOW_SECONDS,
    },
  );

  if (error) {
    console.error(
      "Shop rate limit RPC error:",
      error,
    );

    throw Object.assign(
      new Error(
        "Rate limit check failed.",
      ),
      {
        code:
          "RATE_LIMIT_CHECK_FAILED",
      },
    );
  }

  return data === true;
}

function normalizeEmail(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function readPreorderInput(body) {
  const productId =
    typeof body.productId === "string"
      ? body.productId.trim()
      : "";

  const name =
    typeof body.name === "string"
      ? body.name
          .trim()
          .replace(/\s+/g, " ")
      : "";

  const email =
    normalizeEmail(body.email);

  const size =
    typeof body.size === "string"
      ? body.size
          .trim()
          .toUpperCase()
      : "";

  const quantity =
    Number(body.quantity);

  const locale =
    ALLOWED_LOCALES.has(
      body.locale,
    )
      ? body.locale
      : "ru";

  const consent =
    body.consent === true;

  const website =
    typeof body.website === "string"
      ? body.website.trim()
      : "";

  const startedAt =
    Number(body.startedAt);

  if (!isUuid(productId)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_PRODUCT",
      message:
        "Выбран некорректный товар.",
    };
  }

  if (
    name.length < 2 ||
    name.length > 60
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NAME",
      message:
        "Имя должно содержать от 2 до 60 символов.",
    };
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
      email,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_EMAIL",
      message:
        "Укажите корректный адрес электронной почты.",
    };
  }

  if (
    !/^[A-Z0-9+\-]{1,8}$/.test(
      size,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_SIZE",
      message:
        "Выберите размер товара.",
    };
  }

  if (
    !Number.isInteger(
      quantity,
    ) ||
    quantity < 1 ||
    quantity > 3
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_QUANTITY",
      message:
        "Можно выбрать от 1 до 3 единиц.",
    };
  }

  if (!consent) {
    return {
      ok: false,
      status: 400,
      error:
        "CONSENT_REQUIRED",
      message:
        "Нужно согласиться с обработкой данных для предзаказа.",
    };
  }

  return {
    ok: true,
    productId,
    name,
    email,
    size,
    quantity,
    locale,
    website,
    startedAt,
  };
}

function readOwnerProductInput(body) {
  const id =
    typeof body.id === "string"
      ? body.id.trim()
      : "";

  const slug =
    typeof body.slug === "string"
      ? body.slug
          .trim()
          .toLowerCase()
      : "";

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const collection =
    typeof body.collection ===
    "string"
      ? body.collection.trim()
      : "";

  const shortDescription =
    typeof body.shortDescription ===
    "string"
      ? body.shortDescription.trim()
      : "";

  const description =
    typeof body.description ===
    "string"
      ? body.description.trim()
      : "";

  const imageUrl =
    typeof body.imageUrl ===
    "string"
      ? body.imageUrl.trim()
      : "";

  const status =
    typeof body.status === "string"
      ? body.status
          .trim()
          .toLowerCase()
      : "draft";

  const visualVariant =
    typeof body.visualVariant ===
    "string"
      ? body.visualVariant
          .trim()
          .toLowerCase()
      : "tee";

  const priceSource =
    body.priceUah;

  const priceUah =
    priceSource === "" ||
    priceSource === null ||
    priceSource === undefined
      ? null
      : Number(priceSource);

  const sortOrder =
    Number(body.sortOrder ?? 0);

  const sizes =
    Array.isArray(body.sizes)
      ? [
          ...new Set(
            body.sizes
              .map((item) =>
                String(item)
                  .trim()
                  .toUpperCase(),
              )
              .filter(Boolean),
          ),
        ]
      : [];

  if (id && !isUuid(id)) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_PRODUCT_ID",
      message:
        "Некорректный ID товара.",
    };
  }

  if (
    slug.length < 3 ||
    slug.length > 80 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_PRODUCT_SLUG",
      message:
        "URL товара должен содержать латинские буквы, цифры и дефисы.",
    };
  }

  if (
    name.length < 2 ||
    name.length > 100
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_PRODUCT_NAME",
      message:
        "Название товара должно содержать от 2 до 100 символов.",
    };
  }

  if (
    collection.length < 2 ||
    collection.length > 100
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_COLLECTION",
      message:
        "Укажи название коллекции.",
    };
  }

  if (
    shortDescription.length >
      220 ||
    description.length > 3000
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "PRODUCT_TEXT_TOO_LONG",
      message:
        "Описание товара слишком длинное.",
    };
  }

  if (
    !OWNER_PRODUCT_STATUSES.has(
      status,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_PRODUCT_STATUS",
      message:
        "Выбран недопустимый статус товара.",
    };
  }

  if (
    !OWNER_VISUAL_VARIANTS.has(
      visualVariant,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_VISUAL_VARIANT",
      message:
        "Выбран недопустимый тип визуала.",
    };
  }

  if (
    priceUah !== null &&
    (
      !Number.isInteger(
        priceUah,
      ) ||
      priceUah < 0 ||
      priceUah > 1_000_000
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_PRICE",
      message:
        "Цена должна быть целым числом от 0 до 1 000 000 грн.",
    };
  }

  if (
    !Number.isInteger(
      sortOrder,
    ) ||
    sortOrder < -1000 ||
    sortOrder > 1000
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_SORT_ORDER",
      message:
        "Некорректный порядок отображения.",
    };
  }

  if (
    sizes.length < 1 ||
    sizes.length > 12 ||
    sizes.some(
      (item) =>
        !/^[A-Z0-9+\-]{1,8}$/.test(
          item,
        ),
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_SIZES",
      message:
        "Укажи от 1 до 12 корректных размеров.",
    };
  }

  if (imageUrl) {
    let validImageUrl =
      imageUrl.startsWith("/");

    if (!validImageUrl) {
      try {
        const parsed =
          new URL(imageUrl);

        validImageUrl =
          parsed.protocol ===
          "https:";
      } catch {
        validImageUrl = false;
      }
    }

    if (
      !validImageUrl ||
      imageUrl.length > 1000
    ) {
      return {
        ok: false,
        status: 400,
        error:
          "INVALID_IMAGE_URL",
        message:
          "Изображение должно использовать HTTPS или путь внутри сайта.",
      };
    }
  }

  return {
    ok: true,
    id,
    value: {
      slug,
      name,
      collection,
      short_description:
        shortDescription,
      description,
      price_uah: priceUah,
      status,
      image_url:
        imageUrl || null,
      visual_variant:
        visualVariant,
      sizes,
      sort_order: sortOrder,
    },
  };
}

async function getOwner(
  request,
  response,
) {
  const owner =
    await requireOwner(
      request,
      response,
    );

  if (!owner.ok) {
    sendError(
      response,
      owner.status,
      owner.error,
      owner.message,
    );

    return null;
  }

  return owner;
}

async function handleProducts(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["GET"],
      requireJson: false,
      requireOrigin: false,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data,
      error,
    } = await supabase
      .from("shop_products")
      .select(PRODUCT_COLUMNS)
      .in(
        "status",
        ["live", "soldout"],
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      );

    if (error) {
      console.error(
        "Shop products query error:",
        error,
      );

      return sendError(
        response,
        502,
        "SHOP_PRODUCTS_UNAVAILABLE",
        "Не удалось загрузить коллекцию ISTe Wear.",
      );
    }

    response.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    );

    return response
      .status(200)
      .json({
        ok: true,
        products:
          Array.isArray(data)
            ? data
                .filter((item) =>
                  PUBLIC_STATUSES.has(
                    item.status,
                  ),
                )
                .map(
                  normalizeProduct,
                )
            : [],
      });
  } catch (error) {
    console.error(
      "Unexpected shop products error:",
      error,
    );

    return sendError(
      response,
      error?.code ===
        "SHOP_SECURITY_NOT_CONFIGURED"
        ? 503
        : 500,
      error?.code ||
        "SHOP_INTERNAL_ERROR",
      "Магазин временно недоступен.",
    );
  }
}

async function handlePreorder(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["POST"],
      requireJson: true,
      requireOrigin: true,
      maxBodyBytes:
        MAX_BODY_BYTES,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const body =
    readJsonBody(request);

  if (!body) {
    return sendError(
      response,
      400,
      "INVALID_JSON",
      "Не удалось прочитать форму предзаказа.",
    );
  }

  let encodedBody;

  try {
    encodedBody =
      JSON.stringify(body);
  } catch {
    return sendError(
      response,
      400,
      "INVALID_JSON",
      "Не удалось прочитать форму предзаказа.",
    );
  }

  if (
    Buffer.byteLength(
      encodedBody,
      "utf8",
    ) > MAX_BODY_BYTES
  ) {
    return sendError(
      response,
      413,
      "REQUEST_TOO_LARGE",
      "Форма содержит слишком много данных.",
    );
  }

  const input =
    readPreorderInput(body);

  if (!input.ok) {
    return sendError(
      response,
      input.status,
      input.error,
      input.message,
    );
  }

  if (input.website) {
    return response
      .status(200)
      .json({
        ok: true,
        accepted: true,
        reference:
          `ISTE-${randomUUID()
            .slice(0, 8)
            .toUpperCase()}`,
      });
  }

  const elapsed =
    Date.now() -
    input.startedAt;

  if (
    !Number.isFinite(
      input.startedAt,
    ) ||
    input.startedAt <= 0 ||
    elapsed <
      MIN_FORM_FILL_TIME_MS ||
    elapsed >
      1000 *
        60 *
        60 *
        24
  ) {
    return sendError(
      response,
      400,
      "FORM_TIMING_REJECTED",
      "Обновите страницу и заполните форму ещё раз.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const allowed =
      await consumePreorderRateLimit(
        supabase,
        request,
      );

    if (!allowed) {
      return sendError(
        response,
        429,
        "TOO_MANY_PREORDERS",
        "Слишком много заявок за короткое время. Попробуйте позже.",
      );
    }

    const {
      data: product,
      error: productError,
    } = await supabase
      .from("shop_products")
      .select(
        "id, name, status, sizes",
      )
      .eq(
        "id",
        input.productId,
      )
      .maybeSingle();

    if (productError) {
      console.error(
        "Shop product lookup error:",
        productError,
      );

      return sendError(
        response,
        502,
        "PRODUCT_LOOKUP_FAILED",
        "Не удалось проверить товар.",
      );
    }

    if (
      !product ||
      product.status !== "live"
    ) {
      return sendError(
        response,
        409,
        "PREORDER_CLOSED",
        "Предзаказ на этот товар сейчас закрыт.",
      );
    }

    const sizes =
      Array.isArray(
        product.sizes,
      )
        ? product.sizes.map(
            (item) =>
              String(item)
                .toUpperCase(),
          )
        : [];

    if (
      !sizes.includes(
        input.size,
      )
    ) {
      return sendError(
        response,
        400,
        "SIZE_NOT_AVAILABLE",
        "Этот размер недоступен для выбранного товара.",
      );
    }

    const {
      data: preorder,
      error: insertError,
    } = await supabase
      .from("shop_preorders")
      .insert({
        product_id:
          input.productId,
        name: input.name,
        email: input.email,
        size: input.size,
        quantity:
          input.quantity,
        locale:
          input.locale,
        consent_version:
          "2026-08-08",
      })
      .select("id")
      .single();

    if (
      insertError ||
      !preorder?.id
    ) {
      console.error(
        "Shop preorder insert error:",
        insertError,
      );

      return sendError(
        response,
        502,
        "PREORDER_SAVE_FAILED",
        "Не удалось сохранить предзаказ. Попробуйте ещё раз позже.",
      );
    }

    return response
      .status(201)
      .json({
        ok: true,
        accepted: true,
        reference:
          `ISTE-${String(
            preorder.id,
          )
            .slice(0, 8)
            .toUpperCase()}`,
      });
  } catch (error) {
    console.error(
      "Unexpected shop preorder error:",
      error,
    );

    if (
      error?.code ===
      "SHOP_SECURITY_NOT_CONFIGURED"
    ) {
      return sendError(
        response,
        503,
        error.code,
        "Предзаказы временно отключены до завершения настройки защиты.",
      );
    }

    if (
      error?.code ===
      "RATE_LIMIT_CHECK_FAILED"
    ) {
      return sendError(
        response,
        503,
        error.code,
        "Система защиты предзаказов временно недоступна.",
      );
    }

    return sendError(
      response,
      500,
      "SHOP_INTERNAL_ERROR",
      "Не удалось обработать предзаказ.",
    );
  }
}

async function handleOwnerProducts(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["GET"],
      requireJson: false,
      requireOrigin: false,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const owner =
    await getOwner(
      request,
      response,
    );

  if (!owner) {
    return;
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data,
      error,
    } = await supabase
      .from("shop_products")
      .select(
        `${PRODUCT_COLUMNS}, created_at, updated_at`,
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      );

    if (error) {
      console.error(
        "Owner shop products query error:",
        error,
      );

      return sendError(
        response,
        502,
        "OWNER_SHOP_PRODUCTS_FAILED",
        "Не удалось загрузить товары.",
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
        products:
          Array.isArray(data)
            ? data.map(
                (row) => ({
                  ...normalizeProduct(
                    row,
                  ),
                  createdAt:
                    row.created_at,
                  updatedAt:
                    row.updated_at,
                }),
              )
            : [],
      });
  } catch (error) {
    console.error(
      "Unexpected owner shop products error:",
      error,
    );

    return sendError(
      response,
      500,
      "SHOP_INTERNAL_ERROR",
      "Не удалось загрузить управление магазином.",
    );
  }
}

async function handleOwnerPreorders(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["GET"],
      requireJson: false,
      requireOrigin: false,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const owner =
    await getOwner(
      request,
      response,
    );

  if (!owner) {
    return;
  }

  const limitRaw =
    Number(
      request.query?.limit ??
        200,
    );

  const limit =
    Number.isInteger(limitRaw)
      ? Math.max(
          1,
          Math.min(
            limitRaw,
            500,
          ),
        )
      : 200;

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data,
      error,
    } = await supabase
      .from("shop_preorders")
      .select(
        "id, product_id, name, email, size, quantity, locale, consent_version, created_at, shop_products(name, slug)",
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(limit);

    if (error) {
      console.error(
        "Owner shop preorders query error:",
        error,
      );

      return sendError(
        response,
        502,
        "OWNER_SHOP_PREORDERS_FAILED",
        "Не удалось загрузить заявки.",
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
        preorders:
          Array.isArray(data)
            ? data.map(
                (row) => ({
                  id: row.id,
                  productId:
                    row.product_id,
                  productName:
                    row
                      .shop_products
                      ?.name ||
                    "ISTe Wear",
                  productSlug:
                    row
                      .shop_products
                      ?.slug || "",
                  name: row.name,
                  email:
                    row.email,
                  size: row.size,
                  quantity:
                    row.quantity,
                  locale:
                    row.locale,
                  consentVersion:
                    row
                      .consent_version,
                  createdAt:
                    row.created_at,
                }),
              )
            : [],
      });
  } catch (error) {
    console.error(
      "Unexpected owner shop preorders error:",
      error,
    );

    return sendError(
      response,
      500,
      "SHOP_INTERNAL_ERROR",
      "Не удалось загрузить заявки.",
    );
  }
}

async function handleOwnerSaveProduct(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["POST"],
      requireJson: true,
      requireOrigin: true,
      maxBodyBytes:
        16 * 1024,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const owner =
    await getOwner(
      request,
      response,
    );

  if (!owner) {
    return;
  }

  const body =
    readJsonBody(request);

  if (!body) {
    return sendError(
      response,
      400,
      "INVALID_JSON",
      "Не удалось прочитать данные товара.",
    );
  }

  const input =
    readOwnerProductInput(body);

  if (!input.ok) {
    return sendError(
      response,
      input.status,
      input.error,
      input.message,
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    let query;

    if (input.id) {
      query = supabase
        .from("shop_products")
        .update(input.value)
        .eq("id", input.id)
        .select(
          `${PRODUCT_COLUMNS}, created_at, updated_at`,
        )
        .single();
    } else {
      query = supabase
        .from("shop_products")
        .insert(input.value)
        .select(
          `${PRODUCT_COLUMNS}, created_at, updated_at`,
        )
        .single();
    }

    const {
      data,
      error,
    } = await query;

    if (error || !data) {
      console.error(
        "Owner save shop product error:",
        error,
      );

      if (
        error?.code ===
        "23505"
      ) {
        return sendError(
          response,
          409,
          "PRODUCT_SLUG_TAKEN",
          "Товар с таким URL уже существует.",
        );
      }

      return sendError(
        response,
        502,
        "OWNER_SHOP_SAVE_FAILED",
        "Не удалось сохранить товар.",
      );
    }

    const auditResult =
      await supabase
        .from(
          "shop_admin_audit",
        )
        .insert({
          actor_id:
            owner.user.id,
          action: input.id
            ? "product.update"
            : "product.create",
          product_id:
            data.id,
          metadata: {
            slug: data.slug,
            status:
              data.status,
          },
        });

    if (
      auditResult.error
    ) {
      console.error(
        "Shop audit insert error:",
        auditResult.error,
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
        product: {
          ...normalizeProduct(
            data,
          ),
          createdAt:
            data.created_at,
          updatedAt:
            data.updated_at,
        },
      });
  } catch (error) {
    console.error(
      "Unexpected owner shop save error:",
      error,
    );

    return sendError(
      response,
      500,
      "SHOP_INTERNAL_ERROR",
      "Не удалось сохранить товар.",
    );
  }
}

export default async function shopHandler(
  request,
  response,
) {
  setSecurityHeaders(response);

  const action =
    readQueryString(
      request.query?.action,
      40,
    ) || "products";

  if (action === "products") {
    return handleProducts(
      request,
      response,
    );
  }

  if (action === "preorder") {
    return handlePreorder(
      request,
      response,
    );
  }

  if (
    action ===
    "owner-products"
  ) {
    return handleOwnerProducts(
      request,
      response,
    );
  }

  if (
    action ===
    "owner-preorders"
  ) {
    return handleOwnerPreorders(
      request,
      response,
    );
  }

  if (
    action ===
    "owner-save-product"
  ) {
    return handleOwnerSaveProduct(
      request,
      response,
    );
  }

  return sendError(
    response,
    404,
    "SHOP_ACTION_NOT_FOUND",
    "Запрошенная операция магазина не найдена.",
  );
}
