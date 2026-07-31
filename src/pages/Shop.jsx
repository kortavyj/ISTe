import { Link } from "react-router-dom";

export default function Shop() {
  return (
    <section className="page">
      <div className="page-content">
        <p className="page-eyebrow">ISTE STORE</p>
        <h1 className="page-title">Магазин ISTe</h1>
        <p className="page-description">
          Раздел готовится к запуску. Здесь появятся форма команды, мерч и новые коллекции клуба.
        </p>
        <Link className="page-link" to="/">
          НА ГЛАВНУЮ
        </Link>
      </div>
    </section>
  );
}
