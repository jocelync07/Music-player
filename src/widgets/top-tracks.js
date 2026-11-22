import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { DEEZER_ENDPOINTS } from '../config.js';

/**
 * Widget displaying Deezer top tracks
 */
class TopTracks extends LitElement {
  static properties = {
    limit: { type: Number },
    data: { state: true },
    current: { state: true },
    paused: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
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
      margin: 0 0 4px;
      font-size: 11px;
      color: #75728a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .meta {
      font-size: 10px;
      color: #75728a;
      margin-bottom: 6px;
    }

    .list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      margin: 0 -16px;
      padding: 0 16px;
    }

    .track {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      border-bottom: 1px solid #1f1f23;
      cursor: pointer;
    }

    .track:hover {
      background: #1c1c20;
    }

    .track.playing {
      background: #2a1a14;
      color: #ff6b3d;
    }

    .rank {
      width: 20px;
      font-weight: bold;
      text-align: center;
      font-size: 11px;
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
      font-weight: 600;
      font-size: 13px;
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
      background: #ff6b3d;
      color: #fff;
      border: none;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 11px;
      flex-shrink: 0;
      font-family: inherit;
    }

    .play-btn:hover {
      background: #ffce5e;
    }

    .loading {
      color: #75728a;
      font-size: 12px;
      font-style: italic;
    }
  `;

  constructor() {
    super();
    this.limit = 10;
    this.current = -1;
    this.paused = true;
    this.data = null;

    this.onChanged = (e) => {
      const id = e.detail.track?.id;
      const idx =
        id && this.data ? this.data.findIndex((t) => t.id === id) : -1;
      this.current = idx;
      this.paused = e.detail.paused;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("track-changed", this.onChanged);
    this.fetchTracks();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("track-changed", this.onChanged);
  }

  // Fetch chart tracks from Deezer
  async fetchTracks() {
    try {
      const response = await fetch(DEEZER_ENDPOINTS.CHART);
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      this.data = (data?.data || []).filter((t) => t.preview);
    } catch (error) {
      console.error("Failed to fetch chart tracks:", error);
      this.data = [];
    }
  }

  // Send selected top track to player
  click(track) {
    window.dispatchEvent(
      new CustomEvent("enqueue-track", {
        detail: {
          track,
          queue: this.data,
          queueName: "Top 10 Tracks",
          playNow: true,
        },
      })
    );
  }

  //Pause current track from the widget
  pauseOrResume() {
    window.dispatchEvent(new CustomEvent("toggle-playback"));
  }

  // Render top tracks list
  render() {
    if (!this.data) {
      return html`
        <h3>Top Tracks</h3>
        <div class="loading">Loading…</div>
      `;
    }

    const tracks = this.data;
    const displayLimit = Math.max(1, Math.min(this.limit, tracks.length));

    return html`
      <h3>Top ${displayLimit} Tracks</h3>
      <div class="meta">Source: Deezer Charts</div>
      <div class="list">
        ${tracks.slice(0, displayLimit).map((track, index) => {
          const playing = index === this.current && !this.paused;
          return html`
            <div
              class="track ${playing ? "playing" : ""}"
              @click=${() => this.click(track)}
            >
              <div class="rank">${index + 1}</div>
              <img
                class="cover"
                src=${track.album.cover_medium}
                alt="${track.album.title}"
              />
              <div class="info">
                <div class="title">${track.title}</div>
                <div class="artist">${track.artist.name}</div>
              </div>
              <button
                class="play-btn"
                @click=${(e) => {
                  e.stopPropagation();
                  if (index === this.current) {
                    this.pauseOrResume();
                  } else {
                    this.click(track);
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

customElements.define("top-tracks", TopTracks);
