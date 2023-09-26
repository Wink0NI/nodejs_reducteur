const { customAlphabet } = require('nanoid');
const sqlite3 = require('sqlite3').verbose();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const db = require('./models/Urls');
require('dotenv').config();
// HEX
let nanoid = customAlphabet("123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

function executeQuery(query, data, callback) {
  try {
    // Open the SQLite database
    db.serialize(() => {
      // Execute the provided query
      db.all(query, data, (err, rows) => {
        if (err) {
          console.error("SQLite Error:", err);
          callback(err, null); // Call the callback with an error
        } else {
          // Call the callback with the rows
          callback(null, rows);
        }

        // Close the database connection
        
      });
    });
  } catch (error) {
    // Handle any errors
    console.error("Error:", error);
    callback(error, null); // Call the callback with an error
  }
}

const PORT = process.env.PORT || 3000;

const whiteList = "https://ephemeral-gaufre-dfc573.netlify.app";

app = express();
app.use(
  cors({
    origin: whiteList,
  })
); // origin: * --> origin: mywebsite.com
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Home page",
  });
});

app.post("/api/shorten", async (req, res, next) => {
  if (req.body.url) {
    try {

      // make a request with Axios
      const response = await axios.get(req.body.url.toString(), {
        validateStatus: (status) => {
          return status < 500;
        },
      });

      if (response.status !== 404) {
        const generateUniqueSlug = () => {
          const slug = nanoid(); // Générer un slug aléatoire
          const slugCheckQuery = `SELECT * FROM links WHERE shortenURL = ?`;
      
          executeQuery(slugCheckQuery, [slug], (err, rows) => {
            if (err) {
              res.status(400).json({ message: err });
            } else {
              if (rows.length === 0) {
                // Le slug est unique, insérer l'URL
                const insertQuery = `INSERT INTO links (originalURL, shortenURL) VALUES (?, ?)`;
      
                executeQuery(insertQuery, [req.body.url, slug], (err, result) => {
                  if (err) {
                    res.status(400).json({ message: err });
                  } else {
                    res.status(200).json({ short: `https://shortener-extra-f2ab66d60f80.herokuapp.com/${slug}` });
                  }
                });
              } else {
                // Le slug existe déjà, réessayer avec un nouveau slug
                generateUniqueSlug();
              }
            }
          });
        };
      
        // Commencer la génération avec un slug unique
        generateUniqueSlug();
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

app.get("/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const slugCheckQuery = "SELECT originalUrl FROM links WHERE shortenURL = ?";

    executeQuery(slugCheckQuery, [slug], (err, rows) => {

      if (err) {
        return next(err);
      }

      if (rows.length > 0) {
        // Rediriger vers l'URL d'origine
        const originalUrl = rows[0].originalURL;
        
        res.status(301).redirect(originalUrl);
      } else {
        next();
      }
    });
  } catch (err) {
    next(err);
  }
});


function notFound(req, res, next) {
  res.status(404);
  const error = new Error("Not found - " + req.originalUrl);
  next(error);
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

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
