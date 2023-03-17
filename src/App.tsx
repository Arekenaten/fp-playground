import React, { useState } from 'react';
import './App.css';
import { NetworkError } from './Errors';

import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function'; 
import { z } from 'zod';
import axios, { AxiosInstance } from 'axios';
import { match, P } from 'ts-pattern';

const ValidJoke = z.object({setup: z.string(), punchline: z.string()})
type ValidJokeType = z.infer<typeof ValidJoke>

export type JokeResultsError = 
  | NetworkError
  | z.ZodError<ValidJokeType>

export const getUrl = (url: string) => (
  instance: AxiosInstance
): TE.TaskEither<NetworkError, unknown> =>
  TE.tryCatch(
    () => instance.get(url).then((res) => res.data),
    (reason) => new NetworkError(String(reason))
  );

// I don't like dealing with an unknown here... but a type-guard to ensure an object seems excessive
export const validateJoke = (x: object | unknown) => {
  const parsed = ValidJoke.safeParse(x);
  return parsed.success ? E.right(parsed.data) : E.left(parsed.error);
};

export const getJokeFromApi = (
  url: string
): RTE.ReaderTaskEither<AxiosInstance, JokeResultsError, ValidJokeType> => {
  return pipe(
    // Allows for dependency injection and passes the injected value into the pipe
    RTE.ask<AxiosInstance>(),
    RTE.chainTaskEitherKW((instance) => getUrl(url)(instance)),
    RTE.chainW((response) => RTE.fromEither(validateJoke(response)))
  );
};

function App() {
  const [setup, setSetup] = useState("");
  const [punchline, setPunchline] = useState("");
  const [error, setError] = useState("");

  const url = "https://official-joke-api.appspot.com/random_joke";

  const unsafeHandleClick = async () => {
    pipe(
      // Here we see a new parameter, our injected dependency
      await getJokeFromApi(url)(axios)(),
      E.fold(
        (error) => {
          match(error)
            .with(P.instanceOf(NetworkError), (e) =>
              setError(
                String(
                  `There was something wrong with the API call! ${e.message}`
                )
              )
            )
            .with(P.instanceOf(z.ZodError), (e) =>
              setError(
                String(
                  `The data did not return in the shape we expected! ${e.message}`
                )
              )
            )
            .exhaustive();
        },
        (result) => {
          setSetup(result.setup);
          setPunchline(result.punchline);
        }
      )
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={unsafeHandleClick}>Get a joke</button>
        <p>
          {error
            ? `${error}`
            : setup && punchline
              ? `${setup} ... ${punchline}`
              : "Just waiting for you to get a joke..."}
        </p>
      </header>
    </div>
  );
}

export default App;
