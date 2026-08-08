import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Shop.css";

const copy = {
  uk: {
    drop: "DROP 001 // CORE",
    collection: "ISTe Wear",
    loading: "Завантажуємо колекцію...",
    error: "Не вдалося завантажити колекцію.",
    retry: "ПОВТОРИТИ",
    empty: "Колекція ще не відкрита.",
    size: "Розмір",
    priceSoon: "Ціна скоро",
    preorder: "ПЕРЕДЗАМОВИТИ",
    soldout: "НЕДОСТУПНО",
    owner: "КЕРУВАННЯ МАГАЗИНОМ",
    modalTitle: "Передзамовлення",
    modalText:
      "Оплата зараз не потрібна. Ми збережемо заявку та зв'яжемося перед запуском виробництва.",
    name: "Ім'я",
    email: "Email",
    quantity: "Кількість",
    consent:
      "Я погоджуюся на обробку контактних даних для цієї заявки.",
    privacy: "Політика конфіденційності",
    send: "НАДІСЛАТИ ЗАЯВКУ",
    sending: "НАДСИЛАЄМО...",
    success: "Заявку прийнято",
    reference: "Номер заявки",
    successText:
      "Гроші не списувалися. Це заявка на перший дроп ISTe Wear.",
    close: "ЗАКРИТИ",
  },
  ru: {
    drop: "DROP 001 // CORE",
    collection: "ISTe Wear",
    loading: "Загружаем коллекцию...",
    error: "Не удалось загрузить коллекцию.",
    retry: "ПОВТОРИТЬ",
    empty: "Коллекция ещё не открыта.",
    size: "Размер",
    priceSoon: "Цена скоро",
    preorder: "ПРЕДЗАКАЗ",
    soldout: "НЕДОСТУПНО",
    owner: "УПРАВЛЕНИЕ МАГАЗИНОМ",
    modalTitle: "Предзаказ",
    modalText:
      "Оплата сейчас не требуется. Мы сохраним заявку и свяжемся перед запуском производства.",
    name: "Имя",
    email: "Email",
    quantity: "Количество",
    consent:
      "Я согласен на обработку контактных данных для этой заявки.",
    privacy: "Политика конфиденциальности",
    send: "ОТПРАВИТЬ ЗАЯВКУ",
    sending: "ОТПРАВЛЯЕМ...",
    success: "Заявка принята",
    reference: "Номер заявки",
    successText:
      "Деньги не списывались. Это заявка на первый дроп ISTe Wear.",
    close: "ЗАКРЫТЬ",
  },
  en: {
    drop: "DROP 001 // CORE",
    collection: "ISTe Wear",
    loading: "Loading collection...",
    error: "Could not load the collection.",
    retry: "RETRY",
    empty: "The collection is not open yet.",
    size: "Size",
    priceSoon: "Price coming soon",
    preorder: "PREORDER",
    soldout: "UNAVAILABLE",
    owner: "MANAGE STORE",
    modalTitle: "Preorder",
    modalText:
      "No payment is required now. We will save the request and contact you before production starts.",
    name: "Name",
    email: "Email",
    quantity: "Quantity",
    consent:
      "I agree to the processing of my contact details for this request.",
    privacy: "Privacy policy",
    send: "SEND REQUEST",
    sending: "SENDING...",
    success: "Request accepted",
    reference: "Request number",
    successText:
      "No money was charged. This is a request for the first ISTe Wear drop.",
    close: "CLOSE",
  },
};

const localProductImages = {
  "iste-core-tee": "/shop/iste-core-tee.png",
  "iste-core-hoodie": "/shop/iste-core-hoodie.png",
  "iste-pro-jersey": "/shop/iste-pro-jersey.png",
};

function resolveProductImage(product) {
  return (
    product.imageUrl ||
    localProductImages[product.slug] ||
    ""
  );
}

function formatPrice(value, language) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const locale =
    language === "uk"
      ? "uk-UA"
      : language === "en"
        ? "en-US"
        : "ru-RU";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value);
}

function PreorderModal({
  product,
  initialSize,
  language,
  labels,
  onClose,
}) {
  const firstInputRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [size, setSize] = useState(
    initialSize ||
      product.sizes?.[0] ||
      "",
  );
  const [quantity, setQuantity] =
    useState(1);
  const [consent, setConsent] =
    useState(false);
  const [website, setWebsite] =
    useState("");
  const [startedAt] = useState(() =>
    Date.now(),
  );
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] =
    useState("");

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusTimer =
      window.setTimeout(() => {
        firstInputRef.current?.focus();
      }, 60);

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow =
        previousOverflow;
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || reference) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/shop?action=preorder",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
            name,
            email,
            size,
            quantity,
            consent,
            locale: language,
            website,
            startedAt,
          }),
        },
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "Сервер вернул некорректный ответ.",
        );
      }

      if (
        !response.ok ||
        result?.ok !== true
      ) {
        throw new Error(
          result?.message ||
            "Не удалось отправить заявку.",
        );
      }

      setReference(
        result.reference ||
          "ISTE-WEAR",
      );
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Не удалось отправить заявку.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="wear-modal-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="wear-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wear-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          className="wear-modal__close"
          type="button"
          aria-label={labels.close}
          onClick={onClose}
        >
          ×
        </button>

        <div className="wear-modal__head">
          <p>{product.collection}</p>
          <h2 id="wear-modal-title">
            {labels.modalTitle}
          </h2>
          <strong>{product.name}</strong>
          <span>{labels.modalText}</span>
        </div>

        {reference ? (
          <div
            className="wear-success"
            role="status"
          >
            <span className="wear-success__icon">
              ✓
            </span>
            <h3>{labels.success}</h3>
            <p>{labels.successText}</p>
            <div className="wear-success__reference">
              <small>
                {labels.reference}
              </small>
              <strong>{reference}</strong>
            </div>
            <button
              type="button"
              onClick={onClose}
            >
              {labels.close}
            </button>
          </div>
        ) : (
          <form
            className="wear-form"
            onSubmit={handleSubmit}
          >
            <label>
              <span>{labels.name}</span>
              <input
                ref={firstInputRef}
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              <span>{labels.email}</span>
              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <fieldset className="wear-modal-sizes">
              <legend>
                {labels.size}
              </legend>
              <div>
                {(product.sizes || []).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        size === item
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setSize(item)
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </fieldset>

            <label className="wear-quantity">
              <span>
                {labels.quantity}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        Math.max(
                          1,
                          value - 1,
                        ),
                    )
                  }
                >
                  −
                </button>
                <strong>
                  {quantity}
                </strong>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        Math.min(
                          3,
                          value + 1,
                        ),
                    )
                  }
                >
                  +
                </button>
              </div>
            </label>

            <label className="wear-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) =>
                  setConsent(
                    event.target.checked,
                  )
                }
                required
              />
              <span>
                {labels.consent}{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noreferrer"
                >
                  {labels.privacy}
                </Link>
              </span>
            </label>

            <label
              className="wear-honeypot"
              aria-hidden="true"
            >
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) =>
                  setWebsite(
                    event.target.value,
                  )
                }
              />
            </label>

            {error ? (
              <div
                className="wear-form__error"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <button
              className="wear-form__submit"
              type="submit"
              disabled={
                submitting ||
                !size ||
                !consent
              }
            >
              {submitting
                ? labels.sending
                : labels.send}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default function Shop() {
  const { language } = useLanguage();
  const { role } = useAuth();
  const labels =
    copy[language] || copy.ru;

  const [products, setProducts] =
    useState([]);
  const [selectedSizes, setSelectedSizes] =
    useState({});
  const [selectedProduct, setSelectedProduct] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/shop?action=products",
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.ok !== true
      ) {
        throw new Error(
          result?.message ||
            labels.error,
        );
      }

      const nextProducts =
        Array.isArray(result.products)
          ? result.products
          : [];

      setProducts(nextProducts);

      setSelectedSizes((current) => {
        const next = { ...current };

        nextProducts.forEach(
          (product) => {
            if (
              !next[product.id] &&
              product.sizes?.length
            ) {
              next[product.id] =
                product.sizes[0];
            }
          },
        );

        return next;
      });
    } catch (loadError) {
      setError(
        loadError?.message ||
          labels.error,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedProducts =
    useMemo(() => {
      const rank = {
        "iste-core-tee": 1,
        "iste-core-hoodie": 2,
        "iste-pro-jersey": 3,
      };

      return [...products].sort(
        (a, b) =>
          (rank[a.slug] ?? 99) -
          (rank[b.slug] ?? 99),
      );
    }, [products]);

  return (
    <section className="wear-page">
      <div
        className="wear-page__glow"
        aria-hidden="true"
      />

      <header className="wear-catalog-head">
        <div>
          <span>
            {labels.collection}
          </span>
          <strong>
            {labels.drop}
          </strong>
        </div>

        {role === "owner" ? (
          <Link
            className="wear-owner-link"
            to="/owner/shop"
          >
            {labels.owner}
          </Link>
        ) : null}
      </header>

      {loading ? (
        <div className="wear-state">
          <span className="wear-loader" />
          <p>{labels.loading}</p>
        </div>
      ) : error ? (
        <div className="wear-state wear-state--error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() =>
              void loadProducts()
            }
          >
            {labels.retry}
          </button>
        </div>
      ) : orderedProducts.length ===
        0 ? (
        <div className="wear-state">
          <p>{labels.empty}</p>
        </div>
      ) : (
        <div className="wear-catalog-grid">
          {orderedProducts.map(
            (product) => {
              const image =
                resolveProductImage(
                  product,
                );
              const size =
                selectedSizes[
                  product.id
                ] ||
                product.sizes?.[0] ||
                "";
              const price =
                formatPrice(
                  product.priceUah,
                  language,
                );
              const unavailable =
                product.status ===
                "soldout";

              return (
                <article
                  className="wear-card"
                  key={product.id}
                >
                  <div className="wear-card__visual">
                    <div className="wear-card__halo" />
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="wear-card__fallback">
                        ISTe
                      </div>
                    )}
                  </div>

                  <div className="wear-card__body">
                    <div className="wear-card__topline">
                      <p>
                        {product.collection}
                      </p>
                      <span>
                        {price ||
                          labels.priceSoon}
                      </span>
                    </div>

                    <h2>
                      {product.name}
                    </h2>

                    <div className="wear-card__sizes">
                      <span>
                        {labels.size}
                      </span>
                      <div>
                        {(product.sizes ||
                          []).map(
                          (item) => (
                            <button
                              key={item}
                              type="button"
                              className={
                                size ===
                                item
                                  ? "is-active"
                                  : ""
                              }
                              disabled={
                                unavailable
                              }
                              onClick={() =>
                                setSelectedSizes(
                                  (
                                    current,
                                  ) => ({
                                    ...current,
                                    [
                                      product.id
                                    ]:
                                      item,
                                  }),
                                )
                              }
                            >
                              {item}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <button
                      className="wear-card__preorder"
                      type="button"
                      disabled={
                        unavailable ||
                        !size
                      }
                      onClick={() =>
                        setSelectedProduct(
                          {
                            product,
                            size,
                          },
                        )
                      }
                    >
                      {unavailable
                        ? labels.soldout
                        : labels.preorder}
                    </button>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      <footer className="wear-signature">
        <span>ISTe WEAR</span>
        <strong>
          ONE TEAM. ONE GOAL.
        </strong>
      </footer>

      {selectedProduct ? (
        <PreorderModal
          product={
            selectedProduct.product
          }
          initialSize={
            selectedProduct.size
          }
          language={language}
          labels={labels}
          onClose={() =>
            setSelectedProduct(null)
          }
        />
      ) : null}
    </section>
  );
}
