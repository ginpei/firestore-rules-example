import * as firebaseTesting from "@firebase/testing";
import firebase from "firebase/app";
import "firebase/firestore";

/**
 * The same as `describe()`, or skip if Firebase emulator is running.
 *
 * To activate, set `FB_EMU` env var.
 *
 * For CI, you can use `exec`:
 *
 * ```console
 * npx firebase emulators:exec "FB_EMU=1 CI=1 npm test"
 * ```
 *
 * For local, execute tests while emulator is running, and restart emu when you
 * update rules:
 *
 * ```console
 * npx firebase emulators:start --only firestore &
 * FB_EMU=1 npm test
 * ```
 */
export const describeIfEmulatorUp: jest.Describe = process.env.FB_EMU
  ? describe
  : describe.skip;

// fix error:
//   FirebaseError: Function DocumentReference.set() called with invalid data.
//   Unsupported field value: a custom Timestamp object
class FakeTimestamp extends Date {
  get seconds() {
    return Math.floor(this.getTime() / 1000);
  }

  constructor(seconds: number) {
    super(seconds * 1000);
  }

  toMillis() {
    return this.getTime();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
firebase.firestore.Timestamp = FakeTimestamp as any;

export type FirestoreEmu = firebaseTesting.firestore.Firestore & {
  admin: firebaseTesting.firestore.Firestore;
  cleanUp: () => void;
};

export function prepareFirestore(
  uid: string | undefined,
  projectId = randomName()
): FirestoreEmu {
  const auth = uid ? { uid } : undefined;
  const app = firebaseTesting.initializeTestApp({ projectId, auth });
  const firestore = app.firestore() as FirestoreEmu;

  firestore.admin = prepareAdminFirestore(projectId);
  firestore.cleanUp = () => cleanUpFirestore(projectId);

  return firestore;
}

export function cleanUpFirestore(projectId = randomName()): Promise<void> {
  return firebaseTesting.clearFirestoreData({ projectId });
}

export function prepareAdminFirestore(
  projectId = randomName()
): firebaseTesting.firestore.Firestore {
  const adminApp = firebaseTesting.initializeAdminApp({ projectId });
  const fs = adminApp.firestore();
  return fs;
}

function randomName() {
  const n = Math.random().toString().slice(2);
  return `project-${n}`;
}
