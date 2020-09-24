# Firebase Firestore security rules example

## Get started

You don't need Firebase account to just try.

Prepare:

1. `git clone`
2. `npm install`
3. `cp -r emu-export.example emu-export`

Start app:

1. `npm run emu` for local Firebase emulator
   - http://localhost:4000/
2. `REACT_APP_FB_EMU=1 npm run start` for app with the emulator
   - http://localhost:3000/
   - `REACT_APP_FB_EMU=1` is a flag to switch connection to the local emu

Run test:

1. If the emulator is not running, `npm run emu`
2. `FB_EMU=1 npm run test`
   - If `FB_EMU=1` flag is not set, rule tests are skipped
   - When you saw "No tests found", you may want to press `a` to run all tests

## Where to see

- Firestore security rules
  - `/firestore.rules`
- To run some tests only when the emulator is up
  - `describeIfEmulatorUp` in `/src/firestoreTesting.ts`
- To write tests connecting to the emulator
  - `prepareFirestore()` in `/src/firestoreTesting.ts`
- To test rules
  - Tests under `describeIfEmulatorUp("rules", ...` in `/src/models/SecureNote.test.ts`, etc
- To get items following rules
  - `useUserNotes()` in `/src/models/SecureNote.ts`, etc

## Try on your project

You can set up your project to use Firestore with emulators by `firebase init`. Don't forget you can also add the other futures later by calling `firebase init` again.

1. Prepare `firebase` command by `npm install -D firebase-tools` or global if you want
2. Initialize firebase project
   - `npx firebase init`
3. "Which Firebase CLI features do you want to set up for this folder?"
   - Select **Firestore** and **Emulators**
   - And select any other features else you want
4. "Please select an option"
   - Select **Don't set up a default project** for demo
   - Or you can select existing project
5. "What file should be used for Firestore Rules?"
6. "What file should be used for Firestore indexes?"
7. "Which Firebase emulators do you want to set up?"
   - Select **Firestore**
   - And select the others if you selected recently
8. "Which port do you want to use for the firestore emulator?"
9. "Would you like to enable the Emulator UI?"
10. "Which port do you want to use for the Emulator UI"
11. Would you like to download the emulators now?
    - `y`
12. "Firebase initialization complete!"

## Code and rules

### For ownership

1. Have a user ID on a document; `userId: string`

To get:

```ts
const user = firebase.auth().currentUser;
const coll = firebase.firestore().collection("items");
const query = coll.where("userId", "==", user.uid);
```

Rules:

```
match /items/{itemId} {
  allow read, write: if resource.data.userId == request.auth.uid;
}
```

### For shared flag

1. Have a boolean flag on a document; `public: boolean`

To get:

```ts
const coll = firebase.firestore().collection("items");
const query = coll.where("public", "==", true);
```

Rules:

```
match /items/{itemId} {
  allow read: if resource.data.public;
}
```

### For shared type

1. Have a type on a document; `type: "listed" | "public" | "private"`
   - Let's say "listed" type docs are listed in an index page,
   - And "public" docs are not listed, but anybody who knows the URL can access

To get list:

```ts
const coll = firebase.firestore().collection("items");
const query = coll.where("type", "==", "listed");
```

Rules:

```
match /items/{itemId} {
  allow read: if resource.data.type == "listed";
  allow read: if resource.data.type == "public";
}
```

### For shared users

1. Have a collection of user IDs on a document
   - `/items/${itemId}/users/${userId}`
2. Doc of user collection has privilege flags
   - `read: boolean`
   - `update: boolean`
   - `delete: boolean`
   - etc
3. Have a collection of document IDs on an user document (in order to have a list for user)
   - `/users/${userId}/sharedItems/${itemId}`
4. Doc of shared item collection has sort conditions
   - `updatedAt: Timestamp`
5. Doc of shared item collection has ref to the target item (optional)
   - `item: DocumentReference`
6. Keep both of original item doc and user's collection up-to-date

To get list for user:

```ts
const user = firebase.auth().currentUser;
const docUser = firebase.firestore().collection("users").doc(user.uid);
const coll = docUser.collection("sharedItems");
const query = coll.orderBy("updatedAt", "desc");

// query -> query snapshot
const qss = await query.get();

// query snapshot -> array of document snapshot
const ssList = await Promise.all(
  qss.docs.map((dss) => {
    // document has a ref to the item
    const refItem = dss.data()
      .item as firebase.firestore.DocumentReference;

    // item ref -> item snapshot
    return refItem.get();
  })
);

// item snapshot -> raw data
const dataList = ssList.map((ss) => ss.data());

// raw data -> final data
console.log(
  "Result",
  dataList.map((v, i) => `${i}: ${v?.title ?? "?"}`)
);
```

Rues:

```
match /items/{itemId} {
  allow read: if getItemUser(request.auth.uid).data.read;

  match /users/{userId} {
    // item owner
    allow read, write: if getItem().data.userId == request.auth.uid;

    // shared user
    allow read, delete: if userId == request.auth.uid;
  }

  function getItemUser() { … }
  function getItem() { … }
}
```

## Author

- Ginpei Takanashi
- [@ginpei](https://github.com/ginpei) on GitHub
- [@ginpei_en](https://twitter.com/ginpei_en) on Twitter
