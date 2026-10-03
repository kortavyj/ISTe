export function localizeHighlight(
  highlight,
  language,
) {
  const useEnglish =
    language === "en";

  return {
    ...highlight,
    title:
      (
        useEnglish
          ? highlight?.titleEn
          : highlight?.titleUk
      ) ||
      highlight?.titleUk ||
      highlight?.titleEn ||
      "",
    description:
      (
        useEnglish
          ? highlight?.descriptionEn
          : highlight?.descriptionUk
      ) ||
      highlight?.descriptionUk ||
      highlight?.descriptionEn ||
      "",
  };
}

export function getYouTubeId(
  value,
) {
  if (!value) return "";

  try {
    const url =
      new URL(value);

    if (
      url.hostname ===
        "youtu.be" ||
      url.hostname.endsWith(
        ".youtu.be",
      )
    ) {
      return url.pathname
        .split("/")
        .filter(Boolean)[0] ||
        "";
    }

    if (
      url.hostname ===
        "youtube.com" ||
      url.hostname.endsWith(
        ".youtube.com",
      )
    ) {
      if (
        url.pathname ===
        "/watch"
      ) {
        return (
          url.searchParams.get(
            "v",
          ) || ""
        );
      }

      const parts =
        url.pathname
          .split("/")
          .filter(Boolean);

      if (
        [
          "shorts",
          "embed",
          "live",
        ].includes(
          parts[0],
        )
      ) {
        return parts[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function getHighlightThumbnail(
  highlight,
  fallback,
) {
  if (
    highlight?.thumbnailUrl
  ) {
    return highlight.thumbnailUrl;
  }

  const youtubeId =
    getYouTubeId(
      highlight?.videoUrl,
    );

  if (youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return fallback;
}

export function getHighlightEmbedUrl(
  highlight,
) {
  const youtubeId =
    getYouTubeId(
      highlight?.videoUrl,
    );

  return youtubeId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
        youtubeId,
      )}?autoplay=1&rel=0`
    : "";
}

export function isDirectVideoUrl(
  value,
) {
  if (!value) return false;

  try {
    const url =
      new URL(value);

    return /\.(mp4|webm|ogg)$/i.test(
      url.pathname,
    );
  } catch {
    return false;
  }
}
