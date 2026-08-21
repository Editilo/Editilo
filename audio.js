"use strict";


/* =========================================================
   ÉTAT GLOBAL
========================================================= */

const state = {

    audioContext: null,

    clips: [],

    activeClip: 0,

    position: 0,

    isPlaying: false,

    source: null,

    playStartedAt: 0,

    playStartPosition: 0,

    animationFrame: null,


    isRecording: false,

    recorder: null,

    recordingChunks: [],

    microphoneStream: null,

    recordingContext: null,

    recordingFrame: null,

    recordingTimer: null,

    recordingStartedAt: 0,


    history: [],

    historyIndex: -1,


    mergeMode: false,

    mergeSelection: [],


    fadeType: "in",

    volume: 100,

    exportFormat: "wav",

    bitrate: 192

};


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);


const emptyAudioMessage =
    $("emptyAudioMessage");

const clipsContainer =
    $("clipsContainer");

const undoButton =
    $("undoButton");

const redoButton =
    $("redoButton");

const seekBackwardButton =
    $("seekBackwardButton");

const seekForwardButton =
    $("seekForwardButton");

const playPauseButton =
    $("playPauseButton");

const playPauseIcon =
    $("playPauseIcon");

const currentPosition =
    $("currentPosition");

const toolHelpText =
    $("toolHelpText");


const openChoiceModal =
    $("openChoiceModal");

const choiceModal =
    $("choiceModal");

const closeChoiceModal =
    $("closeChoiceModal");

const choiceImportButton =
    $("choiceImportButton");

const choiceRecordButton =
    $("choiceRecordButton");


const importModal =
    $("importModal");

const closeImportModal =
    $("closeImportModal");

const chooseFileButton =
    $("chooseFileButton");

const audioFileInput =
    $("audioFileInput");

const dropZone =
    $("dropZone");


const recordModal =
    $("recordModal");

const closeRecordModal =
    $("closeRecordModal");

const recordStartButton =
    $("recordStartButton");

const recordStopButton =
    $("recordStopButton");

const recordingWaveCanvas =
    $("recordingWaveCanvas");

const recordingTimer =
    document.querySelector(
        ".recording-timer"
    );

const recordingStatus =
    document.querySelector(
        ".recording-status"
    );


const fadeModal =
    $("fadeModal");

const closeFadeModal =
    $("closeFadeModal");

const fadeModalTitle =
    $("fadeModalTitle");

const automaticFade =
    $("automaticFade");

const manualFade =
    $("manualFade");

const fadeDuration =
    $("fadeDuration");

const applyFadeButton =
    $("applyFadeButton");


const volumeModal =
    $("volumeModal");

const closeVolumeModal =
    $("closeVolumeModal");

const volumeSlider =
    $("volumeSlider");

const volumeValue =
    $("volumeValue");

const applyVolumeButton =
    $("applyVolumeButton");


const exportModal =
    $("exportModal");

const closeExportModal =
    $("closeExportModal");

const openExportModal =
    $("openExportModal");

const exportConfirmButton =
    $("exportConfirmButton");

const formatButtons =
    document.querySelectorAll(
        ".format-button"
    );

const bitrateGroup =
    $("bitrateGroup");

const bitrateSlider =
    $("bitrateSlider");

const bitrateValue =
    $("bitrateValue");


/* =========================================================
   AUDIO CONTEXT
========================================================= */

function getAudioContext() {

    if (!state.audioContext) {

        state.audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }

    return state.audioContext;

}


/* =========================================================
   UTILITAIRES
========================================================= */

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


function formatTime(
    seconds
) {

    if (
        !Number.isFinite(seconds)
    ) {

        return "00:00";

    }

    const total =
        Math.max(
            0,
            Math.floor(seconds)
        );

    const minutes =
        Math.floor(
            total / 60
        );

    const remaining =
        total % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );

}


function cloneBuffer(buffer) {

    const context =
        getAudioContext();

    const clone =
        context.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

    for (
        let channel = 0;
        channel < buffer.numberOfChannels;
        channel++
    ) {

        clone.copyToChannel(
            buffer.getChannelData(channel),
            channel
        );

    }

    return clone;

}


function cloneClips(clips) {

    return clips.map(
        clip => cloneBuffer(clip)
    );

}


/* =========================================================
   WAVEFORM SVG
========================================================= */

function drawClipWave(
    svg,
    buffer,
    clipIndex
) {

    if (!svg || !buffer) {
        return;
    }

    const NS =
        "http://www.w3.org/2000/svg";

    const rect =
        svg.getBoundingClientRect();

    const width =
        Math.max(
            1,
            Math.floor(rect.width)
        );

    const height =
        Math.max(
            1,
            Math.floor(rect.height)
        );

    const columns =
        Math.max(
            1,
            Math.min(
                1200,
                width
            )
        );

    const center =
        height / 2;

    svg.innerHTML = "";

    svg.setAttribute(
        "viewBox",
        `0 0 ${columns} ${height}`
    );

    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );

    const channels = [];

    for (
        let channel = 0;
        channel < buffer.numberOfChannels;
        channel++
    ) {

        channels.push(
            buffer.getChannelData(channel)
        );

    }

    const totalSamples =
        buffer.length;

    const samplesPerColumn =
        totalSamples / columns;

    const waveform =
        new Float32Array(
            columns * 2
        );

    for (
        let column = 0;
        column < columns;
        column++
    ) {

        const start =
            Math.floor(
                column *
                samplesPerColumn
            );

        const end =
            Math.min(
                totalSamples,
                Math.max(
                    start + 1,
                    Math.floor(
                        (column + 1) *
                        samplesPerColumn
                    )
                )
            );

        let minimum = 1;
        let maximum = -1;

        const range =
            end - start;

        const step =
            Math.max(
                1,
                Math.ceil(
                    range / 80
                )
            );

        for (
            let sample = start;
            sample < end;
            sample += step
        ) {

            let value = 0;

            for (
                let channel = 0;
                channel < channels.length;
                channel++
            ) {

                value +=
                    channels[channel][sample];

            }

            value /=
                channels.length;

            minimum =
                Math.min(
                    minimum,
                    value
                );

            maximum =
                Math.max(
                    maximum,
                    value
                );

        }

        waveform[column * 2] =
            minimum;

        waveform[column * 2 + 1] =
            maximum;

    }


    const defs =
        document.createElementNS(
            NS,
            "defs"
        );

    const gradient =
        document.createElementNS(
            NS,
            "linearGradient"
        );

    const gradientId =
        `editilo-wave-${clipIndex}`;

    gradient.setAttribute(
        "id",
        gradientId
    );

    gradient.setAttribute(
        "x1",
        "0%"
    );

    gradient.setAttribute(
        "x2",
        "100%"
    );

    gradient.setAttribute(
        "y1",
        "0%"
    );

    gradient.setAttribute(
        "y2",
        "0%"
    );

    [
        ["0%", "#7c3aed"],
        ["50%", "#3b82f6"],
        ["100%", "#06b6d4"]
    ].forEach(
        ([offset, color]) => {

            const stop =
                document.createElementNS(
                    NS,
                    "stop"
                );

            stop.setAttribute(
                "offset",
                offset
            );

            stop.setAttribute(
                "stop-color",
                color
            );

            gradient.appendChild(
                stop
            );

        }
    );

    defs.appendChild(
        gradient
    );

    svg.appendChild(
        defs
    );


    const centerLine =
        document.createElementNS(
            NS,
            "line"
        );

    centerLine.setAttribute(
        "x1",
        "0"
    );

    centerLine.setAttribute(
        "x2",
        String(columns)
    );

    centerLine.setAttribute(
        "y1",
        String(center)
    );

    centerLine.setAttribute(
        "y2",
        String(center)
    );

    centerLine.setAttribute(
        "stroke",
        "#edf0f5"
    );

    centerLine.setAttribute(
        "stroke-width",
        "1"
    );

    svg.appendChild(
        centerLine
    );


    let path = "";

    for (
        let column = 0;
        column < columns;
        column++
    ) {

        const minimum =
            waveform[column * 2];

        const maximum =
            waveform[column * 2 + 1];

        const top =
            center -
            maximum *
            height *
            0.38;

        const bottom =
            center -
            minimum *
            height *
            0.38;

        path +=
            `M ${column} ${top.toFixed(2)} ` +
            `L ${column} ${bottom.toFixed(2)} `;

    }


    const waveformPath =
        document.createElementNS(
            NS,
            "path"
        );

    waveformPath.setAttribute(
        "d",
        path
    );

    waveformPath.setAttribute(
        "fill",
        "none"
    );

    waveformPath.setAttribute(
        "stroke",
        `url(#${gradientId})`
    );

    waveformPath.setAttribute(
        "stroke-width",
        "1.6"
    );

    waveformPath.setAttribute(
        "stroke-linecap",
        "round"
    );

    svg.appendChild(
        waveformPath
    );

}


/* =========================================================
   RENDU
========================================================= */

function render() {

    const hasAudio =
        state.clips.length > 0;

    emptyAudioMessage.hidden =
        hasAudio;

    updateEditorAvailability();

    if (!hasAudio) {

        clipsContainer.innerHTML =
            "";

        updateHistoryButtons();
        updatePositionDisplay();

        return;
    }

    clipsContainer.innerHTML =
        "";

    state.clips.forEach(
        (clip, index) => {

            createClipElement(
                clip,
                index
            );

        }
    );

    updateCursor();
    updatePositionDisplay();
    updateHistoryButtons();
    updateMergeUI();
    updatePlayPauseUI();

}


/* =========================================================
   CLIP
========================================================= */

function createClipElement(
    clip,
    index
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "audio-clip";

    if (
        index === state.activeClip &&
        !state.mergeMode
    ) {

        article.classList.add(
            "active"
        );

    }

    if (
        state.mergeSelection.includes(
            index
        )
    ) {

        article.classList.add(
            "merge-selected"
        );

    }

    article.dataset.index =
        String(index);

    article.innerHTML = `

        <div class="audio-clip-wave">

            <svg
                class="wave-svg"
                aria-hidden="true"
            ></svg>

            <div
                class="clip-cursor"
                style="left:0%"
            ></div>

        </div>

    `;

    clipsContainer.appendChild(
        article
    );

    const svg =
        article.querySelector(
            ".wave-svg"
        );

    drawClipWave(
        svg,
        clip,
        index
    );


    article.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".wave-svg"
                )
            ) {
                return;
            }

            if (state.mergeMode) {

                handleMergeSelection(
                    index
                );

                return;
            }

            selectClip(index);

        }
    );


    svg.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            if (state.mergeMode) {

                handleMergeSelection(
                    index
                );

                return;
            }

            selectClip(
                index,
                false
            );

            setPositionFromPointer(
                event,
                svg,
                clip
            );

        }
    );


    svg.addEventListener(
        "pointermove",
        event => {

            if (
                state.mergeMode ||
                event.buttons !== 1
            ) {
                return;
            }

            setPositionFromPointer(
                event,
                svg,
                clip
            );

        }
    );

}


/* =========================================================
   POSITION SOURIS
========================================================= */

function setPositionFromPointer(
    event,
    svg,
    clip
) {

    const rect =
        svg.getBoundingClientRect();

    if (rect.width <= 0) {
        return;
    }

    const x =
        clamp(
            event.clientX -
            rect.left,
            0,
            rect.width
        );

    const ratio =
        x / rect.width;

    state.position =
        ratio * clip.duration;

    updateCursor();
    updatePositionDisplay();

}


/* =========================================================
   SÉLECTION CLIP
========================================================= */

function selectClip(
    index,
    resetPosition = true
) {

    if (
        index < 0 ||
        index >= state.clips.length
    ) {
        return;
    }

    stopPlayback();

    state.activeClip =
        index;

    if (resetPosition) {
        state.position = 0;
    }

    render();

}


/* =========================================================
   CURSEUR
========================================================= */

function updateCursor() {

    if (!state.clips.length) {
        return;
    }

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    const article =
        clipsContainer.querySelector(
            `[data-index="${state.activeClip}"]`
        );

    if (!article) {
        return;
    }

    const cursor =
        article.querySelector(
            ".clip-cursor"
        );

    if (!cursor) {
        return;
    }

    const percentage =
        clip.duration > 0
            ? (
                state.position /
                clip.duration
            ) * 100
            : 0;

    cursor.style.left =
        `${clamp(
            percentage,
            0,
            100
        )}%`;

}


/* =========================================================
   DISPONIBILITÉ
========================================================= */

function updateEditorAvailability() {

    const hasAudio =
        state.clips.length > 0;

    document
        .querySelectorAll(
            ".audio-tool-button"
        )
        .forEach(
            button => {

                const action =
                    button.dataset.action;

                button.disabled =
                    action === "merge"
                        ? state.clips.length < 2
                        : !hasAudio;

            }
        );

    seekBackwardButton.disabled =
        !hasAudio;

    seekForwardButton.disabled =
        !hasAudio;

    playPauseButton.disabled =
        !hasAudio;

    openExportModal.disabled =
        !hasAudio;

    toolHelpText.textContent =
        !hasAudio
            ? "Appuyez sur + pour commencer."
            : state.mergeMode
                ? "Sélectionnez deux audios dans l'ordre souhaité."
                : "Sélectionnez un audio et placez le curseur sur sa forme d'onde.";

}


/* =========================================================
   POSITION
========================================================= */

function updatePositionDisplay() {

    currentPosition.textContent =
        formatTime(
            state.position
        );

}


/* =========================================================
   LECTURE — CORRECTION DE SYNCHRONISATION
========================================================= */

function getCurrentPosition() {

    if (!state.isPlaying) {
        return state.position;
    }

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return 0;
    }

    const elapsed =
        getAudioContext().currentTime -
        state.playStartedAt;

    return clamp(
        state.playStartPosition +
        elapsed,
        0,
        clip.duration
    );

}


function playAudio() {

    if (!state.clips.length) {
        return;
    }

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    stopPlayback();

    if (
        state.position >=
        clip.duration
    ) {

        state.position = 0;

    }

    const context =
        getAudioContext();

    if (
        context.state ===
        "suspended"
    ) {

        context.resume();

    }


    /*
     * Position exacte au lancement.
     */

    state.playStartPosition =
        state.position;

    state.playStartedAt =
        context.currentTime;


    const source =
        context.createBufferSource();

    source.buffer =
        clip;

    source.connect(
        context.destination
    );

    state.source =
        source;

    state.isPlaying =
        true;


    source.onended =
        () => {

            if (
                state.source !==
                source
            ) {

                return;

            }

            state.position =
                clip.duration;

            state.isPlaying =
                false;

            state.source =
                null;

            updatePlayPauseUI();
            updateCursor();
            updatePositionDisplay();

        };


    source.start(
        0,
        state.playStartPosition
    );


    updatePlayPauseUI();
    animatePlayback();

}


function stopPlayback() {

    if (state.source) {

        if (state.isPlaying) {

            state.position =
                getCurrentPosition();

        }

        try {
            state.source.stop();
        } catch {}

        state.source =
            null;

    }

    state.isPlaying =
        false;

    if (state.animationFrame) {

        cancelAnimationFrame(
            state.animationFrame
        );

        state.animationFrame =
            null;

    }

    updatePlayPauseUI();

}


function togglePlayback() {

    if (state.isPlaying) {

        stopPlayback();

    } else {

        playAudio();

    }

}


function animatePlayback() {

    if (!state.isPlaying) {
        return;
    }

    state.position =
        getCurrentPosition();

    updateCursor();
    updatePositionDisplay();

    state.animationFrame =
        requestAnimationFrame(
            animatePlayback
        );

}


function updatePlayPauseUI() {

    playPauseIcon.textContent =
        state.isPlaying
            ? "❚❚"
            : "▶";

}


/* =========================================================
   AVANCE / RETOUR 0,1 S
========================================================= */

function seekBy(
    amount
) {

    if (!state.clips.length) {
        return;
    }

    if (state.isPlaying) {

        state.position =
            getCurrentPosition();

        stopPlayback();

    }

    const clip =
        state.clips[
            state.activeClip
        ];

    state.position =
        clamp(
            state.position +
            amount,
            0,
            clip.duration
        );

    updateCursor();
    updatePositionDisplay();

}


/* =========================================================
   COUPER
========================================================= */

function splitClip() {

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    const cutPosition =
        state.position;

    if (
        cutPosition <= 0.05 ||
        cutPosition >=
        clip.duration - 0.05
    ) {

        showMessage(
            "Placez le curseur à l'endroit où couper l'audio."
        );

        return;
    }

    stopPlayback();

    const splitSample =
        Math.floor(
            cutPosition *
            clip.sampleRate
        );

    const first =
        sliceBuffer(
            clip,
            0,
            splitSample
        );

    const second =
        sliceBuffer(
            clip,
            splitSample,
            clip.length
        );

    state.clips.splice(
        state.activeClip,
        1,
        first,
        second
    );

    state.position =
        first.duration;

    pushHistory();
    render();

}


function sliceBuffer(
    buffer,
    startSample,
    endSample
) {

    const result =
        getAudioContext()
            .createBuffer(
                buffer.numberOfChannels,
                endSample -
                startSample,
                buffer.sampleRate
            );

    for (
        let channel = 0;
        channel < buffer.numberOfChannels;
        channel++
    ) {

        result.copyToChannel(
            buffer
                .getChannelData(channel)
                .slice(
                    startSample,
                    endSample
                ),
            channel
        );

    }

    return result;

}


/* =========================================================
   SUPPRIMER
========================================================= */

function deleteClip() {

    if (!state.clips.length) {
        return;
    }

    stopPlayback();

    state.clips.splice(
        state.activeClip,
        1
    );

    state.activeClip =
        Math.min(
            state.activeClip,
            Math.max(
                0,
                state.clips.length - 1
            )
        );

    state.position = 0;

    if (
        state.clips.length === 0
    ) {

        state.history = [];
        state.historyIndex = -1;

    } else {

        pushHistory();

    }

    render();

}


/* =========================================================
   FUSIONNER
========================================================= */

function startMergeMode() {

    if (
        state.clips.length < 2
    ) {
        return;
    }

    stopPlayback();

    state.mergeMode =
        true;

    state.mergeSelection =
        [];

    updateMergeUI();
    updateEditorAvailability();

    showMessage(
        "Sélectionnez le premier audio."
    );

}


function handleMergeSelection(index) {

    if (!state.mergeMode) {
        return;
    }

    if (
        state.mergeSelection.includes(
            index
        )
    ) {
        return;
    }

    state.mergeSelection.push(
        index
    );

    updateMergeUI();

    if (
        state.mergeSelection.length === 1
    ) {

        showMessage(
            "Sélectionnez maintenant le deuxième audio."
        );

        return;
    }

    mergeSelectedClips();

}


function mergeSelectedClips() {

    const firstIndex =
        state.mergeSelection[0];

    const secondIndex =
        state.mergeSelection[1];

    const first =
        state.clips[firstIndex];

    const second =
        state.clips[secondIndex];

    if (
        !first ||
        !second
    ) {

        cancelMergeMode();
        return;

    }

    if (
        first.sampleRate !==
        second.sampleRate
    ) {

        cancelMergeMode();

        showMessage(
            "Les deux audios doivent utiliser la même fréquence."
        );

        return;
    }

    const channels =
        Math.max(
            first.numberOfChannels,
            second.numberOfChannels
        );

    const merged =
        getAudioContext()
            .createBuffer(
                channels,
                first.length +
                second.length,
                first.sampleRate
            );

    for (
        let channel = 0;
        channel < channels;
        channel++
    ) {

        const output =
            merged.getChannelData(
                channel
            );

        output.set(
            first.getChannelData(
                Math.min(
                    channel,
                    first.numberOfChannels - 1
                )
            ),
            0
        );

        output.set(
            second.getChannelData(
                Math.min(
                    channel,
                    second.numberOfChannels - 1
                )
            ),
            first.length
        );

    }

    const insertPosition =
        Math.min(
            firstIndex,
            secondIndex
        );

    [
        firstIndex,
        secondIndex
    ]
        .sort(
            (a, b) => b - a
        )
        .forEach(
            index => {

                state.clips.splice(
                    index,
                    1
                );

            }
        );

    state.clips.splice(
        insertPosition,
        0,
        merged
    );

    state.activeClip =
        insertPosition;

    state.position =
        0;

    state.mergeMode =
        false;

    state.mergeSelection =
        [];

    pushHistory();
    render();

    showMessage(
        "Les deux audios ont été fusionnés."
    );

}


function cancelMergeMode() {

    state.mergeMode =
        false;

    state.mergeSelection =
        [];

    updateMergeUI();
    updateEditorAvailability();

}


function updateMergeUI() {

    document
        .querySelectorAll(
            ".audio-clip"
        )
        .forEach(
            article => {

                const index =
                    Number(
                        article.dataset.index
                    );

                article.classList.toggle(
                    "merge-selected",
                    state.mergeSelection.includes(
                        index
                    )
                );

                article.classList.toggle(
                    "active",
                    !state.mergeMode &&
                    index ===
                    state.activeClip
                );

            }
        );

}


/* =========================================================
   NORMALISER
========================================================= */

function normalizeClip() {

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    let peak = 0;

    for (
        let channel = 0;
        channel < clip.numberOfChannels;
        channel++
    ) {

        const data =
            clip.getChannelData(
                channel
            );

        for (
            let i = 0;
            i < data.length;
            i++
        ) {

            peak =
                Math.max(
                    peak,
                    Math.abs(
                        data[i]
                    )
                );

        }

    }

    if (peak <= 0) {
        return;
    }

    const factor =
        0.98 / peak;

    for (
        let channel = 0;
        channel < clip.numberOfChannels;
        channel++
    ) {

        const data =
            clip.getChannelData(
                channel
            );

        for (
            let i = 0;
            i < data.length;
            i++
        ) {

            data[i] *=
                factor;

        }

    }

    pushHistory();
    render();

}


/* =========================================================
   REVERSE
========================================================= */

function reverseClip() {

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    const reversed =
        getAudioContext()
            .createBuffer(
                clip.numberOfChannels,
                clip.length,
                clip.sampleRate
            );

    for (
        let channel = 0;
        channel < clip.numberOfChannels;
        channel++
    ) {

        const original =
            clip.getChannelData(
                channel
            );

        const output =
            new Float32Array(
                original.length
            );

        for (
            let i = 0;
            i < original.length;
            i++
        ) {

            output[i] =
                original[
                    original.length -
                    1 -
                    i
                ];

        }

        reversed.copyToChannel(
            output,
            channel
        );

    }

    state.clips[
        state.activeClip
    ] = reversed;

    state.position = 0;

    pushHistory();
    render();

}


/* =========================================================
   VOLUME
========================================================= */

function openVolume() {

    if (!state.clips.length) {
        return;
    }

    volumeSlider.value =
        String(
            state.volume
        );

    volumeValue.textContent =
        `${state.volume}%`;

    openModal(
        volumeModal
    );

}


function applyVolume() {

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    const gain =
        Number(
            volumeSlider.value
        ) / 100;

    for (
        let channel = 0;
        channel < clip.numberOfChannels;
        channel++
    ) {

        const data =
            clip.getChannelData(
                channel
            );

        for (
            let i = 0;
            i < data.length;
            i++
        ) {

            data[i] =
                clamp(
                    data[i] *
                    gain,
                    -1,
                    1
                );

        }

    }

    state.volume =
        Number(
            volumeSlider.value
        );

    closeModal(
        volumeModal
    );

    pushHistory();
    render();

}


/* =========================================================
   FADE
========================================================= */

function openFade(type) {

    if (!state.clips.length) {
        return;
    }

    state.fadeType =
        type;

    fadeModalTitle.textContent =
        type === "in"
            ? "Régler le fade in."
            : "Régler le fade out.";

    updateFadeForm();

    openModal(
        fadeModal
    );

}


function updateFadeForm() {

    fadeDuration.disabled =
        automaticFade.checked;

    manualFade.style.opacity =
        automaticFade.checked
            ? "0.45"
            : "1";

}


function applyFade() {

    const clip =
        state.clips[
            state.activeClip
        ];

    if (!clip) {
        return;
    }

    const duration =
        automaticFade.checked
            ? clip.duration * 0.1
            : Number(
                fadeDuration.value
            );

    const fadeDurationSeconds =
        clamp(
            duration,
            0.1,
            clip.duration
        );

    const samples =
        Math.floor(
            fadeDurationSeconds *
            clip.sampleRate
        );

    for (
        let channel = 0;
        channel < clip.numberOfChannels;
        channel++
    ) {

        const data =
            clip.getChannelData(
                channel
            );

        for (
            let i = 0;
            i < samples;
            i++
        ) {

            const ratio =
                i /
                Math.max(
                    1,
                    samples - 1
                );

            const gain =
                state.fadeType === "in"
                    ? ratio
                    : 1 - ratio;

            if (
                state.fadeType === "in"
            ) {

                data[i] *=
                    gain;

            } else {

                data[
                    data.length -
                    samples +
                    i
                ] *=
                    gain;

            }

        }

    }

    closeModal(
        fadeModal
    );

    pushHistory();
    render();

}


/* =========================================================
   HISTORIQUE
========================================================= */

function pushHistory() {

    const snapshot = {

        clips:
            cloneClips(
                state.clips
            ),

        activeClip:
            state.activeClip,

        position:
            state.position

    };

    if (
        state.historyIndex <
        state.history.length - 1
    ) {

        state.history =
            state.history.slice(
                0,
                state.historyIndex + 1
            );

    }

    state.history.push(
        snapshot
    );

    if (
        state.history.length > 15
    ) {

        state.history.shift();

    }

    state.historyIndex =
        state.history.length - 1;

    updateHistoryButtons();

}


function undo() {

    if (
        state.historyIndex <= 0
    ) {
        return;
    }

    stopPlayback();

    state.historyIndex--;

    const snapshot =
        state.history[
            state.historyIndex
        ];

    state.clips =
        cloneClips(
            snapshot.clips
        );

    state.activeClip =
        snapshot.activeClip;

    state.position =
        snapshot.position;

    state.mergeMode =
        false;

    state.mergeSelection =
        [];

    render();

}


function redo() {

    if (
        state.historyIndex >=
        state.history.length - 1
    ) {
        return;
    }

    stopPlayback();

    state.historyIndex++;

    const snapshot =
        state.history[
            state.historyIndex
        ];

    state.clips =
        cloneClips(
            snapshot.clips
        );

    state.activeClip =
        snapshot.activeClip;

    state.position =
        snapshot.position;

    state.mergeMode =
        false;

    state.mergeSelection =
        [];

    render();

}


function updateHistoryButtons() {

    undoButton.disabled =
        state.historyIndex <= 0;

    redoButton.disabled =
        state.historyIndex >=
        state.history.length - 1;

}


/* =========================================================
   IMPORT
========================================================= */

async function importAudioFile(file) {

    if (!file) {
        return;
    }

    if (
        !file.type.startsWith(
            "audio/"
        )
    ) {

        showMessage(
            "Veuillez sélectionner un fichier audio."
        );

        return;
    }

    try {

        const data =
            await file.arrayBuffer();

        const buffer =
            await getAudioContext()
                .decodeAudioData(
                    data.slice(0)
                );

        state.clips.push(
            buffer
        );

        state.activeClip =
            state.clips.length - 1;

        state.position =
            0;

        pushHistory();

        closeModal(
            importModal
        );

        closeModal(
            choiceModal
        );

        render();

    } catch (error) {

        console.error(
            "Import audio :",
            error
        );

        showMessage(
            "Impossible de lire ce fichier audio."
        );

    }

}


/* =========================================================
   ENREGISTREMENT
========================================================= */

async function startRecording() {

    if (state.isRecording) {
        return;
    }

    try {

        const stream =
            await navigator
                .mediaDevices
                .getUserMedia({
                    audio: true
                });

        state.microphoneStream =
            stream;

        const types = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus"
        ];

        const mimeType =
            types.find(
                type =>
                    MediaRecorder.isTypeSupported(
                        type
                    )
            );

        state.recorder =
            mimeType
                ? new MediaRecorder(
                    stream,
                    {
                        mimeType
                    }
                )
                : new MediaRecorder(
                    stream
                );

        state.recordingChunks =
            [];

        state.recorder.ondataavailable =
            event => {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    state.recordingChunks.push(
                        event.data
                    );

                }

            };

        state.recorder.onstop =
            async () => {

                try {

                    const blob =
                        new Blob(
                            state.recordingChunks,
                            {
                                type:
                                    state.recorder
                                        .mimeType ||
                                    "audio/webm"
                            }
                        );

                    const data =
                        await blob.arrayBuffer();

                    const buffer =
                        await getAudioContext()
                            .decodeAudioData(
                                data.slice(0)
                            );

                    state.clips.push(
                        buffer
                    );

                    state.activeClip =
                        state.clips.length - 1;

                    state.position =
                        0;

                    pushHistory();

                    closeModal(
                        recordModal
                    );

                    render();

                } catch (error) {

                    console.error(
                        "Enregistrement :",
                        error
                    );

                    showMessage(
                        "Impossible de traiter l'enregistrement."
                    );

                }

            };

        state.recorder.start(
            100
        );

        state.isRecording =
            true;

        state.recordingStartedAt =
            performance.now();

        recordStartButton.hidden =
            true;

        recordStopButton.hidden =
            false;

        recordingStatus.classList.add(
            "recording"
        );

        recordingStatus.innerHTML =
            "<span></span> Enregistrement en cours";

        startRecordingTimer();

        startRecordingWave(
            stream
        );

    } catch (error) {

        console.error(
            "Microphone :",
            error
        );

        showMessage(
            "L'accès au microphone a été refusé."
        );

    }

}


function stopRecording() {

    if (
        state.recorder &&
        state.recorder.state !==
        "inactive"
    ) {

        state.recorder.stop();

    }

    if (
        state.microphoneStream
    ) {

        state.microphoneStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }

    state.isRecording =
        false;

    stopRecordingVisuals();

}


function startRecordingTimer() {

    clearInterval(
        state.recordingTimer
    );

    state.recordingTimer =
        setInterval(
            () => {

                const elapsed =
                    (
                        performance.now() -
                        state.recordingStartedAt
                    ) /
                    1000;

                recordingTimer.textContent =
                    formatTime(
                        elapsed
                    );

            },
            50
        );

}


function startRecordingWave(
    stream
) {

    const context =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    const analyser =
        context.createAnalyser();

    analyser.fftSize =
        1024;

    const source =
        context.createMediaStreamSource(
            stream
        );

    source.connect(
        analyser
    );

    state.recordingContext =
        context;

    const draw =
        () => {

            if (
                !state.isRecording
            ) {

                return;

            }

            const rect =
                recordingWaveCanvas
                    .getBoundingClientRect();

            const ratio =
                window.devicePixelRatio ||
                1;

            recordingWaveCanvas.width =
                Math.max(
                    1,
                    Math.floor(
                        rect.width *
                        ratio
                    )
                );

            recordingWaveCanvas.height =
                Math.max(
                    1,
                    Math.floor(
                        rect.height *
                        ratio
                    )
                );

            const ctx =
                recordingWaveCanvas
                    .getContext(
                        "2d"
                    );

            ctx.setTransform(
                ratio,
                0,
                0,
                ratio,
                0,
                0
            );

            const data =
                new Uint8Array(
                    analyser.fftSize
                );

            analyser.getByteTimeDomainData(
                data
            );

            ctx.clearRect(
                0,
                0,
                rect.width,
                rect.height
            );

            const center =
                rect.height / 2;

            ctx.beginPath();

            ctx.strokeStyle =
                "#7c3aed";

            ctx.lineWidth =
                2;

            for (
                let i = 0;
                i < data.length;
                i++
            ) {

                const x =
                    i /
                    (data.length - 1) *
                    rect.width;

                const y =
                    center +
                    (
                        (
                            data[i] -
                            128
                        ) /
                        128
                    ) *
                    rect.height *
                    0.36;

                if (i === 0) {

                    ctx.moveTo(
                        x,
                        y
                    );

                } else {

                    ctx.lineTo(
                        x,
                        y
                    );

                }

            }

            ctx.stroke();

            state.recordingFrame =
                requestAnimationFrame(
                    draw
                );

        };

    draw();

}


function stopRecordingVisuals() {

    clearInterval(
        state.recordingTimer
    );

    state.recordingTimer =
        null;

    if (
        state.recordingFrame
    ) {

        cancelAnimationFrame(
            state.recordingFrame
        );

        state.recordingFrame =
            null;

    }

    if (
        state.recordingContext
    ) {

        state.recordingContext
            .close()
            .catch(
                () => {}
            );

        state.recordingContext =
            null;

    }

    recordStartButton.hidden =
        false;

    recordStopButton.hidden =
        true;

    recordingStatus.classList.remove(
        "recording"
    );

    recordingStatus.innerHTML =
        "<span></span> Prêt à enregistrer";

    recordingTimer.textContent =
        "00:00";

}


/* =========================================================
   EXPORT WAV
========================================================= */

function audioBufferToWav(
    buffer
) {

    const channels =
        buffer.numberOfChannels;

    const sampleRate =
        buffer.sampleRate;

    const bytesPerSample =
        2;

    const blockAlign =
        channels *
        bytesPerSample;

    const dataSize =
        buffer.length *
        blockAlign;

    const arrayBuffer =
        new ArrayBuffer(
            44 +
            dataSize
        );

    const view =
        new DataView(
            arrayBuffer
        );

    const writeString =
        (
            offset,
            text
        ) => {

            for (
                let i = 0;
                i < text.length;
                i++
            ) {

                view.setUint8(
                    offset + i,
                    text.charCodeAt(i)
                );

            }

        };

    writeString(
        0,
        "RIFF"
    );

    view.setUint32(
        4,
        36 + dataSize,
        true
    );

    writeString(
        8,
        "WAVE"
    );

    writeString(
        12,
        "fmt "
    );

    view.setUint32(
        16,
        16,
        true
    );

    view.setUint16(
        20,
        1,
        true
    );

    view.setUint16(
        22,
        channels,
        true
    );

    view.setUint32(
        24,
        sampleRate,
        true
    );

    view.setUint32(
        28,
        sampleRate * blockAlign,
        true
    );

    view.setUint16(
        32,
        blockAlign,
        true
    );

    view.setUint16(
        34,
        16,
        true
    );

    writeString(
        36,
        "data"
    );

    view.setUint32(
        40,
        dataSize,
        true
    );

    let offset = 44;

    for (
        let i = 0;
        i < buffer.length;
        i++
    ) {

        for (
            let channel = 0;
            channel < channels;
            channel++
        ) {

            const sample =
                clamp(
                    buffer.getChannelData(
                        channel
                    )[i],
                    -1,
                    1
                );

            view.setInt16(
                offset,
                sample < 0
                    ? sample * 0x8000
                    : sample * 0x7fff,
                true
            );

            offset += 2;

        }

    }

    return new Blob(
        [arrayBuffer],
        {
            type:
                "audio/wav"
        }
    );

}


function combineClips() {

    if (
        !state.clips.length
    ) {

        return null;

    }

    const sampleRate =
        state.clips[0].sampleRate;

    const channels =
        state.clips.reduce(
            (
                max,
                clip
            ) =>
                Math.max(
                    max,
                    clip.numberOfChannels
                ),
            1
        );

    const totalLength =
        state.clips.reduce(
            (
                total,
                clip
            ) =>
                total +
                clip.length,
            0
        );

    const output =
        getAudioContext()
            .createBuffer(
                channels,
                totalLength,
                sampleRate
            );

    let offset = 0;

    state.clips.forEach(
        clip => {

            for (
                let channel = 0;
                channel < channels;
                channel++
            ) {

                output
                    .getChannelData(
                        channel
                    )
                    .set(
                        clip.getChannelData(
                            Math.min(
                                channel,
                                clip.numberOfChannels - 1
                            )
                        ),
                        offset
                    );

            }

            offset +=
                clip.length;

        }
    );

    return output;

}


/* =========================================================
   MP3
========================================================= */

function audioBufferToMp3(
    buffer,
    bitrate
) {

    if (
        typeof lamejs ===
        "undefined"
    ) {

        throw new Error(
            "LameJS indisponible."
        );

    }

    const encoder =
        new lamejs.Mp3Encoder(
            buffer.numberOfChannels,
            buffer.sampleRate,
            bitrate
        );

    const channels = [];

    for (
        let channel = 0;
        channel < buffer.numberOfChannels;
        channel++
    ) {

        const source =
            buffer.getChannelData(
                channel
            );

        const data =
            new Int16Array(
                source.length
            );

        for (
            let i = 0;
            i < source.length;
            i++
        ) {

            const value =
                clamp(
                    source[i],
                    -1,
                    1
                );

            data[i] =
                value < 0
                    ? value * 0x8000
                    : value * 0x7fff;

        }

        channels.push(
            data
        );

    }

    const blockSize =
        1152;

    const parts = [];

    for (
        let offset = 0;
        offset < buffer.length;
        offset += blockSize
    ) {

        const left =
            channels[0].subarray(
                offset,
                offset + blockSize
            );

        const encoded =
            buffer.numberOfChannels > 1
                ? encoder.encodeBuffer(
                    left,
                    channels[1].subarray(
                        offset,
                        offset + blockSize
                    )
                )
                : encoder.encodeBuffer(
                    left
                );

        if (
            encoded.length
        ) {

            parts.push(
                new Int8Array(
                    encoded
                )
            );

        }

    }

    const finalData =
        encoder.flush();

    if (
        finalData.length
    ) {

        parts.push(
            new Int8Array(
                finalData
            )
        );

    }

    return new Blob(
        parts,
        {
            type:
                "audio/mpeg"
        }
    );

}


function downloadBlob(
    blob,
    filename
) {

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
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    setTimeout(
        () =>
            URL.revokeObjectURL(
                url
            ),
        1000
    );

}


function exportAudio() {

    try {

        const buffer =
            combineClips();

        if (!buffer) {
            return;
        }

        if (
            state.exportFormat ===
            "wav"
        ) {

            downloadBlob(
                audioBufferToWav(
                    buffer
                ),
                "editilo-audio.wav"
            );

        } else {

            downloadBlob(
                audioBufferToMp3(
                    buffer,
                    state.bitrate
                ),
                "editilo-audio.mp3"
            );

        }

        closeModal(
            exportModal
        );

    } catch (error) {

        console.error(
            "Export audio :",
            error
        );

        showMessage(
            "Impossible d'exporter l'audio."
        );

    }

}


/* =========================================================
   MODALES
========================================================= */

function openModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   BOUTON +
   + devient X quand le menu est ouvert
========================================================= */

function updatePlusButton() {

    if (!openChoiceModal) {
        return;
    }

    openChoiceModal.classList.toggle(
        "active",
        choiceModal.classList.contains(
            "open"
        )
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

    const message =
        document.createElement(
            "div"
        );

    message.textContent =
        text;

    Object.assign(
        message.style,
        {

            position:
                "fixed",

            left:
                "50%",

            bottom:
                "80px",

            transform:
                "translateX(-50%)",

            zIndex:
                "6000",

            padding:
                "11px 16px",

            borderRadius:
                "13px",

            background:
                "rgba(23,23,37,.95)",

            color:
                "#ffffff",

            fontSize:
                "12px",

            fontWeight:
                "700",

            boxShadow:
                "0 18px 35px rgba(20,20,35,.18)"

        }
    );

    document.body.appendChild(
        message
    );

    setTimeout(
        () =>
            message.remove(),
        2400
    );

}


/* =========================================================
   ACTIONS
========================================================= */

function performAction(action) {

    switch (action) {

        case "split":
            splitClip();
            break;

        case "merge":
            startMergeMode();
            break;

        case "delete":
            deleteClip();
            break;

        case "volume":
            openVolume();
            break;

        case "normalize":
            normalizeClip();
            break;

        case "reverse":
            reverseClip();
            break;

        case "fadeIn":
            openFade("in");
            break;

        case "fadeOut":
            openFade("out");
            break;

    }

}


/* =========================================================
   CHOIX
========================================================= */

openChoiceModal.addEventListener(
    "click",
    () => {

        if (
            choiceModal.classList.contains(
                "open"
            )
        ) {

            closeModal(
                choiceModal
            );

        } else {

            openModal(
                choiceModal
            );

        }

        updatePlusButton();

    }
);


closeChoiceModal.addEventListener(
    "click",
    () => {

        closeModal(
            choiceModal
        );

        updatePlusButton();

    }
);


document
    .querySelector(
        "[data-close-choice]"
    )
    .addEventListener(
        "click",
        () => {

            closeModal(
                choiceModal
            );

            updatePlusButton();

        }
    );


choiceImportButton.addEventListener(
    "click",
    () => {

        closeModal(
            choiceModal
        );

        updatePlusButton();

        openModal(
            importModal
        );

    }
);


choiceRecordButton.addEventListener(
    "click",
    () => {

        closeModal(
            choiceModal
        );

        updatePlusButton();

        openModal(
            recordModal
        );

    }
);


/* =========================================================
   IMPORT
========================================================= */

closeImportModal.addEventListener(
    "click",
    () =>
        closeModal(importModal)
);


document
    .querySelector(
        "[data-close-import]"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(importModal)
    );


chooseFileButton.addEventListener(
    "click",
    () =>
        audioFileInput.click()
);


audioFileInput.addEventListener(
    "change",
    () => {

        const file =
            audioFileInput.files[0];

        if (file) {

            importAudioFile(
                file
            );

        }

        audioFileInput.value =
            "";

    }
);


[
    "dragenter",
    "dragover"
].forEach(
    type => {

        dropZone.addEventListener(
            type,
            event => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.add(
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

        dropZone.addEventListener(
            type,
            event => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.remove(
                    "dragover"
                );

            }
        );

    }
);


dropZone.addEventListener(
    "drop",
    event => {

        const file =
            event.dataTransfer.files[0];

        if (file) {

            importAudioFile(
                file
            );

        }

    }
);


/* =========================================================
   ENREGISTREMENT
========================================================= */

closeRecordModal.addEventListener(
    "click",
    () => {

        if (state.isRecording) {

            showMessage(
                "Arrêtez d'abord l'enregistrement."
            );

            return;

        }

        closeModal(
            recordModal
        );

    }
);


document
    .querySelector(
        "[data-close-record]"
    )
    .addEventListener(
        "click",
        () => {

            if (state.isRecording) {

                showMessage(
                    "Arrêtez d'abord l'enregistrement."
                );

                return;

            }

            closeModal(
                recordModal
            );

        }
    );


recordStartButton.addEventListener(
    "click",
    startRecording
);


recordStopButton.addEventListener(
    "click",
    stopRecording
);


/* =========================================================
   PLAYBACK
========================================================= */

playPauseButton.addEventListener(
    "click",
    togglePlayback
);


seekBackwardButton.addEventListener(
    "click",
    () =>
        seekBy(-0.1)
);


seekForwardButton.addEventListener(
    "click",
    () =>
        seekBy(0.1)
);


/* =========================================================
   HISTORIQUE
========================================================= */

undoButton.addEventListener(
    "click",
    undo
);


redoButton.addEventListener(
    "click",
    redo
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey ||
            event.metaKey
        ) {

            if (
                event.key.toLowerCase() === "z"
            ) {

                event.preventDefault();

                undo();

            }

            if (
                event.key.toLowerCase() === "y"
            ) {

                event.preventDefault();

                redo();

            }

        }

    }
);


/* =========================================================
   OUTILS
========================================================= */

document
    .querySelectorAll(
        ".audio-tool-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !button.disabled
                    ) {

                        performAction(
                            button.dataset.action
                        );

                    }

                }
            );

        }
    );


/* =========================================================
   FADE
========================================================= */

closeFadeModal.addEventListener(
    "click",
    () =>
        closeModal(fadeModal)
);


document
    .querySelector(
        "[data-close-fade]"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(fadeModal)
    );


automaticFade.addEventListener(
    "change",
    updateFadeForm
);


applyFadeButton.addEventListener(
    "click",
    applyFade
);


/* =========================================================
   VOLUME
========================================================= */

closeVolumeModal.addEventListener(
    "click",
    () =>
        closeModal(volumeModal)
);


document
    .querySelector(
        "[data-close-volume]"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(volumeModal)
    );


volumeSlider.addEventListener(
    "input",
    () => {

        volumeValue.textContent =
            `${volumeSlider.value}%`;

    }
);


applyVolumeButton.addEventListener(
    "click",
    applyVolume
);


/* =========================================================
   EXPORT
========================================================= */

openExportModal.addEventListener(
    "click",
    () => {

        if (
            state.clips.length
        ) {

            openModal(
                exportModal
            );

        }

    }
);


closeExportModal.addEventListener(
    "click",
    () =>
        closeModal(exportModal)
);


document
    .querySelector(
        "[data-close-export]"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(exportModal)
);


formatButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                state.exportFormat =
                    button.dataset.format;

                formatButtons.forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item === button
                        );

                    }
                );

                bitrateGroup.hidden =
                    state.exportFormat !==
                    "mp3";

            }
        );

    }
);


bitrateSlider.addEventListener(
    "input",
    () => {

        state.bitrate =
            Number(
                bitrateSlider.value
            );

        bitrateValue.textContent =
            `${state.bitrate} kbps`;

    }
);


exportConfirmButton.addEventListener(
    "click",
    exportAudio
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {
            return;
        }

        if (
            state.isRecording
        ) {
            return;
        }

        closeModal(choiceModal);
        closeModal(importModal);
        closeModal(recordModal);
        closeModal(fadeModal);
        closeModal(volumeModal);
        closeModal(exportModal);

        updatePlusButton();

        if (
            state.mergeMode
        ) {

            cancelMergeMode();

        }

    }
);


/* =========================================================
   REDIMENSIONNEMENT
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            !state.clips.length
        ) {
            return;
        }

        state.clips.forEach(
            (
                clip,
                index
            ) => {

                const svg =
                    clipsContainer.querySelector(
                        `[data-index="${index}"] .wave-svg`
                    );

                if (svg) {

                    drawClipWave(
                        svg,
                        clip,
                        index
                    );

                }

            }
        );

        updateCursor();

    }
);


/* =========================================================
   INITIALISATION
========================================================= */

render();