const roles = [
  {
    title: "Calciatori",
    description:
      "Crea il tuo profilo, mostra le tue caratteristiche e fai vedere il tuo calcio.",
  },
  {
    title: "Scout",
    description:
      "Cerca e analizza nuovi talenti attraverso un database organizzato e filtrabile.",
  },
  {
    title: "Agenti",
    description:
      "Scopri prospetti interessanti e costruisci le tue shortlist.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="navbar">
        <div className="logo">
          NEASIDERA<span>SCOUTING</span>
        </div>

        <div className="nav-actions">
          <a href="#come-funziona">Come funziona</a>
          <a href="#accesso" className="login-button">
            Accedi
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="badge">SCOUTING • PLAYERS • OPPORTUNITIES</div>

          <h1>
            Scopri il prossimo
            <span> talento.</span>
          </h1>

          <p>
            La piattaforma che connette calciatori, scout e agenti
            attraverso un database dedicato alla scoperta dei nuovi
            talenti del calcio.
          </p>

          <div className="hero-buttons">
            <a href="#cerca" className="primary-button">
              Trova giocatori →
            </a>

            <a href="#profilo" className="secondary-button">
              Crea il tuo profilo
            </a>
          </div>
        </div>
      </section>

      <section className="roles" id="come-funziona">
        <div className="section-heading">
          <span>UNA PIATTAFORMA</span>
          <h2>Costruita per il calcio.</h2>
        </div>

        <div className="role-grid">
          {roles.map((role) => (
            <article className="role-card" key={role.title}>
              <div className="card-number">
                0{roles.indexOf(role) + 1}
              </div>

              <h3>{role.title}</h3>

              <p>{role.description}</p>

              <div className="card-arrow">↗</div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" id="accesso">
        <span>NEASIDERA SCOUTING</span>
        <h2>Il prossimo talento<br />potrebbe essere qui.</h2>
        <a href="#registrazione" className="primary-button">
          Inizia ora →
        </a>
      </section>

      <footer>
        <div>NEASIDERA SCOUTING</div>
        <div>© 2026 NeaSidera Scouting</div>
      </footer>
    </main>
  );
}
