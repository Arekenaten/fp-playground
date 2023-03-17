import axios from "axios";
import { NetworkError } from "./Errors";
import {getUrl, validateJoke} from './App'

jest.mock("axios");

describe("getUrl", () => {
  // These tests skew further toward "integration" because we must mock axios to ensure the call to the function works
  it("returns data when the axios call is valid", async () => {
    const mockedResponse = { data: "mocked data" };
    (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValueOnce(
      mockedResponse
    );

    const result = await getUrl("http://mocked-url.com")(axios)();

    // This matcher comes from a library: https://github.com/relmify/jest-fp-ts
    // It would be perfect if it had a matcher for TaskEither (we could have a simple unit test for getUrl => instance of TaskEither)
    // but we can still use it here because by invoking getUrl we actually "unwrap" the value from the promise (TaskEither)
    // Maybe extending this library is something we could have on our Open Source roster?
    expect(result).toEqualRight("mocked data");
  });

  it("returns NetworkError when the axios call is invalid", async () => {
    const mockedError = "mocked error";
    (axios.get as jest.MockedFunction<typeof axios.get>).mockRejectedValueOnce(
      mockedError
    );

    const result = await getUrl("http://mocked-url.com")(axios)();

    expect(result).toEqualLeft(new NetworkError(String('mocked error')))
  });
});

describe("validateJoke", () => {
  it("returns Right with a valid joke object", () => {
    const validJoke = {
      setup: 'a', punchline: 'b'
    }
    expect(validateJoke(validJoke)).toEqualRight(validJoke)
  })
  it("returns Left with an invalid joke object", () => {
    const jokeWithoutPunchline = {
      setup: 'a'
    }
    expect(validateJoke(jokeWithoutPunchline)).toBeLeft()

    const jokeWithoutSetup = {
      punchline: 'b'
    }
    expect(validateJoke(jokeWithoutSetup)).toBeLeft()

    const emptyJoke = {}
    expect(validateJoke(emptyJoke)).toBeLeft()

    const jokeWithInvalidTypes = {
      setup: true, punchline: 5
    }
    expect(validateJoke(jokeWithInvalidTypes)).toBeLeft()
  })
})