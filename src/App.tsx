import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function'; 
import { z } from 'zod';
import axios from 'axios';

function App() {
  const [setup, setSetup] = useState("");
  const [punchline, setPunchline] = useState("");
  const [errorInFetch, setErrorInFetch] = useState("");

  const getUrl: (url: string) => TE.TaskEither<Error, object> = (url) => 
    TE.tryCatch(
      () => axios.get(url).then((res) => res.data),
      (reason) => new Error(String(reason))
    )

  const ValidJoke = z.object({setup: z.string(), punchline: z.string()})
  type ValidJokeType = z.infer<typeof ValidJoke>

  const validateJoke: (x: object) => TE.TaskEither<Error, ValidJokeType> = (x) => {
    const parsed = ValidJoke.safeParse(x)
    return parsed.success ? TE.right(parsed.data) : TE.left(parsed.error)
  };
  
  const getJokeFromApi = (url: string) => {
    return pipe(
      url,
      getUrl,
      TE.chain(validateJoke),
    )
  }

  const url = 'https://official-joke-api.appspot.com/random_joke';
  // const url = 'https://notavalidurl.fortesting'

  const unsafeHandleClick = async () => {
    pipe(
      await getJokeFromApi(url)(),
      E.match(
        (error) => setErrorInFetch(String(error)),
        (result) => {
          setSetup(result.setup)        
          setPunchline(result.punchline)        
        }
      )
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={unsafeHandleClick}>
          Get a joke
        </button>
        <p>{(setup && punchline) ? 
          `${setup} ... ${punchline}` 
          : "Just waiting for you to get a joke..."}</p>
        <p>{errorInFetch ? `Something went wrong! ${errorInFetch}` : ""}</p>
      </header>
    </div>
  );
}

export default App;
