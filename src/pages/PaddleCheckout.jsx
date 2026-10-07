import { useEffect, useMemo, useState } from "react";

import "../styles/PaddleCheckout.css";

const PADDLE_SCRIPT_ID = "iste-paddle-js";
const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";

function loadPaddleScript() {
  if (window.Paddle) {
    return Promise.resolve(window.Paddle);
  }

  const existing = document.getElementById(PADDLE_SCRIPT_ID);

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.Paddle), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("PADDLE_SCRIPT_FAILED")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = PADDLE_SCRIPT_ID;
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Paddle);
    script.onerror = () => reject(new Error("PADDLE_SCRIPT_FAILED"));
    document.head.appendChild(script);
  });
}

export default function PaddleCheckout() {
  const [status, setStatus] = useState("loading");

  const transactionId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const value = String(params.get("_ptxn") || "").trim();

    return /^txn_[a-z\d]{26}$/i.test(value) ? value : "";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function openCheckout() {
      const token = String(import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "").trim();
      const environment = String(
        import.meta.env.VITE_PADDLE_ENVIRONMENT || "live",
      )
        .trim()
        .toLowerCase();

      if (!token || !transactionId) {
        setStatus("unavailable");
        return;
      }

      try {
        const Paddle = await loadPaddleScript();

        if (cancelled || !Paddle) return;

        if (environment === "sandbox") {
          Paddle.Environment.set("sandbox");
        }

        Paddle.Initialize({
          token,
          eventCallback(event) {
            if (event?.name === "checkout.completed" && !cancelled) {
              setStatus("completed");
            }
          },
        });

        Paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            theme: "dark",
            locale: "en",
            allowLogout: false,
          },
        });

        if (!cancelled) {
          setStatus("open");
        }
      } catch (error) {
        console.error("Paddle checkout failed", error);

        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    openCheckout();

    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  const title =
    status === "completed"
      ? "Payment received"
      : status === "unavailable"
        ? "Checkout is not configured"
        : status === "error"
          ? "Checkout could not be opened"
          : "Secure ISTe Bot checkout";

  const text =
    status === "completed"
      ? "Paddle is confirming the transaction. ISTe Bot will activate your subscription automatically."
      : status === "unavailable"
        ? "The Paddle client token or transaction is missing. Return to Discord and create a new subscription order."
        : status === "error"
          ? "Return to Discord and open the payment button again. If the problem persists, contact ISTe support."
          : "The Paddle payment window should open automatically. Do not close this page until payment is complete.";

  return (
    <section className="paddle-checkout-page">
      <div className="paddle-checkout-card">
        <div className="paddle-checkout-kicker">ISTe Bot • Paddle</div>
        <h1>{title}</h1>
        <p>{text}</p>

        {transactionId ? (
          <div className="paddle-checkout-transaction">
            Transaction
            <code>{transactionId}</code>
          </div>
        ) : null}

        <a className="paddle-checkout-back" href="/discord">
          Return to ISTe Bot
        </a>
      </div>
    </section>
  );
}
