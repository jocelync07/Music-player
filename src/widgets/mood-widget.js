import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { DEEZER_ENDPOINTS } from '../config.js';

// Mood music widget with mood-based song search
class MoodMusicWidget extends LitElement {
  static properties = {
    mood: { type: String },
    tracks: { type: Array },
    loading: { type: Boolean },
    expanded: { type: Boolean },
    activeQuery: { type: String },
    currentTrackId: { state: true },
    paused: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .widget {
      background: #161618;
      border: 1px solid #ff6b3d;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      cursor: pointer;
    }

    h2 {
      margin: 0;
      font-size: 16px;
      color: #f3f1ea;
    }

    .mood-label {
      font-size: 11px;
      color: #75728a;
    }

    .moods {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    button {
      background: #222228;
      border: 1px solid #2c2c32;
      color: #f3f1ea;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      cursor: pointer;
    }

    button.active {
      background: #ff6b3d;
      border-color: #ff6b3d;
    }

    .tracks {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      flex: 1;
    }

    .track {
      display: flex;
      gap: 10px;
      background: #1c1c20;
      padding: 8px;
      border-radius: 10px;
      align-items: center;
      cursor: pointer;
      transition: 0.2s;
    }

    .track:hover {
      background: #25252a;
    }

    .track.playing {
      background: #2a1a14;
      border: 1px solid #ff6b3d;
    }

    .track img {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .info {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 13px;
      font-weight: 600;
      color: #f3f1ea;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track.playing .title {
      color: #ff6b3d;
    }

    .artist {
      font-size: 11px;
      color: #75728a;
      margin-top: 2px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }

    .play-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: #ff6b3d;
      color: white;
      cursor: pointer;
      flex-shrink: 0;
    }

    .play-btn:hover {
      background: #ffce5e;
    }

    .loading {
      color: #75728a;
      font-size: 12px;
      padding: 10px;
    }
  `;

  constructor() {
    super();
    this.mood = "chill";
    this.tracks = [];
    this.loading = false;
    this.expanded = false;
    this.activeQuery = "";
    this.currentTrackId = null;
    this.paused = true;
    this.moodMap = {
      happy: ["happy", "feel good", "party", "uplifting", "good vibes"],
      sad: ["sad", "crying", "heartbreak", "emotional"],
      chill: ["lofi", "chill", "ambient", "study music"],
      energetic: ["workout", "edm", "gym", "dance"],
      heartbreak: ["breakup", "alone", "sad love"],
    };

    // Listen for track changes from player
    this._onTrackChanged = (e) => {
      this.currentTrackId = e.detail.track?.id || null;
      this.paused = e.detail.paused;
      this.requestUpdate();
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("track-changed", this._onTrackChanged);
    this.fetchMoodTracks();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("track-changed", this._onTrackChanged);
  }

  // Change current mood and reload tracks
  setMood(mood) {
    this.mood = mood;
    this.fetchMoodTracks();
  }

  // Expand or collapse track list
  toggleExpanded(e) {
    e.stopPropagation();
    this.expanded = !this.expanded;
    this.fetchMoodTracks();
  }

  // Get random search keyword for mood
  randomQuery() {
    const list = this.moodMap[this.mood] || ["music"];
    return list[Math.floor(Math.random() * list.length)];
  }

  async fetchMoodTracks() {
    this.loading = true;
    try {
      const query = `${this.randomQuery()} ${this.randomQuery()}`;
      const url = `${DEEZER_ENDPOINTS.MOOD}?q=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      const tracks = data.data || [];
      const limit = this.expanded ? 20 : 6;
      this.tracks = tracks.filter((t) => t.preview).slice(0, limit);
    } catch (err) {
      console.error("Mood widget error:", err);
      this.tracks = [];
    } finally {
      this.loading = false;
    }
  }

  //Pause current track from the widget
  pauseOrResume() {
    window.dispatchEvent(new CustomEvent("toggle-playback"));
  }

  // Send selected mood track to player
  playTrack(track) {
    let validQueue = this.tracks.filter((t) => t.preview);

    // If clicked track isn't in current queue (stale due to refetch), add it
    const trackInQueue = validQueue.some((t) => t.id === track.id);
    if (!trackInQueue && track.preview) {
      validQueue = [track, ...validQueue];
    }

    window.dispatchEvent(
      new CustomEvent("enqueue-track", {
        detail: {
          track,
          queue: validQueue,
          queueName: `${this.mood} Mood Queue`,
          playNow: true,
        },
      })
    );
  }

  // Render mood buttons
  renderButtons() {
    const moods = [
      ["happy", "Happy"],
      ["sad", "Sad"],
      ["chill", "Chill"],
      ["energetic", "Energetic"],
      ["heartbreak", "Heartbreak"],
    ];

    return moods.map(
      ([value, label]) => html`
        <button
          class=${this.mood === value ? "active" : ""}
          @click=${() => this.setMood(value)}
        >
          ${label}
        </button>
      `
    );
  }

  // Render mood track list
  renderTracks() {
    if (this.loading) {
      return html` <div class="loading">Loading tracks...</div> `;
    }

    return html`
      <div class="tracks">
        ${this.tracks.map((track) => {
          const playing = this.currentTrackId === track.id && !this.paused;
          return html`
            <div
              class="track ${playing ? "playing" : ""}"
              @click=${() => this.playTrack(track)}
            >
              <img src="${track.album.cover_medium}" alt="${track.title}" />

              <div class="info">
                <div class="title">${track.title}</div>
                <div class="artist">${track.artist.name}</div>
              </div>

              <button
                class="play-btn"
                @click=${(e) => {
                  e.stopPropagation();
                  if (this.currentTrackId === track.id) {
                    this.pauseOrResume();
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

  // Render full widget UI
  render() {
    return html`
      <div class="widget">
        <div class="header" @click=${this.toggleExpanded}>
          <div
            style="
              color:#75728a;
              font-size:14px;
              font-weight:bold;
            "
          >
            Mood Music
          </div>
          <div class="mood-label">
            ${this.mood} ${this.expanded ? "+ more" : "click widget for more"}
          </div>
        </div>
        <div class="moods">${this.renderButtons()}</div>
        ${this.renderTracks()}
      </div>
    `;
  }
}

customElements.define("mood-widget", MoodMusicWidget);
