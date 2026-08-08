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
    heroKicker: "ISTe Wear",
    heroTitle: "Одяг із характером команди.",
    heroText:
      "DROP 001 // CORE. Перший одяг ISTe створюється не як сувенірний мерч, а як окрема частина бренду.",
    viewDrop: "ДИВИТИСЯ DROP 001",
    preorderNoPayment: "Попереднє замовлення без оплати",
    protectedApi: "Заявки проходять через захищений API",
    firstDrop: "Перший дроп ISTe Wear",
    collection: "COLLECTION",
    priceSoon: "Ціна скоро",
    choose: "ХОЧУ ПЕРЕДЗАМОВЛЕННЯ",
    soldout: "НЕДОСТУПНО",
    loading: "Завантажуємо DROP 001...",
    errorTitle: "Не вдалося завантажити колекцію",
    errorText: "Спробуй оновити дані магазину.",
    retry: "ПОВТОРИТИ",
    empty: "Колекція ще не відкрита.",
    modalTitle: "Передзамовлення",
    modalSubtitle: "Оплата зараз не потрібна. Ми збережемо заявку та зв'яжемося перед запуском виробництва.",
    name: "Ім'я",
    email: "Email",
    size: "Розмір",
    quantity: "Кількість",
    consent: "Я погоджуюся на обробку контактних даних для цієї заявки.",
    privacy: "Політика конфіденційності",
    submit: "НАДІСЛАТИ ЗАЯВКУ",
    sending: "НАДСИЛАЄМО...",
    success: "Заявку прийнято",
    reference: "Номер заявки",
    successText: "Ми не списували гроші. Це лише заявка на перший дроп ISTe Wear.",
    close: "ЗАКРИТИ",
    admin: "Керування магазином",
    editorialTitle: "Не футболка з логотипом. Повноцінний напрям ISTe.",
    editorialText:
      "Ми запускаємо колекцію через попередній попит: спочатку заявки, потім зразки, перевірка тканини та посадки, і тільки після цього виробництво.",
  },
  ru: {
    heroKicker: "ISTe Wear",
    heroTitle: "Одежда с характером команды.",
    heroText:
      "DROP 001 // CORE. Первая одежда ISTe создаётся не как сувенирный мерч, а как отдельная часть бренда.",
    viewDrop: "СМОТРЕТЬ DROP 001",
    preorderNoPayment: "Предзаказ без оплаты",
    protectedApi: "Заявки проходят через защищённый API",
    firstDrop: "Первый дроп ISTe Wear",
    collection: "COLLECTION",
    priceSoon: "Цена скоро",
    choose: "ХОЧУ ПРЕДЗАКАЗ",
    soldout: "НЕДОСТУПНО",
    loading: "Загружаем DROP 001...",
    errorTitle: "Не удалось загрузить коллекцию",
    errorText: "Попробуй обновить данные магазина.",
    retry: "ПОВТОРИТЬ",
    empty: "Коллекция ещё не открыта.",
    modalTitle: "Предзаказ",
    modalSubtitle: "Оплата сейчас не требуется. Мы сохраним заявку и свяжемся перед запуском производства.",
    name: "Имя",
    email: "Email",
    size: "Размер",
    quantity: "Количество",
    consent: "Я согласен на обработку контактных данных для этой заявки.",
    privacy: "Политика конфиденциальности",
    submit: "ОТПРАВИТЬ ЗАЯВКУ",
    sending: "ОТПРАВЛЯЕМ...",
    success: "Заявка принята",
    reference: "Номер заявки",
    successText: "Мы не списывали деньги. Это только заявка на первый дроп ISTe Wear.",
    close: "ЗАКРЫТЬ",
    admin: "Управление магазином",
    editorialTitle: "Не футболка с логотипом. Полноценное направление ISTe.",
    editorialText:
      "Мы запускаем коллекцию через предварительный спрос: сначала заявки, потом образцы, проверка ткани и посадки, и только после этого производство.",
  },
  en: {
    heroKicker: "ISTe Wear",
    heroTitle: "Clothing with the team's character.",
    heroText:
      "DROP 001 // CORE. The first ISTe clothing line is designed as a real brand extension, not souvenir merch.",
    viewDrop: "VIEW DROP 001",
    preorderNoPayment: "Preorder request with no payment",
    protectedApi: "Requests go through a protected API",
    firstDrop: "First ISTe Wear drop",
    collection: "COLLECTION",
    priceSoon: "Price coming soon",
    choose: "REQUEST PREORDER",
    soldout: "UNAVAILABLE",
    loading: "Loading DROP 001...",
    errorTitle: "Could not load the collection",
    errorText: "Try refreshing the store data.",
    retry: "RETRY",
    empty: "The collection is not open yet.",
    modalTitle: "Preorder request",
    modalSubtitle: "No payment is required now. We will save the request and contact you before production starts.",
    name: "Name",
    email: "Email",
    size: "Size",
    quantity: "Quantity",
    consent: "I agree to the processing of my contact details for this request.",
    privacy: "Privacy policy",
    submit: "SEND REQUEST",
    sending: "SENDING...",
    success: "Request accepted",
    reference: "Request number",
    successText: "No money was charged. This is only a request for the first ISTe Wear drop.",
    close: "CLOSE",
    admin: "Manage store",
    editorialTitle: "Not a logo tee. A real ISTe direction.",
    editorialText:
      "The collection starts with demand first: requests, samples, fabric and fit checks, then production.",
  },
};

function formatPrice(value, language) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const locale = language === "uk"
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

function ProductVisual({ product, index }) {
  if (product.imageUrl) {
    return (
      <img
        className="wear-product-photo"
        src={product.imageUrl}
        alt={product.name}
        loading={index === 0 ? "eager" : "lazy"}
      />
    );
  }

  return (
    <div
      className={`wear-product-art wear-product-art--${product.visualVariant || "tee"}`}
      role="img"
      aria-label={product.name}
    >
      <span className="wear-product-art__halo" />
      <span className="wear-product-art__garment">
        <span className="wear-product-art__mark">ISTe</span>
        <span className="wear-product-art__line" />
      </span>
      <span className="wear-product-art__index">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

function PreorderModal({ product, language, labels, onClose }) {
  const firstInputRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 60);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
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
      const response = await fetch("/api/shop?action=preorder", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
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
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Сервер вернул некорректный ответ.");
      }

      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.message || "Не удалось отправить заявку.");
      }

      setReference(result.reference || "ISTE-WEAR");
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Не удалось отправить заявку. Попробуйте позже.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wear-modal-backdrop" onMouseDown={onClose}>
      <section
        className="wear-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wear-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="wear-modal__close"
          type="button"
          aria-label={labels.close}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="wear-modal__head">
          <p>{product.collection}</p>
          <h2 id="wear-modal-title">{labels.modalTitle}</h2>
          <strong>{product.name}</strong>
          <span>{labels.modalSubtitle}</span>
        </div>

        {reference ? (
          <div className="wear-success" role="status">
            <span className="wear-success__icon">✓</span>
            <h3>{labels.success}</h3>
            <p>{labels.successText}</p>
            <div className="wear-success__reference">
              <small>{labels.reference}</small>
              <strong>{reference}</strong>
            </div>
            <button type="button" onClick={onClose}>
              {labels.close}
            </button>
          </div>
        ) : (
          <form className="wear-form" onSubmit={handleSubmit}>
            <label>
              <span>{labels.name}</span>
              <input
                ref={firstInputRef}
                type="text"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              <span>{labels.email}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <div className="wear-form__row">
              <fieldset className="wear-size-picker">
                <legend>{labels.size}</legend>
                <div>
                  {(product.sizes || []).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={size === item ? "is-active" : ""}
                      onClick={() => setSize(item)}
                      aria-pressed={size === item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="wear-quantity">
                <span>{labels.quantity}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    aria-label="Minus"
                  >
                    −
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.min(3, current + 1))}
                    aria-label="Plus"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>

            <label className="wear-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              <span>
                {labels.consent}{" "}
                <Link to="/privacy" target="_blank" rel="noreferrer">
                  {labels.privacy}
                </Link>
              </span>
            </label>

            <label className="wear-honeypot" aria-hidden="true">
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>

            {error ? (
              <div className="wear-form__error" role="alert">
                {error}
              </div>
            ) : null}

            <button
              className="wear-form__submit"
              type="submit"
              disabled={submitting || !size || !consent}
            >
              {submitting ? labels.sending : labels.submit}
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
  const labels = copy[language] || copy.ru;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const productsRef = useRef(null);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shop?action=products", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(labels.errorText);
      }

      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.message || labels.errorText);
      }

      setProducts(Array.isArray(result.products) ? result.products : []);
    } catch (loadError) {
      setError(loadError?.message || labels.errorText);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
    // Text labels changing do not require a second network request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstCollection = useMemo(
    () => products[0]?.collection || "DROP 001 // CORE",
    [products],
  );

  function scrollToProducts() {
    productsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="wear-page">
      <div className="wear-noise" aria-hidden="true" />
      <div className="wear-hero-glow" aria-hidden="true" />

      <header className="wear-hero">
        <div className="wear-hero__copy">
          <div className="wear-hero__brand">ISTe<span>WEAR</span></div>
          <p className="wear-hero__kicker">{labels.heroKicker}</p>
          <h1>{labels.heroTitle}</h1>
          <p className="wear-hero__text">{labels.heroText}</p>

          <div className="wear-hero__actions">
            <button type="button" onClick={scrollToProducts}>
              {labels.viewDrop}
            </button>

            {role === "owner" ? (
              <Link to="/owner/shop" className="wear-owner-link">
                {labels.admin}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="wear-hero__visual" aria-hidden="true">
          <div className="wear-orbit wear-orbit--one" />
          <div className="wear-orbit wear-orbit--two" />
          <div className="wear-hero__core">
            <span>ISTe</span>
            <small>DROP 001</small>
          </div>
          <div className="wear-hero__serial">CORE / 001 / 2026</div>
        </div>
      </header>

      <div className="wear-trust-strip" aria-label="ISTe Wear">
        <span>{labels.preorderNoPayment}</span>
        <span>{labels.protectedApi}</span>
        <span>{labels.firstDrop}</span>
      </div>

      <section className="wear-editorial">
        <p>{firstCollection}</p>
        <h2>{labels.editorialTitle}</h2>
        <span>{labels.editorialText}</span>
      </section>

      <section className="wear-products" ref={productsRef}>
        <div className="wear-products__head">
          <span>{labels.collection}</span>
          <h2>{firstCollection}</h2>
        </div>

        {loading ? (
          <div className="wear-state">
            <span className="wear-loader" aria-hidden="true" />
            <p>{labels.loading}</p>
          </div>
        ) : error ? (
          <div className="wear-state wear-state--error">
            <h3>{labels.errorTitle}</h3>
            <p>{error}</p>
            <button type="button" onClick={() => void loadProducts()}>
              {labels.retry}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="wear-state">
            <p>{labels.empty}</p>
          </div>
        ) : (
          <div className="wear-product-list">
            {products.map((product, index) => {
              const price = formatPrice(product.priceUah, language);
              const unavailable = product.status === "soldout";

              return (
                <article
                  className={`wear-product${index % 2 === 1 ? " wear-product--reverse" : ""}`}
                  key={product.id}
                >
                  <div className="wear-product__visual">
                    <ProductVisual product={product} index={index} />
                  </div>

                  <div className="wear-product__copy">
                    <p>{product.collection}</p>
                    <h3>{product.name}</h3>
                    <strong>{price || labels.priceSoon}</strong>
                    <span>{product.shortDescription}</span>
                    <p className="wear-product__description">
                      {product.description}
                    </p>

                    <div className="wear-product__sizes" aria-label={labels.size}>
                      {(product.sizes || []).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedProduct(product)}
                    >
                      {unavailable ? labels.soldout : labels.choose}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="wear-footer-note">
        <span>ISTe Wear</span>
        <strong>ONE TEAM. ONE GOAL.</strong>
        <small>DROP 001 // CORE</small>
      </footer>

      {selectedProduct ? (
        <PreorderModal
          product={selectedProduct}
          language={language}
          labels={labels}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </section>
  );
}
