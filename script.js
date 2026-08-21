/* =========================================================
   EDITILO — SCRIPT PRINCIPAL
========================================================= */


/* =========================================================
   ANNÉE DU COPYRIGHT
========================================================= */

const currentYear =
    document.getElementById("currentYear");


if (currentYear) {

    currentYear.textContent =
        new Date().getFullYear();

}



/* =========================================================
   MENU MOBILE
========================================================= */

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mobileMenu =
    document.getElementById("mobileMenu");


if (
    mobileMenuButton &&
    mobileMenu
) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            const isOpen =
                mobileMenu.classList.toggle("open");


            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    const mobileLinks =
        mobileMenu.querySelectorAll("a");


    mobileLinks.forEach(
        (link) => {

            link.addEventListener(
                "click",
                () => {

                    mobileMenu.classList.remove(
                        "open"
                    );


                    mobileMenuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }
    );

}



/* =========================================================
   FAQ
========================================================= */

const faqItems =
    document.querySelectorAll(".faq-item");


faqItems.forEach(
    (item) => {

        const question =
            item.querySelector(".faq-question");


        const answer =
            item.querySelector(".faq-answer");


        if (
            !question ||
            !answer
        ) {

            return;

        }


        question.addEventListener(
            "click",
            () => {

                const isOpen =
                    item.classList.contains("open");


                /*
                 * Fermer toutes les autres FAQ
                 */

                faqItems.forEach(
                    (otherItem) => {

                        otherItem.classList.remove(
                            "open"
                        );


                        const otherAnswer =
                            otherItem.querySelector(
                                ".faq-answer"
                            );


                        if (otherAnswer) {

                            otherAnswer.style.maxHeight =
                                null;

                        }

                    }
                );


                /*
                 * Ouvrir la FAQ sélectionnée
                 */

                if (!isOpen) {

                    item.classList.add(
                        "open"
                    );


                    answer.style.maxHeight =
                        answer.scrollHeight + "px";

                }

            }
        );

    }
);



/* =========================================================
   MODALE CONTACT
========================================================= */

const contactModal =
    document.getElementById("contactModal");


const contactClose =
    document.getElementById("contactClose");


const contactCancel =
    document.getElementById("contactCancel");


const contactTriggers =
    document.querySelectorAll(".contact-trigger");


const contactOverlay =
    document.querySelector(
        "[data-close-contact]"
    );


const contactForm =
    document.getElementById("contactForm");


const contactMessage =
    document.getElementById("contactMessage");


const messageCounter =
    document.getElementById("messageCounter");


const contactStatus =
    document.getElementById("contactStatus");



/* =========================================================
   OUVRIR LA MODALE
========================================================= */

function openContactModal() {

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


    /*
     * Empêche la page de défiler
     * derrière la modale.
     */

    document.body.style.overflow =
        "hidden";


    /*
     * Réinitialiser le message de statut
     */

    if (contactStatus) {

        contactStatus.textContent =
            "";

        contactStatus.className =
            "contact-status";

    }


    /*
     * Donner automatiquement le focus
     * au premier champ.
     */

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



/* =========================================================
   FERMER LA MODALE
========================================================= */

function closeContactModal() {

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


    /*
     * Réautoriser le défilement.
     */

    document.body.style.overflow =
        "";


    /*
     * Réinitialiser le statut.
     */

    if (contactStatus) {

        contactStatus.textContent =
            "";

        contactStatus.className =
            "contact-status";

    }

}



/* =========================================================
   BOUTONS CONTACT
========================================================= */

contactTriggers.forEach(
    (trigger) => {

        trigger.addEventListener(
            "click",
            (event) => {

                event.preventDefault();


                openContactModal();

            }
        );

    }
);



/* =========================================================
   BOUTON X
========================================================= */

if (contactClose) {

    contactClose.addEventListener(
        "click",
        () => {

            closeContactModal();

        }
    );

}



/* =========================================================
   BOUTON ANNULER
========================================================= */

if (contactCancel) {

    contactCancel.addEventListener(
        "click",
        () => {

            closeContactModal();

        }
    );

}



/* =========================================================
   CLIC SUR L'ARRIÈRE-PLAN
========================================================= */

if (contactOverlay) {

    contactOverlay.addEventListener(
        "click",
        () => {

            closeContactModal();

        }
    );

}



/* =========================================================
   TOUCHE ÉCHAP
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            contactModal &&
            contactModal.classList.contains("open")
        ) {

            closeContactModal();

        }

    }
);



/* =========================================================
   COMPTEUR DU MESSAGE
========================================================= */

function updateMessageCounter() {

    if (
        !contactMessage ||
        !messageCounter
    ) {

        return;

    }


    const currentLength =
        contactMessage.value.length;


    const maximumLength =
        1000;


    messageCounter.textContent =
        `${currentLength} / ${maximumLength}`;


    /*
     * Supprimer les anciennes alertes.
     */

    messageCounter.classList.remove(
        "warning",
        "danger"
    );


    /*
     * Avertissement à partir de 900 caractères.
     */

    if (
        currentLength >= 900
    ) {

        messageCounter.classList.add(
            "warning"
        );

    }


    /*
     * Avertissement renforcé à partir de 980 caractères.
     */

    if (
        currentLength >= 980
    ) {

        messageCounter.classList.add(
            "danger"
        );

    }

}



/* =========================================================
   INITIALISER LE COMPTEUR
========================================================= */

if (contactMessage) {

    contactMessage.addEventListener(
        "input",
        () => {

            updateMessageCounter();

        }
    );


    updateMessageCounter();

}



/* =========================================================
   ENVOI DU FORMULAIRE AVEC FORMSPREE
========================================================= */

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        async (event) => {

            /*
             * Empêcher le navigateur de changer de page.
             */

            event.preventDefault();


            if (!contactStatus) {

                return;

            }


            /*
             * Message temporaire.
             */

            contactStatus.textContent =
                "Envoi en cours...";


            contactStatus.className =
                "contact-status";


            /*
             * Désactiver le bouton pendant l'envoi.
             */

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


            /*
             * Récupérer toutes les données du formulaire.
             */

            const formData =
                new FormData(
                    contactForm
                );


            try {

                /*
                 * Envoi vers ton formulaire Formspree.
                 */

                const response =
                    await fetch(
                        "https://formspree.io/f/mwlenedj",
                        {
                            method: "POST",

                            body: formData,

                            headers: {
                                Accept:
                                    "application/json"
                            }
                        }
                    );


                /*
                 * Vérifier la réponse.
                 */

                if (response.ok) {


                    /*
                     * Succès
                     */

                    contactStatus.textContent =
                        "Votre message a bien été envoyé.";


                    contactStatus.className =
                        "contact-status success";


                    /*
                     * Réinitialiser le formulaire.
                     */

                    contactForm.reset();


                    /*
                     * Remettre le compteur à zéro.
                     */

                    updateMessageCounter();


                    /*
                     * Fermer automatiquement
                     * la modale après un court délai.
                     */

                    setTimeout(
                        () => {

                            closeContactModal();

                        },
                        1800
                    );


                } else {


                    /*
                     * Formspree a renvoyé une erreur.
                     */

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


                /*
                 * Erreur réseau ou problème
                 * de connexion.
                 */

                console.error(
                    "Erreur Formspree :",
                    error
                );


                contactStatus.textContent =
                    "Une erreur réseau est survenue. Réessayez.";


                contactStatus.className =
                    "contact-status error";

            }


            /*
             * Réactiver le bouton.
             */

            if (submitButton) {

                submitButton.disabled =
                    false;


                submitButton.style.opacity =
                    "";

            }

        }
    );

}