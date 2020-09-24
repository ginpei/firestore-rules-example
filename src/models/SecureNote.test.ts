import {
  describeIfEmulatorUp,
  FirestoreEmu,
  prepareFirestore,
} from "../firestoreTesting";
import { createSecureNote, SecureNote } from "./SecureNote";

describe("SecureNote", () => {
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
        public: false,
        title: "user note",
      });

      await createSecureNoteDoc({
        id: "public-note-1",
        userId: "user-X",
        public: true,
        title: "public note",
      });

      await createSecureNoteDoc({
        id: "private-note-1",
        userId: "user-X",
        public: false,
        title: "private note",
      });
    });

    describe("user note", () => {
      it("can read", async () => {
        const ss = await fsRoot.collection("notes").doc("user-note-1").get();
        expect(ss.data()?.title).toBe("user note");
      });

      it("can write", async () => {
        await fsRoot
          .collection("notes")
          .doc("user-note-1")
          .update({ title: "updated" });
        const ss = await fsRoot.collection("notes").doc("user-note-1").get();
        expect(ss.data()?.title).toBe("updated");
      });
    });

    describe("public note", () => {
      it("can read", async () => {
        const ss = await fsRoot.collection("notes").doc("public-note-1").get();
        expect(ss.data()?.title).toBe("public note");
      });
    });

    describe("private note", () => {
      it("cannot read", async () => {
        const p = fsRoot.collection("notes").doc("private-note-1").get();
        await expect(p).rejects.toThrow();
      });
    });

    describe("public note list", () => {
      it("can read", async () => {
        const ss = await fsRoot
          .collection("notes")
          .where("public", "==", true)
          .get();
        expect(ss.size).toBe(1);
        expect(ss.docs[0].data()?.title).toBe("public note");
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
  });
});
