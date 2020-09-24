import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  createSecureNote,
  saveSecureNote,
  SecureNote,
  usePublicNotes,
  useUserNotes,
} from "./models/SecureNote";
import { useSharedNotes } from "./models/SecureNoteUser";
import {
  logInWithGitHub,
  logInWithGoogle,
  logInWithMail,
  logOut,
  useCurrentUser,
  User,
} from "./models/User";

const ErrorContext = React.createContext<{
  error: Error | null;
  setError: (v: Error | null) => void;
}>({
  error: null,
  setError: () => undefined,
});

const App: React.FC = () => {
  const [user, userError, userReady] = useCurrentUser();
  const [error, setError] = useState<Error | null>(null);

  if (!userReady) {
    return <LoadingScreen />;
  }

  if (userError) {
    return <ErrorScreen error={userError} />;
  }

  return (
    <>
      <div
        style={{
          backgroundColor: "#036",
          height: "0.5rem",
          width: "100%",
        }}
      ></div>
      <ErrorContext.Provider value={{ error, setError }}>
        <HomePage user={user} />
      </ErrorContext.Provider>
    </>
  );
};

export default App;

const HomePage: React.FC<{ user: User | null }> = ({ user }) => {
  const [notes, notesError, notesReady] = usePublicNotes();
  const [notes2, notes2Error, notes2Ready] = useUserNotes(user);
  const [notes3, notes3Error, notes3Ready] = useSharedNotes(user);
  const [editingNote, setEditingNote] = useState(createSecureNote());

  const onSelectNote = useCallback((note: SecureNote) => {
    setEditingNote(note);
  }, []);

  if (!notesReady || !notes2Ready || !notes3Ready) {
    return <LoadingScreen />;
  }

  const error = notesError || notes2Error || notes3Error;
  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="ui-container">
      <h1>Firebase Firestore security rules example</h1>
      <ul>
        <li>
          <a href="http://localhost:4000/">Firebase emulator UI</a>{" "}
          <small>
            (visit while <code>$ npm run emu</code> running)
          </small>
        </li>
        <li>
          <a href="https://firebase.google.com/docs/emulator-suite/connect_firestore">
            Connect your app to the Cloud Firestore Emulator | Firebase
          </a>
        </li>
      </ul>
      <hr />
      <ErrorSection />
      <h2>User</h2>
      {user ? (
        <>
          <p>User ID: {user.id}</p>
          <LogoutForm />
        </>
      ) : (
        <LoginForm />
      )}
      {editingNote.id && <NoteForm note={editingNote} />}
      <NotesSection
        notes={notes}
        onSelectNote={onSelectNote}
        title="Public notes"
      />
      <NotesSection
        notes={notes2}
        onSelectNote={onSelectNote}
        title="User notes"
      />
      <NotesSection
        notes={notes3}
        onSelectNote={onSelectNote}
        title="Shared notes"
      />
    </div>
  );
};

const LoadingScreen: React.FC = () => {
  return <div className="LoadingScreen">…</div>;
};

const ErrorScreen: React.FC<{ error: Error | firebase.auth.Error }> = ({
  error,
}) => {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="ErrorScreen ui-container">
      <h1>
        <span role="img" aria-label="">
          😥
        </span>{" "}
        Error
      </h1>
      <p>{error.message}</p>
      <hr />
      <LogoutForm />
    </div>
  );
};

const ErrorSection: React.FC = () => {
  const { error, setError } = useContext(ErrorContext);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (!error) {
      return;
    }

    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  if (!error) {
    return null;
  }

  return (
    <div className="ErrorSection" style={{ color: "red" }}>
      <button onClick={clearError} style={{ float: "right" }}>
        Dismiss
      </button>
      {error.message}
    </div>
  );
};

const LoginForm: React.FC = () => {
  const [mail, setMail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const { setError } = useContext(ErrorContext);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      try {
        await logInWithMail(mail, password);
      } catch (error) {
        setError(error);
      }
    },
    [mail, password, setError]
  );

  const onMailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;
      setMail(value);
    },
    []
  );

  const onPasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;
      setPassword(value);
    },
    []
  );

  const onGoogleClick = useCallback(async () => {
    try {
      await logInWithGoogle();
    } catch (error) {
      setError(error);
    }
  }, [setError]);

  const onGitHubClick = useCallback(async () => {
    try {
      await logInWithGitHub();
    } catch (error) {
      setError(error);
    }
  }, [setError]);

  return (
    <form className="LoginForm" onSubmit={onSubmit}>
      <div>
        <label>
          {"Email: "}
          <input
            type="mail"
            onChange={onMailChange}
            placeholder="my-name@example.com"
            value={mail}
          />
        </label>
      </div>
      <div>
        <label>
          {"Password: "}
          <input type="password" onChange={onPasswordChange} value={password} />
        </label>
      </div>
      <div>
        <button type="submit">Log in with email</button>
      </div>
      <div>
        <button type="button" onClick={onGoogleClick}>
          Log in with Google
        </button>{" "}
        <button type="button" onClick={onGitHubClick}>
          Log in with GitHub
        </button>
      </div>
    </form>
  );
};

const LogoutForm: React.FC = () => {
  const onLogoutClick = useCallback(() => logOut(), []);

  return (
    <div className="LogoutForm">
      <button onClick={onLogoutClick}>Log out</button>
    </div>
  );
};

const NoteForm: React.FC<{ note: SecureNote }> = ({ note }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [title, setTitle] = useState("");

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const updatedNote = {
        ...note,
        title,
      };

      setError(null);
      setSaving(true);
      try {
        await saveSecureNote(updatedNote);
      } catch (e) {
        setError(e);
      } finally {
        setSaving(false);
      }
    },
    [note, title]
  );

  const onNoteChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.currentTarget;
      if (name === "title") {
        setTitle(value);
      }
    },
    []
  );

  useEffect(() => {
    setError(null);
    setTitle(note.title);
  }, [note]);

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <form className="NoteForm" onSubmit={onSubmit}>
      <h2>Edit note</h2>
      <p>
        <label>
          {"Title: "}
          <input
            disabled={saving}
            name="title"
            onChange={onNoteChange}
            type="text"
            value={title}
          />
        </label>
      </p>
      {error && (
        <p style={{ color: "tomato" }}>
          <span role="img" aria-label="Error">
            ⚠️
          </span>
          {error.message}
        </p>
      )}
      <p>
        <button disabled={saving} type="submit">
          Save
        </button>{" "}
        <button disabled={saving} type="button">
          Cancel
        </button>{" "}
        <small>ID: {note.id}</small>
      </p>
    </form>
  );
};

const NotesSection: React.FC<{
  notes: SecureNote[];
  onSelectNote: (note: SecureNote) => void;
  title: string;
}> = ({ notes, onSelectNote, title }) => {
  return (
    <div className="UserNotesSection">
      <h2>{title}</h2>
      <ul>
        {notes.map((note) => (
          <NoteListItem key={note.id} note={note} onSelectNote={onSelectNote} />
        ))}
        {notes.length < 1 && (
          <li>
            <small>(No items found)</small>
          </li>
        )}
      </ul>
    </div>
  );
};

const NoteListItem: React.FC<{
  note: SecureNote;
  onSelectNote: (note: SecureNote) => void;
}> = ({ note, onSelectNote }) => {
  const onNoteClick = useCallback(() => {
    onSelectNote(note);
  }, [note, onSelectNote]);

  return (
    <li>
      <span className="ui-link" onClick={onNoteClick}>
        {note.title}
      </span>
    </li>
  );
};
