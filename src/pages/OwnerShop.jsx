import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import "./OwnerShop.css";

const EMPTY_PRODUCT = {
  id: "",
  slug: "",
  name: "",
  collection: "DROP 001 // CORE",
  shortDescription: "",
  description: "",
  priceUah: "",
  status: "draft",
  imageUrl: "",
  visualVariant: "tee",
  sizesText: "S, M, L, XL, XXL",
  sortOrder: 0,
};

function mapProductToForm(product) {
  return {
    id: product.id || "",
    slug: product.slug || "",
    name: product.name || "",
    collection: product.collection || "DROP 001 // CORE",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    priceUah: Number.isFinite(product.priceUah) ? String(product.priceUah) : "",
    status: product.status || "draft",
    imageUrl: product.imageUrl || "",
    visualVariant: product.visualVariant || "tee",
    sizesText: Array.isArray(product.sizes) ? product.sizes.join(", ") : "S, M, L, XL, XXL",
    sortOrder: Number.isFinite(product.sortOrder) ? product.sortOrder : 0,
  };
}

function parseSizes(value) {
  return [...new Set(
    String(value || "")
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean),
  )];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function apiRequest(action, options = {}) {
  const method = options.method || "GET";
  const requestOptions = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  };

  if (options.body) {
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`/api/shop?action=${encodeURIComponent(action)}`, requestOptions);

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Сервер вернул некорректный ответ.");
  }

  if (!response.ok || result?.ok !== true) {
    const error = new Error(result?.message || "Не удалось выполнить запрос.");
    error.code = result?.error || "REQUEST_FAILED";
    throw error;
  }

  return result;
}

function ProductStatus({ status }) {
  const labels = {
    draft: "Черновик",
    live: "На сайте",
    soldout: "Недоступно",
    hidden: "Скрыт",
  };

  return (
    <span className={`owner-shop-status owner-shop-status--${status}`}>
      {labels[status] || status}
    </span>
  );
}

export default function OwnerShop() {
  const [products, setProducts] = useState([]);
  const [preorders, setPreorders] = useState([]);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const liveCount = useMemo(
    () => products.filter((item) => item.status === "live").length,
    [products],
  );

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [productsResult, preordersResult] = await Promise.all([
        apiRequest("owner-products"),
        apiRequest("owner-preorders"),
      ]);

      setProducts(Array.isArray(productsResult.products) ? productsResult.products : []);
      setPreorders(Array.isArray(preordersResult.preorders) ? preordersResult.preorders : []);
    } catch (loadError) {
      setError(loadError?.message || "Не удалось загрузить магазин.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function editProduct(product) {
    setForm(mapProductToForm(product));
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function createProduct() {
    setForm(EMPTY_PRODUCT);
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await apiRequest("owner-save-product", {
        method: "POST",
        body: {
          id: form.id || undefined,
          slug: form.slug,
          name: form.name,
          collection: form.collection,
          shortDescription: form.shortDescription,
          description: form.description,
          priceUah: form.priceUah,
          status: form.status,
          imageUrl: form.imageUrl,
          visualVariant: form.visualVariant,
          sizes: parseSizes(form.sizesText),
          sortOrder: Number(form.sortOrder),
        },
      });

      const saved = result.product;
      setProducts((current) => {
        const exists = current.some((item) => item.id === saved.id);
        const next = exists
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [...current, saved];

        return next.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      });

      setForm(mapProductToForm(saved));
      setSuccess("Товар сохранён. Изменения уже готовы для публичного магазина.");
    } catch (saveError) {
      setError(saveError?.message || "Не удалось сохранить товар.");
    } finally {
      setSaving(false);
    }
  }

  function exportPreorders() {
    if (preorders.length === 0) return;

    const escapeCell = (value) => {
      const source = String(value ?? "").replace(/"/g, '""');
      return `"${source}"`;
    };

    const lines = [
      ["Дата", "Товар", "Имя", "Email", "Размер", "Количество", "Язык", "ID"],
      ...preorders.map((item) => [
        item.createdAt,
        item.productName,
        item.name,
        item.email,
        item.size,
        item.quantity,
        item.locale,
        item.id,
      ]),
    ].map((row) => row.map(escapeCell).join(","));

    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `iste-wear-preorders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="owner-shop-page">
      <header className="owner-shop-hero">
        <div>
          <p>OWNER // ISTe WEAR</p>
          <h1>Управление магазином</h1>
          <span>
            Товары и заявки проходят через серверный API. Сервисный ключ Supabase не попадает в браузер.
          </span>
        </div>

        <div className="owner-shop-hero__actions">
          <Link to="/shop">ОТКРЫТЬ МАГАЗИН</Link>
          <button type="button" onClick={createProduct}>НОВЫЙ ТОВАР</button>
        </div>
      </header>

      <div className="owner-shop-metrics">
        <article>
          <span>Товаров</span>
          <strong>{products.length}</strong>
        </article>
        <article>
          <span>На сайте</span>
          <strong>{liveCount}</strong>
        </article>
        <article>
          <span>Заявок</span>
          <strong>{preorders.length}</strong>
        </article>
      </div>

      {error ? <div className="owner-shop-alert owner-shop-alert--error">{error}</div> : null}
      {success ? <div className="owner-shop-alert owner-shop-alert--success">{success}</div> : null}

      <div className="owner-shop-layout">
        <form className="owner-shop-editor" onSubmit={saveProduct}>
          <div className="owner-shop-section-title">
            <p>{form.id ? "РЕДАКТИРОВАНИЕ" : "НОВЫЙ ТОВАР"}</p>
            <h2>{form.name || "ISTe Wear item"}</h2>
          </div>

          <div className="owner-shop-grid">
            <label>
              <span>Название</span>
              <input
                value={form.name}
                maxLength={100}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>URL slug</span>
              <input
                value={form.slug}
                maxLength={80}
                placeholder="iste-core-hoodie"
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>Коллекция</span>
              <input
                value={form.collection}
                maxLength={100}
                onChange={(event) => setForm((current) => ({ ...current, collection: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>Цена, грн</span>
              <input
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={form.priceUah}
                placeholder="Оставь пустым, если цена ещё не определена"
                onChange={(event) => setForm((current) => ({ ...current, priceUah: event.target.value }))}
              />
            </label>

            <label>
              <span>Статус</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="draft">Черновик</option>
                <option value="live">На сайте</option>
                <option value="soldout">Недоступно</option>
                <option value="hidden">Скрыт</option>
              </select>
            </label>

            <label>
              <span>Визуальный тип</span>
              <select
                value={form.visualVariant}
                onChange={(event) => setForm((current) => ({ ...current, visualVariant: event.target.value }))}
              >
                <option value="tee">Футболка</option>
                <option value="hoodie">Худи</option>
                <option value="jersey">Джерси</option>
              </select>
            </label>

            <label>
              <span>Размеры через запятую</span>
              <input
                value={form.sizesText}
                onChange={(event) => setForm((current) => ({ ...current, sizesText: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>Порядок</span>
              <input
                type="number"
                min="-1000"
                max="1000"
                step="1"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                required
              />
            </label>
          </div>

          <label>
            <span>Короткое описание</span>
            <textarea
              rows="3"
              maxLength={220}
              value={form.shortDescription}
              onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
            />
          </label>

          <label>
            <span>Полное описание</span>
            <textarea
              rows="6"
              maxLength={3000}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label>
            <span>URL изображения, необязательно</span>
            <input
              type="text"
              maxLength={1000}
              value={form.imageUrl}
              placeholder="/shop/hoodie.webp или https://..."
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
            />
          </label>

          <button className="owner-shop-save" type="submit" disabled={saving}>
            {saving ? "СОХРАНЯЕМ..." : "СОХРАНИТЬ ТОВАР"}
          </button>
        </form>

        <aside className="owner-shop-products">
          <div className="owner-shop-section-title">
            <p>КАТАЛОГ</p>
            <h2>Товары</h2>
          </div>

          {loading ? (
            <p className="owner-shop-muted">Загрузка...</p>
          ) : products.length === 0 ? (
            <p className="owner-shop-muted">Товаров пока нет.</p>
          ) : (
            <div className="owner-shop-product-list">
              {products.map((product) => (
                <button key={product.id} type="button" onClick={() => editProduct(product)}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.collection}</span>
                  </div>
                  <ProductStatus status={product.status} />
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section className="owner-shop-preorders">
        <div className="owner-shop-preorders__head">
          <div className="owner-shop-section-title">
            <p>PREORDERS</p>
            <h2>Заявки</h2>
          </div>
          <button type="button" onClick={exportPreorders} disabled={preorders.length === 0}>
            ЭКСПОРТ CSV
          </button>
        </div>

        <div className="owner-shop-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Товар</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Размер</th>
                <th>Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {preorders.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.productName}</td>
                  <td>{item.name}</td>
                  <td><a href={`mailto:${item.email}`}>{item.email}</a></td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}

              {!loading && preorders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="owner-shop-empty-cell">Заявок пока нет.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
