"use strict";

const API_URL = "https://reducteur-js-api.onrender.com/api/user/login";
const SESSION_URL = "https://reducteur-js-api.onrender.com/check-session";
const textArea = document.createElement("textarea");



document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Empêche l'envoi du formulaire par défaut

    // Récupérer les valeurs des champs
    const username = document.getElementById('email_username').value;
    const password = document.getElementById('password').value;

    // Vous pouvez ajouter des validations ici
    let load = { 'user_data': username, 'password': password };
try {
    let request = await (await fetch(API_URL, {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify(load)
    })).json();
    if (request.status === "SUCCESS") {
        copyToClipboard(`Connecté en tant que ${request.data}`)
        setTimeout(() => {
            window.location.href = '/'; // Redirige vers la page d'accueil
        }, 3000); // 3000 millisecondes = 3 secondes
    } else {
        copyToClipboard(request.message, request.message, false)
    }
} catch (e) {
    throw e
}

function copyToClipboard(text, message = "", status = "success") {
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.body.removeChild(textArea);
    Swal.fire({
        icon: status,
        title: status === "success" ? 'Connexion réussie!' : 'Erreur',
        text: status === "success" ? 'Redirection vers le menu principal ...' : message,
    });
}

    // Code pour envoyer les données au serveur via AJAX ou fetch peut être ajouté ici
});

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier si l'utilisateur est déjà connecté
    try {
        let session = await (await fetch(SESSION_URL, {
            method: 'GET',
            credentials: 'include', // Pour inclure les cookies de session
        })).json();

        if (session.loggedIn) {
            // Si l'utilisateur est déjà connecté, le rediriger
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
    }
});