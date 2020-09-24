import firebase from "firebase/app";
import { createDataRecord, updateTimestamp, DataRecord } from "./DataRecord";

describe("DataRecord", () => {
  describe("updateTimestamp()", () => {
    describe("for record without valid timestamp", () => {
      let record: DataRecord;

      beforeEach(() => {
        const data = createDataRecord();
        record = updateTimestamp(data);
      });

      it("updates createdAt", () => {
        expect(record.createdAt.seconds).not.toBe(0);
      });

      it("updates updatedAt", () => {
        expect(record.updatedAt.seconds).not.toBe(0);
      });
    });

    describe("for record with valid timestamp", () => {
      let original: DataRecord;
      let updated: DataRecord;

      beforeEach(() => {
        original = createDataRecord({
          updatedAt: new firebase.firestore.Timestamp(1, 1),
          createdAt: new firebase.firestore.Timestamp(1, 1),
        });
        updated = updateTimestamp(original);
      });

      it("updates createdAt", () => {
        expect(updated.createdAt.seconds).toBe(1);
      });

      it("updates updatedAt", () => {
        expect(updated.updatedAt.seconds).not.toBe(1);
      });
    });
  });
});
