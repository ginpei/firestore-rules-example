import {
  describeIfEmulatorUp,
  FirestoreEmu,
  prepareFirestore,
} from "../firestoreTesting";
import { createSecureNote, SecureNote } from "./SecureNote";
import { createSecureNoteUser, SecureNoteUser } from "./SecureNoteUser";

describe("SecureNoteUser", () => {
  describeIfEmulatorUp("rules", () => {
    let fs: FirestoreEmu;
    let fsRoot: firebase.firestore.DocumentReference;
    let aFsRoot: firebase.firestore.DocumentReference;

    beforeEach(async () => {
      fs = prepareFirestore("user-1");
      fsRoot = fs.collection("secure-notes").doc("v1");
      aFsRoot = fs.admin.collection("secure-notes").doc("v1");

      await createSecureNoteDoc({
        id: "user-note-1",
        userId: "user-1",
      });

      await createSecureNoteUserDoc({
        noteId: "user-note-1",
        read: true,
        id: "user-2",
      });

      await createSecureNoteDoc({
        id: "shared-note-1",
        userId: "user-2",
        public: false,
      });

      await createSecureNoteUserDoc({
        noteId: "shared-note-1",
        read: true,
        id: "user-1",
      });

      await createSecureNoteUserDoc({
        noteId: "shared-note-1",
        read: true,
        id: "user-3",
      });

      await createSecureNoteDoc({
        id: "private-note-1",
        userId: "user-2",
        public: false,
      });

      await createSecureNoteUserDoc({
        noteId: "private-note-1",
        read: true,
        id: "user-3",
      });
    });

    describe("note owner", () => {
      describe("about somebody else", () => {
        it("can read", async () => {
          const ss = await fsRoot
            .collection("notes")
            .doc("user-note-1")
            .collection("users")
            .doc("user-2")
            .get();
          expect(ss.data()?.read).toBe(true);
        });

        it("can write", async () => {
          await fsRoot
            .collection("notes")
            .doc("user-note-1")
            .collection("users")
            .doc("user-2")
            .update({ read: false });

          await fsRoot
            .collection("users")
            .doc("user-2")
            .collection("sharedNotes")
            .doc("user-note-1")
            .set({ read: true });

          const ss = await fsRoot
            .collection("notes")
            .doc("user-note-1")
            .collection("users")
            .doc("user-2")
            .get();
          expect(ss.data()?.read).toBe(false);
        });
      });
    });

    describe("shared user", () => {
      describe("about own self", () => {
        it("can read", async () => {
          const ss = await fsRoot
            .collection("notes")
            .doc("shared-note-1")
            .collection("users")
            .doc("user-1")
            .get();
          expect(ss.data()?.read).toBe(true);
        });

        it("cannot update", async () => {
          const p = fsRoot
            .collection("notes")
            .doc("shared-note-1")
            .collection("users")
            .doc("user-1")
            .update({ read: false });
          await expect(p).rejects.toThrow();

          const p2 = fsRoot
            .collection("users")
            .doc("user-1")
            .collection("sharedNotes")
            .doc("shared-note-1")
            .set({ read: false });
          await expect(p2).rejects.toThrow();
        });

        it("can delete", async () => {
          const p = fsRoot
            .collection("notes")
            .doc("shared-note-1")
            .collection("users")
            .doc("user-1")
            .delete();
          await expect(p).resolves.not.toThrow();

          const p2 = fsRoot
            .collection("users")
            .doc("user-1")
            .collection("sharedNotes")
            .doc("shared-note-1")
            .delete();
          await expect(p2).resolves.not.toThrow();
        });
      });

      describe("about somebody else", () => {
        it("cannot read", async () => {
          const p = fsRoot
            .collection("notes")
            .doc("shared-note-1")
            .collection("users")
            .doc("user-3")
            .get();
          await expect(p).rejects.toThrow();
        });

        it("cannot write", async () => {
          const p = fsRoot
            .collection("notes")
            .doc("shared-note-1")
            .collection("users")
            .doc("user-3")
            .set({ read: true });
          await expect(p).rejects.toThrow();

          const p2 = fsRoot
            .collection("notes")
            .doc("shared-note-1")
            .collection("users")
            .doc("user-3")
            .set({ read: true });
          await expect(p2).rejects.toThrow();
        });
      });
    });

    describe("unrelated user", () => {
      describe("about own self", () => {
        it("cannot write", async () => {
          const p = fsRoot
            .collection("notes")
            .doc("private-note-1")
            .collection("users")
            .doc("user-1")
            .set({ read: true });
          await expect(p).rejects.toThrow();
        });
      });

      describe("about somebody else", () => {
        it("cannot read", async () => {
          const p = fsRoot
            .collection("notes")
            .doc("private-note-1")
            .collection("users")
            .doc("user-3")
            .get();
          await expect(p).rejects.toThrow();

          const p2 = fsRoot
            .collection("users")
            .doc("user-3")
            .collection("notes")
            .doc("private-note-1")
            .get();
          await expect(p2).rejects.toThrow();
        });
      });
    });

    async function createSecureNoteDoc(initial: Partial<SecureNote>) {
      if (!initial.id) {
        throw new Error("ID is required for test");
      }

      const note = createSecureNote(initial);
      const doc = aFsRoot.collection("notes").doc(note.id);
      await doc.set(note);

      return doc;
    }

    async function createSecureNoteUserDoc(initial: Partial<SecureNoteUser>) {
      if (!initial.noteId || !initial.id) {
        throw new Error("ID is required for test");
      }

      const nsUser = createSecureNoteUser(initial);
      const doc = aFsRoot
        .collection("notes")
        .doc(nsUser.noteId)
        .collection("users")
        .doc(initial.id);
      await doc.set(nsUser);

      return doc;
    }
  });
});
