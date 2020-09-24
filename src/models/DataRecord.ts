import firebase from "firebase/app";

export interface DataRecord {
  createdAt: firebase.firestore.Timestamp;
  id: string;
  updatedAt: firebase.firestore.Timestamp;
}

const zeroTimestamp = new firebase.firestore.Timestamp(0, 0);

export function createDataRecord(initial?: Partial<DataRecord>): DataRecord {
  return {
    createdAt: zeroTimestamp,
    id: "",
    updatedAt: zeroTimestamp,
    ...initial,
  };
}

export function updateTimestamp<T extends DataRecord>(data: T): T {
  const updatedAt = firebase.firestore.Timestamp.now();
  const createdAt =
    data.createdAt.toMillis() === 0 ? updatedAt : data.createdAt;
  return {
    ...data,
    createdAt,
    updatedAt,
  };
}
