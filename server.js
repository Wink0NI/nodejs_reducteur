const { customAlphabet } = require('nanoid');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./models/Urls');
const path = require('path');
const session = require('express-session');

// HEX
let nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);
const PORT = process.env.PORT || 3000;
const link = "https://reducteur-js-api.onrender.com";

function executeQuery(query, data, callback) {
  try {
    // enregistrer les modifications
    db.serialize(() => {
      // Executer la fonction
      db.all(query, data, (err, lignes) => {
        if (err) {
          // Callback avec erreur
          callback(err, null);
        } else {
          // Callback avec les lignes
          callback(null, lignes);
        }
      });
    });
  } catch (error) {
    // Cas erreur: Callback erreur
    console.error("Error:", error);
    callback(error, null);
  }
}

app = express();

app.use(session({
  secret: 'votre_secret',  // Replace with a strong secret key
  resave: false,
  saveUninitialized: false,
}));

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true  // Allow credentials (cookies, etc.) to be sent and received
  })
); // origine -> tous les sites

app.use(express.json());
app.use(express.static("dist"))

// Route pour vérifier la session de l'utilisateur
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user.username, email: req.session.user.email });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/api/user/create", async (req, res, next) => {
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.status(402).json({ status: "ERROR", message: "Identifiant ou mot de passe manquante" });
  }

  const generateUniqueshortURL = () => {
    // Générer un shortURL aléatoire
    const id = nanoid();
    const user_id_check = `SELECT * FROM user WHERE user_id = ?`;

    executeQuery(user_id_check, [id], (err, lignes) => {
      if (err) {
        res.status(400).json({ status: "ERROR", message: err });
      } else {
        if (lignes.length === 0) {
          // Le shortURL est unique, insérer l'URL
          const insertQuery = `INSERT INTO user VALUES (?, ?, ?, ?)`;

          executeQuery(insertQuery, [id, req.body.username, req.body.password, req.body.email], (err, result) => {
            if (err) {
              res.status(400).json({ status: "ERROR", message: "Le mail est déjà associé à un compte..." });
            } else {
              req.session.user = { username: req.body.username, email: req.body.email };
              res.status(200).json({ status: "SUCCESS" });
              
            }
          });
        } else {
          // Le shortURL existe déjà, réessayer avec un nouveau shortURL
          generateUniqueshortURL();
        }
      }
    });
  };

  // Commencer la génération avec un shortURL unique
  generateUniqueshortURL();

});

app.post("/api/user/login", async (req, res, next) => {
  try {
    const user_data = req.body.user_data;
    const password = req.body.password;
    const ConnectCheckQuery = "SELECT * FROM user WHERE (email = ? OR name = ?) AND password = ?";

    executeQuery(ConnectCheckQuery, [user_data, user_data, password], (err, lignes) => {

      if (err) {
        return next(err);
      }

      if (lignes.length > 0) {
        req.session.user = { username: lignes[0].name, email: lignes[0].email };
        return res.status(200).json({ status: "SUCCESS", data: lignes[0].name })
      } else {
        return res.status(401).json({ status: "ERROR", message: "Identifiants incorrect" });
      }
    });
  } catch (err) {
    next(err);
  }
});

// Route pour gérer la déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});


app.post("/api/shorten", async (req, res, next) => {
  if (req.body.url) {
    try {

      // Axios pour se connecter
      const response = await axios.get(req.body.url.toString(), {
        validateStatus: (status) => {
          return status < 500;
        },
      });

      if (response.status !== 404) {
        const generateUniqueshortURL = () => {
          // Générer un shortURL aléatoire
          const shortURL = nanoid();
          const user = req.session.user ? req.session.user.username : "Anonyme";
          const shortURLCheckQuery = `SELECT * FROM links WHERE shortenURL = ?`;

          executeQuery(shortURLCheckQuery, [shortURL], (err, lignes) => {
            if (err) {
              res.status(400).json({ message: err });
            } else {
              if (lignes.length === 0) {
                // Le shortURL est unique, insérer l'URL
                const insertQuery = `INSERT INTO links (originalURL, shortenURL, author_id) VALUES (?, ?, ?)`;

                executeQuery(insertQuery, [req.body.url, shortURL, user], (err, result) => {
                  if (err) {
                    res.status(400).json({ message: err });
                  } else {
                    res.status(200).json({ lien_raccourci: `${link}/${shortURL}` });
                  }
                });
              } else {
                // Le shortURL existe déjà, réessayer avec un nouveau shortURL
                generateUniqueshortURL();
              }
            }
          });
        };

        // Commencer la génération avec un shortURL unique
        generateUniqueshortURL();
      }
      else {
        res.json({
          message: response.statusText,
          status: response.status,
        });
      }

    } catch (err) {
      next(err);
    }
  } else {
    res.status(400);
    const error = new Error("URL is required");
    next(error);
  }
});

app.get("/:shortURL", async (req, res, next) => {
  try {
    const shortURL = req.params.shortURL;
    const shortURLCheckQuery = "SELECT originalUrl FROM links WHERE shortenURL = ?";

    executeQuery(shortURLCheckQuery, [shortURL], (err, lignes) => {

      if (err) {
        return next(err);
      }

      if (lignes.length > 0) {
        // Rediriger vers l'URL d'origine
        const originalUrl = lignes[0].originalURL;
        res.status(301).redirect(originalUrl);
      } else {
        next();
      }
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/my_links", async (req, res, next) => {
  try {
    let user = req.session.user;
    if (!user) {
      return res.status(401).json({ status: "ERROR", message: "Unauthorized" });
    }
    user = user.username;

    const shortURLCheckQuery = "SELECT * FROM links WHERE author_id = ?";

    executeQuery(shortURLCheckQuery, [user], (err, lignes) => {

      if (err) {
        return next(err);
      }
      

      return res.status(200).json({ status: "SUCCESS", links: lignes });
    });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/link/:id', async (req, res, next) => {
  const linkId = req.params.id; // ID du lien à supprimer
  const user = req.session.user ? req.session.user.username : "Anonyme"; // ID de l'utilisateur connecté (via session)
  

   // Vérifier si le lien appartient à l'utilisateur avant de le supprimer
   const query = `DELETE FROM links WHERE author_id = ? AND shortenURL = ?`;

   db.run(query, [user, linkId], function (err) {
       if (err) {
           console.error('Erreur lors de la suppression du lien:', err);
           return res.status(500).json({ message: 'Erreur interne du serveur.' });
       }

       // Vérifier si une ligne a été supprimée
       if (this.changes === 0) {
           return res.status(404).json({ message: 'Lien non trouvé ou accès non autorisé.' });
       }

       // Répondre que la suppression a réussi
       res.status(200).json({ status: "SUCCESS", message: 'Lien supprimé avec succès.' });
   });

});

app.get("/login", async (req, res, next) => {
  // redirect to login.html
  res.sendFile(path.join(__dirname, "dist", "login.html"));
});

app.get("/register", async (req, res, next) => {
  // redirect to login.html
  res.sendFile(path.join(__dirname, "dist", "register.html"));
});

app.get("/my_links", async (req, res, next) => {
  // redirect to login.html
  res.sendFile(path.join(__dirname, "dist", "my_links.html"));
});


function notFound(req, res, next) {
  res.status(404);
  const error = new Error("Not found - " + req.originalUrl);
  return next(error);
}

function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    error: {
      status: res.statusCode,
      stack: process.env.ENV === "development" ? err.stack : undefined,
    },
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Listening on port ${PORT}... in mode ${process.env.NODE_ENV}. Go to http://localhost:${PORT} if connected in local mode or to https://reducteur-js-api.onrender.com if deployed.`));
