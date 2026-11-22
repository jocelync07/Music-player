import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

// <history-widget>
// Tracks recently played + liked songs
// Listens for: track-played, track-liked, track-changed
// Saves history to localStorage (recent + liked)

class HistoryWidget extends LitElement {
  static properties = {
    tab: { state: true },
    recent: { state: true },
    liked: { state: true },
    currentTrackId: { state: true },
    paused: { state: true },
  };

  static MAX = 20;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      background: #161618;
      color: #f3f1ea;
      border: 1px solid #ff6b3d;
      border-radius: 12px;
      padding: 14px 16px;
      overflow: hidden;
      font-family: inherit;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    h3 {
      margin: 0;
      font-size: 11px;
      color: #75728a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      flex: 1;
    }

    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      background: transparent;
      color: #75728a;
      border: none;
      padding: 4px 10px;
      font-size: 11px;
      cursor: pointer;
      border-radius: 4px;
    }
    .tab.on {
      background: #2a1a14;
      color: #ff6b3d;
    }

    .clear {
      background: transparent;
      color: #75728a;
      border: none;
      font-size: 10px;
      cursor: pointer;
      text-decoration: underline;
    }

    .list {
      flex: 1;
      overflow-y: auto;
      margin: 0 -16px;
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
      width: 32px;
      height: 32px;
      border-radius: 3px;
      object-fit: cover;
    }
    .info {
      flex: 1;
      min-width: 0;
    }
    .title {
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta {
      font-size: 10px;
      color: #b9b5a8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ago {
      font-size: 10px;
      color: #75728a;
    }
    .empty {
      color: #75728a;
      font-style: italic;
      font-size: 11px;
      padding: 14px 0;
      text-align: center;
    }
  `;

  constructor() {
    super();
    this.tab = "recent";
    this.recent = this.load("played-tracks");
    this.liked = this.load("liked-detail");
    this.currentTrackId = null;
    this.paused = true;

    this.onPlayed = (e) => {
      const { track, at } = e.detail || {};
      if (!track) return;

      this.recent = [
        { track, at },
        ...this.recent.filter((r) => r.track.id !== track.id),
      ].slice(0, HistoryWidget.MAX);

      this.save("played-tracks", this.recent);
    };

    this.onLiked = (e) => {
      const { trackId, liked } = e.detail || {};
      const found = this.recent.find((r) => r.track.id === trackId);

      if (liked && found) {
        this.liked = [
          found.track,
          ...this.liked.filter((t) => t.id !== trackId),
        ].slice(0, HistoryWidget.MAX);
      } else {
        this.liked = this.liked.filter((t) => t.id !== trackId);
      }

      this.save("liked-detail", this.liked);
    };

    this.onChanged = (e) => {
      this.currentTrackId = e.detail.track?.id || null;
      this.paused = e.detail.paused;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("track-played", this.onPlayed);
    window.addEventListener("track-liked", this.onLiked);
    window.addEventListener("track-changed", this.onChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("track-played", this.onPlayed);
    window.removeEventListener("track-liked", this.onLiked);
    window.removeEventListener("track-changed", this.onChanged);
  }

  load(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  ago(at) {
    if (!at) return "";
    const s = Math.floor((Date.now() - at) / 1000);
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  pick(track) {
    const queue =
      this.tab === "recent" ? this.recent.map((r) => r.track) : this.liked;

    const queueName = this.tab === "recent" ? "Recently Played" : "Liked Songs";

    window.dispatchEvent(
      new CustomEvent("enqueue-track", {
        detail: { track, queue, queueName, playNow: true },
      })
    );
  }

  clear() {
    if (this.tab === "recent") {
      this.recent = [];
      this.save("played-tracks", []);
    } else {
      this.liked = [];
      this.save("liked-detail", []);
    }
  }

  render() {
    const items =
      this.tab === "recent"
        ? this.recent
        : this.liked.map((t) => ({ track: t, at: null }));

    return html`
      <div class="head">
        <h3>History</h3>
        <div class="tabs">
          <button
            class="tab ${this.tab === "recent" ? "on" : ""}"
            @click=${() => (this.tab = "recent")}
          >
            Recent
          </button>
          <button
            class="tab ${this.tab === "liked" ? "on" : ""}"
            @click=${() => (this.tab = "liked")}
          >
            Liked
          </button>
        </div>
        ${items.length
          ? html`<button class="clear" @click=${this.clear}>clear</button>`
          : ""}
      </div>

      <div class="list">
        ${items.length === 0
          ? html`
              <div class="empty">
                ${this.tab === "recent"
                  ? "Nothing played yet."
                  : "No liked tracks yet."}
              </div>
            `
          : ""}
        ${items.map(({ track, at }) => {
          const playing = this.currentTrackId === track.id && !this.paused;

          return html`
            <div
              class="row ${playing ? "playing" : ""}"
              @click=${() => this.pick(track)}
            >
              <img class="cover" src=${track.album.cover_small} />
              <div class="info">
                <div class="title">${track.title}</div>
                <div class="meta">${track.artist.name}</div>
              </div>
              ${at ? html`<div class="ago">${this.ago(at)}</div>` : ""}
            </div>
          `;
        })}
      </div>
    `;
  }
}

customElements.define("history-widget", HistoryWidget);
