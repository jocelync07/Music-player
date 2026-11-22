import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

import './src/widgets/search.js';
import './src/widgets/player.js';
import './src/widgets/top-tracks.js';
import './src/widgets/mood-widget.js';
import './src/widgets/history-widget.js';
import './src/widgets/ad-widget.js';
import './src/widgets/hero-widget.js';

const style = document.createElement('style');
style.textContent = `
  html, body {
    margin: 0;
    padding: 0;
    background: #0e0e10;
  }
`;
document.head.appendChild(style);


class PulseDashboard extends LitElement {

  static styles = css`
    :host {
      display: flex;           
      flex-direction: column;
      display: block;
      width: 100vw;
      min-height: 100vh;
      background: #0e0e10;
      color: #f3f1ea;
      font-family: Helvetica, Arial, sans-serif;
    }

    /* HEADER */
    .header {
      display: flex;
      align-items: center;
      padding: 14px 28px;
      border-bottom: 1px solid #ff6b3d;
      position: sticky;
      top: 0;
      background: #0e0e10;
      z-index: 100;
    }

    .logo {
      font-weight: 700;
      font-size: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .accent {
      color: #ff6b3d;
    }

    /* HERO SECTION */
    .hero-section {
      margin: 24px 28px 16px;
    }

    /* GRID */
    main {
      margin: 0px 28px 30px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: 320px 380px;
      gap: 16px;
      width: auto;
      overflow-x: hidden;
      box-sizing: border-box;
    }
      
    @media (max-width: 1100px) {
      main {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 700px) {
      main {
        grid-template-columns: 1fr;
      }
    }

    .cell {
      display: flex;
      min-width: 0;
    }

    footer {
      margin-top: auto;
      border-top: 1px solid #ff6b3d;
      padding: 18px 28px;
      font-size: 11px;
      color: #75728a;
      display: flex;
      justify-content: space-between;
    }
  `;

  render() {
    return html`
      <!-- HEADER -->
      <header class="header">
        <div class="logo">
          <img src="src/pulselogo.png">
          <span>Pulse<span class="accent">.</span></span>
        </div>
      </header>

      <!-- HERO WIDGET -->
      <section class="hero-section">
        <hero-widget></hero-widget>
      </section>

      <!-- DASHBOARD GRID -->
      <main>
        <div class="cell"><search-widget></search-widget></div>
        <div class="cell"><enhanced-player playlist-id="3155776842"></enhanced-player></div>
        <div class="cell"><top-tracks limit="10"></top-tracks></div>
        <div class="cell"><mood-widget></mood-widget></div>
        <div class="cell"><history-widget></history-widget></div>
        <div class="cell"><ad-widget></ad-widget></div>
      </main>

      <!-- FOOTER -->
      <footer>
        <div>Pulse — COMP2110 J.C, E.T, A.N, V.A (2026)</div>
        <div>Built with Lit</div>
      </footer>
    `;
  }
}

customElements.define('pulse-dashboard', PulseDashboard);
