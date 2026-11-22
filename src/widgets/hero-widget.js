import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { DEEZER_ENDPOINTS } from '../config.js';

// Hero widget showing the #1 track from deezer
class HeroWidget extends LitElement {
  static properties = {
    track: { state: true },
    queue: { state: true },
    loading: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      background: linear-gradient(135deg, #1a1a1f, #221814);
      border-radius: 12px;
      border: 1px solid #ff6b3d;
      overflow: hidden;
      color: white;
      position: relative;
      min-height: 180px;
    }

    .hero {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      position: relative;
      z-index: 1;
    }

    .cover {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .info {
      flex: 1;
      min-width: 0;
    }

    .label {
      font-size: 12px;
      color: #b9b5a8;
      margin-bottom: 6px;
    }

    h2 {
      margin: 0 0 6px 0;
      font-size: 24px;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .artist {
      font-size: 14px;
      color: #d0d0d0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cta {
      margin-left: auto;
      background: #ff6b3d;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
      font-family: inherit;
    }

    .cta:hover {
      background: #ffce5e;
    }

    .cta:disabled {
      background: #3a3a3f;
      color: #75728a;
      cursor: not-allowed;
    }

    .loading {
      padding: 24px;
      text-align: center;
      color: #75728a;
      font-style: italic;
      font-size: 14px;
    }

    .error {
      padding: 24px;
      text-align: center;
      color: #ff6b3d;
      font-size: 14px;
    }
  `;

  constructor() {
    super();
    this.track = null;
    this.queue = [];
    this.loading = true;

    this.currentTrackId = null;
    this.paused = true;

    this._onChanged = (e) => {
      this.currentTrackId = e.detail.track?.id || null;
      this.paused = e.detail.paused;
      this.requestUpdate();
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("track-changed", this._onChanged);
    this.fetchTrack();
  }

  async fetchTrack() {
    this.loading = true;
    try {
      const response = await fetch(DEEZER_ENDPOINTS.CHART);
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const tracks = (data?.data || []).filter((t) => t.preview).slice(0, 10);
      this.track = tracks[0] || null;
      this.queue = tracks;
    } catch (error) {
      console.error("Hero widget error:", error);
      this.track = null;
    } finally {
      this.loading = false;
    }
  }

  // Send #1 track to player
  play(e) {
    if (e) e.stopPropagation();
    if (!this.track) return;

    window.dispatchEvent(
      new CustomEvent("enqueue-track", {
        detail: {
          track: this.track,
          queue: this.queue,
          playNow: true,
          queueName: "Top 10 Tracks",
        },
      })
    );
  }

  //Pause current track playing
  pauseOrResume() {
    window.dispatchEvent(new CustomEvent("toggle-playback"));
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading today's top track...</div>`;
    }

    if (!this.track) {
      return html`<div class="error">Failed to load chart data</div>`;
    }

    return html`
      <div class="hero">
        <img
          class="cover"
          src="${this.track.album.cover_medium}"
          alt="${this.track.album.title}"
        />
        <div class="info">
          <div class="label">Today's Pulse · #1</div>
          <h2>${this.track.title}</h2>
          <div class="artist">
            ${this.track.artist.name} — ${this.track.album.title}
          </div>
        </div>
        <button
          class="cta"
          @click=${(e) => {
            e.stopPropagation();
            if (this.track?.id === this.currentTrackId) {
              this.pauseOrResume();
            } else {
              this.play(e);
            }
          }}
          ?disabled=${!this.track}
        >
          ${this.track?.id === this.currentTrackId && !this.paused
            ? "❚❚ Pause"
            : "▶ Play now"}
        </button>
      </div>
    `;
  }
}

customElements.define("hero-widget", HeroWidget);
