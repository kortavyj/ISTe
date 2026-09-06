import { useMemo, useState } from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { askSupportAi } from "../lib/supportApi.js";
import { getLocalizedFaq } from "../../shared/supportFaq.js";

import "./Support.css";

const COPY = {
  uk: {
    title: "Центр підтримки ISTe",
    intro:
      "Знайди відповідь у базі знань або запитай AI-помічника ISTe.",
    faqTitle: "Популярні питання",
    searchPlaceholder: "Пошук по FAQ...",
    aiTitle: "ISTe AI Support",
    aiText:
      "AI знає базу ISTe, пам’ятає контекст розмови та може відповідати на загальні питання.",
    inputPlaceholder: "Опиши питання або проблему...",
    ask: "Запитати",
    asking: "Відповідаю...",
    human: "Потрібна людина?",
    humanText:
      "Якщо AI не вирішив питання, звернися до технічної підтримки в Discord.",
    openDiscord: "Відкрити Discord",
    empty: "За цим запитом нічого не знайдено.",
    error: "Не вдалося звернутися до підтримки. Спробуй ще раз.",
    you: "Ви",
    assistant: "ISTe AI",
  },
  ru: {
    title: "Центр поддержки ISTe",
    intro:
      "Найди ответ в базе знаний или задай вопрос AI-помощнику ISTe.",
    faqTitle: "Популярные вопросы",
    searchPlaceholder: "Поиск по FAQ...",
    aiTitle: "ISTe AI Support",
    aiText:
      "AI знает базу ISTe, помнит контекст разговора и может отвечать на общие вопросы.",
    inputPlaceholder: "Опиши вопрос или проблему...",
    ask: "Спросить",
    asking: "Отвечаю...",
    human: "Нужен человек?",
    humanText:
      "Если AI не решил вопрос, обратись в техническую поддержку в Discord.",
    openDiscord: "Открыть Discord",
    empty: "По этому запросу ничего не найдено.",
    error: "Не удалось обратиться в поддержку. Попробуй ещё раз.",
    you: "Вы",
    assistant: "ISTe AI",
  },
  en: {
    title: "ISTe Support Center",
    intro:
      "Find an answer in the knowledge base or ask the ISTe AI assistant.",
    faqTitle: "Popular questions",
    searchPlaceholder: "Search FAQ...",
    aiTitle: "ISTe AI Support",
    aiText:
      "AI knows the ISTe knowledge base, remembers conversation context and can answer general questions.",
    inputPlaceholder: "Describe your question or problem...",
    ask: "Ask",
    asking: "Thinking...",
    human: "Need a human?",
    humanText:
      "If AI did not solve the issue, contact ISTe technical support on Discord.",
    openDiscord: "Open Discord",
    empty: "No FAQ entries match this search.",
    error: "Could not contact support. Please try again.",
    you: "You",
    assistant: "ISTe AI",
  },
};

export default function Support() {
  const { language } = useLanguage();
  const locale = ["uk", "ru", "en"].includes(language)
    ? language
    : "uk";
  const c = COPY[locale];
  const faq = useMemo(() => getLocalizedFaq(locale), [locale]);

  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredFaq = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return faq;

    return faq.filter((item) =>
      [item.question, item.answer, item.category]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [faq, search]);

  async function handleAsk(event) {
    event.preventDefault();

    const text = question.trim();
    if (text.length < 2 || loading) return;

    setQuestion("");
    setMessages((current) => [
      ...current,
      { role: "user", text },
    ]);
    setLoading(true);

    try {
      const history = messages
        .slice(-8)
        .filter((message) =>
          message.role === "user" || message.role === "assistant"
        )
        .map((message) => ({
          role: message.role,
          text: message.text,
        }));

      const result = await askSupportAi(
        text,
        locale,
        history,
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.answer,
          source: result.source,
          needsHuman: result.needsHuman === true,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error instanceof Error && error.message
              ? error.message
              : c.error,
          needsHuman: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="support-page">
      <div className="support-shell">
        <header className="support-header">
          <div>
            <h1>{c.title}</h1>
            <p>{c.intro}</p>
          </div>
          <span className="support-status">
            <i aria-hidden="true" />
            AI online
          </span>
        </header>

        <div className="support-layout">
          <section className="support-faq" aria-labelledby="support-faq-title">
            <div className="support-section-head">
              <h2 id="support-faq-title">{c.faqTitle}</h2>
              <span>{filteredFaq.length}</span>
            </div>

            <label className="support-search">
              <span aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={c.searchPlaceholder}
              />
            </label>

            <div className="support-faq-list">
              {filteredFaq.map((item) => (
                <details key={item.id} className="support-faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}

              {!filteredFaq.length ? (
                <p className="support-empty">{c.empty}</p>
              ) : null}
            </div>
          </section>

          <section className="support-ai" aria-labelledby="support-ai-title">
            <div className="support-ai-head">
              <div>
                <h2 id="support-ai-title">{c.aiTitle}</h2>
                <p>{c.aiText}</p>
              </div>
              <span>ISTe</span>
            </div>

            <div className="support-chat" aria-live="polite">
              {!messages.length ? (
                <div className="support-chat-empty">
                  <strong>{c.aiTitle}</strong>
                  <p>{c.aiText}</p>
                </div>
              ) : null}

              {messages.map((message, index) => (
                <article
                  className={`support-message support-message-${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <strong>
                    {message.role === "user" ? c.you : c.assistant}
                  </strong>
                  <p>{message.text}</p>
                </article>
              ))}

              {loading ? (
                <article className="support-message support-message-assistant">
                  <strong>{c.assistant}</strong>
                  <p>{c.asking}</p>
                </article>
              ) : null}
            </div>

            <form className="support-composer" onSubmit={handleAsk}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={c.inputPlaceholder}
                maxLength={1200}
                rows={3}
              />
              <div>
                <small>{question.length}/1200</small>
                <button type="submit" disabled={loading || question.trim().length < 2}>
                  {loading ? c.asking : c.ask}
                </button>
              </div>
            </form>

            <aside className="support-human">
              <div>
                <strong>{c.human}</strong>
                <p>{c.humanText}</p>
              </div>
              <a
                href="https://discord.gg/AzpCxEgxye"
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.openDiscord}
              </a>
            </aside>
          </section>
        </div>
      </div>
    </section>
  );
}
