import { Model } from 'common';
import { extend, isString } from 'underscore';
import Properties from './Properties';
import PropertyFactory from './PropertyFactory';

/**
 * @typedef Sector
 * @property {String} id Sector id, eg. `typography`
 * @property {String} name Sector name, eg. `Typography`
 * @property {Boolean} [open=true] Indicates the open state.
 * @property {Array<Object>} [properties=[]] Indicate an array of Property defintions
 *
 * [Property]: property.html
 */
export default class Sector extends Model {
  defaults() {
    return {
      id: '',
      name: '',
      open: true,
      buildProps: '',
      extendBuilded: 1,
      properties: []
    };
  }

  initialize(prp, opts = {}) {
    const { em } = opts;
    const o = prp || {};
    const builded = this.buildProperties(o.buildProps);
    const name = this.get('name') || '';
    let props = [];
    !this.get('id') && this.set('id', name.replace(/ /g, '_').toLowerCase());

    if (!builded) {
      props = this.get('properties')
        .map(prop => (isString(prop) ? this.buildProperties(prop)[0] : prop))
        .filter(Boolean);
    } else {
      props = this.extendProperties(builded);
    }

    props = props.map(prop => this.checkExtend(prop));

    const propsModel = new Properties(props, { em });
    propsModel.sector = this;
    this.set('properties', propsModel);
  }

  /**
   * Get sector id.
   * @returns {String}
   */
  getId() {
    return this.get('id');
  }

  /**
   * Get sector name.
   * @returns {String}
   */
  getName() {
    return this.get('name');
  }

  /**
   * Update sector name.
   * @param {String} value New sector name
   */
  setName(value) {
    return this.set('name', value);
  }

  /**
   * Check if the sector is open
   * @returns {Boolean}
   */
  isOpen() {
    return !!this.get('open');
  }

  /**
   * Update Sector open state
   * @param {Boolean} value
   */
  setOpen(value) {
    return this.set('open', value);
  }

  /**
   * Get sector properties.
   * @returns {Array<[Property]>}
   */
  getProperties() {
    const props = this.get('properties');
    return props.models ? [...props.models] : props;
  }

  getProperty(id) {
    return (
      this.getProperties().filter(prop => prop.get('id') === id)[0] || null
    );
  }

  /**
   * Extend properties
   * @param {Array<Object>} props Start properties
   * @param {Array<Object>} moProps Model props
   * @param {Boolean} ex Returns the same amount of passed model props
   * @return {Array<Object>} Final props
   * @private
   */
  extendProperties(props, moProps, ex) {
    var pLen = props.length;
    var mProps = moProps || this.get('properties');
    var ext = this.get('extendBuilded');
    var isolated = [];

    for (var i = 0, len = mProps.length; i < len; i++) {
      var mProp = mProps[i];
      var found = 0;

      for (var j = 0; j < pLen; j++) {
        var prop = props[j];
        if (mProp.property == prop.property || mProp.id == prop.property) {
          // Check for nested properties
          var mPProps = mProp.properties;
          if (mPProps && mPProps.length) {
            mProp.properties = this.extendProperties(
              prop.properties || [],
              mPProps,
              1
            );
          }
          props[j] = ext ? extend(prop, mProp) : mProp;
          isolated[j] = props[j];
          found = 1;
          continue;
        }
      }

      if (!found) {
        props.push(mProp);
        isolated.push(mProp);
      }
    }

    return ex ? isolated.filter(i => i) : props;
  }

  checkExtend(prop) {
    const { extend, ...rest } = prop || {};
    if (extend) {
      return {
        ...(this.buildProperties([extend])[0] || {}),
        ...rest
      };
    } else {
      return prop;
    }
  }

  /**
   * Build properties
   * @param {Array<string>} propr Array of props as sting
   * @return {Array<Object>}
   * @private
   */
  buildProperties(props) {
    const buildP = props || [];

    if (!buildP.length) return [];

    this.propFactory = this.propFactory || new PropertyFactory();

    return this.propFactory.build(buildP);
  }
}
