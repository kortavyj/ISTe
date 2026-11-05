import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { isValidAccountId, normalizeAccountId } from "../utils/accountId.js";
import MemberShowcase from "../components/MemberShowcase.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import MemberAwards from "../components/MemberAwards.jsx";
import "./PublicMemberProfile.css";

function readableDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Не вказано";
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function initials(profile) {
  return (profile?.display_name || profile?.username || "ISTe").trim().slice(0, 2).toUpperCase();
}

export default function PublicMemberProfile() {
  const { accountId } = useParams();
  const { profile: currentProfile, role } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      setLoading(true);
      setMember(null);
      setMessage("");
      if (!isValidAccountId(accountId || "")) {
        setMessage("Невірний ID профілю.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ action: "find-user", accountId: normalizeAccountId(accountId) }),
        });
        const data = await response.json();
        if (!response.ok || data?.ok !== true) throw new Error(data?.message || "Не вдалося завантажити профіль.");
        if (!data.profile) {
          setMessage("Профіль не знайдено або він недоступний.");
        } else {
          setMember(data.profile);
        }
      } catch (error) {
        if (error.name !== "AbortError") setMessage(error.message || "Не вдалося завантажити профіль.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [accountId]);

  const isMine = Boolean(member?.account_number && currentProfile?.account_number
    && String(member.account_number) === String(currentProfile.account_number));

  return (
    <main className="public-member-page">
      <div className="public-member-shell">
        <Link to="/users" className="public-member-back">← Повернутися до пошуку</Link>
        {loading ? <div className="public-member-notice" role="status">Завантажуємо профіль…</div> : null}
        {!loading && message ? <div className="public-member-notice" role="alert">{message}</div> : null}
        {member ? (
          <div className="public-member-layout">
            <div className="public-member-primary">
              <section className="public-member-card">
                <div className="public-member-cover" style={member.banner_url
                  ? { backgroundImage: `linear-gradient(0deg,rgba(5,4,7,.55),transparent 65%),url("${member.banner_url}")` }
                  : undefined}>
                  <span className="public-member-cover-brand">ISTe <small>COMMUNITY</small></span>
                </div>
                <div className="public-member-identity">
                  <div className="public-member-avatar" aria-hidden="true">
                    <span>{initials(member)}</span>
                    {member.avatar_url && <img src={member.avatar_url} alt="" referrerPolicy="no-referrer"
                      onError={event => { event.currentTarget.hidden = true; }} />}
                  </div>
                  <div className="public-member-main">
                    <p className="public-member-id">{member.account_id}</p>
                    <div className="public-member-name">
                      <h1>{member.display_name || "Учасник ISTe"}</h1>
                      {member.is_verified === true && <VerifiedBadge size={16} />}
                    </div>
                    <p className="public-member-handle">@{member.username || "без_ніка"}</p>
                    <p className="public-member-bio">{member.bio || "Користувач поки нічого не розповів про себе."}</p>
                    <div className="public-member-meta">Учасник ISTe з {readableDate(member.created_at)}</div>
                  </div>
                  {isMine && <Link className="public-member-edit" to="/account">Редагувати профіль ↗</Link>}
                </div>
              </section>
              <section className="public-member-content">
                <div className="public-member-section-heading">Вітрина та коментарі</div>
                <MemberShowcase key={member.account_number} targetAccountNumber={member.account_number} />
              </section>
            </div>
            <aside className="public-member-aside">
              <MemberAwards accountNumber={member.account_number} canManage={role === "owner"} />
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}
