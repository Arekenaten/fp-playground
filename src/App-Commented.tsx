import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { NetworkError } from './Errors';

import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function'; 
import { z } from 'zod';
import axios from 'axios';
import { match, P } from 'ts-pattern';

// Zod is a data validation library with good TypeScript interoperability
// Establish the shape of a valid subset of the payload we expect from our API 
const ValidJoke = z.object({setup: z.string(), punchline: z.string()})
// Build a formal TS type from this construct
type ValidJokeType = z.infer<typeof ValidJoke>

export type JokeResultsError = 
  | NetworkError
  | z.ZodError<ValidJokeType>

// This is the "messy/simple" form of the Application.
// If we want, we can practice refactoring a lot of this out (and testing thoroughly!)
function App() {
  const [setup, setSetup] = useState("");
  const [punchline, setPunchline] = useState("");
  const [error, setError] = useState("");

  // First piece of "functional" code. Take a second to glance at the Types
  // https://gcanti.github.io/fp-ts/modules/TaskEither.ts.html#taskeither-overview
  const getUrl = (url: string) =>
    // Helper/constructor for a TaskEither. 
    // This will run the code in callback 1, and if there are any errors return a Left/Error TaskEither
    // Otherwise, it will return a Right TaskEither with the data from the request
    TE.tryCatch(
      () => axios.get(url).then((res) => res.data),
      (reason) => new NetworkError(String(reason))
  );

  const validateJoke = (x: object) => {
    // Zod validates the data it is passed at runtime and returns an object with a success boolean
    const parsed = ValidJoke.safeParse(x);
    // Here is another example of creating a TaskEither, this time explicitly from left/right helpers
    return parsed.success ? TE.right(parsed.data) : TE.left(parsed.error);
  };

  const getJokeFromApi = (
    url: string
  ): TE.TaskEither<JokeResultsError, ValidJokeType> => {
    // The pipe function is a helper to clean up a chain of function invokations
    // It simply takes the value of the first expression, then sends it as the input to the next parameter (a function)
    // This continues until the end of the chain, and the final output is returned as the value of the pipe expression
    // Without it, this call would be TE.chainW(validateJoke(getUrl(url))). Much messier
    return pipe(url, getUrl, TE.chainW(validateJoke));
  };

  const url = "https://official-joke-api.appspot.com/random_joke";

  // Denoted as unsafe/impure because this function has side effects
  const unsafeHandleClick = async () => {
    pipe(
      // Interestingly, all the functions we wrote above are pure, since evaluation (and thus side effects)
      // is delayed until this point. Note the extra () tacked onto the end here. This indicates we are actually
      // calling the function we built up using our helpers from above. (So the api call doesn't happen until here)
      await getJokeFromApi(url)(),
      // Branches execution based on the value within our TaskEither
      // If Left/Error, the first callback runs, otherwise the second
      E.fold(
        // We had a Left Task Either
        (error) => {
          // This is pattern matching using ts-pattern. It gives us more flexibility than a simple switch
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
            // Here's the more flexibility, we can ensure using TS we have covered every variant of our pattern
            // (In this case, that means every possible error type)
            .exhaustive();
        },
        // We had a Right TaskEither
        (result) => {
          // Just react from here on out! Congrats!
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
