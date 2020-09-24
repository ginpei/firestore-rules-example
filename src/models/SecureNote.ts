import { useEffect, useState } from "react";
import { fsRoot } from "../middleware/fb";
import { createDataRecord, DataRecord, updateTimestamp } from "./DataRecord";
import { User } from "./User";

export interface SecureNote extends DataRecord {
  body: string;
  public: boolean;
  title: string;
  userId: string;
}

export function createSecureNote(initial?: Partial<SecureNote>): SecureNote {
  return {
    ...createDataRecord(),
    body: "",
    public: false,
    title: "",
    userId: "",
    ...initial,
  };
}

export function usePublicNotes(): [SecureNote[], Error | null, boolean] {
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const query = getColl().where("public", "==", true);
    return query.onSnapshot(
      (qss) => {
        const newNotes = qss.docs.map((v) => ssToSecureNote(v));
        setNotes(newNotes);
        setError(null);
        setReady(true);
      },
      (newError) => {
        setNotes([]);
        setError(newError);
        setReady(true);
      }
    );
  }, []);

  return [notes, error, ready];
}

export function useUserNotes(
  user: User | null
): [SecureNote[], Error | null, boolean] {
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setError(null);
      setReady(true);
      return () => undefined;
    }

    setNotes([]);
    setError(null);
    setReady(false);

    const query = getColl().where("userId", "==", user.id);
    return query.onSnapshot(
      (qss) => {
        const newNotes = qss.docs.map((v) => ssToSecureNote(v));
        setNotes(newNotes);
        setError(null);
        setReady(true);
      },
      (newError) => {
        setNotes([]);
        setError(newError);
        setReady(true);
      }
    );
  }, [user]);

  return [notes, error, ready];
}

export async function saveSecureNote(note: SecureNote) {
  const data = secureNoteToData(updateTimestamp(note));
  const doc = getDoc(note.id);
  await doc.update(data);
}

export function ssToSecureNote(
  ss: firebase.firestore.DocumentSnapshot
): SecureNote {
  const data = ss.data();
  return createSecureNote({
    ...data,
    id: ss.id,
  });
}

function getColl() {
  return fsRoot.collection("notes");
}

function getDoc(noteId: string) {
  return getColl().doc(noteId);
}

function secureNoteToData(note: SecureNote) {
  return { ...note };
}
