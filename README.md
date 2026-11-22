# Deployment URL

Deployed website URL here:

```text
https://comp2110-grp102.netlify.app/
```

---

## Setup & Development

The project uses Lit via CDN — no build step required.

### 1. Local Development

This project uses Netlify's `_redirects` to proxy Deezer API requests and bypass CORS.
VS Code Live Server cannot handle proxy redirects, so use `netlify dev` instead:

```bash
npx netlify-cli link --name comp2110-grp102
npx netlify-cli dev
```

Opens at `http://localhost:8888` with full API support.
Save your changes and refresh the browser (`F5`) to see updates.

### 2. Deployment

1. Login to [Netlify](https://www.netlify.com/)
2. Go to the site's **Deploys** tab
3. Drag-drop the project folder to deploy
4. The `_redirects` file handles the Deezer API proxy automatically

### Workflow Summary

1. Edit code in VS Code
2. Preview locally at `localhost:8888` via `npx netlify-cli dev`
3. `git push` to save changes to GitHub
4. Drag-drop the project folder to Netlify when ready to update the live site


# Music Widget System

## Project Overview

This project is a web-based music player application built using JavaScript web components with the Lit framework and the Deezer API.

The application allows users to:

- View and play trending tracks from dezeer
- Play worldwide trending tracks
- Search songs and artists
- Browse mood-based music
- Play music previews
- Like songs
- View recently played tracks
- Control playback using a custom player

The project follows a modular widget-based architecture where components communicate using browser custom events.

---

# API Information

## API Used

This project uses the Deezer API.

API Website without proxy:

```text
https://developers.deezer.com/api
```

### CORS Solution

Initially we used a third-party CORS proxy to bypass browser restrictions:

```text
https://corsproxy.io/?https://api.deezer.com/chart/0/tracks
```

This was unreliable and returned 403 errors after deployment via Netlify, so we switched to a Netlify `_redirects` file to proxy the requests server-side:

```text
/deezer-api/* https://api.deezer.com/:splat 200!
```

This means all frontend requests to `/deezer-api/chart/0/tracks` are proxied to `https://api.deezer.com/chart/0/tracks` without any CORS issues.

### Deezer API Features Used

| Feature       | Purpose                                         |
| ------------- | ----------------------------------------------- |
| Chart API     | Fetch worldwide top tracks                      |
| Search API    | Search songs and artists                        |
| Playlist API  | Load playlist tracks and selected widget tracks |
| Track Preview | Play 30-second audio previews                   |

---

## API Integration

The Deezer API is integrated into multiple widgets throughout the project.

### Hero Widget

- Fetches top played tracks using the Deezer chart API
- Displays the #1 trending song

### Top Tracks Widget

- Displays top chart tracks from Deezer
- Allows users to play chart songs
- Display tracks queue for hero widget

### Search Widget

- Uses Deezer search API
- Searches tracks, artists, and albums
- Select and play tracks

### Mood Widget

- Uses Deezer search queries based on selected moods
- Dynamically generates mood-based playlists
- Users select mood and play mapped songs
- Render random songs to get more selection of songs

### Player Widget

- Main audio preview widget
- Play top worldwide song
- Handles return button to get back to original queue
- Handles queue management and playback controls
- Play selected queue from different widget

---

# Implementation Responsibilities

Replace the names below with your actual group members.

| Team Member | Responsibilities                               |
| ----------- | ---------------------------------------------- |
| Jocelyn     | Hero Widget, Top Tracks Widget                 |
| Ellenear    | Search Widget, Api Integration, History Widget |
| Anna        | Enhanced Player and playback controls          |
| Vivianna    | Mood Widget                                    |

---

# Widget Architecture

The application uses an event-driven architecture.

Widgets communicate using:

```js
window.dispatchEvent();
window.addEventListener();
```

This allows widgets to remain modular and reusable.

---

# Widgets

## 1. Hero Widget (`hero-widget.js`)

### Purpose

Displays the #1 trending track.

### Features

- Fetches chart data from Deezer
- Displays featured track
- Sends queue data to player

### Main Functions

```js
_fetchChart();
_play();
render();
```

---

## 2. Top Tracks Widget (`top-tracks.js`)

### Purpose

Displays the Top 10 tracks from Deezer charts.

### Features

- Receives chart data
- Highlights active track
- Allows playback of chart songs

### Main Functions

```js
_fetch();
_click();
render();
```

---

## 3. Mood Widget (`mood-widget-edited.js`)

### Purpose

Displays tracks based on moods.

### Supported Moods

- Happy
- Sad
- Chill
- Energetic
- Heartbreak

### Features

- Dynamic mood search button
- Expandable song list
- Queue generation

### Main Functions

```js
setMood();
fetchMoodTracks();
playTrack();
```

---

## 4. Search Widget (`search.js`)

### Purpose

Allows users to search for songs and artists.

### Features

- Search input
- Enter key support
- Search results playback

### Main Functions

```js
_search();
_playTrack();
render();
```

---

## 5. Enhanced Player (`player.js`)

### Purpose

Controls music playback.

### Features

- Play/Pause
- Next/Previous controls
- Queue management
- Like system
- Keyboard shortcuts

### Keyboard Controls

| Key         | Action         |
| ----------- | -------------- |
| Space       | Play/Pause     |
| Left Arrow  | Previous Track |
| Right Arrow | Next Track     |

### Main Functions

```js
play();
toggle();
next();
prev();
toggleLike();
```

### Player Event System

### 1. `enqueue-track` (Widgets → Player)

The only way widgets send tracks to the player. The player listens for this on the window.

```js
// Widget sends:
window.dispatchEvent(
  new CustomEvent("enqueue-track", {
    detail: {
      track: this.track, // the song to play
      queue: this.queue, // full list of songs
      playNow: true, // start immediately
      queueName: "Top 10 Tracks",
    },
  })
);

// Player receives:
this.onEnqueue = (e) => {
  const track = e.detail?.track;
  const queue = e.detail?.queue;
  this.queueName = e.detail?.queueName || "Custom Queue";
  // ...sets queue, resets audio, plays track
};
```

---

### 2. `track-changed` (Player → Widgets)

Fires on every play and pause. Tells widgets which track is active and whether it's paused. Used by Top Tracks to highlight the playing row.

```js
// Player sends:
broadcast() {
    window.dispatchEvent(new CustomEvent('track-changed', {
        detail: {
            index: this.index,
            paused: this.paused,
            track: this.track
        }
    }));
}

// Top Tracks listens:
this.onChanged = (e) => {
    const id = e.detail.track?.id;
    const idx = id && this.data
        ? this.data.findIndex(t => t.id === id)
        : -1;
    this.current = idx;
    this.paused = e.detail.paused;
};
```

---

### 3. `track-played` (Player → Widgets)

Fires when a track starts playing. Includes a timestamp so other widgets like listening history can log what was played.

```js
// Player sends:
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
```

---

### 4. `track-liked` (Player → Widgets)

Fires when a user likes or unlikes a track. Other widgets can update their UI accordingly.

```js
// Player sends:
window.dispatchEvent(
  new CustomEvent("track-liked", {
    detail: { trackId, liked: this.liked },
  })
);
```

---

### Summary

| Event           | Direction        | Used By                                |
| --------------- | ---------------- | -------------------------------------- |
| `enqueue-track` | Widgets → Player | Hero, Top Tracks, any widget with play |
| `track-changed` | Player → Widgets | Top Tracks (highlight playing row)     |
| `track-played`  | Player → Widgets | Listening history                      |
| `track-liked`   | Player → Widgets | Favourites, any widget showing likes   |

---

## 6. History Widget (`history-widget.js`)

### Purpose

Stores recent and liked songs.

### Features

- localStorage support
- Recently played list
- Liked songs list

### Main Functions

```js
_pick();
_clear();
_readJson();
_writeJson();
```

---

# Event Communication Flow

```text
Widget Click
    ↓
enqueue-track
    ↓
Enhanced Player
    ↓
track-changed
    ↓
Widgets Update UI
```

---


# Future Improvements

Possible future upgrades:

- Volume controls
- Playlist creation
- Shuffle and repeat
- Full song playback
- Mobile responsive design
- User accounts
- Spotify integration

---
