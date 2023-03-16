import axios from "axios";
import * as TE from "fp-ts/TaskEither";
import { NetworkError } from "./Errors";
import {getUrl} from './App'

jest.mock("axios");

describe("getUrl", () => {
  describe("when curried", () => {
    // I'm still investigating, but (since TypeScript can't do runtime type checks) this may be the best "unit" test we can get
    it("should return a TaskEither", () => {
      const result = getUrl("http://mocked-url.com");
      expect(result).toBeEither()
    })
  })

  // These tests skew further toward "integration" because we must mock axios to ensure the call to the function works
  describe("when invoked", () => {
    it("should return data when the axios call is valid", async () => {
      const mockedResponse = { data: "mocked data" };
      (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValueOnce(
        mockedResponse
      );

      const result = await getUrl("http://mocked-url.com")();

      expect(result).toEqual(await TE.right("mocked data")());
    });

    it("should return NetworkError when the axios call is invalid", async () => {
      const mockedError = "mocked error";
      (axios.get as jest.MockedFunction<typeof axios.get>).mockRejectedValueOnce(
        mockedError
      );

      const result = await getUrl("http://mocked-url.com")();

      expect(result).toEqual(await TE.left(new NetworkError(String('mocked error')))());
    });
  })
});
