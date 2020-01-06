# improv
Yet another actor model implementation for JavaScript. 

**Note:** WIP - Not tested, not battle-tested, not full-featured. Don't use on production

**Note:** Name might change, don't get surprised if it doesn't.

## What is Actor Model
The actor model is an approach to building concurrent applications, dating back as early as 1973. Its earliest known commercial application was at Ericsson in the 80s with the Erlang programming language, where it was used to handle the immense load of telecommunications. The recent rise of functional programming and the increasing need of scalability (similar to that of telco) put the actor model in the spotlight.

At the heart of the actor model are actors; stateful units of computation that communicate with the outside world through asynchronous messages (also called message-passing). Actors choose which messages they would handle, and how they'll handle it, and they can change this behavior over time. Actors only handle one message at a time, so they're free to manipulate their internal state without any worries about multithreaded access. Finally, actors form hierarchies and they handle errors non-locally, meaning that if an actor fails, its the parent actor's responsibility to figure out what to do.

In short, they're tiny finite-state machines that queue incoming messages, form hierarchies to supervise their children, and communicate with each other asynchronously.

For more information, see [my blog article on the subject](https://yalingunayer.com/blog/introduction-to-the-actor-model-with-akka/), [Akka's guide to actors](https://doc.akka.io/docs/akka/current/typed/guide/actors-intro.html), or [Learn You Some Erlang](https://learnyousomeerlang.com/errors-and-processes).

## Style
improv is heavily inspired by Akka and Erlang, both in design and implementation. Here's a couple of design notes
- Supervision is built-in like Akka (NOT YET IMPLEMENTED)
- Actor lifecycle is akin to that of Akka
- Like Erlang, improv uses the term `spawn` to create actors
- Unlike Akka, improv does not enforce object-oriented design, and rather encourages a structure with pure functions like Erlang
    - The behavior of an actor is defined by a type called `Receive` (or `PartialFunction<any, void>` exactly like `Akka`)
    - The properties that comprise an actor are defined by the `ActorProps`, where the initial receive block is required, and the actor's name, supervision strategy, default receive timeout and lifecycle hooks are optional
    - Contextual information about the actor (the system it belongs to, its parent, its children, its reference, etc.) is fed to it through the `ActorContext` type
    - `spawn` calls expect either an `ActorProps` or a function that receives an `ActorContext` and returns an `ActorProps` (called the *inception function*)
    - While you're free to use the inception function's closure to keep state, you can also use functions that return `Receive` blocks and where the arguments *are* the state
- Like Akka, there's an `ask(msg: any, timeout: number): Promise<any>` method on actor references that might help refactoring an existing codebase into a purely actor-based one

## TODO
- !!! WRITE TESTS !!!
- Come up with a more comprehensive documentation and maybe break down the [styles](#styles) section into articles
- Implement supervision
- Hide the internal types and implementations
- Maybe implement other scheduling and message routing methods to allow RPC

## License
MIT
