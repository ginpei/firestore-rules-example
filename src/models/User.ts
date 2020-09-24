import firebase from "firebase/app";
import { useEffect, useState } from "react";
import { auth } from "../middleware/fb";
import { createDataRecord, DataRecord } from "./DataRecord";

export interface User extends DataRecord {
  id: string;
  name: string;
}

export function createUser(initial?: Partial<User>): User {
  return {
    ...createDataRecord(),
    id: "",
    name: "",
    ...initial,
  };
}

export function useCurrentUser(): [
  User | null,
  firebase.auth.Error | null,
  boolean
] {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<firebase.auth.Error | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    auth.onAuthStateChanged(
      (fbUser) => {
        if (!fbUser) {
          setUser(null);
          setError(null);
          setReady(true);
          return;
        }

        // TODO
        const newUser = createUser({ id: fbUser.uid });
        setUser(newUser);
        setError(null);
        setReady(true);
      },
      (newError) => {
        setUser(null);
        setError(newError);
        setReady(true);
      }
    );
  }, []);

  return [user, error, ready];
}

export function logInWithMail(mail: string, password: string) {
  return auth.signInWithEmailAndPassword(mail, password);
}

export function logInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

export function logInWithGitHub() {
  const provider = new firebase.auth.GithubAuthProvider();
  return auth.signInWithPopup(provider);
}

export function logOut() {
  return auth.signOut();
}
