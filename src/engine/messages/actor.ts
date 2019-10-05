import {ActorRef} from '../actor';

export enum ExitNature {
  Normal,
  Crashed,
  Killed
}

export class Exited { constructor(readonly ref: ActorRef, readonly nature: string|ExitNature, readonly reason?: any) {} }
export module Exited {
  export function Normal(ref: ActorRef, reason?: any): Exited { return new Exited(ref, ExitNature.Normal, reason); }
  export function Crashed(ref: ActorRef, reason?: any): Exited { return new Exited(ref, ExitNature.Crashed, reason); }
  export function Killed(ref: ActorRef, reason?: any): Exited { return new Exited(ref, ExitNature.Killed, reason); }
}