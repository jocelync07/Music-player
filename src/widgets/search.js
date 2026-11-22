import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { DEEZER_ENDPOINTS, LIMITS } from '../config.js';

class SearchWidget extends LitElement {
  static properties = {
    query: { state: true },
    results: { state: true },
    loading: { state: true },
    currentTrackId: { state: true },
    paused: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: 0;
      background: #161618;
      color: #f3f1ea;
      border: 1px solid #ff6b3d;
      border-radius: 12px;
      padding: 14px 16px;
      overflow: hidden;
      font-family: inherit;
    }

    h3 {
      margin: 0 0 10px;
      font-size: 11px;
      color: #75728a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .search-row {
      display: flex;
      gap: 6px;
    }

    input {
      flex: 1;
      min-width: 0;
      background: #0e0e10;
      color: #f3f1ea;
      border: 1px solid #25252a;
      border-radius: 999px;
      padding: 9px 14px;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }

    input:focus {
      border-color: #ff6b3d;
    }

    button.go {
      background: #ff6b3d;
      color: #fff;
      border: none;
      padding: 0 16px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
    }

    button.go:hover {
      background: #ffce5e;
    }

    .list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      margin: 10px -16px 0;
      padding: 0 16px;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      border-bottom: 1px solid #1f1f23;
      cursor: pointer;
    }

    .row:hover {
      background: #1c1c20;
    }

    .row.playing {
      background: #2a1a14;
    }

    .row.playing .title {
      color: #ff6b3d;
    }

    .cover {
      width: 36px;
      height: 36px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .info {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .artist {
      font-size: 11px;
      color: #b9b5a8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .play-btn {
      background: transparent;
      color: #ff6b3d;
      border: 1px solid #ff6b3d;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      font-size: 11px;
      cursor: pointer;
      flex-shrink: 0;
      font-family: inherit;
    }

    .play-btn:hover {
      background: #ff6b3d;
      color: white;
    }

    .empty,
    .loading {
      color: #75728a;
      font-style: italic;
      font-size: 12px;
      text-align: center;
      padding: 16px 0;
    }
  `;

  constructor() {
    super();
    this.query = "";
    this.results = null;
    this.loading = false;
    this.currentTrackId = null;
    this.paused = true;

    this._onChanged = (e) => {
      this.currentTrackId = e.detail.track?.id || null;
      this.paused = e.detail.paused;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("track-changed", this._onChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("track-changed", this._onChanged);
  }

  onInput(e) {
    this.query = e.target.value;
  }

  onKeyDown(e) {
    if (e.key === "Enter") this.search();
  }

  async search() {
    const q = this.query.trim();
    if (!q) return;

    this.loading = true;
    this.results = null;

    try {
      const url = `${DEEZER_ENDPOINTS.SEARCH}&q=${encodeURIComponent(q)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Search request failed');

      const json = await res.json();
      this.results = (json.data || [])
        .filter((t) => t.preview)
        .slice(0, LIMITS.SEARCH);
    } catch (error) {
      console.error("Search widget error:", error);
      this.results = [];
    }

    this.loading = false;
  }

  // Tell EnhancedPlayer to pause
  pauseTrack() {
    window.dispatchEvent(new CustomEvent("toggle-playback"));
  }

  // Always enqueue track for playback
  playTrack(track) {
    const queue = (this.results || []).filter((t) => t.preview);

    window.dispatchEvent(
      new CustomEvent("enqueue-track", {
        detail: {
          track,
          queue,
          queueName: "Search Results",
          playNow: true,
        },
      })
    );
  }

  render() {
    return html`
      <h3>Search</h3>

      <div class="search-row">
        <input
          .value=${this.query}
          @input=${this.onInput}
          @keydown=${this.onKeyDown}
          placeholder="Search tracks, artists, albums…"
        />
        <button class="go" @click=${this.search}>Go</button>
      </div>

      <div class="list">
        ${this.loading ? html`<div class="loading">Searching...</div>` : ""}
        ${!this.loading && this.results === null
          ? html`<div class="empty">Try "Daft Punk"</div>`
          : ""}
        ${!this.loading && this.results?.length === 0
          ? html`<div class="empty">No results.</div>`
          : ""}
        ${(this.results || []).map((track) => {
          const playing = this.currentTrackId === track.id && !this.paused;

          return html`
            <div
              class="row ${playing ? "playing" : ""}"
              @click=${() => this.playTrack(track)}
            >
              <img class="cover" src=${track.album.cover_medium} />
              <div class="info">
                <div class="title">${track.title}</div>
                <div class="artist">${track.artist.name}</div>
              </div>

              <button
                class="play-btn"
                @click=${(e) => {
                  e.stopPropagation();
                  if (this.currentTrackId === track.id) {
                    this.pauseTrack();
                  } else {
                    this.playTrack(track);
                  }
                }}
              >
                ${playing ? "❚❚" : "▶"}
              </button>
            </div>
          `;
        })}
      </div>
    `;
  }
}

customElements.define("search-widget", SearchWidget);
