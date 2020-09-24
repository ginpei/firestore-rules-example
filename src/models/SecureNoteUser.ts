import { useEffect, useState } from "react";
import { fb, fsRoot } from "../middleware/fb";
import { createDataRecord, DataRecord, updateTimestamp } from "./DataRecord";
import { SecureNote, ssToSecureNote } from "./SecureNote";
import { User } from "./User";

export interface SecureNoteUser extends DataRecord {
  noteId: string;
  read: boolean;
}

export function createSecureNoteUser(
  initial?: Partial<SecureNoteUser>
): SecureNoteUser {
  return {
    ...createDataRecord(),
    noteId: "",
    read: false,
    ...initial,
  };
}

export function useSharedNotes(
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

    const query = fsRoot
      .collection("users")
      .doc(user.id)
      .collection("sharedNotes");
    return query.onSnapshot(
      async (qss) => {
        const ssNotes = await Promise.all(
          qss.docs.map((v) => v.data().note.get())
        );
        const newNotes = ssNotes.map((v) => ssToSecureNote(v));
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

export function setSecureNotePrivilege(snUser: SecureNoteUser) {
  const updatedSnUser = updateTimestamp(snUser);
  const batch = fb.firestore().batch();
  saveSecureNoteUser(batch, updatedSnUser);
  saveUserSharedNote(batch, updatedSnUser);
  return batch.commit();
}

/**
 * Make sure user data is set simultaneously.
 */
function saveSecureNoteUser(
  batch: firebase.firestore.WriteBatch,
  snUser: SecureNoteUser
) {
  const doc = getDoc(snUser);
  const data = snUserToData(snUser);
  batch.set(doc, data);
}

/**
 * Make sure note data is set simultaneously.
 */
function saveUserSharedNote(
  batch: firebase.firestore.WriteBatch,
  snUser: SecureNoteUser
) {
  const doc = getUserSharedNoteDoc(snUser);
  const data = { x: getDoc(snUser) };
  batch.set(doc, data);
}

function getColl(groupId: string) {
  return fsRoot.collection("notes").doc(groupId).collection("users");
}

function getDoc(snUser: SecureNoteUser): firebase.firestore.DocumentReference;
function getDoc(
  groupId: string,
  userId: string
): firebase.firestore.DocumentReference;
function getDoc(
  p1: SecureNoteUser | string,
  p2?: string
): firebase.firestore.DocumentReference {
  const groupId = typeof p1 === "string" ? p1 : p1.noteId;
  const userId = typeof p1 === "string" ? p2 : p1.id;
  return getColl(groupId).doc(userId);
}

function getUserSharedNoteColl(
  snUser: SecureNoteUser
): firebase.firestore.CollectionReference {
  // TODO
  return fsRoot.collection("users").doc(snUser.id).collection("sharedNotes");
}

function getUserSharedNoteDoc(
  snUser: SecureNoteUser
): firebase.firestore.DocumentReference {
  // TODO
  return getUserSharedNoteColl(snUser).doc(snUser.noteId);
}

function snUserToData(snUser: SecureNoteUser): firebase.firestore.DocumentData {
  return {
    read: snUser.read,
  };
}
