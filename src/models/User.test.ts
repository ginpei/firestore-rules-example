import {
  describeIfEmulatorUp,
  FirestoreEmu,
  prepareFirestore,
} from "../firestoreTesting";
import { createUser, User } from "./User";

describe("User", () => {
  describeIfEmulatorUp("rules", () => {
    let fs: FirestoreEmu;
    let fsRoot: firebase.firestore.DocumentReference;
    let aFsRoot: firebase.firestore.DocumentReference;

    beforeEach(async () => {
      fs = prepareFirestore("user-1");
      fsRoot = fs.collection("secure-notes").doc("v1");
      aFsRoot = fs.admin.collection("secure-notes").doc("v1");

      await createUserDoc({
        id: "user-1",
        name: "current user",
      });

      await createUserDoc({
        id: "user-2",
        name: "another user",
      });
    });

    afterEach(() => {
      fs.cleanUp();
    });

    describe("current user", () => {
      it("can read", async () => {
        const ss = await fsRoot.collection("users").doc("user-1").get();
        expect(ss.data()?.name).toBe("current user");
      });

      it("can write", async () => {
        await fsRoot
          .collection("users")
          .doc("user-1")
          .update({ name: "updated" });

        const ss = await fsRoot.collection("users").doc("user-1").get();
        expect(ss.data()?.name).toBe("updated");
      });
    });

    describe("another user", () => {
      it("cannot read", async () => {
        return expect(
          fsRoot.collection("users").doc("user-2").get()
        ).rejects.toThrow();
      });

      it("cannot write", async () => {
        return expect(
          fsRoot.collection("users").doc("user-2").update({ name: "updated" })
        ).rejects.toThrow();
      });
    });

    async function createUserDoc(initial: Partial<User>) {
      if (!initial.id) {
        throw new Error("ID is required for test");
      }

      const note = createUser(initial);
      const doc = aFsRoot.collection("users").doc(note.id);
      await doc.set(note);

      return doc;
    }
  });
});
