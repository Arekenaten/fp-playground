import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { taskEither } from 'fp-ts';
import { chain } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function'; 
import { z } from 'zod';

const url = 'https://official-joke-api.appspot.com/random_joke';

function App() {
  const [setup, setSetup] = useState("");
  const [punchline, setPunchline] = useState("");

  const getUrl: (x: string) => taskEither.TaskEither<Error, string> = (url) => {
    return taskEither.tryCatch(
      () => fetch(url).then((res) => res.text()),
      (reason) => new Error(String(reason))
    )
  }

  const parseJson: (x: string) => taskEither.TaskEither<Error, object> = (json) => {
    return taskEither.tryCatch(
      () => new Promise((resolve) => resolve(JSON.parse(json))),
      (reason) => new Error(String(reason))
    )
  }

  const ValidJoke = z.object({setup: z.string(), punchline: z.string()})
  type ValidJokeType = z.infer<typeof ValidJoke>

  const validateJoke: (x: object) => taskEither.TaskEither<Error, ValidJokeType> = (x) => {
    const parsed = ValidJoke.safeParse(x)
    return parsed.success ? taskEither.right(parsed.data) : taskEither.left(parsed.error)
  };
  

  const getFromApiAndFormat = (url: string) => {
    return pipe(
      url,
      getUrl,
      chain(parseJson),
      chain(validateJoke)
    )
  }

  const trim = (s: string) => s.slice(1, -1)

  const handleClick = () => {
    getFromApiAndFormat(url)
    const {newSetup, newPunchline} = 
    setSetup(trim(JSON.stringify(newSetup)))
    setPunchline(trim(JSON.stringify(newPunchline)))
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={handleClick}>
          Get a joke
        </button>
        <p>{(setup && punchline) ? 
          `${setup} ... ${punchline}` 
          : "Just waiting for you to get a joke..."}</p>
      </header>
    </div>
  );
}

export default App;
