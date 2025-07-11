import { Events } from '../../Events/Events.js';
import { CLASS_FONT_REGULAR, CLASS_FLASH, CLASS_DISABLED, CLASS_READONLY, CLASS_HIDDEN, CLASS_ERROR } from '../../class.js';

const CLASS_ELEMENT = 'pcui-element';
// these are properties that are
// available as Element properties and
// can also be set through the Element constructor
const SIMPLE_CSS_PROPERTIES = [
    'flexDirection',
    'flexGrow',
    'flexBasis',
    'flexShrink',
    'flexWrap',
    'alignItems',
    'alignSelf',
    'justifyContent',
    'justifySelf'
];
/**
 * The base class for all UI elements.
 */
class Element extends Events {
    /**
     * Creates a new Element.
     *
     * @param args - The arguments.
     */
    constructor(args = {}) {
        var _a, _b, _c, _d;
        super();
        this._destroyed = false;
        this._parent = null; // eslint-disable-line no-use-before-define
        this._eventsParent = [];
        this._flashTimeout = null;
        this._suppressChange = false;
        this._onMouseOver = (evt) => {
            this.emit('hover', evt);
        };
        this._onMouseOut = (evt) => {
            this.emit('hoverend', evt);
        };
        if (typeof args.dom === 'string') {
            this._dom = document.createElement(args.dom);
        }
        else if (args.dom instanceof Node) {
            this._dom = args.dom;
        }
        else {
            this._dom = document.createElement('div');
        }
        if (args.id !== undefined) {
            this._dom.id = args.id;
        }
        // add ui reference
        this._dom.ui = this;
        this._onClickEvt = this._onClick.bind(this);
        // add event listeners
        this._dom.addEventListener('click', this._onClickEvt);
        this._dom.addEventListener('mouseover', this._onMouseOver);
        this._dom.addEventListener('mouseout', this._onMouseOut);
        // add css classes
        this._dom.classList.add(CLASS_ELEMENT, CLASS_FONT_REGULAR);
        // add user classes
        if (args.class) {
            const classes = Array.isArray(args.class) ? args.class : [args.class];
            for (const cls of classes) {
                this._dom.classList.add(cls);
            }
        }
        this.enabled = (_a = args.enabled) !== null && _a !== void 0 ? _a : true;
        this._hiddenParents = !args.isRoot;
        this.hidden = (_b = args.hidden) !== null && _b !== void 0 ? _b : false;
        this.readOnly = (_c = args.readOnly) !== null && _c !== void 0 ? _c : false;
        this.ignoreParent = (_d = args.ignoreParent) !== null && _d !== void 0 ? _d : false;
        if (args.width !== undefined) {
            this.width = args.width;
        }
        if (args.height !== undefined) {
            this.height = args.height;
        }
        if (args.tabIndex !== undefined) {
            this.tabIndex = args.tabIndex;
        }
        // copy CSS properties from args
        for (const key in args) {
            // @ts-ignore
            if (args[key] === undefined)
                continue;
            if (SIMPLE_CSS_PROPERTIES.indexOf(key) !== -1) {
                // @ts-ignore
                this[key] = args[key];
            }
        }
        // set the binding object
        if (args.binding) {
            this.binding = args.binding;
        }
    }
    /**
     * Destroys the Element and its events.
     */
    destroy() {
        if (this._destroyed)
            return;
        this._destroyed = true;
        if (this.binding) {
            this.binding = null;
        }
        else {
            this.unlink();
        }
        if (this.parent) {
            const parent = this.parent;
            for (const event of this._eventsParent) {
                event.unbind();
            }
            this._eventsParent.length = 0;
            // remove element from parent
            // check if parent has been destroyed already
            // because we do not want to be emitting events
            // on a destroyed parent after it's been destroyed
            // as it is easy to lead to null exceptions
            // @ts-ignore
            if (parent.remove && !parent._destroyed) {
                // @ts-ignore
                parent.remove(this);
            }
            // set parent to null and remove from
            // parent dom just in case parent.remove above
            // didn't work because of an override or other condition
            this._parent = null;
            // Do not manually call removeChild for elements whose parent has already been destroyed.
            // For example when we destroy a TreeViewItem that has many child nodes, that will trigger every child Element to call dom.parentElement.removeChild(dom).
            // But we don't need to remove all these DOM elements from their parents since the root DOM element is destroyed anyway.
            // This has a big impact on destroy speed in certain cases.
            if (!parent._destroyed && this._dom && this._dom.parentElement) {
                this._dom.parentElement.removeChild(this._dom);
            }
        }
        const dom = this._dom;
        if (dom) {
            // remove event listeners
            dom.removeEventListener('click', this._onClickEvt);
            dom.removeEventListener('mouseover', this._onMouseOver);
            dom.removeEventListener('mouseout', this._onMouseOut);
            // remove ui reference
            delete dom.ui;
            this._dom = null;
        }
        if (this._flashTimeout) {
            window.clearTimeout(this._flashTimeout);
        }
        this.emit('destroy', dom, this);
        this.unbind();
    }
    /**
     * Links the specified observers and paths to the Element's data binding.
     *
     * @param observers - An array of observers or a single observer.
     * @param paths - A path for the observer(s) or an array of paths that maps to each separate observer.
     */
    link(observers, paths) {
        if (this._binding) {
            this._binding.link(observers, paths);
        }
    }
    /**
     * Unlinks the Element from its observers.
     */
    unlink() {
        if (this._binding) {
            this._binding.unlink();
        }
    }
    /**
     * Triggers a flash animation on the Element.
     */
    flash() {
        if (this._flashTimeout)
            return;
        this.class.add(CLASS_FLASH);
        this._flashTimeout = window.setTimeout(() => {
            this._flashTimeout = null;
            this.class.remove(CLASS_FLASH);
        }, 200);
    }
    _onClick(evt) {
        if (this.enabled) {
            this.emit('click', evt);
        }
    }
    _onHiddenToRootChange(hiddenToRoot) {
        this.emit(hiddenToRoot ? 'hideToRoot' : 'showToRoot');
    }
    _onEnabledChange(enabled) {
        if (enabled) {
            this.class.remove(CLASS_DISABLED);
        }
        else {
            this.class.add(CLASS_DISABLED);
        }
        this.emit(enabled ? 'enable' : 'disable');
    }
    _onParentDestroy() {
        this.destroy();
    }
    _onParentDisable() {
        if (this._ignoreParent)
            return;
        if (this._enabled) {
            this._onEnabledChange(false);
        }
    }
    _onParentEnable() {
        if (this._ignoreParent)
            return;
        if (this._enabled) {
            this._onEnabledChange(true);
        }
    }
    _onParentShowToRoot() {
        const oldHiddenToRoot = this.hiddenToRoot;
        this._hiddenParents = false;
        if (oldHiddenToRoot !== this.hiddenToRoot) {
            this._onHiddenToRootChange(this.hiddenToRoot);
        }
    }
    _onParentHideToRoot() {
        const oldHiddenToRoot = this.hiddenToRoot;
        this._hiddenParents = true;
        if (oldHiddenToRoot !== this.hiddenToRoot) {
            this._onHiddenToRootChange(this.hiddenToRoot);
        }
    }
    _onReadOnlyChange(readOnly) {
        if (readOnly) {
            this.class.add(CLASS_READONLY);
        }
        else {
            this.class.remove(CLASS_READONLY);
        }
        this.emit('readOnly', readOnly);
    }
    _onParentReadOnlyChange(readOnly) {
        if (this._ignoreParent)
            return;
        if (readOnly) {
            if (!this._readOnly) {
                this._onReadOnlyChange(true);
            }
        }
        else {
            if (!this._readOnly) {
                this._onReadOnlyChange(false);
            }
        }
    }
    /**
     * @param type - The type we want to reference this Element by.
     * @param cls - The actual class of the Element.
     * @param defaultArguments - Default arguments when creating this type.
     */
    static register(type, cls, defaultArguments) {
        Element.registry.set(type, { cls, defaultArguments });
    }
    /**
     * @param type - The type we want to unregister.
     */
    static unregister(type) {
        Element.registry.delete(type);
    }
    /**
     * Creates a new Element of the desired type.
     *
     * @param type - The type of the Element (registered by Element#register).
     * @param args - Arguments for the Element.
     * @returns The new Element or undefined if type is not found.
     */
    static create(type, args) {
        const entry = Element.registry.get(type);
        if (!entry) {
            console.error('Invalid type passed to Element.create:', type);
            return undefined;
        }
        const cls = entry.cls;
        const clsArgs = Object.assign(Object.assign({}, entry.defaultArguments), args);
        return new cls(clsArgs);
    }
    /**
     * Sets whether the Element or its parent chain is enabled or not. Defaults to `true`.
     */
    set enabled(value) {
        if (this._enabled === value)
            return;
        // remember if enabled in hierarchy
        const enabled = this.enabled;
        this._enabled = value;
        // only fire event if hierarchy state changed
        if (enabled !== value) {
            this._onEnabledChange(value);
        }
    }
    /**
     * Gets whether the Element or its parent chain is enabled or not.
     */
    get enabled() {
        if (this._ignoreParent)
            return this._enabled;
        return this._enabled && (!this._parent || this._parent.enabled);
    }
    /**
     * Sets whether the Element will ignore parent events & variable states.
     */
    set ignoreParent(value) {
        this._ignoreParent = value;
        this._onEnabledChange(this.enabled);
        this._onReadOnlyChange(this.readOnly);
    }
    /**
     * Gets whether the Element will ignore parent events & variable states.
     */
    get ignoreParent() {
        return this._ignoreParent;
    }
    /**
     * Gets the root DOM node for this Element.
     */
    get dom() {
        return this._dom;
    }
    /**
     * Sets the parent Element.
     */
    set parent(value) {
        if (value === this._parent)
            return;
        const oldEnabled = this.enabled;
        const oldReadonly = this.readOnly;
        const oldHiddenToRoot = this.hiddenToRoot;
        if (this._parent) {
            for (let i = 0; i < this._eventsParent.length; i++) {
                this._eventsParent[i].unbind();
            }
            this._eventsParent.length = 0;
        }
        this._parent = value;
        if (this._parent) {
            this._eventsParent.push(this._parent.once('destroy', this._onParentDestroy.bind(this)));
            this._eventsParent.push(this._parent.on('disable', this._onParentDisable.bind(this)));
            this._eventsParent.push(this._parent.on('enable', this._onParentEnable.bind(this)));
            this._eventsParent.push(this._parent.on('readOnly', this._onParentReadOnlyChange.bind(this)));
            this._eventsParent.push(this._parent.on('showToRoot', this._onParentShowToRoot.bind(this)));
            this._eventsParent.push(this._parent.on('hideToRoot', this._onParentHideToRoot.bind(this)));
            this._hiddenParents = this._parent.hiddenToRoot;
        }
        else {
            this._hiddenParents = true;
        }
        this.emit('parent', this._parent);
        const newEnabled = this.enabled;
        if (newEnabled !== oldEnabled) {
            this._onEnabledChange(newEnabled);
        }
        const newReadonly = this.readOnly;
        if (newReadonly !== oldReadonly) {
            this._onReadOnlyChange(newReadonly);
        }
        const hiddenToRoot = this.hiddenToRoot;
        if (hiddenToRoot !== oldHiddenToRoot) {
            this._onHiddenToRootChange(hiddenToRoot);
        }
    }
    /**
     * Gets the parent Element.
     */
    get parent() {
        return this._parent;
    }
    /**
     * Sets whether the Element is hidden.
     */
    set hidden(value) {
        if (value === this._hidden)
            return;
        const oldHiddenToRoot = this.hiddenToRoot;
        this._hidden = value;
        if (value) {
            this.class.add(CLASS_HIDDEN);
        }
        else {
            this.class.remove(CLASS_HIDDEN);
        }
        this.emit(value ? 'hide' : 'show');
        if (this.hiddenToRoot !== oldHiddenToRoot) {
            this._onHiddenToRootChange(this.hiddenToRoot);
        }
    }
    /**
     * Gets whether the Element is hidden.
     */
    get hidden() {
        return this._hidden;
    }
    /**
     * Gets whether the Element is hidden all the way up to the root. If the Element itself or any of its parents are hidden then this is true.
     */
    get hiddenToRoot() {
        return this._hidden || this._hiddenParents;
    }
    /**
     * Sets whether the Element is read only.
     */
    set readOnly(value) {
        if (this._readOnly === value)
            return;
        this._readOnly = value;
        this._onReadOnlyChange(value);
    }
    /**
     * Gets whether the Element is read only.
     */
    get readOnly() {
        if (this._ignoreParent)
            return this._readOnly;
        return this._readOnly || !!(this._parent && this._parent.readOnly);
    }
    /**
     * Sets whether the Element is in an error state.
     */
    set error(value) {
        if (this._hasError === value)
            return;
        this._hasError = value;
        if (value) {
            this.class.add(CLASS_ERROR);
        }
        else {
            this.class.remove(CLASS_ERROR);
        }
    }
    /**
     * Gets whether the Element is in an error state.
     */
    get error() {
        return this._hasError;
    }
    /**
     * Shortcut to Element.dom.style.
     */
    get style() {
        return this._dom.style;
    }
    /**
     * Get the `DOMTokenList` of the underlying DOM element. This is essentially a shortcut to
     * `element.dom.classList`.
     */
    get class() {
        return this._dom.classList;
    }
    /**
     * Sets the width of the Element in pixels. Can also be an empty string to remove it.
     */
    set width(value) {
        this.style.width = typeof value === 'number' ? `${value}px` : value;
    }
    /**
     * Gets the width of the Element in pixels.
     */
    get width() {
        return this._dom.clientWidth;
    }
    /**
     * Sets the height of the Element in pixels. Can also be an empty string to remove it.
     */
    set height(value) {
        this.style.height = typeof value === 'number' ? `${value}px` : value;
    }
    /**
     * Gets the height of the Element in pixels.
     */
    get height() {
        return this._dom.clientHeight;
    }
    /**
     * Sets the tabIndex of the Element.
     */
    set tabIndex(value) {
        this._dom.tabIndex = value;
    }
    /**
     * Gets the tabIndex of the Element.
     */
    get tabIndex() {
        return this._dom.tabIndex;
    }
    /**
     * Sets the Binding object for the element.
     */
    set binding(value) {
        if (this._binding === value)
            return;
        let prevObservers;
        let prevPaths;
        if (this._binding) {
            prevObservers = this._binding.observers;
            prevPaths = this._binding.paths;
            this.unlink();
            this._binding.element = null;
            this._binding = null;
        }
        this._binding = value;
        if (this._binding) {
            // @ts-ignore
            this._binding.element = this;
            if (prevObservers && prevPaths) {
                this.link(prevObservers, prevPaths);
            }
        }
    }
    /**
     * Gets the Binding object for the element.
     */
    get binding() {
        return this._binding;
    }
    get destroyed() {
        return this._destroyed;
    }
    // CSS proxy accessors
    /**
     * Sets the flex-direction CSS property.
     */
    set flexDirection(value) {
        this.style.flexDirection = value;
    }
    /**
     * Gets the flex-direction CSS property.
     */
    get flexDirection() {
        return this.style.flexDirection;
    }
    /**
     * Sets the flex-grow CSS property.
     */
    set flexGrow(value) {
        this.style.flexGrow = value;
    }
    /**
     * Gets the flex-grow CSS property.
     */
    get flexGrow() {
        return this.style.flexGrow;
    }
    /**
     * Sets the flex-basis CSS property.
     */
    set flexBasis(value) {
        this.style.flexBasis = value;
    }
    /**
     * Gets the flex-basis CSS property.
     */
    get flexBasis() {
        return this.style.flexBasis;
    }
    /**
     * Sets the flex-shrink CSS property.
     */
    set flexShrink(value) {
        this.style.flexShrink = value;
    }
    /**
     * Gets the flex-shrink CSS property.
     */
    get flexShrink() {
        return this.style.flexShrink;
    }
    /**
     * Sets the flex-wrap CSS property.
     */
    set flexWrap(value) {
        this.style.flexWrap = value;
    }
    /**
     * Gets the flex-wrap CSS property.
     */
    get flexWrap() {
        return this.style.flexWrap;
    }
    /**
     * Sets the align-items CSS property.
     */
    set alignItems(value) {
        this.style.alignItems = value;
    }
    /**
     * Gets the align-items CSS property.
     */
    get alignItems() {
        return this.style.alignItems;
    }
    /**
     * Sets the align-self CSS property.
     */
    set alignSelf(value) {
        this.style.alignSelf = value;
    }
    /**
     * Gets the align-self CSS property.
     */
    get alignSelf() {
        return this.style.alignSelf;
    }
    /**
     * Sets the justify-content CSS property.
     */
    set justifyContent(value) {
        this.style.justifyContent = value;
    }
    /**
     * Gets the justify-content CSS property.
     */
    get justifyContent() {
        return this.style.justifyContent;
    }
    /**
     * Sets the justify-self CSS property.
     */
    set justifySelf(value) {
        this.style.justifySelf = value;
    }
    /**
     * Gets the justify-self CSS property.
     */
    get justifySelf() {
        return this.style.justifySelf;
    }
    /*  Backwards Compatibility */
    // we should remove those after we migrate
    /** @ignore */
    set disabled(value) {
        this.enabled = !value;
    }
    /** @ignore */
    get disabled() {
        return !this.enabled;
    }
    /** @ignore */
    set element(value) {
        this._dom = value;
    }
    /** @ignore */
    get element() {
        return this.dom;
    }
    /** @ignore */
    set innerElement(value) {
        this._domContent = value;
    }
    /** @ignore */
    get innerElement() {
        return this._domContent;
    }
}
/**
 * Fired when the Element gets enabled.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('enable', () => {
 *     console.log('Element enabled');
 * });
 * ```
 */
Element.EVENT_ENABLE = 'enable';
/**
 * Fired when the Element gets disabled.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('disable', () => {
 *     console.log('Element disabled');
 * });
 * ```
 */
Element.EVENT_DISABLE = 'disable';
/**
 * Fired when the Element gets hidden.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('hide', () => {
 *     console.log('Element hidden');
 * });
 * ```
 */
Element.EVENT_HIDE = 'hide';
/**
 * Fired when the Element or any of its parent get hidden.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('hideToRoot', () => {
 *     console.log('Element or one of its parents hidden');
 * });
 * ```
 */
Element.EVENT_HIDE_TO_ROOT = 'hideToRoot';
/**
 * Fired when the Element stops being hidden.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('show', () => {
 *     console.log('Element shown');
 * });
 * ```
 */
Element.EVENT_SHOW = 'show';
/**
 * Fired when the Element and all of its parents become visible.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('showToRoot', () => {
 *     console.log('Element and all of its parents shown');
 * });
 * ```
 */
Element.EVENT_SHOW_TO_ROOT = 'showToRoot';
/**
 * Fired when the readOnly property of an Element changes.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('readOnly', (readOnly: boolean) => {
 *     console.log(`Element is now ${readOnly ? 'read only' : 'editable'}`);
 * });
 * ```
 */
Element.EVENT_READ_ONLY = 'readOnly';
/**
 * Fired when the Element's parent gets set.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('parent', (parent: Element) => {
 *     console.log(`Element's parent is now ${parent}`);
 * });
 * ```
 */
Element.EVENT_PARENT = 'parent';
/**
 * Fired when the mouse is clicked on the Element but only if the Element is enabled. The
 * native DOM MouseEvent is passed as a parameter to the event handler.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('click', (evt: MouseEvent) => {
 *     console.log('Element clicked');
 * });
 * ```
 */
Element.EVENT_CLICK = 'click';
/**
 * Fired when the mouse starts hovering on the Element. The native DOM MouseEvent is passed as a
 * parameter to the event handler.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('hover', (evt: MouseEvent) => {
 *     console.log('Element hovered');
 * });
 * ```
 */
Element.EVENT_HOVER = 'hover';
/**
 * Fired when the mouse stops hovering on the Element. The native DOM MouseEvent is passed as a
 * parameter to the event handler.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('hoverend', (evt: MouseEvent) => {
 *     console.log('Element hover ended');
 * });
 * ```
 */
Element.EVENT_HOVER_END = 'hoverend';
/**
 * Fired after the element has been destroyed. Both the DOM element and the owner Element
 * instance are passed as parameters to the event handler.
 *
 * @event
 * @example
 * ```ts
 * const element = new Element();
 * element.on('destroy', (dom: HTMLElement, element: Element) => {
 *     console.log('Element destroyed');
 * });
 * ```
 */
Element.EVENT_DESTROY = 'destroy';
/**
 * Stores Element types by name and default arguments.
 */
Element.registry = new Map();

export { Element };
//# sourceMappingURL=index.js.map
