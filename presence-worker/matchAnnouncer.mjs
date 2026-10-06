function cleanText(value, fallback = "") {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function finiteScore(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function safeUrl(value) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  try {
    const url = new URL(text);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function matchIdOf(match) {
  return cleanText(match?.matchId || match?.id);
}

function scoreOf(match) {
  return {
    own: finiteScore(match?.ownTeam?.score),
    opponent: finiteScore(match?.opponent?.score),
  };
}

function scoreText(match) {
  const score = scoreOf(match);

  if (score.own === null || score.opponent === null) {
    return "Рахунок оновлюється";
  }

  return `${score.own} : ${score.opponent}`;
}

function resultText(match) {
  const result = cleanText(match?.result).toLowerCase();

  if (result === "win") {
    return "Перемога ISTe";
  }

  if (result === "loss") {
    return "Поразка ISTe";
  }

  if (result === "draw") {
    return "Нічия";
  }

  const score = scoreOf(match);

  if (score.own !== null && score.opponent !== null) {
    if (score.own > score.opponent) {
      return "Перемога ISTe";
    }

    if (score.own < score.opponent) {
      return "Поразка ISTe";
    }

    return "Нічия";
  }

  return "Матч завершено";
}

function resultColor(match) {
  const result = cleanText(match?.result).toLowerCase();

  if (result === "win") {
    return 0x2f9e44;
  }

  if (result === "loss") {
    return 0xe30613;
  }

  return 0xf2c94c;
}

function matchLinks(match, siteUrl) {
  const links = [];

  const faceitUrl = safeUrl(match?.faceitUrl);

  if (faceitUrl) {
    links.push({
      type: 2,
      style: 5,
      label: "FACEIT",
      url: faceitUrl,
    });
  }

  const streamUrl =
    safeUrl(match?.streamUrl) ||
    safeUrl(match?.broadcastUrl) ||
    safeUrl(match?.twitchUrl);

  if (streamUrl) {
    links.push({
      type: 2,
      style: 5,
      label: "Трансляція",
      url: streamUrl,
    });
  }

  const website = safeUrl(siteUrl);

  if (website) {
    links.push({
      type: 2,
      style: 5,
      label: "istesport.com",
      url: website,
    });
  }

  return links.length
    ? [
        {
          type: 1,
          components: links.slice(0, 5),
        },
      ]
    : [];
}

function matchEmbed(match, mode) {
  const id = matchIdOf(match);
  const opponent = cleanText(match?.opponent?.name, "Opponent");
  const competition = cleanText(
    match?.competitionName,
    "ISTe Match",
  );
  const bestOf = finiteScore(match?.bestOf);
  const finished = mode === "finished";

  const fields = [
    {
      name: "Суперник",
      value: opponent,
      inline: true,
    },
    {
      name: "Рахунок",
      value: scoreText(match),
      inline: true,
    },
    {
      name: "Турнір",
      value: competition,
      inline: false,
    },
  ];

  if (bestOf !== null && bestOf > 0) {
    fields.splice(2, 0, {
      name: "Формат",
      value: `BO${bestOf}`,
      inline: true,
    });
  }

  if (finished) {
    fields.push({
      name: "Результат",
      value: resultText(match),
      inline: false,
    });
  }

  const embed = {
    title: finished ? "🏁 Матч завершено" : "🔴 ISTe LIVE",
    description: `**ISTe  ${scoreText(match)}  ${opponent}**`,
    color: finished ? resultColor(match) : 0xe30613,
    fields,
    footer: {
      text: `Match ID: ${id}`,
    },
    timestamp:
      (finished
        ? match?.finishedAt
        : match?.startedAt) ||
      new Date().toISOString(),
  };

  const opponentAvatar = safeUrl(match?.opponent?.avatar);

  if (opponentAvatar) {
    embed.thumbnail = {
      url: opponentAvatar,
    };
  }

  return embed;
}

function stateSnapshot(match) {
  const score = scoreOf(match);

  return {
    status: cleanText(match?.status).toLowerCase(),
    ownScore: score.own,
    opponentScore: score.opponent,
    result: cleanText(match?.result).toLowerCase(),
  };
}

function scoreChanged(previous, next) {
  return (
    previous?.ownScore !== next?.ownScore ||
    previous?.opponentScore !== next?.opponentScore
  );
}

export function createMatchAnnouncer({
  client,
  channelId,
  internalGuildId,
  siteUrl,
  log = () => {},
}) {
  const normalizedChannelId = cleanText(channelId);
  const normalizedGuildId = cleanText(internalGuildId);

  let initialized = false;
  let lastError = null;
  let lastEventAt = null;
  let eventsSent = 0;

  const previousById = new Map();
  const liveMessages = new Map();

  async function resolveChannel() {
    if (!normalizedChannelId) {
      return null;
    }

    const channel =
      client.channels.cache.get(normalizedChannelId) ||
      (await client.channels.fetch(normalizedChannelId).catch(() => null));

    if (!channel || typeof channel.send !== "function") {
      throw new Error("Configured match announcement channel is unavailable");
    }

    if (
      normalizedGuildId &&
      channel.guildId &&
      channel.guildId !== normalizedGuildId
    ) {
      throw new Error(
        "Configured match announcement channel is outside the ISTe Discord server",
      );
    }

    return channel;
  }

  async function findExistingMessage(channel, matchId) {
    const knownId = liveMessages.get(matchId);

    if (knownId) {
      const known = await channel.messages
        .fetch(knownId)
        .catch(() => null);

      if (known) {
        return known;
      }

      liveMessages.delete(matchId);
    }

    if (!channel.messages?.fetch || !client.user?.id) {
      return null;
    }

    const recent = await channel.messages
      .fetch({
        limit: 35,
      })
      .catch(() => null);

    if (!recent) {
      return null;
    }

    const footer = `Match ID: ${matchId}`;

    const existing =
      recent.find(
        (message) =>
          message.author?.id === client.user.id &&
          message.embeds?.some(
            (embed) =>
              embed.footer?.text === footer,
          ),
      ) || null;

    if (existing) {
      liveMessages.set(matchId, existing.id);
    }

    return existing;
  }

  function messagePayload(match, mode) {
    return {
      embeds: [matchEmbed(match, mode)],
      components: matchLinks(match, siteUrl),
      allowedMentions: {
        parse: [],
      },
    };
  }

  async function upsertLive(match, reason) {
    const matchId = matchIdOf(match);

    if (!matchId) {
      return;
    }

    const channel = await resolveChannel();

    if (!channel) {
      return;
    }

    const existing =
      await findExistingMessage(
        channel,
        matchId,
      );

    const payload =
      messagePayload(
        match,
        "live",
      );

    let message = existing;

    if (existing) {
      await existing.edit(payload);
    } else {
      message =
        await channel.send(payload);
    }

    liveMessages.set(
      matchId,
      message.id,
    );

    lastError = null;
    lastEventAt =
      new Date().toISOString();
    eventsSent += 1;

    log("match_announcement_live", {
      matchId,
      channelId:
        normalizedChannelId,
      reason,
      messageId:
        message.id,
      score:
        scoreText(match),
    });
  }

  async function finishMatch(match) {
    const matchId = matchIdOf(match);

    if (!matchId) {
      return;
    }

    const channel = await resolveChannel();

    if (!channel) {
      return;
    }

    const existing =
      await findExistingMessage(
        channel,
        matchId,
      );

    const payload =
      messagePayload(
        match,
        "finished",
      );

    let message = existing;

    if (existing) {
      await existing.edit(payload);
    } else {
      message =
        await channel.send(payload);
    }

    liveMessages.delete(matchId);

    lastError = null;
    lastEventAt =
      new Date().toISOString();
    eventsSent += 1;

    log("match_announcement_finished", {
      matchId,
      channelId:
        normalizedChannelId,
      messageId:
        message.id,
      score:
        scoreText(match),
      result:
        cleanText(match?.result) ||
        null,
    });
  }

  async function sync(payload) {
    if (!normalizedChannelId) {
      return;
    }

    const matches =
      Array.isArray(
        payload?.teamMatches,
      )
        ? payload.teamMatches
        : [];

    const currentById =
      new Map();

    for (const match of matches) {
      const id =
        matchIdOf(match);

      if (!id) {
        continue;
      }

      currentById.set(
        id,
        match,
      );
    }

    try {
      if (!initialized) {
        for (const [
          id,
          match,
        ] of currentById) {
          previousById.set(
            id,
            stateSnapshot(match),
          );

          if (
            cleanText(
              match?.status,
            ).toLowerCase() ===
            "ongoing"
          ) {
            await upsertLive(
              match,
              "startup",
            );
          }
        }

        initialized = true;

        log(
          "match_announcer_ready",
          {
            channelId:
              normalizedChannelId,
            trackedMatches:
              previousById.size,
          },
        );

        return;
      }

      for (const [
        id,
        match,
      ] of currentById) {
        const next =
          stateSnapshot(match);
        const previous =
          previousById.get(id);

        if (
          next.status ===
          "ongoing"
        ) {
          if (
            !previous ||
            previous.status !==
              "ongoing"
          ) {
            await upsertLive(
              match,
              "started",
            );
          } else if (
            scoreChanged(
              previous,
              next,
            )
          ) {
            await upsertLive(
              match,
              "score",
            );
          }
        }

        if (
          next.status ===
            "finished" &&
          previous?.status ===
            "ongoing"
        ) {
          await finishMatch(
            match,
          );
        }

        previousById.set(
          id,
          next,
        );
      }

      for (const id of previousById.keys()) {
        if (
          !currentById.has(id)
        ) {
          previousById.delete(
            id,
          );
        }
      }

      while (
        previousById.size > 150
      ) {
        const oldest =
          previousById.keys()
            .next().value;

        previousById.delete(
          oldest,
        );
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : String(error);

      log(
        "match_announcer_failed",
        {
          channelId:
            normalizedChannelId,
          message:
            lastError,
        },
      );
    }
  }

  function health() {
    return {
      enabled:
        Boolean(
          normalizedChannelId,
        ),
      channelId:
        normalizedChannelId ||
        null,
      initialized,
      trackedMatches:
        previousById.size,
      trackedLiveMessages:
        liveMessages.size,
      eventsSent,
      lastEventAt,
      lastError,
    };
  }

  return {
    sync,
    health,
  };
}
