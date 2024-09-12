"use strict";

const API_URL = "https://reducteur-js-api.onrender.com/";

document.addEventListener('DOMContentLoaded', () => {
    // Appel API pour récupérer les liens de l'utilisateur
    fetch('/api/my_links')
        .then(response => response.json())
        .then(data => {
            if (data.status === "SUCCESS") {
                const linksTable = document.getElementById('links-table');
                const noLinksMessage = document.getElementById('no-links-message');

                if (data.links.length === 0) {
                    // Si pas de liens, afficher un message "Aucun lien"
                    noLinksMessage.style.display = 'block';
                    linksTable.style.display = 'none'; // cacher la table
                } else {
                    // Si des liens existent, cacher le message "Aucun lien"
                    noLinksMessage.style.display = 'none';

                    // Remplir la table avec les données des liens
                    data.links.forEach((link, index) => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${link.originalURL}</td>
                            <td><a href="${API_URL + link.shortenURL}" target="_blank">${API_URL + link.shortenURL}</a></td>
                            <td>
                                <button class="button is-small is-info" onclick="copyToClipboard('${API_URL + link.shortenURL}')">Copier</button>
                                <button class="button is-small is-danger" onclick="deleteLink('${link.shortenURL}')">Supprimer</button>
                            </td>
                        `;
                        linksTable.appendChild(row);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des liens:', error);
        });
});

// Fonction pour copier le lien réduit
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {

        Swal.fire('Copié avec succès!', 'Lien copié dans le presse-papiers!', 'success');
    });
}

// Fonction pour supprimer un lien
function deleteLink(linkId) {
    fetch(`/api/link/${linkId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.status === "SUCCESS") {
                window.location.reload(); // Recharger la page après suppression
            }
        })
        .catch(error => {
            Swal.fire('Erreur', 'Erreur lors de la suppression du lien...', 'error');

        });
}


function checkSession() {
    fetch('/check-session', {
        method: 'GET',
        credentials: 'include' // Inclure les cookies de session
    })
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
                window.location.href = '/login';
            } else {
                const user_info = document.querySelector("div.navbar-item>p>span");
                user_info.textContent = data.username
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de la session:', error);
            window.location.href = '/login'; // Rediriger si une erreur survient
        });
}

checkSession();