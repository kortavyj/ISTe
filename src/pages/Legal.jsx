import { Link } from "react-router-dom";

export function Privacy() {
  return (
    <section className="page">
      <div className="page-content">
        <p className="page-eyebrow">PRIVACY</p>
        <h1 className="page-title">Политика конфиденциальности</h1>
        <p className="page-description">
          На текущей версии сайта нет регистрации, личного кабинета и форм сбора персональных данных. При добавлении таких функций правила будут обновлены.
        </p>
        <Link className="page-link" to="/">
          НА ГЛАВНУЮ
        </Link>
      </div>
    </section>
  );
}

export function Terms() {
  return (
    <section className="page">
      <div className="page-content">
        <p className="page-eyebrow">TERMS</p>
        <h1 className="page-title">Условия использования</h1>
        <p className="page-description">
          Материалы сайта используются для представления команды ISTe. Логотипы, фотографии и названия сторонних сервисов принадлежат их владельцам.
        </p>
        <Link className="page-link" to="/">
          НА ГЛАВНУЮ
        </Link>
      </div>
    </section>
  );
}
