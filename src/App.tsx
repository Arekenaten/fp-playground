import React, { useState } from 'react';
import './App.css';
import { NetworkError } from './Errors';

import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function'; 
import { z } from 'zod';
import axios from 'axios';
import { match, P } from 'ts-pattern';

const ValidJoke = z.object({setup: z.string(), punchline: z.string()})
type ValidJokeType = z.infer<typeof ValidJoke>

export type JokeResultsError = 
  | NetworkError
  | z.ZodError<ValidJokeType>

export const getUrl = (url: string) =>
  TE.tryCatch(
    () => axios.get(url).then((res) => res.data),
    (reason) => new NetworkError(String(reason))
);

export const validateJoke = (x: object) => {
  const parsed = ValidJoke.safeParse(x);
  return parsed.success ? TE.right(parsed.data) : TE.left(parsed.error);
};

export const getJokeFromApi = (
  url: string
): TE.TaskEither<JokeResultsError, ValidJokeType> => {
  return pipe(url, getUrl, TE.chainW(validateJoke));
};

function App() {
  const [setup, setSetup] = useState("");
  const [punchline, setPunchline] = useState("");
  const [error, setError] = useState("");

  const url = "https://official-joke-api.appspot.com/random_joke";

  const unsafeHandleClick = async () => {
    pipe(
      await getJokeFromApi(url)(),
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
