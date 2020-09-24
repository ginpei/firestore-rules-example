import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const app = firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
});

if (process.env.REACT_APP_FB_EMU) {
  // eslint-disable-next-line no-console
  console.log("[Firestore] Using local emu");
  app.firestore().settings({
    host: "localhost:8080",
    ssl: false,
  });
}

export const fb = app;
export const auth = app.auth();
export const fsRoot = app.firestore().collection("secure-notes").doc("v1");
