# improv
Yet another actor model implementation for JavaScript. 

**Note:** WIP - Not tested, not battle-tested, not full-featured. Don't use on production

**Note:** Name might change, don't get surprised if it doesn't.

## What is Actor Model
TODO

## Style
improv's style of implementation is a middleground between Erlang's and Akka's
- Supervision is built-in like Akka (NOT YET IMPLEMENTED)
- Actor implementations are simple one-off functions and they don't loop by themselves.
    - This is in contrast to Akka where actors are implemented in an object-oriented nature, and receive blocks are actually overridden functions that loop by default.
    - Continuations are a combination of Akka and Erlang, where an actor can repeat its current behavior (like Erlang loops), change it to something else (like `become/unbecome` from Akka), or stop itself (like stop calls from both Akka and Erlang)
- Unlike Akka, there's no `ask(msg: any): Promise<any>` method

## TODO
- !!! WRITE TESTS !!!
- Implement supervision
- Implement `receive()` timeouts
- Prevent multiple scheduler calls from creating unnecessary work load
- (Maybe) Implement built-in ask pattern
    - Requirements:
        - Custom `send()` messages received through `context`
        - Inject an `ActorRef` named `sender` that can be replied to
        - A global dead letter actor which will be used as the `sender` for messages sent outside a `context`

## License
MIT
