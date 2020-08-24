import { BitId } from 'bit-bin/dist/bit-id';

export class ComponentID {
  constructor(
    /**
     * legacy bit component id
     */
    private legacyComponentId: BitId,

    readonly _scope?: string
  ) {}

  /**
   * An access to the legacy id. DO NOT USE THIS
   *
   * @readonly
   * @memberof ComponentID
   */
  get _legacy() {
    return this.legacyComponentId;
  }

  /**
   * determine whether ID has a version.
   */
  hasVersion() {
    return this._legacy.hasVersion();
  }

  /**
   * resolves the version of the component ID.
   */
  get version() {
    return this.legacyComponentId.version;
  }

  get namespace() {
    const arr = this.legacyComponentId.name.split('/');
    return arr.splice(-1, 1).join('/');
  }

  /**
   * retrieves the full name of the component including its namespace.
   */
  get fullName() {
    return this._legacy.name;
  }

  /**
   * resolves the name of the component.
   */
  get name() {
    const arr = this.legacyComponentId.name.split('/');
    return arr[arr.length - 1];
  }

  /**
   * return the scope if included in the ID.
   */
  get scope() {
    const scope = this._legacy.scope;
    if (scope) return scope;
    return this._scope;
  }

  /**
   * get a new component ID instance with given scope.
   */
  changeScope(scopeName: string): ComponentID {
    const legacyId = this._legacy.changeScope(scopeName);
    return ComponentID.fromLegacy(legacyId);
  }

  isEqual(id: ComponentID): boolean {
    return id.scope === this.scope && id.fullName === this.fullName && this.version === id.version;
  }

  /**
   * serialize the component ID.
   */
  toString() {
    let id = this._legacy;
    if (this._scope && !this._legacy.scope) {
      id = id.changeScope(this._scope);
    }
    return id.toString();
  }

  toObject() {
    const object = this.legacyComponentId.serialize();
    if (!object.scope) {
      object.scope = this.scope;
    }

    return object;
  }

  /**
   * generate a component ID from a string.
   */
  static fromString(idStr: string) {
    const legacyId = BitId.parse(idStr, true);
    if (legacyId.scope) throw new Error();
    return new ComponentID(legacyId);
  }

  static fromObject(object: any) {
    if (!object.scope) throw new Error();
    return ComponentID.fromLegacy(new BitId(object));
  }

  /**
   * create a `ComponentID` instance from the legacy `BitId`.
   */
  static fromLegacy(legacyId: BitId, scope?: string) {
    if (!scope && !legacyId.scope) throw new Error();
    return new ComponentID(legacyId);
  }
}
