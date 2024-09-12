"use strict";

const API_URL = "https://reducteur-js-api.onrender.com/api/user/create"
const SESSION_URL = "https://reducteur-js-api.onrender.com/check-session";

const textArea = document.createElement("textarea");

function copyToClipboard(text, message, status = "success") {
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.body.removeChild(textArea);
    Swal.fire(status === "success" ? 'Inscription réussie!' : 'Erreur',
        status === "success" ? `Bienvenue ${message} !!!` : message,
        status
    );

}

document.getElementById('register-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Empêche l'envoi du formulaire par défaut

    // Récupérer les valeurs des champs
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // Vérification si les mots de passe correspondent
    if (password !== confirmPassword) {
        Swal.fire({
            title: 'Erreur',
            text: 'Les mots de passe ne correspondent pas',
            type: 'warning',
            confirmButtonText: 'OK'
        });
    } else {


        // Vous pouvez ensuite envoyer les données au serveur avec fetch ou AJAX
        fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ username: username, email: email, password: password }),
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json()).then(data => {
            if (data.status === "SUCCESS") {
                copyToClipboard("Inscription réussie...", username);
                setTimeout(() => {
                    window.location.href = '/'; // Redirige vers la page d'accueil
                }, 3000); // 3000 millisecondes = 3 secondes
            } else {
                copyToClipboard("Erreur lors de l'inscription", data.message, "error");
            }
        });

    }

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