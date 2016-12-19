/** @flow */
import * as pathlib from 'path';
import { propogateUntil, pathHas, readFile } from '../utils';
import { getContents } from '../tar';
import { BIT_SOURCES_DIRNAME, BIT_JSON } from '../constants';
import { ScopeNotFound } from './exceptions';
import { Source, Cache, Tmp, External } from './repositories';
import { DependencyMap, getPath as getDependenyMapPath } from './dependency-map';
import BitJson from '../bit-json';
import { BitId } from '../bit-id';
import Bit from '../bit';

const pathHasScope = pathHas([BIT_SOURCES_DIRNAME]);

export type ScopeProps = {
  path: string,
  created?: boolean;
  cache?: Cache;
  tmp?: Tmp;
  sources?: Source,
  external?: External;
  dependencyMap?: DependencyMap;
};

export default class Scope {
  // globals: Global;
  // boxes: Box;
  // cache: Cache;
  // scopeJson: ScopeJson;
  external: External;
  created: boolean = false;
  cache: Cache;
  tmp: Tmp;
  sources: Source;
  path: string;
  dependencyMap: DependencyMap;

  constructor({ path, cache, sources, tmp, created, dependencyMap, external }: ScopeProps) {
    this.path = path;
    this.cache = cache || new Cache(this);
    this.sources = sources || new Source(this);
    this.created = created || false;
    this.tmp = tmp || new Tmp(this);
    this.external = external || new External(this);
    this.dependencyMap = dependencyMap || new DependencyMap(this);
  }

  prepareBitRegistration(name: string, bitJson: BitJson) {
    try {
      bitJson.validate();
    } catch (e) {
      throw e;
    }
    
    return pathlib.join(this.tmp.getPath(), `${name}_${bitJson.version}.tar`);
  }

  put(bit: Bit) {
    bit.validateOrThrow();
    return bit.dependencies().fetch(this, bit.remotes())
    .then((bits) => {
      this.external.store(bits);
      return this.dependencyMap.setBit(bit, bits)
      .then(() => this.sources.setSource(bit))
      // .then(() => bit.build())
      .then(() => this.dependencyMap.write())
      .then(() => bits);
      // .catch(err => clear());
    });
  }

  get(bitId: BitId): Promise<Bit> {
    return this.sources.loadSource(bitId);
  }

  sync() {

  }

  ensureDir() {
    const self = this;

    return this.cache
      .ensureDir()
      .then(() => self.sources.ensureDir())
      .then(() => self.tmp.ensureDir())
      .then(() => this.dependencyMap.write())
      .then(() => self); 
  }

  // resolve(bitId: BitId) {
  //   return this.sources.getPartial().then((partial) => {
  //     partial.resolveDependencies();
  //   });
  // }
  
  fetch(bitIds: string[]): Promise<{id: string, contents: Buffer}>[] {
    return bitIds.map((name) => {
      return this.sources
        .getPartial(name)
        .then((bit) => {
          return bit.toTar()
          .then((tar) => {
            return {
              id: name,
              contents: tar
            };
          });
        });
    });
  }

  upload(name: string, tar: Buffer) {
    return getContents(tar)
      .then((files) => {
        const bitJson = JSON.parse(files[BIT_JSON]);
        
        const bit = Bit.loadFromMemory({
          name,
          bitDir: this.sources.getBitPath(name),
          bitJson: files[BIT_JSON],
          impl: bitJson.impl ? files[bitJson.impl] : undefined,
          spec: bitJson.spec ? files[bitJson.spec] : undefined
        });

        bit.resolveDependencies();

        return bit.write();
      });
  }

  getPath() {
    return this.path;
  }

  static create(path: string = process.cwd()) {
    if (pathHasScope(path)) return this.load(path);
    return new Scope({ path, created: true });
  }

  static load(absPath: string): Promise<Scope> {
    const scopePath = propogateUntil(absPath, pathHasScope);
    if (!scopePath) throw new ScopeNotFound();
    return readFile(getDependenyMapPath(scopePath))
      .then((contents) => {
        const scope = new Scope({ path: scopePath });
        scope.dependencyMap = DependencyMap.load(JSON.parse(contents.toString('utf8')), scope);
        return scope;
      });
  }
}
