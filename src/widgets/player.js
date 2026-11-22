import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { DEEZER_ENDPOINTS } from '../config.js';

/**
 * Main music player widget
 * Play Top worldwide hits
 */
class EnhancedPlayer extends LitElement {
  static properties = {
    playlistId: { type: String, attribute: "playlist-id" },
    track: { state: true },
    index: { state: true },
    paused: { state: true },
    currentTime: { state: true },
    duration: { state: true },
    liked: { state: true },
    queueName: { state: true },
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
      margin: 0 0 8px;
      font-size: 11px;
      color: #75728a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .badge {
      display: inline-block;
      background: #2a1a14;
      color: #ff6b3d;
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 6px;
      letter-spacing: 0.5px;
    }

    .stage {
      position: relative;
      display: flex;
      gap: 12px;
      align-items: center;
      min-height: 80px;
    }

    .cover {
      width: 72px;
      height: 72px;
      border-radius: 4px;
      background: #0e0e10;
      object-fit: cover;
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    }

    .info {
      flex: 1;
      min-width: 0;
      position: relative;
      z-index: 1;
    }

    .title {
      font-weight: bold;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .artist {
      font-size: 12px;
      color: #b9b5a8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .like-btn {
      position: relative;
      z-index: 1;
      background: transparent;
      border: 1px solid #ff6b3d;
      color: #ff6b3d;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      flex-shrink: 0;
      font-family: inherit;
    }

    .like-btn.on {
      background: #ff6b3d;
      color: #fff;
      border-color: #ff6b3d;
    }

    .progress {
      margin-top: 10px;
      height: 4px;
      background: #25252a;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #ff6b3d;
      transition: width 0.2s linear;
    }

    .times {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #75728a;
      margin-top: 4px;
    }

    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    .up-next {
      margin-top: 6px;
      font-size: 10px;
      color: #75728a;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .up-next strong {
      color: #b9b5a8;
      font-weight: 600;
    }

    .btn {
      background: #ff6b3d;
      color: #fff;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
    }

    .btn.big {
      width: 42px;
      height: 42px;
      font-size: 15px;
    }

    .btn:hover {
      background: #ffce5e;
    }

    .back-btn {
      margin-top: 8px;
      background: transparent;
      border: 1px solid #25252a;
      color: #75728a;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      cursor: pointer;
      font-family: inherit;
      text-align: center;
    }

    .back-btn:hover {
      border-color: #ff6b3d;
      color: #ff6b3d;
    }

    .empty {
      color: #75728a;
      font-style: italic;
      padding: 20px 0;
      text-align: center;
      font-size: 12px;
    }

    .error {
      color: #ff6b3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
  `;

  constructor() {
    super();
    this.playlistId = null;
    this.track = null;
    this.index = -1;
    this.paused = true;
    this.currentTime = 0;
    this.duration = 0;
    this.queue = [];
    this.playlist = [];
    this.playlistName = "";
    this.queueName = "Loading...";
    this.liked = false;
    this.error = null;

    this.setupAudio();
    this.setupEventListeners();
  }

  // Setup audio player events
  setupAudio() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";

    this.audio.addEventListener("play", () => {
      this.paused = false;
      this.broadcast();
      if (this.track) {
        window.dispatchEvent(
          new CustomEvent("track-played", {
            detail: { track: this.track, at: Date.now() },
          })
        );
      }
    });

    this.audio.addEventListener("pause", () => {
      this.paused = true;
      this.broadcast();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration || 0;
    });

    this.audio.addEventListener("ended", () => this.next());
  }

  // Setup queue listeners
  setupEventListeners() {
    this.onEnqueue = (e) => {
      const track = e.detail?.track;
      const queue = e.detail?.queue;
      this.queueName = e.detail?.queueName || "Custom Queue";

      if (!track || !track.preview) return;

      if (Array.isArray(queue) && queue.length) {
        this.queue = queue.filter((t) => t.preview);
      } else if (this.playlist.some((t) => t.id === track.id)) {
        this.queue = [...this.playlist];
      } else {
        this.queue = [track, ...this.queue.filter((t) => t.id !== track.id)];
      }

      const trackIndex = this.queue.findIndex((t) => t.id === track.id);

      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = "";
      this.index = -1;
      this.track = null;

      if (e.detail?.playNow !== false) {
        this.play(trackIndex >= 0 ? trackIndex : 0);
      }
    };

    // Listen for pause/play requests
    window.addEventListener("toggle-playback", () => this.toggle());

    // Setup keyboard listeners
    this.onKey = (e) => {
      if (e.composedPath()[0].tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        this.toggle();
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.prev();
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        this.next();
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("enqueue-track", this.onEnqueue);
    window.addEventListener("keydown", this.onKey);

    if (!this.playlistId) {
      this.error =
        'No playlist-id provided. Usage: <enhanced-player playlist-id="123456"></enhanced-player>';
      this.requestUpdate();
      return;
    }

    this.fetchPlaylist();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.audio.pause();
    window.removeEventListener("enqueue-track", this.onEnqueue);
    window.removeEventListener("keydown", this.onKey);
  }

  // Fetch playlist from Deezer API
  async fetchPlaylist() {
    try {
      const url = `${DEEZER_ENDPOINTS.PLAYLIST}${this.playlistId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const tracks = (data?.tracks?.data || []).filter((t) => t.preview);

      if (tracks.length === 0) {
        throw new Error("No playable tracks found in this playlist");
      }

      this.queue = tracks;
      this.playlist = tracks;
      this.playlistName = data?.title || `Playlist ${this.playlistId}`;
      this.queueName = this.playlistName;
      this.error = null;
    } catch (error) {
      console.error("Failed to fetch playlist:", error);
      this.error = `Failed to load playlist: ${error.message}`;
      this.queue = [];
      this.playlist = [];
    }
  }

  // Notify widgets about current track
  broadcast() {
    window.dispatchEvent(
      new CustomEvent("track-changed", {
        detail: {
          index: this.index,
          paused: this.paused,
          track: this.track,
        },
      })
    );
  }

  // Play selected track
  play(index) {
    if (!this.queue.length) return;
    const target = this.queue[index];
    if (!target) return;

    if (this.track && target.id === this.track.id) {
      this.audio.paused ? this.audio.play() : this.audio.pause();
      return;
    }

    this.index = index;
    this.track = target;
    this.liked = this.isLiked(target.id);
    this.audio.src = target.preview;
    this.audio.play();
    this.broadcast();
  }

  // Play next track
  next() {
    if (!this.queue.length) return;
    this.play((this.index + 1) % this.queue.length);
  }

  // Play previous track
  prev() {
    if (!this.queue.length) return;
    this.play((this.index - 1 + this.queue.length) % this.queue.length);
  }

  peek(offset) {
    if (!this.queue.length) return null;
    const len = this.queue.length;
    const index = (((this.index + offset) % len) + len) % len;
    return this.queue[index] || null;
  }

  // Toggle play and pause
  toggle() {
    if (this.index < 0) {
      this.play(0);
    } else {
      this.audio.paused ? this.audio.play() : this.audio.pause();
    }
  }

  // Return to original playlist
  backToPlaylist() {
    if (!this.playlist.length) return;

    this.queue = [...this.playlist];
    this.queueName = this.playlistName;

    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = "";
    this.index = -1;
    this.track = null;

    this.play(0);
  }

  // Toggle liked song status
  likedSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem("liked-tracks") || "[]"));
    } catch {
      return new Set();
    }
  }

  isLiked(trackId) {
    return this.likedSet().has(trackId);
  }

  toggleLike() {
    if (!this.track) return;

    const likedSet = this.likedSet();
    const trackId = this.track.id;

    likedSet.has(trackId) ? likedSet.delete(trackId) : likedSet.add(trackId);

    localStorage.setItem("liked-tracks", JSON.stringify([...likedSet]));
    this.liked = likedSet.has(trackId);

    window.dispatchEvent(
      new CustomEvent("track-liked", {
        detail: { trackId, liked: this.liked },
      })
    );
  }

  // Format audio time display
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  // Render player UI
  render() {
    if (this.error) {
      return html`
        <h3>Player Error</h3>
        <div class="error">${this.error}</div>
      `;
    }

    if (!this.track) {
      return html`
        <h3>Now Playing <span class="badge">${this.queueName}</span></h3>
        <div class="empty">
          ${this.queue.length ? "Press ▶ to start." : "Loading…"}
        </div>
        ${this.queue.length
          ? html`
              <div class="controls">
                <button class="btn big" @click=${this.toggle}>▶</button>
              </div>
            `
          : ""}
      `;
    }

    const progress = this.duration
      ? (this.currentTime / this.duration) * 100
      : 0;

    return html`
      <h3>Now Playing <span class="badge">${this.queueName}</span></h3>

      <div class="stage">
        <img
          class="cover"
          src=${this.track.album.cover_medium}
          alt=${this.track.album.title}
        />
        <div class="info">
          <div class="title">${this.track.title}</div>
          <div class="artist">${this.track.artist.name}</div>
        </div>
        <button
          class="like-btn ${this.liked ? "on" : ""}"
          @click=${this.toggleLike}
        >
          ${this.liked ? "♥" : "♡"}
        </button>
      </div>

      <div class="progress">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>

      <div class="times">
        <span>${this.formatTime(this.currentTime)}</span>
        <span>${this.formatTime(this.duration)}</span>
      </div>

      <div class="controls">
        <button
          class="btn"
          title="Previous: ${this.peek(-1)?.title || ""}"
          @click=${this.prev}
        >
          ⏮
        </button>
        <button class="btn big" @click=${this.toggle}>
          ${this.paused ? "▶" : "❚❚"}
        </button>
        <button
          class="btn"
          title="Next: ${this.peek(+1)?.title || ""}"
          @click=${this.next}
        >
          ⏭
        </button>
      </div>

      <div class="up-next">
        Up next: <strong>${this.peek(+1)?.title || "—"}</strong>
        ${this.peek(+1) ? html` · ${this.peek(+1).artist.name}` : ""}
      </div>

      ${this.queueName !== this.playlistName && this.playlist.length
        ? html`
            <button class="back-btn" @click=${this.backToPlaylist}>
              ← Back to ${this.playlistName}
            </button>
          `
        : ""}
    `;
  }
}

customElements.define("enhanced-player", EnhancedPlayer);
