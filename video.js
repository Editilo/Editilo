"use strict";


/* =========================================================
   CONFIG
========================================================= */

const CFG = {

    controlsWidth: 160,

    maxDuration:
        99 * 3600 +
        59 * 60 +
        59,

    alignmentTolerance:
        0.04,

    dragThreshold:
        7,

    minSubtitleDuration:
        0.1,

    zoomWindows: [
        1800,
        900,
        600,
        300,
        120,
        60,
        30,
        15,
        5,
        2,
        1
    ]

};


/* =========================================================
   STATE
========================================================= */

const state = {

    videos: [],
    audios: [],
    subtitles: [],

    videoSources:
        new Map(),

    audioSources:
        new Map(),

    audioPlayers:
        new Map(),

    thumbnailPromises:
        new Map(),

    waveformPromises:
        new Map(),

    selected:
        null,

    editingSubtitleId:
        null,

    currentTime:
        0,

    duration:
        0,

    zoomIndex:
        0,

    pixelsPerSecond:
        50,

    playing:
        false,

    animationFrame:
        0,

    lastFrame:
        0,

    activeVideoId:
        null,

    videoReady:
        false,

    scrubActive:
        false,

    draggingPlayhead:
        false,

    history:
        [],

    historyIndex:
        -1,

    nextId:
        0,
    exportFormat:
    "webm",

    exportAudioBitrate:
        192,

};


/* =========================================================
   DOM
========================================================= */

const $ =
    id =>
        document.getElementById(id);


const dom = {

    preview:
        $("preview"),

    previewFrame:
        $("previewFrame"),

    emptyState:
        $("emptyState"),

    subtitleLayer:
        $("subtitleLayer"),

    subtitleGuides:
        $("subtitleGuides"),

    timelinePanel:
        $("timeline-panel"),

    timelineViewport:
        $("timelineViewport"),

    timelineSurface:
        $("timelineSurface"),

    ruler:
        $("ruler"),

    tracks:
        $("tracks"),

    playhead:
        $("playhead"),

    clock:
        $("clock"),

    play:
        $("play"),

    prevFrame:
        $("prevFrame"),

    nextFrame:
        $("nextFrame"),

    zoomIn:
        $("zoomIn"),

    zoomOut:
        $("zoomOut"),

    addMedia:
        $("addMedia"),

    mediaModal:
        $("mediaModal"),

    videoImportModal:
        $("videoImportModal"),

    closeVideoImportModal:
        $("closeVideoImportModal"),

    chooseVideoFileButton:
        $("chooseVideoFileButton"),

    videoDropZone:
        $("videoDropZone"),

    videoFile:
        $("videoFile"),

    audioFile:
        $("audioFile"),

    speedModal:
        $("speedModal"),

    volumeModal:
        $("volumeModal"),

    volumeSlider:
        $("volumeSlider"),

    volumeValue:
        $("volumeValue"),

    undo:
        $("undo"),

    redo:
        $("redo"),

    contextToolbar:
        $("contextToolbar"),
    
    exportButton:
        $("openVideoExportModal"),
    
    videoExportModal:
    $("videoExportModal"),

    closeVideoExportModal:
        $("closeVideoExportModal"),

    videoExportConfirmButton:
        $("videoExportConfirmButton"),

    videoQualitySlider:
        $("videoQualitySlider"),

    videoQualityValue:
        $("videoQualityValue"),

    videoAudioQualitySlider:
        $("videoAudioQualitySlider"),

    videoAudioQualityValue:
        $("videoAudioQualityValue"),

};


/* =========================================================
   UTILS
========================================================= */

function uid(prefix) {

    state.nextId++;

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        state.nextId
    );

}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );

}


function formatTime(value) {

    const total =
        Math.max(
            0,
            Math.floor(
                Number(value) ||
                0
            )
        );


    const hours =
        Math.floor(
            total /
            3600
        );


    const minutes =
        Math.floor(
            (
                total %
                3600
            ) /
            60
        );


    const seconds =
        total %
        60;


    if (
        hours
    ) {

        return (
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0")
        );

    }


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );

}


function openModal(modal) {

    if (!modal) return;

    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   TRACKS
========================================================= */

function createTrack(type) {

    if (
        type ===
        "video"
    ) {

        const track = {

            id:
                uid(
                    "video-track"
                ),

            clips:
                []

        };


        state.videos.push(
            track
        );


        return track;

    }


    if (
        type ===
        "audio"
    ) {

        const track = {

            id:
                uid(
                    "audio-track"
                ),

            muted:
                false,

            clips:
                []

        };


        state.audios.push(
            track
        );


        return track;

    }


    const track = {

        id:
            uid(
                "subtitle-track"
            ),

        visible:
            true,

        clips:
            []

    };


    state.subtitles.push(
        track
    );


    return track;

}

function ensureBaseVideoTrack() {

    if (
        state.videos.length === 0
    ) {

        return createTrack(
            "video"
        );

    }


    return state.videos[0];

}


function ensureBaseTracks() {

    if (
        state.audios.length ===
        0
    ) {

        createTrack(
            "audio"
        );

    }


    if (
        state.subtitles.length ===
        0
    ) {

        createTrack(
            "subtitle"
        );

    }

}


function getTracks(type) {

    if (
        type ===
        "video"
    ) {

        return state.videos;

    }


    if (
        type ===
        "audio"
    ) {

        return state.audios;

    }


    return state.subtitles;

}


/* =========================================================
   SOURCES
========================================================= */

function registerVideoSource(file) {

    const url =
        URL.createObjectURL(
            file
        );


    const id =
        uid(
            "video-source"
        );


    state.videoSources.set(
        id,
        {
            id,
            url,
            name:
                file.name
        }
    );


    return {
        id,
        url
    };

}


function registerAudioSource(file) {

    const url =
        URL.createObjectURL(
            file
        );


    const id =
        uid(
            "audio-source"
        );


    state.audioSources.set(
        id,
        {
            id,
            url,
            name:
                file.name,

            waveform:
                null

        }
    );


    return {
        id,
        url
    };

}


/* =========================================================
   FIND CLIP
========================================================= */

function findClip(id) {

    const groups = [

        [
            "video",
            state.videos
        ],

        [
            "audio",
            state.audios
        ],

        [
            "subtitle",
            state.subtitles
        ]

    ];


    for (
        const [
            type,
            tracks
        ] of groups
    ) {

        for (
            let index = 0;
            index < tracks.length;
            index++
        ) {

            const clip =
                tracks[index]
                    .clips
                    .find(
                        item =>
                            item.id ===
                            id
                    );


            if (clip) {

                return {

                    clip,

                    track:
                        tracks[index],

                    trackIndex:
                        index,

                    type

                };

            }

        }

    }


    return null;

}


/* =========================================================
   DURATION
========================================================= */

function projectDuration() {

    let result =
        0;


    [
        ...state.videos,
        ...state.audios,
        ...state.subtitles

    ].forEach(
        track => {

            track.clips.forEach(
                clip => {

                    result =
                        Math.max(
                            result,
                            clip.start +
                            clip.duration
                        );

                }
            );

        }
    );


    return clamp(
        result,
        0,
        CFG.maxDuration
    );

}


/* =========================================================
   COLLISION
========================================================= */

function hasCollision(
    clip,
    track,
    start
) {

    const end =
        start +
        clip.duration;


    return track.clips.some(
        other => {

            if (
                other.id ===
                clip.id
            ) {

                return false;

            }


            return (
                start <
                other.start +
                other.duration
                &&
                end >
                other.start
            );

        }
    );

}


function nearestValidStart(
    clip,
    track,
    desired
) {

    desired =
        Math.max(
            0,
            desired
        );


    if (
        !hasCollision(
            clip,
            track,
            desired
        )
    ) {

        return desired;

    }


    const others =
        track.clips
            .filter(
                item =>
                    item.id !==
                    clip.id
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.start -
                    b.start
            );


    let best =
        desired;


    let bestDistance =
        Infinity;


    for (
        const other of
        others
    ) {

        const candidates = [

            Math.max(
                0,
                other.start -
                clip.duration
            ),

            other.start +
            other.duration

        ];


        for (
            const candidate of
            candidates
        ) {

            if (
                !hasCollision(
                    clip,
                    track,
                    candidate
                )
            ) {

                const distance =
                    Math.abs(
                        candidate -
                        desired
                    );


                if (
                    distance <
                    bestDistance
                ) {

                    best =
                        candidate;

                    bestDistance =
                        distance;

                }

            }

        }

    }


    return best;

}


/* =========================================================
   SCALE
========================================================= */

function updateScale() {

    const available =
        Math.max(
            700,
            (
                dom.timelinePanel.clientWidth ||
                1000
            ) -
            CFG.controlsWidth
        );


    state.pixelsPerSecond =
        available /
        CFG.zoomWindows[
            state.zoomIndex
        ];

}


function calculateSurfaceWidth() {

    updateScale();


    const minimum =
        Math.max(
            700,
            (
                dom.timelinePanel.clientWidth ||
                1000
            ) -
            CFG.controlsWidth
        );


    return Math.max(
        minimum,
        Math.max(
            state.duration,
            CFG.zoomWindows[
                state.zoomIndex
            ]
        ) *
        state.pixelsPerSecond
    );

}


/* =========================================================
   HISTORY
========================================================= */

function snapshot() {

    return JSON.stringify({

        videos:
            state.videos,

        audios:
            state.audios,

        subtitles:
            state.subtitles

    });

}


function saveHistory() {

    state.history =
        state.history.slice(
            0,
            state.historyIndex +
            1
        );


    state.history.push(
        snapshot()
    );


    if (
        state.history.length >
        30
    ) {

        state.history.shift();

    }


    state.historyIndex =
        state.history.length -
        1;


    updateHistoryButtons();

}


function updateHistoryButtons() {

    dom.undo.disabled =
        state.historyIndex <=
        0;


    dom.redo.disabled =
        state.historyIndex >=
        state.history.length -
        1;

}


function restoreHistory(index) {

    const data =
        JSON.parse(
            state.history[index]
        );


    state.videos =
        data.videos;


    state.audios =
        data.audios;


    state.subtitles =
        data.subtitles;


    state.selected =
        null;


    state.editingSubtitleId =
        null;


    hideSubtitleGuides();

    ensureBaseTracks();

    pause();

    render();

}


function undo() {

    if (
        state.historyIndex <=
        0
    ) {

        return;

    }


    state.historyIndex--;

    restoreHistory(
        state.historyIndex
    );

    updateHistoryButtons();

}


function redo() {

    if (
        state.historyIndex >=
        state.history.length -
        1
    ) {

        return;

    }


    state.historyIndex++;

    restoreHistory(
        state.historyIndex
    );

    updateHistoryButtons();

}


/* =========================================================
   ACTIVE VIDEO
========================================================= */

function activeVideo() {

    for (
        const track of
        state.videos
    ) {

        for (
            const clip of
            track.clips
        ) {

            if (
                clip.visible ===
                false
            ) {

                continue;

            }


            if (
                state.currentTime >=
                clip.start
                &&
                state.currentTime <
                clip.start +
                clip.duration
            ) {

                return {

                    clip,

                    track

                };

            }

        }

    }


    return null;

}

/* =========================================================
   SOURCE TIME
========================================================= */

function sourceTime(clip) {

    const local =
        clamp(
            state.currentTime -
            clip.start,
            0,
            clip.duration
        );


    return (
        clip.sourceStart +
        local *
        (
            clip.speed ||
            1
        )
    );

}

/* =========================================================
   VIDEO SYNC
========================================================= */

function syncVideo(
    forceSeek = false
) {

    const active =
        activeVideo();


    if (
        !active
    ) {

        dom.preview.pause();

        state.activeVideoId =
            null;

        state.videoReady =
            false;

        return;

    }


    const source =
        state.videoSources.get(
            active.clip.sourceId
        );


    if (
        !source
    ) {

        return;

    }


    const sourceChanged =
        dom.preview.src !==
        source.url;


    const clipChanged =
        state.activeVideoId !==
        active.clip.id;


    /*
     * Changement de fichier vidéo.
     */

    if (
        sourceChanged
    ) {

        state.videoReady =
            false;


        state.activeVideoId =
            active.clip.id;


        dom.preview.src =
            source.url;


        dom.preview.load();


        return;

    }


    state.activeVideoId =
        active.clip.id;


    /*
     * État du clip.
     */

    dom.preview.muted =
        active.clip.muted === true;


    dom.preview.volume =
        clamp(
            active.clip.volume ??
            1,
            0,
            1
        );


    dom.preview.playbackRate =
        Number(
            active.clip.speed
        ) ||
        1;


    /*
     * Position dans la source.
     */

    if (
        state.videoReady &&
        Number.isFinite(
            dom.preview.duration
        )
    ) {

        const wanted =
            clamp(
                sourceTime(
                    active.clip
                ),
                0,
                Math.max(
                    0,
                    dom.preview.duration -
                    .01
                )
            );


        if (
            forceSeek ||
            clipChanged ||
            Math.abs(
                dom.preview.currentTime -
                wanted
            ) > .035
        ) {

            try {

                dom.preview.currentTime =
                    wanted;

            } catch {}

        }

    }


    /*
     * Lecture.
     */

    if (
        state.playing &&
        state.videoReady &&
        dom.preview.paused
    ) {

        dom.preview
            .play()
            .catch(
                () => {}
            );

    }


    renderSubtitles();

}

dom.preview.addEventListener(
    "loadedmetadata",
    () => {

        state.videoReady =
            true;


        syncVideo(
            true
        );

    }
);


dom.preview.addEventListener(
    "canplay",
    () => {

        state.videoReady =
            true;


        if (
            state.playing
        ) {

            dom.preview
                .play()
                .catch(
                    () => {}
                );

        }

    }
);


dom.preview.addEventListener(
    "timeupdate",
    () => {

        if (
            !state.playing
        ) {

            return;

        }


        const active =
            activeVideo();


        if (
            !active
        ) {

            return;

        }


        const local =
            (
                dom.preview.currentTime -
                active.clip.sourceStart
            ) /
            (
                active.clip.speed ||
                1
            );


        state.currentTime =
            active.clip.start +
            local;


        updateClock();

        updatePlayhead();

        syncStandaloneAudio();

    }
);

/* =========================================================
   TIME
========================================================= */

function setTime(
    time,
    seek = true
) {

    state.currentTime =
        clamp(
            time,
            0,
            state.duration
        );


    updateClock();

    updatePlayhead();

    syncVideo(
        seek
    );

    syncStandaloneAudio();

}


/* =========================================================
   PLAYBACK
========================================================= */

function setPlayIcon(
    playing
) {

    dom.play.textContent =
        playing
            ? "❚❚"
            : "▶";

}


function play() {

    if (
        state.duration <=
        0
    ) {

        return;

    }


    if (
        state.currentTime >=
        state.duration
    ) {

        state.currentTime =
            0;

    }


    state.playing =
        true;


    setPlayIcon(
        true
    );


    syncVideo(
        true
    );


    syncStandaloneAudio();


    state.lastFrame =
        performance.now();


    cancelAnimationFrame(
        state.animationFrame
    );


    state.animationFrame =
        requestAnimationFrame(
            playbackLoop
        );

}


function pause() {

    state.playing =
        false;


    setPlayIcon(
        false
    );


    cancelAnimationFrame(
        state.animationFrame
    );


    state.animationFrame =
        0;


    dom.preview.pause();


    state.audioPlayers.forEach(
        player =>
            player.pause()
    );

}


function playbackLoop(timestamp) {

    if (
        !state.playing
    ) {

        return;

    }


    const active =
        activeVideo();


    /*
     * Si aucun clip vidéo n'est actif,
     * on continue d'avancer dans la timeline.
     */

    if (
        active &&
        state.videoReady
    ) {

        const local =
            (
                dom.preview.currentTime -
                active.clip.sourceStart
            ) /
            (
                active.clip.speed ||
                1
            );


        state.currentTime =
            active.clip.start +
            local;

    } else {

        const delta =
            Math.min(
                .1,
                Math.max(
                    0,
                    (
                        timestamp -
                        state.lastFrame
                    ) /
                    1000
                )
            );


        state.currentTime +=
            delta;

    }


    state.lastFrame =
        timestamp;


    if (
        state.currentTime >=
        state.duration
    ) {

        state.currentTime =
            state.duration;


        pause();

        updateClock();

        updatePlayhead();

        return;

    }


    /*
     * IMPORTANT :
     * resynchronise la source vidéo si le clip actif
     * vient de changer.
     */

    syncVideo(
        false
    );


    syncStandaloneAudio();

    updateClock();

    updatePlayhead();


    state.animationFrame =
        requestAnimationFrame(
            playbackLoop
        );

}


/* =========================================================
   AUDIO
========================================================= */

function syncStandaloneAudio() {

    const activeIds =
        new Set();


    state.audios.forEach(
        track => {

            track.clips.forEach(
                clip => {

                    if (
                        state.currentTime <
                        clip.start
                        ||
                        state.currentTime >=
                        clip.start +
                        clip.duration
                    ) {

                        return;

                    }


                    activeIds.add(
                        clip.id
                    );


                    const source =
                        state.audioSources.get(
                            clip.sourceId
                        );


                    if (!source) {

                        return;

                    }


                    let player =
                        state.audioPlayers.get(
                            clip.id
                        );


                    if (!player) {

                        player =
                            new Audio(
                                source.url
                            );


                        player.preload =
                            "auto";


                        state.audioPlayers.set(
                            clip.id,
                            player
                        );

                    }


                    player.muted =
                        track.muted;


                    player.volume =
                        clamp(
                            clip.volume ??
                            1,
                            0,
                            1
                        );


                    player.playbackRate =
                        clip.speed ||
                        1;


                    const wanted =
                        clip.sourceStart +
                        (
                            state.currentTime -
                            clip.start
                        ) *
                        (
                            clip.speed ||
                            1
                        );


                    if (
                        !state.playing
                        ||
                        Math.abs(
                            player.currentTime -
                            wanted
                        ) > .15
                    ) {

                        try {

                            player.currentTime =
                                wanted;

                        } catch {}

                    }


                    if (
                        state.playing
                        &&
                        !track.muted
                    ) {

                        player
                            .play()
                            .catch(
                                () => {}
                            );

                    } else {

                        player.pause();

                    }

                }
            );

        }
    );


    state.audioPlayers.forEach(
        (
            player,
            id
        ) => {

            if (
                !activeIds.has(id)
            ) {

                player.pause();

            }

        }
    );

}


/* =========================================================
   PLAYHEAD
========================================================= */

function updatePlayhead() {

    const x =
        CFG.controlsWidth +
        state.currentTime *
        state.pixelsPerSecond;


    dom.playhead.style.left =
        `${Math.max(
            CFG.controlsWidth,
            x
        )}px`;

}


/* =========================================================
   SCRUB
========================================================= */

function getTimelineTime(event) {

    const rect =
        dom.timelineSurface
            .getBoundingClientRect();


    const x =
        event.clientX -
        rect.left -
        CFG.controlsWidth +
        dom.timelineViewport.scrollLeft;


    return clamp(
        x /
        state.pixelsPerSecond,
        0,
        state.duration
    );

}


function scrubTimeline(event) {

    setTime(
        getTimelineTime(
            event
        ),
        true
    );

}


dom.playhead.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        event.stopPropagation();


        state.draggingPlayhead =
            true;


        dom.playhead.setPointerCapture?.(
            event.pointerId
        );


        scrubTimeline(
            event
        );

    }
);


dom.playhead.addEventListener(
    "pointermove",
    event => {

        if (
            !state.draggingPlayhead
        ) {

            return;

        }


        scrubTimeline(
            event
        );

    }
);


dom.playhead.addEventListener(
    "pointerup",
    event => {

        state.draggingPlayhead =
            false;


        try {

            dom.playhead.releasePointerCapture(
                event.pointerId
            );

        } catch {}

    }
);


dom.timelineSurface.addEventListener(
    "pointerdown",
    event => {

        if (
            event.target.closest(
                ".track-controls"
            )
        ) {

            return;

        }


        if (
            event.target.closest(
                ".clip"
            )
        ) {

            return;

        }


        state.scrubActive =
            true;


        scrubTimeline(
            event
        );

    }
);


dom.timelineSurface.addEventListener(
    "pointermove",
    event => {

        if (
            !state.scrubActive
        ) {

            return;

        }


        scrubTimeline(
            event
        );

    }
);


window.addEventListener(
    "pointerup",
    () => {

        state.scrubActive =
            false;

        state.draggingPlayhead =
            false;

    }
);


/* =========================================================
   ICONS
========================================================= */

const ICONS = {

    eye: `
        <svg viewBox="0 0 24 24" fill="none">

            <path
                d="M2.8 12C5.1 7.9 8.4 5.8 12 5.8C15.6 5.8 18.9 7.9 21.2 12C18.9 16.1 15.6 18.2 12 18.2C8.4 18.2 5.1 16.1 2.8 12Z"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                stroke-width="1.8"
            />

        </svg>
    `,


    eyeOff: `
        <svg viewBox="0 0 24 24" fill="none">

            <path
                d="M3 3L21 21"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <path
                d="M6.2 7.1C4.8 8.3 3.7 9.9 2.8 12C5.1 16.2 8.3 18.4 12 18.4"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

        </svg>
    `,


    speaker: `
        <svg viewBox="0 0 24 24" fill="none">

            <path
                d="M4 10V14H8L13 18V6L8 10H4Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
            />

            <path
                d="M16 9C17.3 10.3 17.3 13.7 16 15"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

        </svg>
    `,


    speakerOff: `
        <svg viewBox="0 0 24 24" fill="none">

            <path
                d="M4 10V14H8L13 18V6L8 10H4Z"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <path
                d="M17 9L21 15M21 9L17 15"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

        </svg>
    `

};


/* =========================================================
   TRACK UI
========================================================= */

function trackButton(
    icon,
    callback
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "track-button";


    button.innerHTML =
        icon;


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            callback();

        }
    );


    return button;

}


function plusButton(callback) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "track-plus";


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            callback();

        }
    );


    return button;

}


function buildTrackRow(
    type,
    track,
    index,
    width
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "track-row";


    row.dataset.type =
        type;


    row.dataset.trackId =
        track.id;


    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "track-controls";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "track-content";


    content.style.width =
        `${width}px`;


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "track-name";


    name.textContent =
        type === "video"
            ? "VIDEO"
            : type === "audio"
                ? "AUDIO"
                : "SOUS-TITRE";

if (
    type ===
    "video"
) {

    const eyeButton =
        trackButton(
            ICONS.eye,
            () => {

                if (
                    !state.selected ||
                    state.selected.type !==
                    "video"
                ) {

                    return;

                }


                const clip =
                    state.selected.clip;


                clip.visible =
                    clip.visible !==
                    false
                        ? false
                        : true;


                if (
                    !clip.visible
                ) {

                    pause();

                }


                render();

                selectClip(
                    clip,
                    track,
                    "video"
                );

            }
        );


    const muteButton =
        trackButton(
            ICONS.speaker,
            () => {

                if (
                    !state.selected ||
                    state.selected.type !==
                    "video"
                ) {

                    return;

                }


                const clip =
                    state.selected.clip;


                clip.muted =
                    !clip.muted;


                syncVideo(
                    true
                );


                render();

                selectClip(
                    clip,
                    track,
                    "video"
                );

            }
        );


    controls.append(
        muteButton
    );


    /*
     * Les boutons sont désactivés tant qu'aucun
     * segment vidéo n'est sélectionné.
     */

    if (
        !state.selected ||
        state.selected.type !==
        "video"
    ) {

        eyeButton.disabled =
            true;

        muteButton.disabled =
            true;

    } else {

        const selectedClip =
            state.selected.clip;


        eyeButton.innerHTML =
            selectedClip.visible ===
            false
                ? ICONS.eyeOff
                : ICONS.eye;


        muteButton.innerHTML =
            selectedClip.muted
                ? ICONS.speakerOff
                : ICONS.speaker;

    }

}


    if (
        type ===
        "audio"
    ) {

        controls.append(
            plusButton(
                () =>
                    dom.audioFile.click()
            )
        );


    }


    if (
        type ===
        "subtitle"
    ) {

        controls.append(
            plusButton(
                () =>
                    openSubtitleEditor()
            )
        );


    }


    controls.append(
        name
    );


    row.append(
        controls,
        content
    );


    return {
        row,
        content
    };

}


/* =========================================================
   CLIPS
========================================================= */

function makeClipElement(
    clip,
    track,
    type
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "clip";


    element.dataset.clipId =
        clip.id;


    if (
        type ===
        "audio"
    ) {

        element.classList.add(
            "audio"
        );

    }


    if (
        type ===
        "subtitle"
    ) {

        element.classList.add(
            "subtitle-clip"
        );

    }


    element.style.left =
        `${
            clip.start *
            state.pixelsPerSecond
        }px`;


    element.style.width =
        `${Math.max(
            2,
            clip.duration *
            state.pixelsPerSecond
        )}px`;


    if (
        state.selected?.id ===
        clip.id
    ) {

        element.classList.add(
            "selected"
        );

    }


    if (
        type ===
        "video"
    ) {

        const strip =
            document.createElement(
                "div"
            );


        strip.className =
            "thumb-strip";


        element.appendChild(
            strip
        );


        loadThumbnails(
            strip,
            clip
        );


        const label =
            document.createElement(
                "div"
            );


        label.className =
            "clip-label";


        label.textContent =
            clip.name;


        element.appendChild(
            label
        );

    }


    if (
        type ===
        "audio"
    ) {

        const wave =
            document.createElement(
                "div"
            );


        wave.className =
            "wave";


        wave.dataset.sourceId =
            clip.sourceId;


        element.appendChild(
            wave
        );


        const label =
            document.createElement(
                "div"
            );


        label.className =
            "clip-label";


        label.textContent =
            clip.name;


        element.appendChild(
            label
        );

    }


    if (
        type ===
        "subtitle"
    ) {

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "subtitle-clip-text";


        text.textContent =
            clip.text;


        text.style.color =
            "#111827";


        text.style.fontFamily =
            clip.font ||
            "Inter";


        element.appendChild(
            text
        );


        [
            "left",
            "right"
        ]
        .forEach(
            side => {

                const handle =
                    document.createElement(
                        "div"
                    );


                handle.className =
                    `subtitle-handle ${side}`;


                handle.addEventListener(
                    "pointerdown",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        resizeSubtitle(
                            event,
                            clip,
                            track,
                            side ===
                            "left"
                        );

                    }
                );


                element.appendChild(
                    handle
                );

            }
        );

    }


    attachDrag(
        element,
        clip,
        track,
        type
    );


    return element;

}


/* =========================================================
   SELECTION
========================================================= */

function selectClip(
    clip,
    track,
    type
) {

    state.selected = {

        id:
            clip.id,

        clip,

        track,

        type

    };


    document
        .querySelectorAll(
            ".clip"
        )
        .forEach(
            element => {

                element.classList.toggle(
                    "selected",
                    element.dataset.clipId ===
                    clip.id
                );

            }
        );


    renderContextToolbar();

}


/* =========================================================
   DRAGGING
========================================================= */

function attachDrag(
    element,
    clip,
    sourceTrack,
    type
) {

    element.addEventListener(
        "pointerdown",
        event => {

            if (
                event.button !==
                0
            ) {

                return;

            }


            event.preventDefault();

            event.stopPropagation();


            selectClip(
                clip,
                sourceTrack,
                type
            );


            startClipDrag(
                event,
                element,
                clip,
                sourceTrack,
                type
            );

        }
    );

}


function startClipDrag(
    startEvent,
    element,
    clip,
    sourceTrack,
    type
) {

    const elementRect =
        element.getBoundingClientRect();


    const startX =
        startEvent.clientX;


    const startY =
        startEvent.clientY;


    const grabOffsetX =
        startEvent.clientX -
        elementRect.left;


    const grabOffsetY =
        startEvent.clientY -
        elementRect.top;


    let axis =
        "horizontal";



    let dragging =
        true;


    let ghost =
        null;


    let targetStart =
        clip.start;


    let targetTrack =
        sourceTrack;


    function makeGhost() {

        if (
            ghost
        ) {

            return;

        }


        ghost =
            element.cloneNode(
                true
            );


        ghost.classList.add(
            "ghost"
        );


        ghost.classList.remove(
            "selected"
        );


        ghost.style.left =
            `${
                CFG.controlsWidth +
                clip.start *
                state.pixelsPerSecond
            }px`;


        ghost.style.top =
            `${element.offsetTop}px`;


        ghost.style.width =
            `${Math.max(
                2,
                element.offsetWidth
            )}px`;


        ghost.style.height =
            `${element.offsetHeight}px`;


        dom.timelineSurface.appendChild(
            ghost
        );

    }


    function cleanup() {

        window.removeEventListener(
            "pointermove",
            move
        );


        window.removeEventListener(
            "pointerup",
            up
        );


        window.removeEventListener(
            "pointercancel",
            cancel
        );


        clearAlignment();


        ghost?.remove();


        element.classList.remove(
            "dragging"
        );

    }


    function cancel() {

        cleanup();

        render();

    }


    function determineAxis(event) {

        if (
            axis
        ) {

            return;

        }


        const dx =
            Math.abs(
                event.clientX -
                startX
            );


        const dy =
            Math.abs(
                event.clientY -
                startY
            );


        if (
            Math.max(
                dx,
                dy
            ) <
            CFG.dragThreshold
        ) {

            return;

        }


        axis =
            dx >= dy
                ? "horizontal"
                : "vertical";


        dragging =
            true;


        makeGhost();


        element.classList.add(
            "dragging"
        );

    }


    function move(event) {

        determineAxis(
            event
        );


        if (
            !axis
        ) {

            return;

        }


        const viewportRect =
            dom.timelineViewport
                .getBoundingClientRect();


        if (
            event.clientX <
            viewportRect.left
            ||
            event.clientX >
            viewportRect.right
            ||
            event.clientY <
            viewportRect.top
            ||
            event.clientY >
            viewportRect.bottom
        ) {

            cancel();

            return;

        }


        makeGhost();


        if (
            axis ===
            "horizontal"
        ) {

            const rows =
                [
                    ...dom.tracks.children
                ]
                .filter(
                    row =>
                        row.dataset.type ===
                        type
                );


            const trackIndex =
                getTracks(type)
                    .findIndex(
                        track =>
                            track.id ===
                            sourceTrack.id
                    );


            const row =
                rows[trackIndex];


            if (
                !row
            ) {

                return;

            }


            const content =
                row.querySelector(
                    ".track-content"
                );


            const contentRect =
                content.getBoundingClientRect();


            const desiredStart =
                (
                    event.clientX -
                    grabOffsetX -
                    contentRect.left
                ) /
                state.pixelsPerSecond;


            targetStart =
                nearestValidStart(
                    clip,
                    sourceTrack,
                    desiredStart
                );


            targetStart =
                clamp(
                    targetStart,
                    0,
                    Math.max(
                        0,
                        CFG.maxDuration -
                        clip.duration
                    )
                );


            ghost.style.left =
                `${
                    CFG.controlsWidth +
                    targetStart *
                    state.pixelsPerSecond
                }px`;


            ghost.style.top =
                `${row.offsetTop + 10}px`;


            if (
                type ===
                "video"
            ) {

                showAlignment(
                    clip,
                    sourceTrack,
                    targetStart,
                    "video"
                );

            }


            return;

        }


        const rows =
            [
                ...dom.tracks.children
            ]
            .filter(
                row =>
                    row.dataset.type ===
                    "video"
            );


        targetTrack =
            null;


        let targetRow =
            null;


        for (
            let index = 0;
            index < rows.length;
            index++
        ) {

            const rowRect =
                rows[index]
                    .getBoundingClientRect();


            if (
                event.clientY >=
                    rowRect.top
                &&
                event.clientY <=
                    rowRect.bottom
            ) {

                targetTrack =
                    state.videos[index] ||
                    null;

                targetRow =
                    rows[index];

                break;

            }

        }


        if (
            !targetTrack ||
            !targetRow
        ) {

            return;

        }


        const ghostTop =
            event.clientY -
            dom.timelineSurface
                .getBoundingClientRect()
                .top -
            grabOffsetY;


        ghost.style.top =
            `${ghostTop}px`;


        targetStart =
            clip.start;


        ghost.style.left =
            `${
                CFG.controlsWidth +
                targetStart *
                state.pixelsPerSecond
            }px`;


        showAlignment(
            clip,
            targetTrack,
            targetStart,
            "video"
        );

    }


    function up() {

        if (
            !dragging
        ) {

            cleanup();

            return;

        }


        if (
            type ===
            "audio"
        ) {

            clip.start =
                clamp(
                    targetStart,
                    0,
                    Math.max(
                        0,
                        CFG.maxDuration -
                        clip.duration
                    )
                );


            cleanup();

            saveHistory();

            render();

            selectClip(
                clip,
                sourceTrack,
                "audio"
            );

            return;

        }


        if (
            type ===
            "subtitle"
        ) {

            clip.start =
                clamp(
                    targetStart,
                    0,
                    Math.max(
                        0,
                        CFG.maxDuration -
                        clip.duration
                    )
                );


            cleanup();

            saveHistory();

            render();

            selectClip(
                clip,
                sourceTrack,
                "subtitle"
            );

            return;

        }


        if (
            axis ===
            "horizontal"
        ) {

            clip.start =
                clamp(
                    targetStart,
                    0,
                    Math.max(
                        0,
                        CFG.maxDuration -
                        clip.duration
                    )
                );


            cleanup();

            saveHistory();

            render();

            selectClip(
                clip,
                sourceTrack,
                "video"
            );

            return;

        }



        const result =
            findClip(
                clip.id
            );


        if (
            result
        ) {

            selectClip(
                result.clip,
                result.track,
                result.type
            );

        }

    }


    window.addEventListener(
        "pointermove",
        move
    );


    window.addEventListener(
        "pointerup",
        up
    );


    window.addEventListener(
        "pointercancel",
        cancel
    );

}


/* =========================================================
   ALIGNEMENT
========================================================= */

function clearAlignment() {

    dom.timelineSurface
        .querySelectorAll(
            ".align-line,.align-label"
        )
        .forEach(
            element =>
                element.remove()
        );

}


function showAlignment(
    clip,
    sourceTrack,
    desiredStart,
    type
) {

    if (
        type !==
        "video"
    ) {

        return;

    }


    clearAlignment();


    const sourceIndex =
        state.videos.findIndex(
            track =>
                track.id ===
                sourceTrack.id
        );


    const proposedEnd =
        desiredStart +
        clip.duration;


    let found =
        false;


    for (
        let index = 0;
        index < state.videos.length;
        index++
    ) {

        if (
            index ===
            sourceIndex
        ) {

            continue;

        }


        const track =
            state.videos[index];


        for (
            const other of
            track.clips
        ) {

            const otherStart =
                other.start;


            const otherEnd =
                other.start +
                other.duration;


            let alignment =
                null;


            if (
                Math.abs(
                    proposedEnd -
                    otherStart
                ) <=
                CFG.alignmentTolerance
            ) {

                alignment =
                    otherStart;

            } else if (
                Math.abs(
                    desiredStart -
                    otherEnd
                ) <=
                CFG.alignmentTolerance
            ) {

                alignment =
                    otherEnd;

            }


            if (
                alignment ===
                null
            ) {

                continue;

            }


            const rows =
                [
                    ...dom.tracks.children
                ]
                .filter(
                    row =>
                        row.dataset.type ===
                        "video"
                );


            const rowA =
                rows[sourceIndex];


            const rowB =
                rows[index];


            if (
                !rowA ||
                !rowB
            ) {

                continue;

            }


            const surface =
                dom.timelineSurface
                    .getBoundingClientRect();


            const a =
                rowA.getBoundingClientRect();


            const b =
                rowB.getBoundingClientRect();


            const x =
                CFG.controlsWidth +
                alignment *
                state.pixelsPerSecond;


            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "align-line";


            line.style.left =
                `${x}px`;


            line.style.top =
                `${
                    Math.min(
                        a.top,
                        b.top
                    ) -
                    surface.top +
                    18
                }px`;


            line.style.height =
                `${
                    Math.abs(
                        a.top -
                        b.top
                    ) +
                    45
                }px`;


            dom.timelineSurface.appendChild(
                line
            );


            const label =
                document.createElement(
                    "div"
                );


            label.className =
                "align-label";


            label.textContent =
                "Aligné";


            label.style.left =
                `${x}px`;


            label.style.top =
                `${
                    Math.min(
                        a.top,
                        b.top
                    ) -
                    surface.top -
                    18
                }px`;


            dom.timelineSurface.appendChild(
                label
            );


            found =
                true;


            break;

        }


        if (
            found
        ) {

            break;

        }

    }

}


/* =========================================================
   CUT
========================================================= */

function cutSelected() {

    if (
        !state.selected
    ) {

        return false;

    }


    const {
        clip,
        track,
        type
    } =
        state.selected;


    const local =
        state.currentTime -
        clip.start;


    if (
        !Number.isFinite(local)
        ||
        local <= .02
        ||
        local >=
        clip.duration -
        .02
    ) {

        return false;

    }


    const speed =
        clip.speed ||
        1;


    const sourceOffset =
        local *
        speed;


    const first = {

        ...clip,

        id:
            uid(
                type ===
                "audio"
                    ? "audio"
                    : "clip"
            ),

        duration:
            local

    };


    const second = {

        ...clip,

        id:
            uid(
                type ===
                "audio"
                    ? "audio"
                    : "clip"
            ),

        start:
            clip.start +
            local,

        duration:
            clip.duration -
            local,

        sourceStart:
            (
                clip.sourceStart ||
                0
            ) +
            sourceOffset

    };


    const index =
        track.clips.findIndex(
            item =>
                item.id ===
                clip.id
        );


    if (
        index <
        0
    ) {

        return false;

    }


    track.clips.splice(
        index,
        1,
        first,
        second
    );


    state.selected = {

        id:
            second.id,

        clip:
            second,

        track,

        type

    };


    pause();

    saveHistory();

    render();

    return true;

}


/* =========================================================
   DELETE
========================================================= */

function deleteSelected() {

    if (
        !state.selected
    ) {

        return;

    }


    const {
        clip,
        track,
        type
    } =
        state.selected;


    const index =
        track.clips.findIndex(
            item =>
                item.id ===
                clip.id
        );


    if (
        index <
        0
    ) {

        return;

    }


    track.clips.splice(
        index,
        1
    );


    if (
        type ===
        "video"
    ) {

        state.videos =
            state.videos.filter(
                track =>
                    track.clips.length >
                    0
            );

    }


    state.selected =
        null;


    pause();

    saveHistory();

    render();

}


/* =========================================================
   CONTEXT TOOLBAR
========================================================= */

function toolbarButton(
    text,
    callback
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "context-action";


    button.textContent =
        text;


    button.addEventListener(
        "click",
        callback
    );


    return button;

}


function renderContextToolbar() {

    const cutButton =
        $("videoToolCut");

    const deleteButton =
        $("videoToolDelete");

    const speedButton =
        $("videoToolSpeed");

    const volumeButton =
        $("videoToolVolume");

    const subtitleButton =
        $("videoToolSubtitle");

    const helpText =
        $("videoToolHelpText");


    if (!cutButton) {
        return;
    }


    const hasSelection =
        !!state.selected;


    const isVideo =
        hasSelection &&
        state.selected.type ===
        "video";


    const isAudio =
        hasSelection &&
        state.selected.type ===
        "audio";


    const isSubtitle =
        hasSelection &&
        state.selected.type ===
        "subtitle";


    /*
     * COUPER
     */

    cutButton.disabled =
        !hasSelection;


    /*
     * SUPPRIMER
     */

    deleteButton.disabled =
        !hasSelection;


    /*
     * VITESSE
     */

    speedButton.disabled =
        !isVideo;


    /*
     * VOLUME
     */

    volumeButton.disabled =
        !isVideo &&
        !isAudio;


    /*
     * SOUS-TITRE
     */

    subtitleButton.disabled =
        !isSubtitle;


    /*
     * TEXTE D'AIDE
     */

    if (!hasSelection) {

        helpText.textContent =
            "Sélectionnez un élément dans la timeline.";

    } else if (isVideo) {

        helpText.textContent =
            "Modifiez la vidéo sélectionnée.";

    } else if (isAudio) {

        helpText.textContent =
            "Modifiez l'audio sélectionné.";

    } else {

        helpText.textContent =
            "Modifiez le sous-titre sélectionné.";

    }

}

/* =========================================================
   OUTILS VIDÉO — BARRE PERMANENTE
========================================================= */

$("videoToolCut")?.addEventListener(
    "click",
    () => {

        if (
            !state.selected
        ) {
            return;
        }

        cutSelected();

    }
);


$("videoToolDelete")?.addEventListener(
    "click",
    () => {

        if (
            !state.selected
        ) {
            return;
        }

        deleteSelected();

    }
);


$("videoToolSpeed")?.addEventListener(
    "click",
    () => {

        if (
            !state.selected ||
            state.selected.type !==
            "video"
        ) {
            return;
        }

        openModal(
            dom.speedModal
        );

    }
);


$("videoToolVolume")?.addEventListener(
    "click",
    () => {

        if (
            !state.selected ||
            (
                state.selected.type !==
                "video" &&
                state.selected.type !==
                "audio"
            )
        ) {
            return;
        }

        openVolume();

    }
);


$("videoToolSubtitle")?.addEventListener(
    "click",
    () => {

        if (
            !state.selected ||
            state.selected.type !==
            "subtitle"
        ) {
            return;
        }

        editSubtitle(
            state.selected.clip
        );

    }
);


/* =========================================================
   VOLUME
========================================================= */

function openVolume() {

    if (
        !state.selected
    ) {

        return;

    }


    const value =
        Math.round(
            (
                state.selected.clip.volume ??
                1
            ) *
            100
        );


    dom.volumeSlider.value =
        value;


    dom.volumeValue.textContent =
        `${value}%`;


    openModal(
        dom.volumeModal
    );

}


dom.volumeSlider.addEventListener(
    "input",
    () => {

        dom.volumeValue.textContent =
            `${dom.volumeSlider.value}%`;

    }
);


$("applyVolume").addEventListener(
    "click",
    () => {

        if (
            !state.selected
        ) {

            return;

        }


        state.selected.clip.volume =
            Number(
                dom.volumeSlider.value
            ) /
            100;


        if (
            state.selected.type ===
            "video"
        ) {

            dom.preview.volume =
                state.selected.clip.volume;

        }


        closeModal(
            dom.volumeModal
        );


        saveHistory();

    }
);


/* =========================================================
   SPEED
========================================================= */

document
    .querySelectorAll(
        "[data-speed]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !state.selected
                        ||
                        state.selected.type !==
                        "video"
                    ) {

                        return;

                    }


                    const clip =
                        state.selected.clip;


                    const speed =
                        Number(
                            button.dataset.speed
                        );


                    const sourceDuration =
                        clip.duration *
                        (
                            clip.speed ||
                            1
                        );


                    clip.speed =
                        speed;


                    clip.duration =
                        sourceDuration /
                        speed;


                    closeModal(
                        dom.speedModal
                    );


                    pause();

                    saveHistory();

                    render();

                }
            );

        }
    );


/* =========================================================
   SUBTITLES
========================================================= */

function renderSubtitles() {

    dom.subtitleLayer.innerHTML =
        "";


    state.subtitles.forEach(
        track => {

/* La visibilité est maintenant propre au clip. */


            track.clips.forEach(
                clip => {

                    if (
                        clip.visible ===
                        false
                    ) {

                        return;

                    }

                    if (
                        state.editingSubtitleId ===
                        clip.id
                    ) {

                        return;

                    }


                    if (
                        state.currentTime <
                        clip.start
                        ||
                        state.currentTime >=
                        clip.start +
                        clip.duration
                    ) {

                        return;

                    }


                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "subtitle-live";


                    element.textContent =
                        clip.text;


                    element.style.left =
                        `${clip.x ?? 50}%`;


                    element.style.top =
                        `${clip.y ?? 82}%`;


                    element.style.width =
                        `${clip.width ?? 90}%`;


                    element.style.fontFamily =
                        clip.font ||
                        "Inter";


                    element.style.fontSize =
                        `${clip.size || 42}px`;


                    element.style.color =
                        clip.color ||
                        "#fff";


                    dom.subtitleLayer.appendChild(
                        element
                    );

                }
            );

        }
    );

}


/* =========================================================
   GUIDE
========================================================= */

function showSubtitleGuides() {

    if (
        !dom.subtitleGuides
    ) {

        return;

    }


    dom.subtitleGuides.hidden =
        false;


    requestAnimationFrame(
        () => {

            dom.subtitleGuides.classList.add(
                "active"
            );

        }
    );

}


function hideSubtitleGuides() {

    if (
        !dom.subtitleGuides
    ) {

        return;

    }


    dom.subtitleGuides.classList.remove(
        "active"
    );


    dom.subtitleGuides
        .querySelectorAll(
            ".subtitle-guide"
        )
        .forEach(
            guide => {

                guide.classList.remove(
                    "aligned"
                );

            }
        );


    dom.subtitleGuides.hidden =
        true;

}


function updateSubtitleGuides(
    x,
    y
) {

    if (
        !dom.subtitleGuides
    ) {

        return;

    }


    const horizontal =
        dom.subtitleGuides.querySelector(
            ".subtitle-guide.horizontal"
        );


    const vertical =
        dom.subtitleGuides.querySelector(
            ".subtitle-guide.vertical"
        );


    if (
        !horizontal ||
        !vertical
    ) {

        return;

    }


    horizontal.classList.toggle(
        "aligned",
        Math.abs(
            y - 50
        ) <=
        1.2
    );


    vertical.classList.toggle(
        "aligned",
        Math.abs(
            x - 50
        ) <=
        1.2
    );

}


/* =========================================================
   EDIT SUBTITLE
========================================================= */

function editSubtitle(
    clip
) {

    if (
        !clip
    ) {

        return;

    }


    const result =
        findClip(
            clip.id
        );


    if (
        !result
    ) {

        return;

    }


    state.selected = {

        id:
            result.clip.id,

        clip:
            result.clip,

        track:
            result.track,

        type:
            "subtitle"

    };


    openSubtitleEditor(
        result.clip
    );

}


/* =========================================================
   FONTS
========================================================= */

const SUBTITLE_FONTS = [

    "Inter",
    "Arial",
    "Helvetica",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Impact",
    "Comic Sans MS",
    "Lucida Console",
    "Palatino Linotype",
    "Garamond",
    "Segoe UI",
    "Calibri",
    "Cambria",
    "Consolas",
    "Franklin Gothic Medium",
    "Century Gothic"

];


/* =========================================================
   SUBTITLE EDITOR
========================================================= */

function openSubtitleEditor(
    existingClip = null
) {

    document
        .querySelectorAll(
            ".subtitle-editor"
        )
        .forEach(
            editor =>
                editor.remove()
        );


    pause();


    state.editingSubtitleId =
        existingClip?.id ??
        null;


    renderSubtitles();

    showSubtitleGuides();


    const editor =
        document.createElement(
            "div"
        );


    editor.className =
        "subtitle-editor";


    const textEditor =
        document.createElement(
            "div"
        );


    textEditor.className =
        "subtitle-edit-text";


    textEditor.contentEditable =
        "true";


    textEditor.spellcheck =
        false;


    textEditor.textContent =
        existingClip?.text ||
        "";


    const config = {

        x:
            existingClip?.x ??
            50,

        y:
            existingClip?.y ??
            72,

        width:
            existingClip?.width ??
            60,

        height:
            existingClip?.height ??
            13,

        size:
            existingClip?.size ??
            42,

        font:
            existingClip?.font ??
            "Inter",

        color:
            existingClip?.color ??
            "#ffffff"

    };


    const handleClasses = [
        "tl",
        "tm",
        "tr",
        "ml",
        "mr",
        "bl",
        "bm",
        "br"
    ];


    const handles = {};


    handleClasses.forEach(
        className => {

            const handle =
                document.createElement(
                    "div"
                );


            handle.className =
                `subtitle-resize-live ${className}`;


            handles[className] =
                handle;


            editor.appendChild(
                handle
            );

        }
    );


    const tools =
        document.createElement(
            "div"
        );


    tools.className =
        "subtitle-editor-tools";


    const fontPicker =
        document.createElement(
            "div"
        );


    fontPicker.className =
        "subtitle-font-picker";


    const fontTrigger =
        document.createElement(
            "button"
        );


    fontTrigger.type =
        "button";


    fontTrigger.className =
        "subtitle-font-trigger";


    const fontTriggerLabel =
        document.createElement(
            "span"
        );


    fontTriggerLabel.textContent =
        config.font;


    fontTrigger.appendChild(
        fontTriggerLabel
    );


    const fontMenu =
        document.createElement(
            "div"
        );


    fontMenu.className =
        "subtitle-font-menu";


    const fontSearch =
        document.createElement(
            "input"
        );


    fontSearch.type =
        "text";


    fontSearch.className =
        "subtitle-font-search";


    fontSearch.placeholder =
        "Rechercher une police…";


    const fontOptions =
        document.createElement(
            "div"
        );


    fontOptions.className =
        "subtitle-font-options";


    fontMenu.append(
        fontSearch,
        fontOptions
    );


    fontPicker.append(
        fontTrigger,
        fontMenu
    );


    function renderFontOptions(
        filter = ""
    ) {

        fontOptions.innerHTML =
            "";


        const query =
            filter
                .trim()
                .toLowerCase();


        SUBTITLE_FONTS.forEach(
            name => {

                if (
                    query &&
                    !name
                        .toLowerCase()
                        .includes(
                            query
                        )
                ) {

                    return;

                }


                const option =
                    document.createElement(
                        "button"
                    );


                option.type =
                    "button";


                option.className =
                    "subtitle-font-option";


                option.textContent =
                    name;


                option.style.fontFamily =
                    name;


                option.classList.toggle(
                    "selected",
                    name ===
                    config.font
                );


                option.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        config.font =
                            name;


                        fontTriggerLabel.textContent =
                            name;


                        fontSearch.value =
                            "";


                        fontPicker.classList.remove(
                            "open"
                        );


                        updateStyle();

                    }
                );


                fontOptions.appendChild(
                    option
                );

            }
        );

    }


    renderFontOptions();


    fontTrigger.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            const shouldOpen =
                !fontPicker.classList.contains(
                    "open"
                );


            document
                .querySelectorAll(
                    ".subtitle-font-picker.open"
                )
                .forEach(
                    picker =>
                        picker.classList.remove(
                            "open"
                        )
                );


            if (
                !shouldOpen
            ) {

                return;

            }


            fontPicker.classList.add(
                "open"
            );


            renderFontOptions(
                fontSearch.value
            );


            setTimeout(
                () =>
                    fontSearch.focus(),
                0
            );

        }
    );


    fontSearch.addEventListener(
        "input",
        event => {

            event.stopPropagation();


            const query =
                fontSearch.value
                    .trim()
                    .toLowerCase();


            renderFontOptions(
                query
            );


            const best =
                SUBTITLE_FONTS.find(
                    name =>
                        name
                            .toLowerCase()
                            .startsWith(
                                query
                            )
                ) ||
                SUBTITLE_FONTS.find(
                    name =>
                        name
                            .toLowerCase()
                            .includes(
                                query
                            )
                );


            if (
                best
            ) {

                const option =
                    [
                        ...fontOptions.children
                    ]
                    .find(
                        child =>
                            child.textContent ===
                            best
                    );


                option?.scrollIntoView({
                    block:
                        "nearest"
                });

            }

        }
    );


    fontMenu.addEventListener(
        "click",
        event =>
            event.stopPropagation()
    );


    const color =
        document.createElement(
            "input"
        );


    color.type =
        "color";


    color.value =
        config.color;


    const confirm =
        document.createElement(
            "button"
        );


    confirm.type =
        "button";


    confirm.className =
        "confirm";


    confirm.textContent =
        "✓";


    const cancel =
        document.createElement(
            "button"
        );


    cancel.type =
        "button";


    cancel.textContent =
        "×";


    tools.append(
        fontPicker,
        color,
        confirm,
        cancel
    );


    editor.append(
        textEditor,
        tools
    );


    dom.previewFrame.appendChild(
        editor
    );


    function updateStyle() {

        editor.style.left =
            `${config.x}%`;


        editor.style.top =
            `${config.y}%`;


        editor.style.width =
            `${config.width}%`;


        editor.style.height =
            `${config.height}%`;


        textEditor.style.fontSize =
            `${config.size}px`;


        textEditor.style.fontFamily =
            config.font;


        textEditor.style.color =
            config.color;


        fontTriggerLabel.textContent =
            config.font;


        updateSubtitleGuides(
            config.x,
            config.y
        );

    }


    updateStyle();


    let moving =
        false;


    let resizing =
        false;


    let resizeHandle =
        null;


    let moveOffsetX =
        0;


    let moveOffsetY =
        0;


    let resizeStartX =
        0;


    let resizeStartY =
        0;


    let startX =
        config.x;


    let startY =
        config.y;


    let startWidth =
        config.width;


    let startHeight =
        config.height;


    let startFontSize =
        config.size;


    textEditor.addEventListener(
        "pointerdown",
        event => {

            event.stopPropagation();


            moving =
                true;


            const rect =
                editor.getBoundingClientRect();


            moveOffsetX =
                event.clientX -
                (
                    rect.left +
                    rect.width /
                    2
                );


            moveOffsetY =
                event.clientY -
                (
                    rect.top +
                    rect.height /
                    2
                );

        }
    );


    handleClasses.forEach(
        className => {

            handles[className]
                .addEventListener(
                    "pointerdown",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        resizing =
                            true;


                        resizeHandle =
                            className;


                        resizeStartX =
                            event.clientX;


                        resizeStartY =
                            event.clientY;


                        startX =
                            config.x;


                        startY =
                            config.y;


                        startWidth =
                            config.width;


                        startHeight =
                            config.height;


                        startFontSize =
                            config.size;

                    }
                );

        }
    );


    function moveEditor(event) {

        const frameRect =
            dom.previewFrame
                .getBoundingClientRect();


        if (
            moving
        ) {

            config.x =
                clamp(
                    (
                        (
                            event.clientX -
                            moveOffsetX -
                            frameRect.left
                        ) /
                        frameRect.width
                    ) *
                    100,
                    5,
                    95
                );


            config.y =
                clamp(
                    (
                        (
                            event.clientY -
                            moveOffsetY -
                            frameRect.top
                        ) /
                        frameRect.height
                    ) *
                    100,
                    5,
                    95
                );


            updateStyle();

        }


        if (
            !resizing ||
            !resizeHandle
        ) {

            return;

        }


        const dx =
            (
                event.clientX -
                resizeStartX
            ) /
            frameRect.width *
            100;


        const dy =
            (
                event.clientY -
                resizeStartY
            ) /
            frameRect.height *
            100;


        let newWidth =
            startWidth;


        let newHeight =
            startHeight;


        let newX =
            startX;


        let newY =
            startY;


        const horizontal =
            resizeHandle.includes("l")
            ||
            resizeHandle.includes("r");


        const vertical =
            resizeHandle.includes("t")
            ||
            resizeHandle.includes("b");


        if (
            horizontal
        ) {

            if (
                resizeHandle.includes("l")
            ) {

                newWidth =
                    clamp(
                        startWidth -
                        dx,
                        12,
                        90
                    );


                newX =
                    startX +
                    dx /
                    2;

            }


            if (
                resizeHandle.includes("r")
            ) {

                newWidth =
                    clamp(
                        startWidth +
                        dx,
                        12,
                        90
                    );


                newX =
                    startX +
                    dx /
                    2;

            }

        }


        if (
            vertical
        ) {

            if (
                resizeHandle.includes("t")
            ) {

                newHeight =
                    clamp(
                        startHeight -
                        dy,
                        6,
                        70
                    );


                newY =
                    startY +
                    dy /
                    2;

            }


            if (
                resizeHandle.includes("b")
            ) {

                newHeight =
                    clamp(
                        startHeight +
                        dy,
                        6,
                        70
                    );


                newY =
                    startY +
                    dy /
                    2;

            }

        }


        config.width =
            newWidth;


        config.height =
            newHeight;


        config.x =
            clamp(
                newX,
                5,
                95
            );


        config.y =
            clamp(
                newY,
                5,
                95
            );


        if (
            horizontal
        ) {

            config.size =
                clamp(
                    startFontSize *
                    (
                        newWidth /
                        startWidth
                    ),
                    12,
                    120
                );

        }


        if (
            vertical &&
            !horizontal
        ) {

            config.size =
                clamp(
                    startFontSize *
                    (
                        newHeight /
                        startHeight
                    ),
                    12,
                    120
                );

        }


        updateStyle();

    }


    function pointerUp() {

        moving =
            false;

        resizing =
            false;

        resizeHandle =
            null;

    }


    window.addEventListener(
        "pointermove",
        moveEditor
    );


    window.addEventListener(
        "pointerup",
        pointerUp
    );


    function destroy() {

        window.removeEventListener(
            "pointermove",
            moveEditor
        );


        window.removeEventListener(
            "pointerup",
            pointerUp
        );


        editor.remove();


        state.editingSubtitleId =
            null;


        hideSubtitleGuides();


        renderSubtitles();

    }


    cancel.addEventListener(
        "click",
        destroy
    );


    color.addEventListener(
        "input",
        () => {

            config.color =
                color.value;


            updateStyle();

        }
    );


    confirm.addEventListener(
        "click",
        () => {

            const text =
                textEditor.textContent
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


            if (
                !text
            ) {

                return;

            }


            if (
                existingClip
            ) {

                const result =
                    findClip(
                        existingClip.id
                    );


                if (
                    !result
                ) {

                    destroy();

                    return;

                }


                const target =
                    result.clip;


                target.text =
                    text;


                target.x =
                    config.x;


                target.y =
                    config.y;


                target.width =
                    config.width;


                target.height =
                    config.height;


                target.size =
                    config.size;


                target.font =
                    config.font;


                target.color =
                    config.color;


                destroy();

                saveHistory();

                render();


                const updated =
                    findClip(
                        target.id
                    );


                if (
                    updated
                ) {

                    selectClip(
                        updated.clip,
                        updated.track,
                        "subtitle"
                    );

                }


                return;

            }


            ensureBaseTracks();


            const track =
                state.subtitles[0];


            const clip = {

                id:
                    uid(
                        "subtitle"
                    ),

                text,

                start:
                    state.currentTime,

                duration:
                    3,

                x:
                    config.x,

                y:
                    config.y,

                width:
                    config.width,

                height:
                    config.height,

                size:
                    config.size,

                font:
                    config.font,

                color:
                    config.color,

                underline:
                    false

            };


            clip.start =
                nearestValidStart(
                    clip,
                    track,
                    clip.start
                );


            track.clips.push(
                clip
            );


            state.selected = {

                id:
                    clip.id,

                clip,

                track,

                type:
                    "subtitle"

            };


            destroy();

            saveHistory();

            render();

        }
    );


    textEditor.focus();

}


/* =========================================================
   SUBTITLE TIMELINE RESIZE
========================================================= */

function resizeSubtitle(
    event,
    clip,
    track,
    leftSide
) {

    const startX =
        event.clientX;


    const originalStart =
        clip.start;


    const originalEnd =
        clip.start +
        clip.duration;


    function move(pointer) {

        const delta =
            (
                pointer.clientX -
                startX
            ) /
            state.pixelsPerSecond;


        if (
            leftSide
        ) {

            const newStart =
                clamp(
                    originalStart +
                    delta,
                    0,
                    originalEnd -
                    CFG.minSubtitleDuration
                );


            clip.start =
                newStart;


            clip.duration =
                originalEnd -
                newStart;

        } else {

            clip.duration =
                Math.max(
                    CFG.minSubtitleDuration,
                    originalEnd -
                    originalStart +
                    delta
                );

        }


        const element =
            document.querySelector(
                `[data-clip-id="${clip.id}"]`
            );


        if (
            element
        ) {

            element.style.left =
                `${
                    clip.start *
                    state.pixelsPerSecond
                }px`;


            element.style.width =
                `${Math.max(
                    2,
                    clip.duration *
                    state.pixelsPerSecond
                )}px`;

        }

    }


    function pointerUp() {

        window.removeEventListener(
            "pointermove",
            move
        );


        window.removeEventListener(
            "pointerup",
            pointerUp
        );


        saveHistory();

        render();

    }


    window.addEventListener(
        "pointermove",
        move
    );


    window.addEventListener(
        "pointerup",
        pointerUp
    );

}


/* =========================================================
   THUMBNAILS
========================================================= */

function createThumbnailPromise(url) {

    return new Promise(
        resolve => {

            const video =
                document.createElement(
                    "video"
                );


            video.src =
                url;


            video.preload =
                "metadata";


            video.muted =
                true;


            video.addEventListener(
                "loadedmetadata",
                () => {

                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        240;


                    canvas.height =
                        135;


                    const context =
                        canvas.getContext(
                            "2d"
                        );


                    const times = [

                        0,

                        video.duration /
                        2,

                        Math.max(
                            0,
                            video.duration -
                            .05
                        )

                    ];


                    const result = [];


                    let index =
                        0;


                    function next() {

                        if (
                            index >=
                            times.length
                        ) {

                            resolve(
                                result
                            );

                            return;

                        }


                        video.currentTime =
                            times[index];

                    }


                    video.addEventListener(
                        "seeked",
                        () => {

                            try {

                                context.drawImage(
                                    video,
                                    0,
                                    0,
                                    240,
                                    135
                                );


                                result.push(
                                    canvas.toDataURL(
                                        "image/jpeg",
                                        .65
                                    )
                                );

                            } catch {}


                            index++;

                            next();

                        }
                    );


                    next();

                },
                {
                    once:
                        true
                }
            );

        }
    );

}


async function loadThumbnails(
    container,
    clip
) {

    const source =
        state.videoSources.get(
            clip.sourceId
        );


    if (
        !source
    ) {

        return;

    }


    if (
        !state.thumbnailPromises.has(
            clip.sourceId
        )
    ) {

        state.thumbnailPromises.set(
            clip.sourceId,
            createThumbnailPromise(
                source.url
            )
        );

    }


    const images =
        await state.thumbnailPromises.get(
            clip.sourceId
        );


    if (
        !document.body.contains(
            container
        )
    ) {

        return;

    }


    container.innerHTML =
        "";


    images.forEach(
        src => {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                src;


            image.alt =
                "";


            container.appendChild(
                image
            );

        }
    );

}


/* =========================================================
   WAVEFORM
========================================================= */

function decodeWaveform(sourceId) {

    const source =
        state.audioSources.get(
            sourceId
        );


    if (
        !source
    ) {

        return Promise.resolve(
            null
        );

    }


    if (
        source.waveform
    ) {

        return Promise.resolve(
            source.waveform
        );

    }


    if (
        state.waveformPromises.has(
            sourceId
        )
    ) {

        return state.waveformPromises.get(
            sourceId
        );

    }


    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (
        !AudioContext
    ) {

        return Promise.resolve(
            null
        );

    }


    const promise =
        fetch(
            source.url
        )
        .then(
            response =>
                response.arrayBuffer()
        )
        .then(
            buffer => {

                const context =
                    new AudioContext();


                return context
                    .decodeAudioData(
                        buffer.slice(0)
                    )
                    .then(
                        decoded => {

                            source.waveform =
                                decoded.getChannelData(
                                    0
                                );


                            return source.waveform;

                        }
                    )
                    .finally(
                        () =>
                            context.close()
                    );

            }
        )
        .catch(
            () =>
                null
        );


    state.waveformPromises.set(
        sourceId,
        promise
    );


    return promise;

}


async function renderWaveforms() {

    const elements =
        [
            ...document.querySelectorAll(
                ".wave"
            )
        ];


    for (
        const element of
        elements
    ) {

        const data =
            await decodeWaveform(
                element.dataset.sourceId
            );


        if (
            !data
            ||
            !document.body.contains(
                element
            )
        ) {

            continue;

        }


        const width =
            Math.max(
                2,
                Math.floor(
                    element.clientWidth
                )
            );


        const height =
            Math.max(
                2,
                Math.floor(
                    element.clientHeight
                )
            );


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            width;


        canvas.height =
            height;


        const context =
            canvas.getContext(
                "2d"
            );


        const step =
            data.length /
            width;


        const center =
            height /
            2;


        const amplitude =
            height *
            .42;


        context.strokeStyle =
            "rgba(124,58,237,.7)";


        context.lineWidth =
            1;


        context.beginPath();


        for (
            let x = 0;
            x < width;
            x++
        ) {

            const start =
                Math.floor(
                    x *
                    step
                );


            const end =
                Math.min(
                    data.length,
                    Math.floor(
                        (
                            x + 1
                        ) *
                        step
                    ) +
                    1
                );


            let min =
                1;


            let max =
                -1;


            for (
                let i = start;
                i < end;
                i++
            ) {

                min =
                    Math.min(
                        min,
                        data[i]
                    );


                max =
                    Math.max(
                        max,
                        data[i]
                    );

            }


            context.moveTo(
                x,
                center +
                min *
                amplitude
            );


            context.lineTo(
                x,
                center +
                max *
                amplitude
            );

        }


        context.stroke();


        element.innerHTML =
            "";


        element.appendChild(
            canvas
        );

    }

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    ensureBaseTracks();

    const hasMedia =
    state.videos.some(
        track => track.clips.length > 0
    ) ||
    state.audios.some(
        track => track.clips.length > 0
    );

dom.timelinePanel.classList.toggle(
    "timeline-disabled",
    !hasMedia
);
if (dom.exportButton) {

    dom.exportButton.disabled =
        !hasMedia;

}


    state.duration =
        projectDuration();


    const width =
        calculateSurfaceWidth();


    dom.timelineSurface.style.width =
        `${
            CFG.controlsWidth +
            width
        }px`;


    dom.ruler.style.width =
        `${width}px`;


    renderRuler(
        width
    );


    dom.tracks.innerHTML =
        "";


    [
        [
            "video",
            state.videos
        ],

        [
            "audio",
            state.audios
        ],

        [
            "subtitle",
            state.subtitles
        ]

    ]
    .forEach(
        (
            [
                type,
                tracks
            ]
        ) => {

            tracks.forEach(
                (
                    track,
                    index
                ) => {

                    const built =
                        buildTrackRow(
                            type,
                            track,
                            index,
                            width
                        );


                    track.clips.forEach(
                        clip => {

                            built.content.appendChild(
                                makeClipElement(
                                    clip,
                                    track,
                                    type
                                )
                            );

                        }
                    );


                    dom.tracks.appendChild(
                        built.row
                    );

                }
            );

        }
    );


    updateClock();

    updatePlayhead();

    renderSubtitles();

    renderContextToolbar();


    requestAnimationFrame(
        renderWaveforms
    );

}


/* =========================================================
   EXPORT VIDÉO — OUVERTURE
========================================================= */

if (dom.exportButton) {

    dom.exportButton.addEventListener(
        "click",
        () => {

            if (
                dom.exportButton.disabled ||
                !state.duration
            ) {

                return;

            }

            openModal(
                dom.videoExportModal
            );

        }
    );

}

/* =========================================================
   FERMETURE EXPORT VIDÉO
========================================================= */

dom.closeVideoExportModal?.addEventListener(
    "click",
    () => {

        closeModal(
            dom.videoExportModal
        );

    }
);


const videoExportOverlay =
    document.querySelector(
        "[data-close-video-export]"
    );


videoExportOverlay?.addEventListener(
    "click",
    () => {

        closeModal(
            dom.videoExportModal
        );

    }
);

/* =========================================================
   FORMAT VIDÉO
========================================================= */

document
    .querySelectorAll(
        "[data-video-format]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.disabled
                    ) {

                        return;

                    }


                    state.exportFormat =
                        button.dataset.videoFormat;


                    document
                        .querySelectorAll(
                            "[data-video-format]"
                        )
                        .forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item === button
                                );

                            }
                        );

                }
            );

        }
    );




/* =========================================================
   QUALITÉ AUDIO
========================================================= */

const VIDEO_AUDIO_BITRATES = [

    128,
    192,
    256,
    320

];


dom.videoAudioQualitySlider?.addEventListener(
    "input",
    () => {

        const index =
            Number(
                dom.videoAudioQualitySlider.value
            );


        state.exportAudioBitrate =
            VIDEO_AUDIO_BITRATES[
                index
            ];


        dom.videoAudioQualityValue.textContent =
            `${state.exportAudioBitrate} kbps`;

    }
);


/* =========================================================
   RULER
========================================================= */

function renderRuler(width) {

    dom.ruler.innerHTML =
        "";


    const visible =
        CFG.zoomWindows[
            state.zoomIndex
        ];


    const step =
        visible >= 1800
            ? 300
            : visible >= 600
                ? 60
                : visible >= 120
                    ? 10
                    : visible >= 15
                        ? 1
                        : visible >= 5
                            ? .5
                            : .1;


    const end =
        Math.max(
            state.duration,
            visible
        );


    for (
        let time = 0;
        time <= end;
        time += step
    ) {

        const x =
            time *
            state.pixelsPerSecond;


        const mark =
            document.createElement(
                "div"
            );


        mark.className =
            "ruler-mark";


        mark.style.left =
            `${x}px`;


        const label =
            document.createElement(
                "div"
            );


        label.className =
            "ruler-label";


        label.style.left =
            `${x}px`;


        label.textContent =
            formatTime(
                time
            );


        dom.ruler.append(
            mark,
            label
        );

    }

}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    dom.clock.textContent =
        `${formatTime(
            state.currentTime
        )} / ${formatTime(
            state.duration
        )}`;

}


/* =========================================================
   IMPORT VIDEO
========================================================= */

function importVideoFile(file) {

    if (
        !file
        ||
        !file.type.startsWith(
            "video/"
        )
    ) {

        return;

    }


    const source =
        registerVideoSource(
            file
        );


    const probe =
        document.createElement(
            "video"
        );


    probe.preload =
        "metadata";


    probe.src =
        source.url;


    probe.addEventListener(
        "loadedmetadata",
        () => {

            const duration =
                probe.duration;


            if (
                !Number.isFinite(
                    duration
                )
                ||
                duration <= 0
            ) {

                return;

            }


            const track =
                ensureBaseVideoTrack();


            const videoEnd =
                track.clips.reduce(
                    (
                        max,
                        existingClip
                    ) =>
                        Math.max(
                            max,
                            existingClip.start +
                            existingClip.duration
                        ),
                    0
                );


            const clip = {

                id:
                    uid(
                        "video"
                    ),

                sourceId:
                    source.id,

                name:
                    file.name,

                start:
                    videoEnd,

                duration,

                sourceStart:
                    0,

                speed:
                    1,

                volume:
                    1,
                
                visible:
                    true,

                muted:
                    false,

            };


            track.clips.push(
                clip
            );


            state.selected = {

                id:
                    clip.id,

                clip,

                track,

                type:
                    "video"

            };


            closeModal(
                dom.mediaModal
            );


            dom.addMedia.classList.remove(
                "active"
            );


            saveHistory();

render();


state.currentTime =
    clip.start;


updateClock();

updatePlayhead();


state.videoReady =
    false;


state.activeVideoId =
    null;


syncVideo(
    true
);

        },
        {
            once:
                true
        }
    );

}


/* =========================================================
   IMPORT AUDIO
========================================================= */

function importAudioFile(file) {

    if (
        !file
        ||
        !file.type.startsWith(
            "audio/"
        )
    ) {

        return;

    }


    const source =
        registerAudioSource(
            file
        );


    const probe =
        document.createElement(
            "audio"
        );


    probe.preload =
        "metadata";


    probe.src =
        source.url;


    probe.addEventListener(
        "loadedmetadata",
        () => {

            const duration =
                probe.duration;


            if (
                !Number.isFinite(
                    duration
                )
                ||
                duration <= 0
            ) {

                return;

            }


            ensureBaseTracks();


            const track =
                state.audios[0];


            const clip = {

                id:
                    uid(
                        "audio"
                    ),

                sourceId:
                    source.id,

                name:
                    file.name,

                start:
                    0,

                duration,

                sourceStart:
                    0,

                speed:
                    1,

                volume:
                    1

            };


            clip.start =
                nearestValidStart(
                    clip,
                    track,
                    0
                );


            track.clips.push(
                clip
            );


            state.selected = {

                id:
                    clip.id,

                clip,

                track,

                type:
                    "audio"

            };


            saveHistory();

            render();


            decodeWaveform(
                source.id
            );

        },
        {
            once:
                true
        }
    );

}


/* =========================================================
   IMPORT UI
========================================================= */

dom.addMedia.addEventListener(
    "click",
    () => {

        const open =
            !dom.mediaModal.classList.contains(
                "open"
            );


        if (open) {

            openModal(
                dom.mediaModal
            );

        } else {

            closeModal(
                dom.mediaModal
            );

        }


        dom.addMedia.classList.toggle(
            "active",
            open
        );

    }
);


/* =========================================================
   CHOIX — IMPORTER UNE VIDÉO
========================================================= */

$("pickVideo").addEventListener(
    "click",
    () => {

        closeModal(
            dom.mediaModal
        );


        dom.addMedia.classList.remove(
            "active"
        );


        openModal(
            dom.videoImportModal
        );

    }
);


/* =========================================================
   BOUTON CHOISIR UN FICHIER
========================================================= */

dom.chooseVideoFileButton.addEventListener(
    "click",
    () => {

        dom.videoFile.click();

    }
);


/* =========================================================
   IMPORT VIA EXPLORATEUR
========================================================= */

dom.videoFile.addEventListener(
    "change",
    () => {

        const file =
            dom.videoFile.files[0];


        if (file) {

            closeModal(
                dom.videoImportModal
            );


            importVideoFile(
                file
            );

        }


        dom.videoFile.value =
            "";

    }
);


/* =========================================================
   IMPORT AUDIO
========================================================= */

dom.audioFile.addEventListener(
    "change",
    () => {

        importAudioFile(
            dom.audioFile.files[0]
        );


        dom.audioFile.value =
            "";

    }
);


/* =========================================================
   DRAG & DROP VIDÉO
========================================================= */

[
    "dragenter",
    "dragover"
].forEach(
    type => {

        dom.videoDropZone.addEventListener(
            type,
            event => {

                event.preventDefault();

                event.stopPropagation();

                dom.videoDropZone.classList.add(
                    "dragover"
                );

            }
        );

    }
);


[
    "dragleave",
    "drop"
].forEach(
    type => {

        dom.videoDropZone.addEventListener(
            type,
            event => {

                event.preventDefault();

                event.stopPropagation();

                dom.videoDropZone.classList.remove(
                    "dragover"
                );

            }
        );

    }
);


dom.videoDropZone.addEventListener(
    "drop",
    event => {

        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                "video/"
            )
        ) {

            return;
        }


        closeModal(
            dom.videoImportModal
        );


        importVideoFile(
            file
        );

    }
);

/* =========================================================
   MODAL CLOSE
========================================================= */

document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    closeModal(
                        $(
                            element.dataset.close
                        )
                    );


                    dom.addMedia.classList.remove(
                        "active"
                    );

                }
            );

        }
    );

dom.closeVideoImportModal.addEventListener(
    "click",
    () => {

        closeModal(
            dom.videoImportModal
        );

    }
);


document
    .querySelector(
        "[data-close-video-import]"
    )
    .addEventListener(
        "click",
        () => {

            closeModal(
                dom.videoImportModal
            );

        }
    );


/* =========================================================
   TRANSPORT
========================================================= */

dom.play.addEventListener(
    "click",
    () => {

        if (
            state.playing
        ) {

            pause();

        } else {

            play();

        }

    }
);


dom.prevFrame.addEventListener(
    "click",
    () => {

        setTime(
            state.currentTime -
            .1,
            true
        );

    }
);


dom.nextFrame.addEventListener(
    "click",
    () => {

        setTime(
            state.currentTime +
            .1,
            true
        );

    }
);


/* =========================================================
   ZOOM
========================================================= */

dom.zoomIn.addEventListener(
    "click",
    () => {

        const current =
            state.currentTime;


        state.zoomIndex =
            clamp(
                state.zoomIndex + 1,
                0,
                CFG.zoomWindows.length -
                1
            );


        render();


        state.currentTime =
            current;


        updatePlayhead();

    }
);


dom.zoomOut.addEventListener(
    "click",
    () => {

        const current =
            state.currentTime;


        state.zoomIndex =
            clamp(
                state.zoomIndex - 1,
                0,
                CFG.zoomWindows.length -
                1
            );


        render();


        state.currentTime =
            current;


        updatePlayhead();

    }
);


/* =========================================================
   HISTORY
========================================================= */

dom.undo.addEventListener(
    "click",
    undo
);


dom.redo.addEventListener(
    "click",
    redo
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey ||
            event.metaKey
        ) {

            if (
                event.key.toLowerCase() ===
                "z"
            ) {

                event.preventDefault();

                undo();

            }


            if (
                event.key.toLowerCase() ===
                "y"
            ) {

                event.preventDefault();

                redo();

            }

        }


        if (
            event.key ===
            "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal.open"
                )
                .forEach(
                    modal =>
                        closeModal(
                            modal
                        )
                );


            dom.addMedia.classList.remove(
                "active"
            );

        }

    }
);


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenuButton =
    $("mobileMenuButton");


const mobileMenu =
    $("mobileMenu");


if (
    mobileMenuButton &&
    mobileMenu
) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            const open =
                mobileMenu.classList.toggle(
                    "open"
                );


            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(open)
            );

        }
    );

}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        render();

    }
);

/* =========================================================
   EXPORT WEBM
========================================================= */

/* =========================================================
   FFmpeg.wasm — EXPORT VIDÉO
========================================================= */

let ffmpegInstance = null;
let ffmpegLoaded = false;
let ffmpegLoading = null;

async function toLocalBlobURL(
    url,
    type
) {

    const response =
        await fetch(url);


    if (
        !response.ok
    ) {

        throw new Error(
            `Impossible de charger ${url} (${response.status})`
        );

    }


    const blob =
        await response.blob();


    return URL.createObjectURL(
        new Blob(
            [
                blob
            ],
            {
                type
            }
        )
    );

}

/* =========================================================
   CHARGEMENT FFmpeg
========================================================= */

async function loadFFmpeg() {

    if (
        ffmpegLoaded &&
        ffmpegInstance
    ) {

        return ffmpegInstance;

    }


    if (
        ffmpegLoading
    ) {

        return ffmpegLoading;

    }


    ffmpegLoading =
        (async () => {

            const {
                FFmpeg
            } =
                await import(
                    "./ffmpeg/index.js"
                );


            const {
                fetchFile,
                toBlobURL
            } =
                await import(
                    "./ffmpeg/util/index.js"
                );


            const ffmpeg =
                new FFmpeg();


            ffmpeg.on(
                "log",
                ({
                    message
                }) => {

                    console.log(
                        "[FFmpeg]",
                        message
                    );

                }
            );


            /*
             * Dossier contenant le core multithread.
             */

            const baseURL =
                new URL(
                    "./ffmpeg/",
                    document.baseURI
                ).href;


            /*
             * Conversion en Blob URL.
             */

            const coreURL =
                await toBlobURL(
                    `${baseURL}ffmpeg-core.js`,
                    "text/javascript"
                );


            const wasmURL =
                await toBlobURL(
                    `${baseURL}ffmpeg-core.wasm`,
                    "application/wasm"
                );


            const workerURL =
                await toBlobURL(
                    `${baseURL}ffmpeg-core.worker.js`,
                    "text/javascript"
                );


            /*
             * Chargement du core multithread.
             */

            await ffmpeg.load({

                coreURL,
                wasmURL,
                workerURL

            });


            ffmpegInstance =
                ffmpeg;


            ffmpegLoaded =
                true;


            ffmpeg.__fetchFile =
                fetchFile;


            return ffmpeg;

        })();


    try {

        return await ffmpegLoading;

    } finally {

        ffmpegLoading =
            null;

    }

}

/* =========================================================
   UTILITAIRES FFmpeg
========================================================= */

function ffmpegSafeName(
    value,
    fallback
) {

    const clean =
        String(
            value ||
            fallback
        )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );


    return clean ||
        fallback;

}


function escapeDrawText(
    value
) {

    return String(
        value ||
        ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /:/g,
            "\\:"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /,/g,
            "\\,"
        )
        .replace(
            /\[/g,
            "\\["
        )
        .replace(
            /\]/g,
            "\\]"
        )
        .replace(
            /\n/g,
            "\\n"
        );

}


function hexToFFmpegColor(
    color
) {

    const value =
        String(
            color ||
            "#ffffff"
        )
        .replace(
            "#",
            ""
        );


    if (
        !/^[0-9a-fA-F]{6}$/.test(
            value
        )
    ) {

        return "FFFFFF";

    }


    return value
        .toUpperCase();

}


function getAtempoFilters(
    speed
) {

    const value =
        Number(
            speed
        ) ||
        1;


    const filters = [];


    let remaining =
        value;


    /*
     * atempo accepte 0.5 → 2.
     * On découpe donc les valeurs extrêmes.
     */

    while (
        remaining <
        0.5
    ) {

        filters.push(
            "atempo=0.5"
        );


        remaining /=
            0.5;

    }


    while (
        remaining >
        2
    ) {

        filters.push(
            "atempo=2"
        );


        remaining /=
            2;

    }


    filters.push(
        `atempo=${remaining}`
    );


    return filters.join(
        ","
    );

}


async function fetchSourceBlob(
    url
) {

    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Impossible de récupérer la source (${response.status}).`
        );

    }


    return await response.blob();

}


/* =========================================================
   SEGMENTS VIDÉO
========================================================= */

function buildVideoSegments() {

    const boundaries =
        new Set([
            0,
            state.duration
        ]);


    state.videos.forEach(
        track => {



            track.clips.forEach(
                clip => {

                    boundaries.add(
                        clip.start
                    );


                    boundaries.add(
                        clip.start +
                        clip.duration
                    );

                }
            );

        }
    );


    const sorted =
        [...boundaries]
            .filter(
                value =>
                    value >= 0 &&
                    value <=
                    state.duration
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a - b
            );


    const segments = [];


    for (
        let index = 0;
        index <
        sorted.length - 1;
        index++
    ) {

        const start =
            sorted[index];


        const end =
            sorted[index + 1];


        if (
            end -
            start <
            0.001
        ) {

            continue;

        }


        const active =
            [];


        state.videos.forEach(
            (
                track,
                trackIndex
            ) => {


                track.clips.forEach(
                    clip => {

                        if (
                            start >=
                            clip.start
                            &&
                            start <
                            clip.start +
                            clip.duration
                        ) {

                            active.push({

                                clip,
                                track,
                                trackIndex

                            });

                        }

                    }
                );

            }
        );


        active.sort(
            (
                a,
                b
            ) =>
                b.trackIndex -
                a.trackIndex
        );


        segments.push({

            start,
            end,
            clip:
                active[0]?.clip ||
                null,
            track:
                active[0]?.track ||
                null

        });

    }


    return segments;

}

async function getVideoSourceDimensions(source) {

    if (
        source &&
        Number(source.width) > 0 &&
        Number(source.height) > 0
    ) {

        return {

            width:
                Number(source.width),

            height:
                Number(source.height)

        };

    }


    if (
        !source ||
        !source.url
    ) {

        return {

            width: 1280,
            height: 720

        };

    }


    return await new Promise(
        resolve => {

            const video =
                document.createElement("video");


            video.preload =
                "metadata";


            video.muted =
                true;


            video.playsInline =
                true;


            const cleanup =
                () => {

                    video.removeAttribute("src");

                    video.load();

                };


            video.addEventListener(
                "loadedmetadata",
                () => {

                    const width =
                        video.videoWidth ||
                        1280;


                    const height =
                        video.videoHeight ||
                        720;


                    cleanup();


                    resolve({

                        width,
                        height

                    });

                },
                {
                    once: true
                }
            );


            video.addEventListener(
                "error",
                () => {

                    cleanup();


                    resolve({

                        width: 1280,
                        height: 720

                    });

                },
                {
                    once: true
                }
            );


            video.src =
                source.url;

        }
    );

}

/* =========================================================
   TEST WEBCODECS
========================================================= */

async function checkWebCodecsH264() {

    if (
        typeof VideoEncoder ===
        "undefined"
    ) {

        console.log(
            "[Editilo] WebCodecs indisponible."
        );

        return false;

    }


    try {

        const config = {

            codec:
                "avc1.640028",

            width:
                1920,

            height:
                1080,

            bitrate:
                8_000_000,

            framerate:
                30,

            hardwareAcceleration:
                "prefer-hardware"

        };


        const result =
            await VideoEncoder.isConfigSupported(
                config
            );


        console.log(
            "[Editilo] WebCodecs H.264 :",
            result
        );


        return (
            result.supported ===
            true
        );

    } catch (
        error
    ) {

        console.error(
            "[Editilo] Erreur WebCodecs :",
            error
        );


        return false;

    }

}

/* =========================================================
   DESSIN DES SOUS-TITRES SUR UNE FRAME
========================================================= */

function drawEditiloSubtitles(
    ctx,
    width,
    height,
    timestamp
) {

    if (
        !state.subtitles ||
        !state.subtitles.length
    ) {

        return;

    }


    state.subtitles.forEach(
        track => {

            if (
                !track ||
                !track.visible ||
                !track.clips
            ) {

                return;

            }


            track.clips.forEach(
                clip => {

                    if (!clip) {

                        return;

                    }


                    const text =
                        String(
                            clip.text ||
                            ""
                        ).trim();


                    if (
                        !text
                    ) {

                        return;

                    }


                    const start =
                        Number(
                            clip.start
                        ) || 0;


                    const duration =
                        Number(
                            clip.duration
                        ) || 0;


                    if (
                        timestamp < start ||
                        timestamp > start + duration
                    ) {

                        return;

                    }


                    /* =====================================
                       POSITION
                    ===================================== */

                    const x =
                        (
                            Number(
                                clip.x
                            ) ||
                            50
                        ) /
                        100 *
                        width;


                    const y =
                        (
                            Number(
                                clip.y
                            ) ||
                            82
                        ) /
                        100 *
                        height;


                    /* =====================================
                       TAILLE
                    ===================================== */

                    const size =
                        Math.max(
                            12,
                            Math.round(
                                (
                                    Number(
                                        clip.size
                                    ) ||
                                    42
                                ) *
                                (
                                    width /
                                    1280
                                )
                            )
                        );


                    /* =====================================
                       COULEUR
                    ===================================== */

                    let color =
                        clip.color ||
                        "#ffffff";


                    if (
                        !String(
                            color
                        ).startsWith("#")
                    ) {

                        color =
                            `#${color}`;

                    }


                    /* =====================================
                       POLICE
                    ===================================== */

                    const fontFamily =
                        clip.fontFamily ||
                        clip.font ||
                        "Arial";


                    ctx.font =
                        `700 ${size}px "${fontFamily}", Arial, sans-serif`;


                    ctx.textAlign =
                        "center";


                    ctx.textBaseline =
                        "middle";


                    ctx.fillStyle =
                        color;


                    ctx.shadowColor =
                        "rgba(0,0,0,0.80)";


                    ctx.shadowBlur =
                        Math.max(
                            4,
                            size * 0.20
                        );


                    ctx.shadowOffsetX =
                        0;


                    ctx.shadowOffsetY =
                        Math.max(
                            2,
                            size * 0.10
                        );


                    /* =====================================
                       RETOUR À LA LIGNE
                    ===================================== */

                    const maxWidth =
                        width *
                        0.92;


                    const words =
                        text.split(
                            /\s+/
                        );


                    const lines = [];


                    let line =
                        "";


                    for (
                        const word of
                        words
                    ) {

                        const test =
                            line
                                ? `${line} ${word}`
                                : word;


                        if (
                            ctx.measureText(
                                test
                            ).width >
                            maxWidth &&
                            line
                        ) {

                            lines.push(
                                line
                            );


                            line =
                                word;

                        } else {

                            line =
                                test;

                        }

                    }


                    if (
                        line
                    ) {

                        lines.push(
                            line
                        );

                    }


                    /* =====================================
                       DESSIN
                    ===================================== */

                    const lineHeight =
                        size *
                        1.08;


                    const totalHeight =
                        lines.length *
                        lineHeight;


                    const firstY =
                        y -
                        totalHeight / 2 +
                        lineHeight / 2;


                    lines.forEach(
                        (
                            currentLine,
                            index
                        ) => {

                            ctx.fillText(
                                currentLine,
                                x,
                                firstY +
                                index *
                                lineHeight
                            );

                        }
                    );


                    /*
                     * On réinitialise l'ombre pour
                     * ne pas affecter la frame suivante.
                     */

                    ctx.shadowColor =
                        "transparent";

                    ctx.shadowBlur =
                        0;

                    ctx.shadowOffsetX =
                        0;

                    ctx.shadowOffsetY =
                        0;

                }
            );

        }
    );

}

/* =========================================================
   EXPORT WEBCODECS MP4

   VIDÉO
   + AUDIO ORIGINAL
   + AUDIO EXTERNE
   + SOUS-TITRES

   Respecte :
   - track.visible vidéo
   - track.muted vidéo
   - clip.volume vidéo
   - track.muted audio
   - clip.volume audio
   - clip.speed audio
   - clip.start audio
   - clip.sourceStart audio
   - track.visible sous-titres

   TEST LIMITÉ À 5 SECONDES
========================================================= */

async function WebCodecsMP4() {

    console.log(
        "[Editilo] Début export WebCodecs MP4..."
    );


    const button =
        dom.videoExportConfirmButton;


    if (
        !button ||
        !state.duration
    ) {

        console.error(
            "[Editilo] Impossible de lancer l'export."
        );

        return;

    }


    const originalText =
        button.innerHTML;


    button.disabled =
        true;


    button.innerHTML =
        "Préparation de l'export...";


    try {

        /* =================================================
           SOURCE VIDÉO ACTIVE
        ================================================= */

        let videoStateSource =
            null;


        let videoExportTrack =
            null;


        let videoExportClip =
            null;


        /*
         * On cherche la première piste vidéo
         * visible contenant un clip.
         */

for (
    const track of
    state.videos
) {

    if (
        !track.clips ||
        !track.clips.length
    ) {
        continue;
    }

    const clip =
        track.clips.find(
            item =>
                item.visible !== false
        );

    if (
        !clip
    ) {
        continue;
    }


            if (
                !clip
            ) {

                continue;

            }


            const source =
                state.videoSources.get(
                    clip.sourceId
                );


            if (
                !source
            ) {

                continue;

            }


            videoStateSource =
                source;


            videoExportTrack =
                track;


            videoExportClip =
                clip;


            break;

        }


        if (
            !videoStateSource
        ) {

            throw new Error(
                "Aucune piste vidéo visible avec une source valide."
            );

        }


        const videoBlob =
            await fetchSourceBlob(
                videoStateSource.url
            );


        if (
            !videoBlob
        ) {

            throw new Error(
                "Impossible de récupérer la vidéo source."
            );

        }


        /* =================================================
           MEDIABUNNY
        ================================================= */

        const {

            Input,
            ALL_FORMATS,
            BlobSource,

            VideoSampleSink,
            VideoSampleSource,

            AudioSampleSource,
            AudioSample,

            Output,
            Mp4OutputFormat,
            BufferTarget,
            Quality

        } =
            Mediabunny;


        /* =================================================
           INPUT VIDÉO
        ================================================= */

        const input =
            new Input({

                formats:
                    ALL_FORMATS,

                source:
                    new BlobSource(
                        videoBlob
                    )

            });


        /* =================================================
           PISTE VIDÉO
        ================================================= */

        const videoTrack =
            await input.getPrimaryVideoTrack();


        if (
            !videoTrack
        ) {

            throw new Error(
                "Aucune piste vidéo trouvée."
            );

        }


        const rawWidth =
            await videoTrack.getCodedWidth();


        const rawHeight =
            await videoTrack.getCodedHeight();


        const width =
            rawWidth -
            (
                rawWidth % 2
            );


        const height =
            rawHeight -
            (
                rawHeight % 2
            );


        const sourceDuration =
            await videoTrack.computeDuration();




        const duration =
            Math.min(
                sourceDuration,
                state.duration
            );


        console.log(
            "[Editilo] Résolution :",
            `${width}x${height}`
        );


        console.log(
            "[Editilo] Durée testée :",
            duration.toFixed(2),
            "s"
        );


        console.log(
            "[Editilo] Piste vidéo visible :",
            videoExportClip?.visible !== false 
        );


        console.log(
            "[Editilo] Piste vidéo muette :",
            videoExportClip?.muted === true
        );


        console.log(
            "[Editilo] Volume vidéo :",
            videoExportClip?.volume ?? 1
        );


        /* =================================================
           PISTE AUDIO ORIGINALE
        ================================================= */

        const audioTrack =
            await input.getPrimaryAudioTrack();


        /* =================================================
           SINK VIDÉO
        ================================================= */

        const videoSink =
            new VideoSampleSink(
                videoTrack,
                {
                    hardwareAcceleration:
                        "prefer-hardware"
                }
            );


        /* =================================================
           VIDÉO H.264 + SOUS-TITRES
        ================================================= */

        const encodedVideo =
            new VideoSampleSource({

                codec:
                    "avc",

                quality:
                    new Quality({

                        bitrate:
                            8_000_000

                    }),

                hardwareAcceleration:
                    "prefer-hardware",

                latencyMode:
                    "quality",

                transform: {

                    width,
                    height,

                    fit:
                        "contain",

                    force:
                        true,

                    process:
                        async sample => {

                            const canvas =
                                new OffscreenCanvas(
                                    width,
                                    height
                                );


                            const ctx =
                                canvas.getContext(
                                    "2d",
                                    {
                                        alpha:
                                            false
                                    }
                                );


                            if (
                                !ctx
                            ) {

                                throw new Error(
                                    "Impossible de créer le canvas vidéo."
                                );

                            }


                            /*
                             * Image vidéo.
                             */

                            sample.draw(
                                ctx,
                                0,
                                0,
                                width,
                                height
                            );


                            /*
                             * Sous-titres.
                             *
                             * drawEditiloSubtitles()
                             * vérifie déjà track.visible.
                             */

                            drawEditiloSubtitles(
                                ctx,
                                width,
                                height,
                                sample.timestamp
                            );


                            return canvas;

                        }

                }

            });


        /* =================================================
           MIXAGE AUDIO
        ================================================= */

        const audioContext =
            new OfflineAudioContext(
                2,
                Math.ceil(
                    duration *
                    48000
                ),
                48000
            );


        let audioSourceCount =
            0;


        /* =================================================
           AJOUT SOURCE AUDIO AU MIX
        ================================================= */

        const addAudioBlob =
            async (
                blob,
                start,
                sourceStart,
                clipDuration,
                speed,
                volume
            ) => {

                if (
                    !blob ||
                    clipDuration <= 0 ||
                    volume <= 0
                ) {

                    return;

                }


                /*
                 * Source complètement après
                 * la fenêtre exportée.
                 */

                if (
                    start >= duration
                ) {

                    return;

                }


                const arrayBuffer =
                    await blob.arrayBuffer();


                const audioBuffer =
                    await audioContext.decodeAudioData(
                        arrayBuffer.slice(0)
                    );


                if (
                    !audioBuffer
                ) {

                    return;

                }


                const source =
                    audioContext.createBufferSource();


                source.buffer =
                    audioBuffer;


                source.playbackRate.value =
                    Math.max(
                        0.01,
                        speed
                    );


                const gain =
                    audioContext.createGain();


                gain.gain.value =
                    clamp(
                        volume,
                        0,
                        1
                    );


                source.connect(
                    gain
                );


                gain.connect(
                    audioContext.destination
                );


                /* =========================================
                   SOURCE START
                ========================================= */

                const safeSourceStart =
                    Math.max(
                        0,
                        Math.min(
                            sourceStart,
                            Math.max(
                                0,
                                audioBuffer.duration -
                                0.001
                            )
                        )
                    );


                const availableSourceDuration =
                    Math.max(
                        0,
                        audioBuffer.duration -
                        safeSourceStart
                    );


                const safeSpeed =
                    Math.max(
                        0.01,
                        speed
                    );


                const requestedSourceDuration =
                    clipDuration *
                    safeSpeed;


                const actualSourceDuration =
                    Math.min(
                        requestedSourceDuration,
                        availableSourceDuration
                    );


                if (
                    actualSourceDuration <=
                    0
                ) {

                    return;

                }


                /* =========================================
                   POSITION DE SORTIE
                ========================================= */

                let outputStart =
                    Math.max(
                        0,
                        start
                    );


                let actualSourceOffset =
                    safeSourceStart;


                /*
                 * Clip qui commence avant 0.
                 */

                if (
                    start < 0
                ) {

                    actualSourceOffset +=
                        Math.abs(
                            start
                        ) *
                        safeSpeed;

                }


                if (
                    outputStart >=
                    duration
                ) {

                    return;

                }


                const remainingOutputDuration =
                    duration -
                    outputStart;


                const finalSourceDuration =
                    Math.min(
                        actualSourceDuration,
                        remainingOutputDuration *
                        safeSpeed
                    );


                if (
                    finalSourceDuration <=
                    0
                ) {

                    return;

                }


                /* =========================================
                   PLANIFICATION
                ========================================= */

                source.start(
                    outputStart,
                    actualSourceOffset,
                    finalSourceDuration
                );


                source.stop(
                    Math.min(
                        duration,
                        outputStart +
                        (
                            finalSourceDuration /
                            safeSpeed
                        )
                    )
                );


                audioSourceCount++;

            };


        /* =================================================
   AUDIO ORIGINAL DE CHAQUE CLIP VIDÉO
================================================= */

let originalVideoAudioCount =
    0;


if (
    audioTrack
) {

    for (
        const track of
        state.videos
    ) {

        if (
            !track.clips
        ) {

            continue;

        }


        for (
            const clip of
            track.clips
        ) {

            if (
                !clip
            ) {

                continue;

            }


            /*
             * Clip masqué :
             * aucune image et aucun son à exporter.
             */

            if (
                clip.visible ===
                false
            ) {

                continue;

            }


            /*
             * Clip muet :
             * on conserve l'image mais pas son audio.
             */

            if (
                clip.muted ===
                true
            ) {

                console.log(
                    "[Editilo] Audio vidéo désactivé pour :",
                    clip.name
                );

                continue;

            }


            const volume =
                clamp(
                    Number(
                        clip.volume ??
                        1
                    ),
                    0,
                    1
                );


            if (
                volume <=
                0
            ) {

                continue;

            }


            const source =
                state.videoSources.get(
                    clip.sourceId
                );


            if (
                !source
            ) {

                continue;

            }


            /*
             * Chaque clip utilise sa propre source vidéo.
             */

            const clipBlob =
                clip.sourceId ===
                videoStateSource.id
                    ? videoBlob
                    : await fetchSourceBlob(
                        source.url
                    );


            const clipStart =
                Math.max(
                    0,
                    Number(
                        clip.start
                    ) ||
                    0
                );


            const clipDuration =
                Number(
                    clip.duration
                ) ||
                0;


            const sourceStart =
                Number(
                    clip.sourceStart
                ) ||
                0;


            const speed =
                Number(
                    clip.speed
                ) ||
                1;


            if (
                clipDuration <=
                0 ||
                clipStart >=
                duration
            ) {

                continue;

            }


            await addAudioBlob(

                clipBlob,

                clipStart,

                sourceStart,

                Math.min(
                    clipDuration,
                    duration -
                    clipStart
                ),

                speed,

                volume

            );


            originalVideoAudioCount++;


            console.log(
                "[Editilo] Audio vidéo ajouté :",
                clip.name,
                "| début :",
                clipStart.toFixed(2),
                "| durée :",
                clipDuration.toFixed(2),
                "| mute :",
                clip.muted === true
            );

        }

    }

}


console.log(
    "[Editilo] Clips audio vidéo actifs :",
    originalVideoAudioCount
);


        /* =================================================
           SONS EXTERNES
        ================================================= */

        let externalAudioCount =
            0;


        for (
            const track of
            state.audios
        ) {

            /*
             * Respect du bouton mute de la piste.
             */

            if (
                track.muted
            ) {

                continue;

            }


            if (
                !track.clips
            ) {

                continue;

            }


            for (
                const clip of
                track.clips
            ) {

                if (
                    !clip
                ) {

                    continue;

                }


                const volume =
                    Number(
                        clip.volume ??
                        1
                    );


                if (
                    volume <=
                    0
                ) {

                    continue;

                }


                const audioStateSource =
                    state.audioSources.get(
                        clip.sourceId
                    );


                if (
                    !audioStateSource
                ) {

                    continue;

                }


                const blob =
                    await fetchSourceBlob(
                        audioStateSource.url
                    );


                const start =
                    Number(
                        clip.start
                    ) ||
                    0;


                const sourceStart =
                    Number(
                        clip.sourceStart
                    ) ||
                    0;


                const clipDuration =
                    Number(
                        clip.duration
                    ) ||
                    0;


                const speed =
                    Number(
                        clip.speed
                    ) ||
                    1;


                if (
                    clipDuration <=
                    0
                ) {

                    continue;

                }


                await addAudioBlob(

                    blob,

                    start,

                    sourceStart,

                    clipDuration,

                    speed,

                    volume

                );


                externalAudioCount++;

            }

        }


        console.log(
            "[Editilo] Sons externes :",
            externalAudioCount
        );


        /* =================================================
           RENDU DU MIXAGE AUDIO
        ================================================= */

        button.innerHTML =
            "Mixage audio...";


        const mixedAudioBuffer =
            await audioContext.startRendering();


        /* =================================================
           AAC
        ================================================= */

        const encodedAudio =
            new AudioSampleSource({

                codec:
                    "aac",

                quality:
                    new Quality({

                        bitrate:
                            Math.max(
                                128_000,
                                (
                                    Number(
                                        state.exportAudioBitrate
                                    ) ||
                                    192
                                ) *
                                1000
                            )

                    })

            });


        /* =================================================
           AUDIO BUFFER → AUDIO SAMPLES
        ================================================= */

        const audioSamples =
            AudioSample.fromAudioBuffer(
                mixedAudioBuffer,
                0
            );


        /* =================================================
           SORTIE MP4
        ================================================= */

        const target =
            new BufferTarget();


        const output =
            new Output({

                format:
                    new Mp4OutputFormat({

                        fastStart:
                            "in-memory"

                    }),

                target

            });


        output.addVideoTrack(
            encodedVideo
        );


        output.addAudioTrack(
            encodedAudio
        );


        await output.start();


        /* =================================================
           ENCODAGE
        ================================================= */

        button.innerHTML =
            "Encodage vidéo...";


        const startTime =
            performance.now();


        let videoFrames =
            0;


        let audioSamplesCount =
            0;


        /* =================================================
           ENCODAGE VIDÉO
        ================================================= */

        for await (
            const sample of
            videoSink.samples(
                0,
                duration
            )
        ) {

            await encodedVideo.add(
                sample
            );


            videoFrames++;


            const currentTimestamp =
                sample.timestamp;


            sample.close();


            if (
                videoFrames %
                30 ===
                0
            ) {

                const progress =
                    duration > 0
                        ? Math.min(
                            100,
                            (
                                currentTimestamp /
                                duration
                            ) *
                            100
                        )
                        : 0;


                button.innerHTML =
                    `Encodage vidéo... ${Math.round(
                        progress
                    )}%`;

            }

        }


        /* =================================================
           ENCODAGE AUDIO
        ================================================= */

        for (
            const sample of
            audioSamples
        ) {

            await encodedAudio.add(
                sample
            );


            sample.close();


            audioSamplesCount++;

        }


        /* =================================================
           FERMETURE
        ================================================= */

        encodedVideo.close();


        encodedAudio.close();


        /* =================================================
           FINALISATION
        ================================================= */

        button.innerHTML =
            "Finalisation du MP4...";


        await output.finalize();


        const elapsed =
            performance.now() -
            startTime;


        const buffer =
            target.buffer;


        if (
            !buffer
        ) {

            throw new Error(
                "Aucun fichier MP4 produit."
            );

        }


        /* =================================================
           BLOB
        ================================================= */

        const blob =
            new Blob(
                [
                    buffer
                ],
                {
                    type:
                        "video/mp4"
                }
            );


        /* =================================================
           TÉLÉCHARGEMENT
        ================================================= */

        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "editilo-video.mp4";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            5000
        );


        /* =================================================
           STATISTIQUES
        ================================================= */

        const realtimeFactor =
            duration /
            (
                elapsed /
                1000
            );


        console.log(
            "[Editilo] Export WebCodecs terminé."
        );


        console.log(
            "[Editilo] Durée :",
            duration.toFixed(2),
            "s"
        );


        console.log(
            "[Editilo] Résolution :",
            `${width}x${height}`
        );


        console.log(
            "[Editilo] Frames vidéo :",
            videoFrames
        );


        console.log(
            "[Editilo] Échantillons audio :",
            audioSamplesCount
        );


        console.log(
            "[Editilo] Sources audio externes :",
            externalAudioCount
        );


        console.log(
            "[Editilo] Temps :",
            (
                elapsed /
                1000
            ).toFixed(2),
            "s"
        );


        console.log(
            "[Editilo] Facteur temps réel :",
            realtimeFactor.toFixed(2),
            "x"
        );


        console.log(
            "[Editilo] Taille MP4 :",
            (
                buffer.byteLength /
                1024 /
                1024
            ).toFixed(2),
            "MB"
        );


        /* =================================================
           FIN UI
        ================================================= */

        button.innerHTML =
            "Exporté ✓";


        setTimeout(
            () => {

                button.innerHTML =
                    originalText;


                button.disabled =
                    false;

            },
            1500
        );


    } catch (
        error
    ) {

        console.error(
            "[Editilo] Export WebCodecs :",
            error
        );


        console.error(
            "[Editilo] Message :",
            error?.message
        );


        console.error(
            "[Editilo] Stack :",
            error?.stack
        );


        alert(
            "Impossible d'exporter la vidéo. Consultez la console pour plus de détails."
        );


        button.innerHTML =
            originalText;


        button.disabled =
            false;

    }

}

/* =========================================================
   EXPORT MP4
========================================================= */

async function exportMP4() {

    if (
        !state.duration ||
        !dom.videoExportConfirmButton
    ) {
        return;
    }

    const button =
        dom.videoExportConfirmButton;

    const originalText =
        button.innerHTML;

    button.disabled =
        true;

    button.innerHTML =
        "Chargement de l'export...";

    try {

        /* =================================================
           FFmpeg
        ================================================= */

        const ffmpeg =
            await loadFFmpeg();

        const fetchFile =
            ffmpeg.__fetchFile;


        /* =================================================
           PROGRESSION
        ================================================= */

        ffmpeg.on(
            "progress",
            ({
                progress
            }) => {

                if (
                    typeof progress ===
                    "number"
                ) {

                    button.innerHTML =
                        `Exportation... ${Math.round(
                            progress * 100
                        )}%`;

                }

            }
        );


        /* =================================================
           RÉSOLUTION NATIVE
        ================================================= */

        let firstVideoSource =
            null;

        for (
            const track of
            state.videos
        ) {

            if (
                !track.clips ||
                !track.clips.length
            ) {
                continue;
            }

            const clip =
                track.clips[0];

            if (
                !clip
            ) {
                continue;
            }

            firstVideoSource =
                state.videoSources.get(
                    clip.sourceId
                );

            if (
                firstVideoSource
            ) {
                break;
            }

        }

        const dimensions =
            await getVideoSourceDimensions(
                firstVideoSource
            );


        const width =
            dimensions.width -
            (
                dimensions.width % 2
            );

        const height =
            dimensions.height -
            (
                dimensions.height % 2
            );


        /* =================================================
           SOURCES VIDÉO
        ================================================= */

        const sourceFiles =
            new Map();

        for (
            const track of
            state.videos
        ) {

            for (
                const clip of
                track.clips
            ) {

                if (
                    sourceFiles.has(
                        clip.sourceId
                    )
                ) {
                    continue;
                }

                const source =
                    state.videoSources.get(
                        clip.sourceId
                    );

                if (
                    !source
                ) {
                    continue;
                }

                const blob =
                    await fetchSourceBlob(
                        source.url
                    );

                const filename =
                    `video_${sourceFiles.size}.${(
                        source.name
                            ?.split(".")
                            .pop()
                        ||
                        "mp4"
                    ).toLowerCase()}`;

                await ffmpeg.writeFile(
                    filename,
                    await fetchFile(
                        blob
                    )
                );

                sourceFiles.set(
                    clip.sourceId,
                    filename
                );

            }

        }
                /* =================================================
           SOURCES AUDIO
        ================================================= */

        const audioFiles =
            new Map();

        for (
            const track of
            state.audios
        ) {

            for (
                const clip of
                track.clips
            ) {

                if (
                    audioFiles.has(
                        clip.sourceId
                    )
                ) {
                    continue;
                }

                const source =
                    state.audioSources.get(
                        clip.sourceId
                    );

                if (
                    !source
                ) {
                    continue;
                }

                const blob =
                    await fetchSourceBlob(
                        source.url
                    );

                const filename =
                    `audio_${audioFiles.size}.${(
                        source.name
                            ?.split(".")
                            .pop()
                        ||
                        "mp3"
                    ).toLowerCase()}`;

                await ffmpeg.writeFile(
                    filename,
                    await fetchFile(
                        blob
                    )
                );

                audioFiles.set(
                    clip.sourceId,
                    filename
                );

            }

        }


        /* =================================================
           SEGMENTS
        ================================================= */

        const segments =
            buildVideoSegments();

        if (
            segments.length === 0
        ) {

            segments.push({

                start:
                    0,

                end:
                    state.duration,

                clip:
                    null,

                track:
                    null

            });

        }


        const filterParts = [];
        const videoLabels = [];
        const audioLabels = [];

        let inputIndex =
            0;


        /* =================================================
           INDEX VIDÉO
        ================================================= */

        const inputIndexes =
            new Map();

        for (
            const filename of
            sourceFiles.values()
        ) {

            inputIndexes.set(
                filename,
                inputIndex
            );

            inputIndex++;

        }


        /* =================================================
           INDEX AUDIO
        ================================================= */

        const audioInputIndexes =
            new Map();

        for (
            const filename of
            audioFiles.values()
        ) {

            audioInputIndexes.set(
                filename,
                inputIndex
            );

            inputIndex++;

        }


        /* =================================================
           SEGMENTS VIDÉO
        ================================================= */

        segments.forEach(
            (
                segment,
                segmentIndex
            ) => {

                const duration =
                    segment.end -
                    segment.start;

                if (
                    segment.clip
                ) {

                    const source =
                        state.videoSources.get(
                            segment.clip.sourceId
                        );

                    const filename =
                        sourceFiles.get(
                            segment.clip.sourceId
                        );

                    const input =
                        inputIndexes.get(
                            filename
                        );

                    const clip =
                        segment.clip;

                    const speed =
                        Number(
                            clip.speed
                        ) ||
                        1;

                    const sourceStart =
                        Number(
                            clip.sourceStart
                        ) ||
                        0;

                    const clipOffset =
                        Math.max(
                            0,
                            segment.start -
                            clip.start
                        );

                    const sourceOffset =
                        sourceStart +
                        clipOffset *
                        speed;

                    const sourceEnd =
                        sourceOffset +
                        duration *
                        speed;

                    const label =
                        `vseg${segmentIndex}`;

                    const videoFilters = [

                        `trim=start=${sourceOffset}:end=${sourceEnd}`,

                        "setpts=PTS-STARTPTS"

                    ];

                    if (
                        speed !== 1
                    ) {

                        videoFilters.push(
                            `setpts=PTS/${speed}`
                        );

                    }

                    /*
                     * Pas de scale/pad :
                     * résolution native.
                     */

                    videoFilters.push(
                        "setsar=1"
                    );

                    filterParts.push(

                        `[${input}:v]` +
                        videoFilters.join(",") +
                        `[${label}]`

                    );

                    videoLabels.push(
                        `[${label}]`
                    );


                    /* =====================================
                       AUDIO DE LA VIDÉO
                    ===================================== */

                    if (
                        segment.track &&
                        !segment.track.muted &&
                        (
                            clip.volume ??
                            1
                        ) > 0
                    ) {

                        const audioLabel =
                            `vaseg${segmentIndex}`;

                        filterParts.push(

                            `[${input}:a]` +
                            `atrim=` +
                            `start=${sourceOffset}:` +
                            `end=${sourceEnd},` +
                            `asetpts=PTS-STARTPTS,` +
                            getAtempoFilters(
                                speed
                            ) +
                            `,volume=${clamp(
                                clip.volume ??
                                1,
                                0,
                                1
                            )}` +
                            `[${audioLabel}]`

                        );

                        audioLabels.push({

                            label:
                                audioLabel,

                            delay:
                                segment.start

                        });

                    }

                } else {

                    const label =
                        `vseg${segmentIndex}`;

                    filterParts.push(

                        `color=` +
                        `c=black:` +
                        `s=${width}x${height}:` +
                        `r=30:` +
                        `d=${duration}` +
                        `[${label}]`

                    );

                    videoLabels.push(
                        `[${label}]`
                    );

                }

            }
        );


        /* =================================================
           CONCATÉNATION VIDÉO
        ================================================= */

        filterParts.push(

            videoLabels.join("") +
            `concat=n=${videoLabels.length}:` +
            `v=1:a=0` +
            `[vout]`

        );
                /* =================================================
           AUDIOS INDÉPENDANTS
        ================================================= */

        state.audios.forEach(
            track => {

                track.clips.forEach(
                    clip => {

                        if (
                            track.muted ||
                            (
                                clip.volume ??
                                1
                            ) <= 0
                        ) {
                            return;
                        }

                        const filename =
                            audioFiles.get(
                                clip.sourceId
                            );

                        const input =
                            audioInputIndexes.get(
                                filename
                            );

                        if (
                            input ===
                            undefined
                        ) {
                            return;
                        }

                        const sourceStart =
                            Number(
                                clip.sourceStart
                            ) ||
                            0;

                        const speed =
                            Number(
                                clip.speed
                            ) ||
                            1;

                        const sourceDuration =
                            clip.duration *
                            speed;

                        const label =
                            `abase${input}_${clip.id.replace(
                                /[^a-zA-Z0-9]/g,
                                ""
                            )}`;

                        filterParts.push(

                            `[${input}:a]` +
                            `atrim=` +
                            `start=${sourceStart}:` +
                            `duration=${sourceDuration},` +
                            `asetpts=PTS-STARTPTS,` +
                            getAtempoFilters(
                                speed
                            ) +
                            `,volume=${clamp(
                                clip.volume ??
                                1,
                                0,
                                1
                            )},` +
                            `adelay=${Math.round(
                                clip.start *
                                1000
                            )}:all=1` +
                            `[${label}]`

                        );

                        audioLabels.push({

                            label,

                            delay:
                                0

                        });

                    }
                );

            }
        );


        /* =================================================
           MIXAGE AUDIO
        ================================================= */

        let audioOutput =
            null;

        if (
            audioLabels.length
        ) {

            const labels =
                audioLabels.map(
                    item =>
                        `[${item.label}]`
                ).join("");

            filterParts.push(

                labels +
                `amix=` +
                `inputs=${audioLabels.length}:` +
                `duration=longest:` +
                `dropout_transition=0,` +
                `aresample=async=1` +
                `[aout]`

            );

            audioOutput =
                "[aout]";

        }


        /* =================================================
           SOUS-TITRES
        ================================================= */

        let subtitleCounter =
            0;

        state.subtitles.forEach(
            track => {

                if (
                    !track.visible
                ) {
                    return;
                }

                track.clips.forEach(
                    clip => {

                        if (
                            !String(
                                clip.text ||
                                ""
                            ).trim()
                        ) {
                            return;
                        }

                        const x =
                            (
                                clip.x ??
                                50
                            ) /
                            100 *
                            width;

                        const y =
                            (
                                clip.y ??
                                82
                            ) /
                            100 *
                            height;

                        const size =
                            Math.max(
                                12,
                                Math.round(
                                    (
                                        clip.size ||
                                        42
                                    ) *
                                    (
                                        width /
                                        1280
                                    )
                                )
                            );

                        const text =
                            escapeDrawText(
                                clip.text
                            );

                        const color =
                            hexToFFmpegColor(
                                clip.color
                            );

                        const output =
                            `vsub${subtitleCounter}`;

                        const input =
                            subtitleCounter === 0
                                ? "[vout]"
                                : `[vsub${subtitleCounter - 1}]`;

                        filterParts.push(

                            `${input}` +
                            `drawtext=` +
                            `text='${text}':` +
                            `fontcolor=#${color}:` +
                            `fontsize=${size}:` +
                            `x=${Math.round(x)}:` +
                            `y=${Math.round(y)}:` +
                            `enable='between(t,${clip.start},${clip.start + clip.duration})'` +
                            `[${output}]`

                        );

                        subtitleCounter++;

                    }
                );

            }
        );


        const finalVideoLabel =
            subtitleCounter > 0
                ? `[vsub${subtitleCounter - 1}]`
                : "[vout]";
                
                        /* =================================================
           SORTIE
        ================================================= */

        const outputName =
            "editilo-export.mp4";

        const filterComplex =
            filterParts.join(";");

        const inputArgs = [];


        /* =================================================
           ENTRÉES VIDÉO
        ================================================= */

        for (
            const filename of
            sourceFiles.values()
        ) {

            inputArgs.push(
                "-i",
                filename
            );

        }


        /* =================================================
           ENTRÉES AUDIO
        ================================================= */

        for (
            const filename of
            audioFiles.values()
        ) {

            inputArgs.push(
                "-i",
                filename
            );

        }


        button.innerHTML =
            "Exportation...";


        const ffmpegArgs = [

            ...inputArgs,

            "-filter_complex",
            filterComplex,

            "-map",
            finalVideoLabel

        ];


        if (
            audioOutput
        ) {

            ffmpegArgs.push(
                "-map",
                audioOutput
            );

        }


        ffmpegArgs.push(

            /* =========================================
               VIDÉO H.264
            ========================================= */

            "-c:v",
            "libx264",

            "-preset",
            "ultrafast",

            "-threads",
            "0",

            "-crf",
            "30",

            "-pix_fmt",
            "yuv420p",


            /* =========================================
               AUDIO AAC
            ========================================= */

            "-c:a",
            "aac",

            "-b:a",
            "192k",


            /* =========================================
               DURÉE
            ========================================= */

            "-t",
            String(
                state.duration
            ),


            /* =========================================
               MP4
            ========================================= */

            "-movflags",
            "+faststart",

            outputName

        );


        /* =================================================
           EXÉCUTION FFmpeg
        ================================================= */

        await ffmpeg.exec(
            ffmpegArgs
        );


        button.innerHTML =
            "Préparation du téléchargement...";


        const data =
            await ffmpeg.readFile(
                outputName
            );


        const blob =
            new Blob(
                [
                    data.buffer
                ],
                {
                    type:
                        "video/mp4"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            "editilo-video.mp4";


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            3000
        );


        /* =================================================
           NETTOYAGE
        ================================================= */

        try {

            await ffmpeg.deleteFile(
                outputName
            );

        } catch {}


        button.innerHTML =
            "Exporté ✓";


        setTimeout(
            () => {

                button.innerHTML =
                    originalText;

                button.disabled =
                    false;

            },
            1500
        );


    } catch (
        error
    ) {

        console.error(
            "Export FFmpeg :",
            error
        );


        alert(
            "Impossible d'exporter la vidéo. Consultez la console pour plus de détails."
        );


        button.innerHTML =
            originalText;

        button.disabled =
            false;

    }

}


/* =========================================================
   INIT
========================================================= */

ensureBaseTracks();

render();

saveHistory();

updateHistoryButtons();

setPlayIcon(false);
/* =========================================================
   CONTACT — ISOLÉ DU RESTE DE L'ÉDITEUR
========================================================= */

(() => {

    const contactModal =
        document.getElementById(
            "contactModal"
        );


    const contactClose =
        document.getElementById(
            "contactClose"
        );


    const contactCancel =
        document.getElementById(
            "contactCancel"
        );


    const contactTriggers =
        document.querySelectorAll(
            ".contact-trigger"
        );


    const contactOverlay =
        document.querySelector(
            "[data-close-contact]"
        );


    const contactForm =
        document.getElementById(
            "contactForm"
        );


    const contactMessage =
        document.getElementById(
            "contactMessage"
        );


    const messageCounter =
        document.getElementById(
            "messageCounter"
        );


    const contactStatus =
        document.getElementById(
            "contactStatus"
        );


    /* =====================================================
       OUVRIR
    ====================================================== */

    function openVideoContact() {

        if (!contactModal) {
            return;
        }


        contactModal.classList.add(
            "open"
        );


        contactModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";


        if (contactStatus) {

            contactStatus.textContent =
                "";

            contactStatus.className =
                "contact-status";

        }


        setTimeout(
            () => {

                const firstField =
                    document.getElementById(
                        "contactFirstName"
                    );


                if (firstField) {
                    firstField.focus();
                }

            },
            120
        );

    }


    /* =====================================================
       FERMER
    ====================================================== */

    function closeVideoContact() {

        if (!contactModal) {
            return;
        }


        contactModal.classList.remove(
            "open"
        );


        contactModal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        if (contactStatus) {

            contactStatus.textContent =
                "";

            contactStatus.className =
                "contact-status";

        }

    }


    /* =====================================================
       TRIGGERS
    ====================================================== */

    contactTriggers.forEach(
        trigger => {

            trigger.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openVideoContact();

                }
            );

        }
    );


    /* =====================================================
       FERMETURE
    ====================================================== */

    contactClose?.addEventListener(
        "click",
        closeVideoContact
    );


    contactCancel?.addEventListener(
        "click",
        closeVideoContact
    );


    contactOverlay?.addEventListener(
        "click",
        closeVideoContact
    );


    /* =====================================================
       ESC
    ====================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                contactModal &&
                contactModal.classList.contains("open")
            ) {

                closeVideoContact();

            }

        }
    );


    /* =====================================================
       COMPTEUR
    ====================================================== */

    function updateVideoMessageCounter() {

        if (
            !contactMessage ||
            !messageCounter
        ) {

            return;

        }


        const length =
            contactMessage.value.length;


        messageCounter.textContent =
            `${length} / 1000`;


        messageCounter.classList.remove(
            "warning",
            "danger"
        );


        if (
            length >= 900
        ) {

            messageCounter.classList.add(
                "warning"
            );

        }


        if (
            length >= 980
        ) {

            messageCounter.classList.add(
                "danger"
            );

        }

    }


    contactMessage?.addEventListener(
        "input",
        updateVideoMessageCounter
    );


    updateVideoMessageCounter();


    /* =====================================================
       FORMSPREE
    ====================================================== */

    contactForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!contactStatus) {
                return;
            }


            contactStatus.textContent =
                "Envoi en cours...";


            contactStatus.className =
                "contact-status";


            const submitButton =
                contactForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.style.opacity =
                    "0.7";

            }


            const formData =
                new FormData(
                    contactForm
                );


            try {

                const response =
                    await fetch(
                        "https://formspree.io/f/mwlenedj",
                        {

                            method:
                                "POST",

                            body:
                                formData,

                            headers:
                                {
                                    Accept:
                                        "application/json"
                                }

                        }
                    );


                if (
                    response.ok
                ) {

                    contactStatus.textContent =
                        "Votre message a bien été envoyé.";


                    contactStatus.className =
                        "contact-status success";


                    contactForm.reset();


                    updateVideoMessageCounter();


                    setTimeout(
                        closeVideoContact,
                        1800
                    );

                } else {

                    const data =
                        await response
                            .json()
                            .catch(
                                () => null
                            );


                    contactStatus.textContent =
                        data?.errors?.[0]?.message ||
                        "Impossible d'envoyer le message. Réessayez.";


                    contactStatus.className =
                        "contact-status error";

                }

            } catch (error) {

                console.error(
                    "Erreur Contact :",
                    error
                );


                contactStatus.textContent =
                    "Une erreur réseau est survenue. Réessayez.";


                contactStatus.className =
                    "contact-status error";

            }


            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.style.opacity =
                    "";

            }

        }
    );

})();
/* =========================================================
   BOUTON EXPORT WEBM
========================================================= */

dom.videoExportConfirmButton?.addEventListener(
    "click",
    WebCodecsMP4
);