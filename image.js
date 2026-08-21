"use strict";


/* =========================================================
   ÉTAT
========================================================= */

const imageState = {

    canvas:
        document.getElementById(
            "imageCanvas"
        ),

    context:
        document
            .getElementById(
                "imageCanvas"
            )
            .getContext("2d"),

    imageLoaded:
        false,

    activeMode:
        null,


    history:
        [],

    historyIndex:
        -1,


    rotation:
        0,

    flipX:
        false,

    flipY:
        false,


    brightness:
        0,

    contrast:
        0,

    saturation:
        0,

    blur:
        0,


    selectedColor:
        "#00FF00",

    tolerance:
        35,


    exportFormat:
        "png",

    exportQuality:
        0.9,


    cameraStream:
        null,


    adjustmentPreview:
        null,

    adjustmentType:
        null,


    crop: {

        active:
            false,

        dragging:
            false,

        resizing:
            false,

        handle:
            null,

        startX:
            0,

        startY:
            0,

        originalX:
            0,

        originalY:
            0,

        x:
            0,

        y:
            0,

        width:
            0,

        height:
            0

    },


    rotationSession: {

        active:
            false,

        startAngle:
            0,

        currentDelta:
            0,

        centerX:
            0,

        centerY:
            0

    },


    colorPicker: {

        hue:
            120,

        saturation:
            100,

        lightness:
            50

    }

};


/* =========================================================
   DOM
========================================================= */

const imageCanvas =
    imageState.canvas;

const imageCanvasWrapper =
    document.getElementById(
        "imageCanvasWrapper"
    );

const emptyImageMessage =
    document.getElementById(
        "emptyImageMessage"
    );

const imageLoadedEditor =
    document.getElementById(
        "imageLoadedEditor"
    );


const openImageChoice =
    document.getElementById(
        "openImageChoice"
    );

const imageChoiceModal =
    document.getElementById(
        "imageChoiceModal"
    );

const closeImageChoice =
    document.getElementById(
        "closeImageChoice"
    );

const imageImportChoice =
    document.getElementById(
        "imageImportChoice"
    );

const cameraChoice =
    document.getElementById(
        "cameraChoice"
    );


const imageImportModal =
    document.getElementById(
        "imageImportModal"
    );

const closeImageImport =
    document.getElementById(
        "closeImageImport"
    );

const imageChooseFile =
    document.getElementById(
        "imageChooseFile"
    );

const imageFileInput =
    document.getElementById(
        "imageFileInput"
    );

const imageDropZone =
    document.getElementById(
        "imageDropZone"
    );


const cameraModal =
    document.getElementById(
        "cameraModal"
    );

const closeCamera =
    document.getElementById(
        "closeCamera"
    );

const cameraVideo =
    document.getElementById(
        "cameraVideo"
    );

const cameraCanvas =
    document.getElementById(
        "cameraCanvas"
    );

const capturePhotoButton =
    document.getElementById(
        "capturePhotoButton"
    );


const rotateOverlay =
    document.getElementById(
        "rotateOverlay"
    );


const cropOverlay =
    document.getElementById(
        "cropOverlay"
    );

const cropSelection =
    document.getElementById(
        "cropSelection"
    );

const applyCropButton =
    document.getElementById(
        "applyCropButton"
    );


const resizeModal =
    document.getElementById(
        "resizeModal"
    );

const closeResize =
    document.getElementById(
        "closeResize"
    );

const imageWidth =
    document.getElementById(
        "imageWidth"
    );

const imageHeight =
    document.getElementById(
        "imageHeight"
    );

const lockAspectRatio =
    document.getElementById(
        "lockAspectRatio"
    );

const applyResize =
    document.getElementById(
        "applyResize"
    );


const adjustmentModal =
    document.getElementById(
        "adjustmentModal"
    );

const closeAdjustment =
    document.getElementById(
        "closeAdjustment"
    );

const adjustmentTitle =
    document.getElementById(
        "adjustmentTitle"
    );

const adjustmentSlider =
    document.getElementById(
        "adjustmentSlider"
    );

const adjustmentValue =
    document.getElementById(
        "adjustmentValue"
    );

const applyAdjustment =
    document.getElementById(
        "applyAdjustment"
    );


const blurModal =
    document.getElementById(
        "blurModal"
    );

const closeBlur =
    document.getElementById(
        "closeBlur"
    );

const blurSlider =
    document.getElementById(
        "blurSlider"
    );

const blurValue =
    document.getElementById(
        "blurValue"
    );

const applyBlur =
    document.getElementById(
        "applyBlur"
    );


const removeColorModal =
    document.getElementById(
        "removeColorModal"
    );

const closeRemoveColor =
    document.getElementById(
        "closeRemoveColor"
    );


/* =========================================================
   NUANCIER
========================================================= */

const colorSwatchButton =
    document.getElementById(
        "colorSwatchButton"
    );

const colorSwatchLabel =
    document.querySelector(
        ".color-swatch-label"
    );

const customColorPanel =
    document.getElementById(
        "customColorPanel"
    );

const colorSpectrum =
    document.getElementById(
        "colorSpectrum"
    );

const colorSpectrumCursor =
    document.getElementById(
        "colorSpectrumCursor"
    );

const colorHue =
    document.getElementById(
        "colorHue"
    );

const colorHueCursor =
    document.getElementById(
        "colorHueCursor"
    );

const customColorPreview =
    document.getElementById(
        "customColorPreview"
    );

const customColorHex =
    document.getElementById(
        "customColorHex"
    );

const customColorConfirm =
    document.getElementById(
        "customColorConfirm"
    );

const selectedColorPreview =
    document.getElementById(
        "selectedColorPreview"
    );


const eyedropperButton =
    document.getElementById(
        "eyedropperButton"
    );


const toleranceSlider =
    document.getElementById(
        "toleranceSlider"
    );

const toleranceValue =
    document.getElementById(
        "toleranceValue"
    );


const applyRemoveColor =
    document.getElementById(
        "applyRemoveColor"
    );


/* =========================================================
   PIPETTE
========================================================= */

const eyedropperIndicator =
    document.getElementById(
        "eyedropperIndicator"
    );

const eyedropperPreview =
    document.getElementById(
        "eyedropperPreview"
    );


/* =========================================================
   HISTORIQUE
========================================================= */

const imageUndoButton =
    document.getElementById(
        "imageUndoButton"
    );

const imageRedoButton =
    document.getElementById(
        "imageRedoButton"
    );

const imageToolHelp =
    document.getElementById(
        "imageToolHelp"
    );


/* =========================================================
   EXPORT
========================================================= */

const imageExportModal =
    document.getElementById(
        "imageExportModal"
    );

const closeImageExport =
    document.getElementById(
        "closeImageExport"
    );

const openImageExport =
    document.getElementById(
        "openImageExport"
    );

const imageFormatButtons =
    document.querySelectorAll(
        ".image-format-button"
    );

const imageQualityGroup =
    document.getElementById(
        "imageQualityGroup"
    );

const imageQualitySlider =
    document.getElementById(
        "imageQualitySlider"
    );

const imageQualityValue =
    document.getElementById(
        "imageQualityValue"
    );

const confirmImageExport =
    document.getElementById(
        "confirmImageExport"
    );


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


function openImageModal(
    modal
) {

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


function closeImageModal(
    modal
) {

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


function hexToRgb(
    hex
) {

    const clean =
        hex
            .replace(
                "#",
                ""
            )
            .padEnd(
                6,
                "0"
            );


    const value =
        parseInt(
            clean,
            16
        );


    return {

        r:
            (value >> 16) & 255,

        g:
            (value >> 8) & 255,

        b:
            value & 255

    };

}


function rgbToHex(
    r,
    g,
    b
) {

    const toHex =
        value =>
            Math.round(
                value
            )
                .toString(16)
                .padStart(
                    2,
                    "0"
                );


    return (
        "#" +
        toHex(r) +
        toHex(g) +
        toHex(b)
    ).toUpperCase();

}


function cloneCanvas(
    source
) {

    const copy =
        document.createElement(
            "canvas"
        );


    copy.width =
        source.width;

    copy.height =
        source.height;


    copy
        .getContext(
            "2d"
        )
        .drawImage(
            source,
            0,
            0
        );


    return copy;

}


/* =========================================================
   INTERFACE
========================================================= */

function updateImageEditorState() {

    const hasImage =
        imageState.imageLoaded;


    if (!hasImage) {

        exitEditModes();

    }


    emptyImageMessage.hidden =
        false;


    imageLoadedEditor.hidden =
        false;


    document
        .querySelectorAll(
            ".image-tool-button"
        )
        .forEach(
            button => {

                button.disabled =
                    !hasImage;

            }
        );


    openImageExport.disabled =
        !hasImage;


    imageUndoButton.disabled =
        !hasImage ||
        imageState.historyIndex <= 0;


    imageRedoButton.disabled =
        !hasImage ||
        imageState.historyIndex >=
        imageState.history.length - 1;


    imageToolHelp.textContent =
        hasImage
            ? "Sélectionnez un outil pour modifier votre image."
            : "Appuyez sur + pour commencer.";

}


/* =========================================================
   SORTIE DES MODES
========================================================= */

function exitEditModes() {

    imageState.activeMode =
        null;


    imageState.crop.active =
        false;

    imageState.crop.dragging =
        false;

    imageState.crop.resizing =
        false;

    imageState.crop.handle =
        null;


    imageState.rotationSession.active =
        false;


    imageState.adjustmentPreview =
        null;


    cropOverlay.hidden =
        true;


    applyCropButton.hidden =
        true;


    rotateOverlay.hidden =
        true;


    eyedropperIndicator.hidden =
        true;


    eyedropperIndicator.style.display =
        "none";


    imageCanvas.classList.remove(
        "eyedropper-active"
    );


    imageCanvas.style.transform =
        "";


    if (
        customColorPanel
    ) {

        customColorPanel.hidden =
            true;

    }

}


/* =========================================================
   AFFICHAGE CANVAS
========================================================= */

function updateCanvasDisplay() {

    if (
        !imageCanvas.width ||
        !imageCanvas.height
    ) {

        return;

    }


    const parentWidth =
        imageCanvasWrapper.parentElement
            ?.clientWidth ||
        1050;


    const maxWidth =
        Math.min(
            parentWidth - 20,
            1050
        );


    const maxHeight =
        620;


    const scale =
        Math.min(
            maxWidth /
                imageCanvas.width,

            maxHeight /
                imageCanvas.height,

            1
        );


    imageCanvas.style.width =
        `${Math.max(
            1,
            Math.round(
                imageCanvas.width *
                scale
            )
        )}px`;


    imageCanvas.style.height =
        `${Math.max(
            1,
            Math.round(
                imageCanvas.height *
                scale
            )
        )}px`;


    requestAnimationFrame(
        () => {

            updateCropOverlayPosition();

            updateRotateOverlayPosition();

        }
    );

}


/* =========================================================
   IMPORT
========================================================= */

function loadImageSource(
    source
) {

    imageState.imageLoaded =
        true;


    imageState.rotation =
        0;

    imageState.flipX =
        false;

    imageState.flipY =
        false;

    imageState.brightness =
        0;

    imageState.contrast =
        0;

    imageState.saturation =
        0;

    imageState.blur =
        0;


    imageState.context =
        imageCanvas.getContext(
            "2d"
        );


    imageCanvas.width =
        source.width;

    imageCanvas.height =
        source.height;


    imageState.context.clearRect(
        0,
        0,
        imageCanvas.width,
        imageCanvas.height
    );


    imageState.context.drawImage(
        source,
        0,
        0
    );


    imageState.history =
        [];

    imageState.historyIndex =
        -1;


    exitEditModes();


    pushHistory();


    updateCanvasDisplay();


    updateImageEditorState();

}


function importImageFile(
    file
) {

    if (!file) {
        return;
    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        return;

    }


    const url =
        URL.createObjectURL(
            file
        );


    const image =
        new Image();


    image.onload =
        () => {

            loadImageSource(
                image
            );


            URL.revokeObjectURL(
                url
            );


            closeImageModal(
                imageImportModal
            );


            closeImageModal(
                imageChoiceModal
            );


            updatePlusButton();

        };


    image.onerror =
        () => {

            URL.revokeObjectURL(
                url
            );

        };


    image.src =
        url;

}


/* =========================================================
   HISTORIQUE
========================================================= */

function createSnapshot() {

    return {

        canvas:
            cloneCanvas(
                imageCanvas
            ),

        width:
            imageCanvas.width,

        height:
            imageCanvas.height

    };

}


function restoreSnapshot(
    snapshot
) {

    imageCanvas.width =
        snapshot.width;


    imageCanvas.height =
        snapshot.height;


    imageState.context =
        imageCanvas.getContext(
            "2d"
        );


    imageState.context.drawImage(
        snapshot.canvas,
        0,
        0
    );


    exitEditModes();


    updateCanvasDisplay();

}


function pushHistory() {

    if (
        !imageState.imageLoaded
    ) {

        return;

    }


    const snapshot =
        createSnapshot();


    if (
        imageState.historyIndex <
        imageState.history.length - 1
    ) {

        imageState.history =
            imageState.history.slice(
                0,
                imageState.historyIndex + 1
            );

    }


    imageState.history.push(
        snapshot
    );


    if (
        imageState.history.length >
        20
    ) {

        imageState.history.shift();

    }


    imageState.historyIndex =
        imageState.history.length - 1;


    updateImageEditorState();

}


function undoImage() {

    if (
        imageState.historyIndex <= 0
    ) {

        return;

    }


    imageState.historyIndex--;


    restoreSnapshot(
        imageState.history[
            imageState.historyIndex
        ]
    );


    updateImageEditorState();

}


function redoImage() {

    if (
        imageState.historyIndex >=
        imageState.history.length - 1
    ) {

        return;

    }


    imageState.historyIndex++;


    restoreSnapshot(
        imageState.history[
            imageState.historyIndex
        ]
    );


    updateImageEditorState();

}


/* =========================================================
   ROTATION
========================================================= */

function startRotation() {

    exitEditModes();


    if (
        !imageState.imageLoaded
    ) {

        return;

    }


    imageState.activeMode =
        "rotate";


    rotateOverlay.hidden =
        false;


    updateRotateOverlayPosition();


    imageToolHelp.textContent =
        "Cliquez sur l'image puis déplacez la souris autour du centre pour la faire pivoter.";

}


function updateRotateOverlayPosition() {

    if (
        imageState.activeMode !==
        "rotate"
    ) {

        return;

    }


    const rect =
        imageCanvas.getBoundingClientRect();


    const wrapperRect =
        imageCanvasWrapper.getBoundingClientRect();


    rotateOverlay.style.left =
        `${rect.left -
            wrapperRect.left}px`;


    rotateOverlay.style.top =
        `${rect.top -
            wrapperRect.top}px`;


    rotateOverlay.style.width =
        `${rect.width}px`;


    rotateOverlay.style.height =
        `${rect.height}px`;

}


imageCanvas.addEventListener(
    "pointerdown",
    event => {

        if (
            imageState.activeMode !==
            "rotate"
        ) {

            return;

        }


        const rect =
            imageCanvas.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;


        const centerY =
            rect.top +
            rect.height / 2;


        const startAngle =
            Math.atan2(
                event.clientY -
                    centerY,
                event.clientX -
                    centerX
            );


        imageState.rotationSession = {

            active:
                true,

            startAngle,

            currentDelta:
                0,

            centerX,

            centerY

        };


        try {

            imageCanvas.setPointerCapture(
                event.pointerId
            );

        } catch {}

    }
);


imageCanvas.addEventListener(
    "pointermove",
    event => {

        if (
            imageState.activeMode !==
                "rotate" ||
            !imageState.rotationSession.active
        ) {

            return;

        }


        const session =
            imageState.rotationSession;


        const angle =
            Math.atan2(
                event.clientY -
                    session.centerY,
                event.clientX -
                    session.centerX
            );


        let delta =
            (
                angle -
                session.startAngle
            ) *
            180 /
            Math.PI;


        if (
            delta > 180
        ) {

            delta -=
                360;

        }


        if (
            delta < -180
        ) {

            delta +=
                360;

        }


        session.currentDelta =
            delta;


        imageCanvas.style.transform =
            `rotate(${delta}deg)`;

    }
);


imageCanvas.addEventListener(
    "pointerup",
    event => {

        if (
            !imageState.rotationSession.active
        ) {

            return;

        }


        try {

            imageCanvas.releasePointerCapture(
                event.pointerId
            );

        } catch {}


        const degrees =
            imageState.rotationSession.currentDelta;


        imageState.rotationSession.active =
            false;


        imageCanvas.style.transform =
            "";


        if (
            Math.abs(
                degrees
            ) > 0.1
        ) {

            applyRotationDegrees(
                degrees
            );

        }

    }
);


imageCanvas.addEventListener(
    "pointercancel",
    () => {

        imageState.rotationSession.active =
            false;


        imageCanvas.style.transform =
            "";

    }
);


function applyRotationDegrees(
    degrees
) {

    const source =
        cloneCanvas(
            imageCanvas
        );


    const radians =
        degrees *
        Math.PI /
        180;


    const cos =
        Math.abs(
            Math.cos(
                radians
            )
        );


    const sin =
        Math.abs(
            Math.sin(
                radians
            )
        );


    const newWidth =
        Math.ceil(
            source.width * cos +
            source.height * sin
        );


    const newHeight =
        Math.ceil(
            source.width * sin +
            source.height * cos
        );


    const output =
        document.createElement(
            "canvas"
        );


    output.width =
        newWidth;

    output.height =
        newHeight;


    const ctx =
        output.getContext(
            "2d"
        );


    ctx.translate(
        newWidth / 2,
        newHeight / 2
    );


    ctx.rotate(
        radians
    );


    ctx.drawImage(
        source,
        -source.width / 2,
        -source.height / 2
    );


    imageCanvas.width =
        newWidth;

    imageCanvas.height =
        newHeight;


    imageState.context =
        imageCanvas.getContext(
            "2d"
        );


    imageState.context.drawImage(
        output,
        0,
        0
    );


    imageState.rotation =
        (
            imageState.rotation +
            degrees
        ) % 360;


    pushHistory();


    updateCanvasDisplay();

}


/* =========================================================
   CROP
========================================================= */

function startCrop() {

    exitEditModes();


    if (
        !imageState.imageLoaded
    ) {

        return;

    }


    const rect =
        imageCanvas.getBoundingClientRect();


    imageState.activeMode =
        "crop";


    imageState.crop = {

        active:
            true,

        dragging:
            false,

        resizing:
            false,

        handle:
            null,

        startX:
            0,

        startY:
            0,

        originalX:
            0,

        originalY:
            0,

        x:
            0,

        y:
            0,

        width:
            rect.width,

        height:
            rect.height

    };


    cropOverlay.hidden =
        false;


    applyCropButton.hidden =
        false;


    updateCropOverlayPosition();


    updateCropSelection();


    imageToolHelp.textContent =
        "Déplacez la sélection ou utilisez les 8 poignées pour choisir la zone à conserver.";

}


function updateCropOverlayPosition() {

    if (
        imageState.activeMode !==
        "crop"
    ) {

        return;

    }


    const rect =
        imageCanvas.getBoundingClientRect();


    const wrapperRect =
        imageCanvasWrapper.getBoundingClientRect();


    cropOverlay.style.left =
        `${rect.left -
            wrapperRect.left}px`;


    cropOverlay.style.top =
        `${rect.top -
            wrapperRect.top}px`;


    cropOverlay.style.width =
        `${rect.width}px`;


    cropOverlay.style.height =
        `${rect.height}px`;


    updateCropSelection();

}


function updateCropSelection() {

    if (
        !imageState.crop.active
    ) {

        return;

    }


    const crop =
        imageState.crop;


    cropSelection.style.left =
        `${crop.x}px`;


    cropSelection.style.top =
        `${crop.y}px`;


    cropSelection.style.width =
        `${crop.width}px`;


    cropSelection.style.height =
        `${crop.height}px`;

}


cropSelection.addEventListener(
    "pointerdown",
    event => {

        if (
            event.target.closest(
                ".crop-handle"
            )
        ) {

            return;

        }


        event.preventDefault();

        event.stopPropagation();


        const rect =
            imageCanvas.getBoundingClientRect();


        imageState.crop.dragging =
            true;


        imageState.crop.startX =
            event.clientX -
            rect.left;


        imageState.crop.startY =
            event.clientY -
            rect.top;


        imageState.crop.originalX =
            imageState.crop.x;


        imageState.crop.originalY =
            imageState.crop.y;

    }
);


document
    .querySelectorAll(
        ".crop-handle"
    )
    .forEach(
        handle => {

            handle.addEventListener(
                "pointerdown",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    if (
                        imageState.activeMode !==
                        "crop"
                    ) {

                        return;

                    }


                    const rect =
                        imageCanvas.getBoundingClientRect();


                    imageState.crop.resizing =
                        true;


                    imageState.crop.handle =
                        handle.dataset.handle;


                    imageState.crop.startX =
                        event.clientX -
                        rect.left;


                    imageState.crop.startY =
                        event.clientY -
                        rect.top;

                }
            );

        }
    );


window.addEventListener(
    "pointermove",
    event => {

        if (
            imageState.activeMode !==
            "crop"
        ) {

            return;

        }


        const rect =
            imageCanvas.getBoundingClientRect();


        if (
            imageState.crop.resizing
        ) {

            resizeCropFromPointer(
                event,
                rect
            );

            return;

        }


        if (
            imageState.crop.dragging
        ) {

            moveCropSelection(
                event,
                rect
            );

        }

    }
);


window.addEventListener(
    "pointerup",
    () => {

        imageState.crop.resizing =
            false;

        imageState.crop.dragging =
            false;

        imageState.crop.handle =
            null;

    }
);


function moveCropSelection(
    event,
    rect
) {

    const crop =
        imageState.crop;


    const deltaX =
        event.clientX -
        rect.left -
        crop.startX;


    const deltaY =
        event.clientY -
        rect.top -
        crop.startY;


    crop.x =
        clamp(
            crop.originalX +
                deltaX,
            0,
            rect.width -
                crop.width
        );


    crop.y =
        clamp(
            crop.originalY +
                deltaY,
            0,
            rect.height -
                crop.height
        );


    updateCropSelection();

}


function resizeCropFromPointer(
    event,
    rect
) {

    const crop =
        imageState.crop;


    const pointerX =
        clamp(
            event.clientX -
                rect.left,
            0,
            rect.width
        );


    const pointerY =
        clamp(
            event.clientY -
                rect.top,
            0,
            rect.height
        );


    const right =
        crop.x +
        crop.width;


    const bottom =
        crop.y +
        crop.height;


    const minimum =
        20;


    switch (
        crop.handle
    ) {

        case "nw":

            crop.x =
                Math.min(
                    pointerX,
                    right -
                        minimum
                );

            crop.y =
                Math.min(
                    pointerY,
                    bottom -
                        minimum
                );

            crop.width =
                right -
                crop.x;

            crop.height =
                bottom -
                crop.y;

            break;


        case "n":

            crop.y =
                Math.min(
                    pointerY,
                    bottom -
                        minimum
                );

            crop.height =
                bottom -
                crop.y;

            break;


        case "ne":

            crop.y =
                Math.min(
                    pointerY,
                    bottom -
                        minimum
                );

            crop.width =
                Math.max(
                    minimum,
                    pointerX -
                        crop.x
                );

            crop.height =
                bottom -
                crop.y;

            break;


        case "e":

            crop.width =
                Math.max(
                    minimum,
                    pointerX -
                        crop.x
                );

            break;


        case "se":

            crop.width =
                Math.max(
                    minimum,
                    pointerX -
                        crop.x
                );

            crop.height =
                Math.max(
                    minimum,
                    pointerY -
                        crop.y
                );

            break;


        case "s":

            crop.height =
                Math.max(
                    minimum,
                    pointerY -
                        crop.y
                );

            break;


        case "sw":

            crop.x =
                Math.min(
                    pointerX,
                    right -
                        minimum
                );

            crop.width =
                right -
                crop.x;

            crop.height =
                Math.max(
                    minimum,
                    pointerY -
                        crop.y
                );

            break;


        case "w":

            crop.x =
                Math.min(
                    pointerX,
                    right -
                        minimum
                );

            crop.width =
                right -
                crop.x;

            break;

    }


    updateCropSelection();

}


function applyCropSelection() {

    if (
        !imageState.crop.active
    ) {

        return;

    }


    const rect =
        imageCanvas.getBoundingClientRect();


    const scaleX =
        imageCanvas.width /
        rect.width;


    const scaleY =
        imageCanvas.height /
        rect.height;


    const crop =
        imageState.crop;


    const x =
        Math.round(
            crop.x *
            scaleX
        );


    const y =
        Math.round(
            crop.y *
            scaleY
        );


    const width =
        Math.round(
            crop.width *
            scaleX
        );


    const height =
        Math.round(
            crop.height *
            scaleY
        );


    if (
        width <= 1 ||
        height <= 1
    ) {

        return;

    }


    const source =
        cloneCanvas(
            imageCanvas
        );


    const imageData =
        source
            .getContext(
                "2d"
            )
            .getImageData(
                x,
                y,
                width,
                height
            );


    imageCanvas.width =
        width;

    imageCanvas.height =
        height;


    imageState.context =
        imageCanvas.getContext(
            "2d"
        );


    imageState.context.putImageData(
        imageData,
        0,
        0
    );


    exitEditModes();


    pushHistory();


    updateCanvasDisplay();


    imageToolHelp.textContent =
        "Image recadrée.";

}


/* =========================================================
   RETOURNEMENT
========================================================= */

function flipImage(
    horizontal
) {

    const source =
        cloneCanvas(
            imageCanvas
        );


    const ctx =
        imageCanvas.getContext(
            "2d"
        );


    ctx.clearRect(
        0,
        0,
        imageCanvas.width,
        imageCanvas.height
    );


    ctx.save();


    if (
        horizontal
    ) {

        ctx.translate(
            imageCanvas.width,
            0
        );

        ctx.scale(
            -1,
            1
        );


        imageState.flipX =
            !imageState.flipX;

    } else {

        ctx.translate(
            0,
            imageCanvas.height
        );

        ctx.scale(
            1,
            -1
        );


        imageState.flipY =
            !imageState.flipY;

    }


    ctx.drawImage(
        source,
        0,
        0
    );


    ctx.restore();


    pushHistory();

}


/* =========================================================
   REDIMENSIONNEMENT
========================================================= */

function openResize() {

    imageWidth.value =
        imageCanvas.width;


    imageHeight.value =
        imageCanvas.height;


    openImageModal(
        resizeModal
    );

}


imageWidth.addEventListener(
    "input",
    () => {

        if (
            !lockAspectRatio.checked
        ) {

            return;

        }


        const ratio =
            imageCanvas.width /
            imageCanvas.height;


        imageHeight.value =
            Math.max(
                1,
                Math.round(
                    Number(
                        imageWidth.value
                    ) /
                    ratio
                )
            );

    }
);


imageHeight.addEventListener(
    "input",
    () => {

        if (
            !lockAspectRatio.checked
        ) {

            return;

        }


        const ratio =
            imageCanvas.width /
            imageCanvas.height;


        imageWidth.value =
            Math.max(
                1,
                Math.round(
                    Number(
                        imageHeight.value
                    ) *
                    ratio
                )
            );

    }
);


function resizeImage() {

    const width =
        Math.max(
            1,
            Number(
                imageWidth.value
            )
        );


    const height =
        Math.max(
            1,
            Number(
                imageHeight.value
            )
        );


    const source =
        cloneCanvas(
            imageCanvas
        );


    imageCanvas.width =
        width;

    imageCanvas.height =
        height;


    imageCanvas
        .getContext(
            "2d"
        )
        .drawImage(
            source,
            0,
            0,
            width,
            height
        );


    closeImageModal(
        resizeModal
    );


    pushHistory();


    updateCanvasDisplay();

}


/* =========================================================
   AJUSTEMENTS
========================================================= */

function openAdjustment(
    type
) {

    exitEditModes();


    imageState.activeMode =
        "adjustment";


    imageState.adjustmentType =
        type;


    imageState.adjustmentPreview =
        cloneCanvas(
            imageCanvas
        );


    const labels = {

        brightness:
            "Luminosité",

        contrast:
            "Contraste",

        saturation:
            "Saturation"

    };


    adjustmentTitle.textContent =
        `${labels[type]}.`;


    adjustmentSlider.value =
        imageState[type];


    adjustmentValue.textContent =
        imageState[type];


    openImageModal(
        adjustmentModal
    );

}


adjustmentSlider.addEventListener(
    "input",
    () => {

        const value =
            Number(
                adjustmentSlider.value
            );


        imageState[
            imageState.adjustmentType
        ] =
            value;


        adjustmentValue.textContent =
            value;


        renderAdjustmentPreview();

    }
);


function renderAdjustmentPreview() {

    if (
        !imageState.adjustmentPreview
    ) {

        return;

    }


    imageCanvas.width =
        imageState.adjustmentPreview.width;


    imageCanvas.height =
        imageState.adjustmentPreview.height;


    imageState.context =
        imageCanvas.getContext(
            "2d"
        );


    const brightness =
        100 +
        imageState.brightness;


    const contrast =
        100 +
        imageState.contrast;


    const saturation =
        100 +
        imageState.saturation;


    imageState.context.filter =
        `
        brightness(${brightness}%)
        contrast(${contrast}%)
        saturate(${saturation}%)
        blur(${imageState.blur}px)
        `;


    imageState.context.drawImage(
        imageState.adjustmentPreview,
        0,
        0
    );


    imageState.context.filter =
        "none";


    updateCanvasDisplay();

}


function restoreCanvasFromPreview() {

    if (
        !imageState.adjustmentPreview
    ) {

        return;

    }


    imageCanvas.width =
        imageState.adjustmentPreview.width;


    imageCanvas.height =
        imageState.adjustmentPreview.height;


    imageState.context =
        imageCanvas.getContext(
            "2d"
        );


    imageState.context.drawImage(
        imageState.adjustmentPreview,
        0,
        0
    );


    updateCanvasDisplay();

}


function cancelAdjustment() {

    restoreCanvasFromPreview();


    imageState.adjustmentPreview =
        null;

}


/* =========================================================
   FLOU
========================================================= */

function openBlur() {

    exitEditModes();


    imageState.activeMode =
        "blur";


    imageState.adjustmentPreview =
        cloneCanvas(
            imageCanvas
        );


    blurSlider.value =
        imageState.blur;


    blurValue.textContent =
        `${imageState.blur} px`;


    openImageModal(
        blurModal
    );

}


blurSlider.addEventListener(
    "input",
    () => {

        imageState.blur =
            Number(
                blurSlider.value
            );


        blurValue.textContent =
            `${imageState.blur} px`;


        renderAdjustmentPreview();

    }
);


function cancelBlur() {

    restoreCanvasFromPreview();


    imageState.adjustmentPreview =
        null;

}


/* =========================================================
   HSL -> HEX
========================================================= */

function hslToHex(
    h,
    s,
    l
) {

    h =
        (
            (
                h % 360
            ) +
            360
        ) %
        360;


    s /=
        100;

    l /=
        100;


    const c =
        (
            1 -
            Math.abs(
                2 * l -
                1
            )
        ) *
        s;


    const x =
        c *
        (
            1 -
            Math.abs(
                (
                    h / 60
                ) % 2 -
                1
            )
        );


    const m =
        l -
        c / 2;


    let r =
        0;

    let g =
        0;

    let b =
        0;


    if (
        h < 60
    ) {

        r = c;
        g = x;
        b = 0;

    } else if (
        h < 120
    ) {

        r = x;
        g = c;
        b = 0;

    } else if (
        h < 180
    ) {

        r = 0;
        g = c;
        b = x;

    } else if (
        h < 240
    ) {

        r = 0;
        g = x;
        b = c;

    } else if (
        h < 300
    ) {

        r = x;
        g = 0;
        b = c;

    } else {

        r = c;
        g = 0;
        b = x;

    }


    return rgbToHex(
        (r + m) * 255,
        (g + m) * 255,
        (b + m) * 255
    );

}


/* =========================================================
   NUANCIER
========================================================= */

function updateSelectedColor(
    color
) {

    imageState.selectedColor =
        color.toUpperCase();


    if (
        selectedColorPreview
    ) {

        selectedColorPreview.style.background =
            color;

    }


    if (
        customColorPreview
    ) {

        customColorPreview.style.background =
            color;

    }


    if (
        customColorHex
    ) {

        customColorHex.textContent =
            color.toUpperCase();

    }


    if (
        colorSwatchLabel
    ) {

        colorSwatchLabel.textContent =
            color.toUpperCase();

    }

}


function updateCustomColorUI() {

    const {
        hue,
        saturation,
        lightness
    } =
        imageState.colorPicker;


    const color =
        hslToHex(
            hue,
            saturation,
            lightness
        );


    if (
        customColorPreview
    ) {

        customColorPreview.style.background =
            color;

    }


    if (
        selectedColorPreview
    ) {

        selectedColorPreview.style.background =
            color;

    }


    if (
        customColorHex
    ) {

        customColorHex.textContent =
            color;

    }


    if (
        colorSwatchLabel
    ) {

        colorSwatchLabel.textContent =
            color;

    }


    if (
        colorSpectrum
    ) {

        colorSpectrum.style.background =
            `
            linear-gradient(
                to bottom,
                transparent,
                #000
            ),
            linear-gradient(
                to right,
                #fff,
                hsl(
                    ${hue},
                    100%,
                    50%
                )
            )
            `;

    }

}


function setColorFromSpectrum(
    event
) {

    const rect =
        colorSpectrum.getBoundingClientRect();


    const x =
        clamp(
            (
                event.clientX -
                rect.left
            ) /
            rect.width,
            0,
            1
        );


    const y =
        clamp(
            (
                event.clientY -
                rect.top
            ) /
            rect.height,
            0,
            1
        );


    imageState.colorPicker.saturation =
        x * 100;


    imageState.colorPicker.lightness =
        50 -
        y * 50;


    colorSpectrumCursor.style.left =
        `${x * 100}%`;


    colorSpectrumCursor.style.top =
        `${y * 100}%`;


    updateCustomColorUI();

}


let isHueDragging =
    false;


function setHueFromPointer(
    event
) {

    const rect =
        colorHue.getBoundingClientRect();


    const ratio =
        clamp(
            (
                event.clientX -
                rect.left
            ) /
            rect.width,
            0,
            1
        );


    imageState.colorPicker.hue =
        ratio * 360;


    colorHueCursor.style.left =
        `${ratio * 100}%`;


    updateCustomColorUI();

}


/* =========================================================
   ÉVÉNEMENTS NUANCIER
========================================================= */

colorSwatchButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        customColorPanel.hidden =
            !customColorPanel.hidden;


        if (
            !customColorPanel.hidden
        ) {

            updateCustomColorUI();

        }

    }
);


customColorPanel.addEventListener(
    "click",
    event => {

        event.stopPropagation();

    }
);


document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                "#customColorPicker"
            )
        ) {

            customColorPanel.hidden =
                true;

        }

    }
);


/* Spectrum */

colorSpectrum.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();


        setColorFromSpectrum(
            event
        );


        try {

            colorSpectrum.setPointerCapture(
                event.pointerId
            );

        } catch {}

    }
);


colorSpectrum.addEventListener(
    "pointermove",
    event => {

        if (
            event.buttons === 0
        ) {

            return;

        }


        setColorFromSpectrum(
            event
        );

    }
);


/* Hue */

colorHue.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();


        isHueDragging =
            true;


        try {

            colorHue.setPointerCapture(
                event.pointerId
            );

        } catch {}


        setHueFromPointer(
            event
        );

    }
);


colorHue.addEventListener(
    "pointermove",
    event => {

        if (
            !isHueDragging
        ) {

            return;

        }


        setHueFromPointer(
            event
        );

    }
);


colorHue.addEventListener(
    "pointerup",
    event => {

        isHueDragging =
            false;


        try {

            colorHue.releasePointerCapture(
                event.pointerId
            );

        } catch {}

    }
);


colorHue.addEventListener(
    "pointercancel",
    event => {

        isHueDragging =
            false;


        try {

            colorHue.releasePointerCapture(
                event.pointerId
            );

        } catch {}

    }
);


customColorConfirm.addEventListener(
    "click",
    () => {

        const color =
            hslToHex(
                imageState.colorPicker.hue,
                imageState.colorPicker.saturation,
                imageState.colorPicker.lightness
            );


        updateSelectedColor(
            color
        );


        customColorPanel.hidden =
            true;

    }
);


/* =========================================================
   TOLÉRANCE
========================================================= */

toleranceSlider.addEventListener(
    "input",
    () => {

        imageState.tolerance =
            Number(
                toleranceSlider.value
            );


        toleranceValue.textContent =
            `${imageState.tolerance}%`;

    }
);


/* =========================================================
   SUPPRESSION DE COULEUR
========================================================= */

function colorDistance(
    r1,
    g1,
    b1,
    r2,
    g2,
    b2
) {

    const dr =
        r1 -
        r2;


    const dg =
        g1 -
        g2;


    const db =
        b1 -
        b2;


    return Math.sqrt(
        dr * dr +
        dg * dg +
        db * db
    );

}


function toleranceToDistance(
    tolerance
) {

    return (
        tolerance /
        100
    ) *
    Math.sqrt(
        255 * 255 * 3
    );

}


function removeSelectedColor() {

    if (
        !imageState.imageLoaded
    ) {

        return;

    }


    const target =
        hexToRgb(
            imageState.selectedColor
        );


    const ctx =
        imageCanvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );


    const imageData =
        ctx.getImageData(
            0,
            0,
            imageCanvas.width,
            imageCanvas.height
        );


    const pixels =
        imageData.data;


    const maximumDistance =
        toleranceToDistance(
            imageState.tolerance
        );


    for (
        let i = 0;
        i < pixels.length;
        i += 4
    ) {

        const distance =
            colorDistance(
                pixels[i],
                pixels[i + 1],
                pixels[i + 2],
                target.r,
                target.g,
                target.b
            );


        if (
            distance <=
            maximumDistance
        ) {

            pixels[i + 3] =
                0;

        }

    }


    ctx.putImageData(
        imageData,
        0,
        0
    );


    closeImageModal(
        removeColorModal
    );


    exitEditModes();


    pushHistory();


    imageToolHelp.textContent =
        "La couleur sélectionnée a été supprimée.";

}


/* =========================================================
   PIPETTE — APERÇU AGRANDI
========================================================= */

function updateEyedropperPreview(
    mouseX,
    mouseY
) {

    const rect =
        imageCanvas.getBoundingClientRect();


    if (
        rect.width <= 0 ||
        rect.height <= 0
    ) {

        return;

    }


    const canvasX =
        clamp(
            (
                mouseX -
                rect.left
            ) *
            (
                imageCanvas.width /
                rect.width
            ),
            0,
            imageCanvas.width - 1
        );


    const canvasY =
        clamp(
            (
                mouseY -
                rect.top
            ) *
            (
                imageCanvas.height /
                rect.height
            ),
            0,
            imageCanvas.height - 1
        );


    const sourceSize =
        24;


    const sourceX =
        clamp(
            Math.floor(
                canvasX -
                sourceSize / 2
            ),
            0,
            Math.max(
                0,
                imageCanvas.width -
                sourceSize
            )
        );


    const sourceY =
        clamp(
            Math.floor(
                canvasY -
                sourceSize / 2
            ),
            0,
            Math.max(
                0,
                imageCanvas.height -
                sourceSize
            )
        );


    const previewCanvas =
        document.createElement(
            "canvas"
        );


    previewCanvas.width =
        sourceSize;

    previewCanvas.height =
        sourceSize;


    const previewContext =
        previewCanvas.getContext(
            "2d"
        );


    /*
     * Pas d'interpolation :
     * les pixels restent nets dans la loupe.
     */

    previewContext.imageSmoothingEnabled =
        false;


    previewContext.drawImage(

        imageCanvas,

        sourceX,
        sourceY,
        sourceSize,
        sourceSize,

        0,
        0,
        sourceSize,
        sourceSize

    );


    eyedropperPreview.style.backgroundImage =
        `url(${previewCanvas.toDataURL("image/png")})`;


    eyedropperPreview.style.backgroundSize =
        "320px 320px";


    eyedropperPreview.style.backgroundPosition =
        "center";

}


function activateEyedropper() {

    if (
        !imageState.imageLoaded
    ) {

        return;

    }


    closeImageModal(
        removeColorModal
    );


    exitEditModes();


    imageState.activeMode =
        "eyedropper";


    imageCanvas.classList.add(
        "eyedropper-active"
    );


    eyedropperIndicator.hidden =
        false;


    eyedropperIndicator.style.display =
        "block";


    imageToolHelp.textContent =
        "Placez la croix au centre de la loupe sur la couleur souhaitée.";

}


imageCanvas.addEventListener(
    "pointermove",
    event => {

        if (
            imageState.activeMode !==
            "eyedropper"
        ) {

            return;

        }


        updateEyedropperPreview(
            event.clientX,
            event.clientY
        );


        eyedropperIndicator.style.left =
            `${event.clientX}px`;


        eyedropperIndicator.style.top =
            `${event.clientY}px`;


        eyedropperIndicator.style.display =
            "block";

    }
);


/* =========================================================
   SÉLECTION AVEC LA CROIX CENTRALE
========================================================= */

imageCanvas.addEventListener(
    "click",
    event => {

        if (
            imageState.activeMode !==
            "eyedropper"
        ) {

            return;

        }


        const rect =
            imageCanvas.getBoundingClientRect();


        const x =
            clamp(
                Math.floor(
                    (
                        event.clientX -
                        rect.left
                    ) *
                    (
                        imageCanvas.width /
                        rect.width
                    )
                ),
                0,
                imageCanvas.width - 1
            );


        const y =
            clamp(
                Math.floor(
                    (
                        event.clientY -
                        rect.top
                    ) *
                    (
                        imageCanvas.height /
                        rect.height
                    )
                ),
                0,
                imageCanvas.height - 1
            );


        const pixel =
            imageState.context.getImageData(
                x,
                y,
                1,
                1
            ).data;


        const color =
            rgbToHex(
                pixel[0],
                pixel[1],
                pixel[2]
            );


        updateSelectedColor(
            color
        );


        exitEditModes();


        openImageModal(
            removeColorModal
        );


        imageToolHelp.textContent =
            "Couleur sélectionnée. Ajustez la tolérance puis appliquez.";

    }
);


/* =========================================================
   CAMERA
========================================================= */

async function openCamera() {

    try {

        imageState.cameraStream =
            await navigator
                .mediaDevices
                .getUserMedia(
                    {
                        video:
                            true,

                        audio:
                            false
                    }
                );


        cameraVideo.srcObject =
            imageState.cameraStream;


        openImageModal(
            cameraModal
        );

    } catch (error) {

        console.error(
            "Camera :",
            error
        );


        alert(
            "Impossible d'accéder à la caméra."
        );

    }

}


function closeCameraStream() {

    if (
        imageState.cameraStream
    ) {

        imageState.cameraStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


        imageState.cameraStream =
            null;

    }


    cameraVideo.srcObject =
        null;

}


function capturePhoto() {

    if (
        !cameraVideo.videoWidth
    ) {

        return;

    }


    cameraCanvas.width =
        cameraVideo.videoWidth;


    cameraCanvas.height =
        cameraVideo.videoHeight;


    const ctx =
        cameraCanvas.getContext(
            "2d"
        );


    ctx.drawImage(
        cameraVideo,
        0,
        0,
        cameraCanvas.width,
        cameraCanvas.height
    );


    const image =
        new Image();


    image.onload =
        () => {

            loadImageSource(
                image
            );


            closeCameraStream();


            closeImageModal(
                cameraModal
            );


            closeImageModal(
                imageChoiceModal
            );


            updatePlusButton();

        };


    image.src =
        cameraCanvas.toDataURL(
            "image/png"
        );

}


/* =========================================================
   EXPORT
========================================================= */

function exportImage() {

    const format =
        imageState.exportFormat;


    let mime =
        "image/png";


    let extension =
        "png";


    if (
        format ===
        "jpeg"
    ) {

        mime =
            "image/jpeg";

        extension =
            "jpg";

    }


    if (
        format ===
        "webp"
    ) {

        mime =
            "image/webp";

        extension =
            "webp";

    }


    imageCanvas.toBlob(
        blob => {

            if (!blob) {

                return;

            }


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
                `editilo-image.${extension}`;


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


            closeImageModal(
                imageExportModal
            );

        },
        mime,
        imageState.exportQuality
    );

}


/* =========================================================
   ACTIONS OUTILS
========================================================= */

function performImageAction(
    action
) {

    if (
        !imageState.imageLoaded
    ) {

        return;

    }


    exitEditModes();


    switch (action) {

        case "crop":

            startCrop();

            break;


        case "rotate":

            startRotation();

            break;


        case "flipHorizontal":

            flipImage(
                true
            );

            break;


        case "flipVertical":

            flipImage(
                false
            );

            break;


        case "resize":

            openResize();

            break;


        case "brightness":

            openAdjustment(
                "brightness"
            );

            break;


        case "contrast":

            openAdjustment(
                "contrast"
            );

            break;


        case "saturation":

            openAdjustment(
                "saturation"
            );

            break;


        case "blur":

            openBlur();

            break;


        case "removeColor":

            updateSelectedColor(
                imageState.selectedColor
            );


            toleranceSlider.value =
                imageState.tolerance;


            toleranceValue.textContent =
                `${imageState.tolerance}%`;


            openImageModal(
                removeColorModal
            );

            break;

    }

}


/* =========================================================
   PLUS
========================================================= */

function updatePlusButton() {

    openImageChoice.classList.toggle(
        "active",
        imageChoiceModal.classList.contains(
            "open"
        )
    );

}


openImageChoice.addEventListener(
    "click",
    () => {

        if (
            imageChoiceModal.classList.contains(
                "open"
            )
        ) {

            closeImageModal(
                imageChoiceModal
            );

        } else {

            openImageModal(
                imageChoiceModal
            );

        }


        updatePlusButton();

    }
);


closeImageChoice.addEventListener(
    "click",
    () => {

        closeImageModal(
            imageChoiceModal
        );


        updatePlusButton();

    }
);


document
    .querySelector(
        "[data-close-image-choice]"
    )
    .addEventListener(
        "click",
        () => {

            closeImageModal(
                imageChoiceModal
            );


            updatePlusButton();

        }
    );


imageImportChoice.addEventListener(
    "click",
    () => {

        closeImageModal(
            imageChoiceModal
        );


        updatePlusButton();


        openImageModal(
            imageImportModal
        );

    }
);


cameraChoice.addEventListener(
    "click",
    () => {

        closeImageModal(
            imageChoiceModal
        );


        updatePlusButton();


        openCamera();

    }
);


/* =========================================================
   IMPORT
========================================================= */

closeImageImport.addEventListener(
    "click",
    () =>
        closeImageModal(
            imageImportModal
        )
);


document
    .querySelector(
        "[data-close-image-import]"
    )
    .addEventListener(
        "click",
        () =>
            closeImageModal(
                imageImportModal
            )
    );


imageChooseFile.addEventListener(
    "click",
    () =>
        imageFileInput.click()
);


imageFileInput.addEventListener(
    "change",
    () => {

        const file =
            imageFileInput.files[0];


        if (
            file
        ) {

            importImageFile(
                file
            );

        }


        imageFileInput.value =
            "";

    }
);


[
    "dragenter",
    "dragover"
].forEach(
    type => {

        imageDropZone.addEventListener(
            type,
            event => {

                event.preventDefault();

                event.stopPropagation();

                imageDropZone.classList.add(
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

        imageDropZone.addEventListener(
            type,
            event => {

                event.preventDefault();

                event.stopPropagation();

                imageDropZone.classList.remove(
                    "dragover"
                );

            }
        );

    }
);


imageDropZone.addEventListener(
    "drop",
    event => {

        const file =
            event.dataTransfer.files[0];


        if (
            file
        ) {

            importImageFile(
                file
            );

        }

    }
);


/* =========================================================
   CAMERA
========================================================= */

closeCamera.addEventListener(
    "click",
    () => {

        closeCameraStream();


        closeImageModal(
            cameraModal
        );

    }
);


document
    .querySelector(
        "[data-close-camera]"
    )
    .addEventListener(
        "click",
        () => {

            closeCameraStream();


            closeImageModal(
                cameraModal
            );

        }
    );


capturePhotoButton.addEventListener(
    "click",
    capturePhoto
);


/* =========================================================
   REDIMENSIONNEMENT
========================================================= */

closeResize.addEventListener(
    "click",
    () =>
        closeImageModal(
            resizeModal
        )
);


document
    .querySelector(
        "[data-close-resize]"
    )
    .addEventListener(
        "click",
        () =>
            closeImageModal(
                resizeModal
            )
    );


applyResize.addEventListener(
    "click",
    resizeImage
);


/* =========================================================
   RÉGLAGES
========================================================= */

closeAdjustment.addEventListener(
    "click",
    () => {

        cancelAdjustment();


        closeImageModal(
            adjustmentModal
        );


        exitEditModes();

    }
);


document
    .querySelector(
        "[data-close-adjustment]"
    )
    .addEventListener(
        "click",
        () => {

            cancelAdjustment();


            closeImageModal(
                adjustmentModal
            );


            exitEditModes();

        }
);


applyAdjustment.addEventListener(
    "click",
    () => {

        imageState.adjustmentPreview =
            null;


        closeImageModal(
            adjustmentModal
        );


        exitEditModes();


        pushHistory();

    }
);


/* =========================================================
   FLOU
========================================================= */

closeBlur.addEventListener(
    "click",
    () => {

        cancelBlur();


        closeImageModal(
            blurModal
        );


        exitEditModes();

    }
);


document
    .querySelector(
        "[data-close-blur]"
    )
    .addEventListener(
        "click",
        () => {

            cancelBlur();


            closeImageModal(
                blurModal
            );


            exitEditModes();

        }
);


applyBlur.addEventListener(
    "click",
    () => {

        imageState.adjustmentPreview =
            null;


        closeImageModal(
            blurModal
        );


        exitEditModes();


        pushHistory();

    }
);


/* =========================================================
   FOND VERT
========================================================= */

closeRemoveColor.addEventListener(
    "click",
    () => {

        closeImageModal(
            removeColorModal
        );


        exitEditModes();

    }
);


document
    .querySelector(
        "[data-close-color]"
    )
    .addEventListener(
        "click",
        () => {

            closeImageModal(
                removeColorModal
            );


            exitEditModes();

        }
);


eyedropperButton.addEventListener(
    "click",
    activateEyedropper
);


applyRemoveColor.addEventListener(
    "click",
    removeSelectedColor
);


/* =========================================================
   CROP
========================================================= */

applyCropButton.addEventListener(
    "click",
    applyCropSelection
);


/* =========================================================
   HISTORIQUE
========================================================= */

imageUndoButton.addEventListener(
    "click",
    undoImage
);


imageRedoButton.addEventListener(
    "click",
    redoImage
);


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


                undoImage();

            }


            if (
                event.key.toLowerCase() ===
                "y"
            ) {

                event.preventDefault();


                redoImage();

            }

        }

    }
);


/* =========================================================
   OUTILS
========================================================= */

document
    .querySelectorAll(
        ".image-tool-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !button.disabled
                    ) {

                        performImageAction(
                            button.dataset.action
                        );

                    }

                }
            );

        }
    );


/* =========================================================
   EXPORT
========================================================= */

openImageExport.addEventListener(
    "click",
    () => {

        if (
            imageState.imageLoaded
        ) {

            openImageModal(
                imageExportModal
            );

        }

    }
);


closeImageExport.addEventListener(
    "click",
    () =>
        closeImageModal(
            imageExportModal
        )
);


document
    .querySelector(
        "[data-close-image-export]"
    )
    .addEventListener(
        "click",
        () =>
            closeImageModal(
                imageExportModal
            )
    );


imageFormatButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                imageState.exportFormat =
                    button.dataset.format;


                imageFormatButtons.forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item === button
                        );

                    }
                );


                imageQualityGroup.hidden =
                    button.dataset.format ===
                    "png";

            }
        );

    }
);


imageQualitySlider.addEventListener(
    "input",
    () => {

        const value =
            Number(
                imageQualitySlider.value
            );


        imageState.exportQuality =
            value /
            100;


        imageQualityValue.textContent =
            `${value}%`;

    }
);


confirmImageExport.addEventListener(
    "click",
    exportImage
);


/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            imageState.activeMode ===
            "eyedropper"
        ) {

            exitEditModes();


            openImageModal(
                removeColorModal
            );


            return;

        }


        if (
            imageState.activeMode ===
            "adjustment"
        ) {

            cancelAdjustment();

        }


        if (
            imageState.activeMode ===
            "blur"
        ) {

            cancelBlur();

        }


        exitEditModes();


        closeImageModal(
            imageChoiceModal
        );


        closeImageModal(
            imageImportModal
        );


        closeImageModal(
            cameraModal
        );


        closeImageModal(
            resizeModal
        );


        closeImageModal(
            adjustmentModal
        );


        closeImageModal(
            blurModal
        );


        closeImageModal(
            removeColorModal
        );


        closeImageModal(
            imageExportModal
        );


        closeCameraStream();


        updatePlusButton();

    }
);


/* =========================================================
   REDIMENSIONNEMENT FENÊTRE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        updateCanvasDisplay();


        updateCropOverlayPosition();


        updateRotateOverlayPosition();

    }
);


/* =========================================================
   INITIALISATION
========================================================= */

imageLoadedEditor.hidden =
    false;


emptyImageMessage.hidden =
    false;


updateSelectedColor(
    imageState.selectedColor
);


updateCustomColorUI();


updateImageEditorState();