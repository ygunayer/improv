import {randomId} from '../../lib/utils';
import {ActorPath} from '../types';

export interface InternalActorPath extends ActorPath {
  /**
   * Adds a child node with the given name. Throws an error if another child with that name already exists
   * 
   * @param name the name of the child to add
   */
  add(name: string): InternalActorPath;

  /**
   * Removes the child with the given name
   * 
   * @param name the name of the child to remove
   */
  remove(name: string);

  /**
   * Disposes of the path, releasing it from the parent
   */
  dispose();
}

export function createNode(name: string, parent: ActorPath): InternalActorPath {
  let children: {[key: string]: ActorPath} = {};
  const uid = randomId();
  const root = parent.root();
  const parentString = parent.toString();

  const self: InternalActorPath = {
    uid: () => uid,
    name: () => name,
    parent: () => parent,
    root: () => root,
    get: name => {
      if (!children[name]) {
        return null;
      }
      return children[name];
    },
    add: name => {
      if (children[name]) {
        throw new Error(`Parent ${self} already has a child with name ${name}`);
      }

      const node = createNode(name, self);
      return node;
    },
    remove: name => {
      delete children[name];
    },
    dispose: () => (parent as InternalActorPath).remove(name),
    toString: () => `${parentString}/${name}`
  };

  return self;
}

export function createRootNode(systemName: string): InternalActorPath {
  const fakeParent: any = {
    root: () => self,
    parent: () => self,
    toString: () => `improv:/` // TODO this feels off
  };

  const self = createNode(systemName, fakeParent);
  self.parent = fakeParent.parent;
  self.root = fakeParent.root;
  return self;
}
