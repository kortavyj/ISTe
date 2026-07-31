import "./Media.css";

const highlights = [
  {
    title: "ISTe vs RIVALS, Best Moments",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Clutch 1v4 by KORTAVYJ",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Team Highlights, FACEIT CUP",
    image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Media() {
  return (
    <section className="section media-section" id="media">
      <header className="section-header">
        <p className="section-tag">MEDIA</p>
        <h2 className="section-title">ХАЙЛАЙТЫ И МЕДИА</h2>
      </header>

      <div className="media-grid">
        {highlights.map((item) => (
          <article className="media-card" key={item.title}>
            <img src={item.image} alt="" loading="lazy" />

            <div className="media-overlay">
              <span className="media-play" aria-hidden="true">
                ▶
              </span>
              <h3>{item.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
