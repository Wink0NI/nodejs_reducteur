"use strict";
const textArea = document.createElement("textarea");
const API_URL = "https://reducteur-js-api.onrender.com/api/shorten";

function copyToClipboard(text) {
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    Swal.fire({
        icon: 'success',
        title: 'Copié avec succès!',
        text: 'Lien copié dans le presse-papiers!',
    });
}

let sectionContainer = document.querySelector('.section div.url-responses');

function createSection(link, copyable = true) {
    // Créer les éléments HTML
    if (!sectionContainer) {
        const divContainer = document.createElement('div');
        divContainer.classList.add("box", "url-responses");
        document.querySelector("body>section.section>div.container").appendChild(divContainer);
        sectionContainer = document.querySelector(".section div.url-responses")
    }

    const divNotification = document.createElement('div');
    divNotification.id = 'shortURL';

    const state = copyable ? 'is-success' : 'is-danger';
    divNotification.classList.add('notification', state);

    const divColumns = document.createElement('div');
    divColumns.classList.add('columns', 'is-mobile');

    const divColumn1 = document.createElement('div');
    divColumn1.classList.add('column', 'is-narrow');

    if (copyable) {
        const button = document.createElement('button');
        button.classList.add('button', 'is-info');
        button.textContent = 'Copier';
        button.addEventListener('click', function () {
            copyToClipboard(link);
        });
        divColumn1.appendChild(button);
    }



    const divColumn2 = document.createElement('div');
    divColumn2.classList.add('column', 'is-flex', 'is-justify-content-center', 'is-align-items-center');

    const p = document.createElement('p');
    p.textContent = `${link}`;

    divColumn2.appendChild(p);

    divColumns.appendChild(divColumn1);
    divColumns.appendChild(divColumn2);

    divNotification.appendChild(divColumns);


    // Ajouter la section à la classe "section"
    sectionContainer.appendChild(divNotification);
}

const form = document.querySelector("form.shorten-form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let load = { 'url': document.querySelector("#longURL").value }
    try {
        let request = await (await fetch(API_URL, {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(load)
        })).json();
        if (request.lien_raccourci) {
            createSection(request.lien_raccourci)
        } else {
            createSection(request.message, false)
        }
    } catch (e) {
        throw e
    }
});