import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page">
      <div className="page-content">
        <p className="page-eyebrow">404</p>
        <h1 className="page-title">Страница не найдена</h1>
        <p className="page-description">
          Такой страницы на сайте нет. Вернитесь на главную и продолжите просмотр сайта.
        </p>
        <Link className="page-link" to="/">
          НА ГЛАВНУЮ
        </Link>
      </div>
    </section>
  );
}
