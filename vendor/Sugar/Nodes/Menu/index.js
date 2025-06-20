import { Container } from '../Container/index.js';
import { MenuItem } from '../MenuItem/index.js';

const CLASS_MENU = 'menu';
const CLASS_MENU_ITEMS = `${CLASS_MENU}-items`;
/**
 * A Menu is a list of {@link MenuItem}s which can contain child MenuItems. Useful to show context
 * menus and nested menus. Note that a Menu must be appended to the root Element and then
 * positioned accordingly.
 */
class Menu extends Container {
    /**
     * Creates a new Menu.
     *
     * @param args - The arguments.
     */
    constructor(args = {}) {
        var _a;
        super(Object.assign({ tabIndex: 1 }, args));
        this._onClickMenu = (evt) => {
            if (!this._containerMenuItems.dom.contains(evt.target)) {
                this.hidden = true;
            }
        };
        this._onFocus = (evt) => {
            this.emit('focus');
        };
        this._onBlur = (evt) => {
            this.emit('blur');
        };
        this._onKeyDown = (evt) => {
            if (this.hidden)
                return;
            if (evt.key === 'Escape') {
                this.hidden = true;
            }
        };
        this.hidden = (_a = args.hidden) !== null && _a !== void 0 ? _a : true;
        this.class.add(CLASS_MENU);
        this._containerMenuItems = new Container({
            class: CLASS_MENU_ITEMS,
            flex: true,
            flexDirection: 'column'
        });
        this.append(this._containerMenuItems);
        this.domContent = this._containerMenuItems.dom;
        this.on('click', this._onClickMenu);
        this.on('show', () => {
            this._onShowMenu();
        });
        this.dom.addEventListener('contextmenu', this._onClickMenu);
        this.dom.addEventListener('keydown', this._onKeyDown);
        if (args.items) {
            args.items.forEach((item) => {
                const menuItem = new MenuItem(item);
                this.append(menuItem);
            });
        }
    }
    destroy() {
        if (this.destroyed)
            return;
        this.dom.removeEventListener('keydown', this._onKeyDown);
        this.dom.removeEventListener('contextmenu', this._onClickMenu);
        this.dom.removeEventListener('focus', this._onFocus);
        this.dom.removeEventListener('blur', this._onBlur);
        super.destroy();
    }
    _onAppendChild(element) {
        if (element instanceof MenuItem) {
            element.menu = this;
        }
    }
    _onRemoveChild(element) {
        if (element instanceof MenuItem) {
            element.menu = null;
        }
    }
    _filterMenuItems(item) {
        if (!(item instanceof MenuItem))
            return;
        if (item.onIsEnabled) {
            item.enabled = item.onIsEnabled();
        }
        if (item.onIsVisible) {
            item.hidden = !item.onIsVisible();
        }
        // @ts-ignore
        for (const child of item._containerItems.dom.childNodes) {
            this._filterMenuItems(child.ui);
        }
    }
    _onShowMenu() {
        this.focus();
        // filter child menu items
        for (const child of this._containerMenuItems.dom.childNodes) {
            this._filterMenuItems(child.ui);
        }
    }
    _limitSubmenuAtScreenEdges(item) {
        if (!(item instanceof MenuItem) || !item.hasChildren)
            return;
        // @ts-ignore
        const containerItems = item._containerItems;
        containerItems.style.top = '';
        containerItems.style.left = '';
        containerItems.style.right = '';
        const rect = containerItems.dom.getBoundingClientRect();
        // limit to bottom / top of screen
        if (rect.bottom > window.innerHeight) {
            containerItems.style.top = `${-(rect.bottom - window.innerHeight)}px`;
        }
        if (rect.right > window.innerWidth) {
            containerItems.style.left = 'auto';
            containerItems.style.right = '100%';
        }
        for (const child of containerItems.dom.childNodes) {
            this._limitSubmenuAtScreenEdges(child.ui);
        }
    }
    focus() {
        this.dom.focus();
    }
    blur() {
        this.dom.blur();
    }
    /**
     * Positions the top-left corner of the menu at the specified coordinates.
     *
     * @param x - The x coordinate.
     * @param y - The y coordinate.
     * @example
     * ```ts
     * // open a context menu at the mouse position
     * window.addEventListener('contextmenu', (event) => {
     *     event.stopPropagation();
     *     event.preventDefault();
     *
     *     menu.hidden = false;
     *     menu.position(event.clientX, event.clientY);
     * });
     * ```
     */
    position(x, y) {
        const rect = this._containerMenuItems.dom.getBoundingClientRect();
        let left = (x || 0);
        let top = (y || 0);
        // limit to bottom / top of screen
        if (top + rect.height > window.innerHeight) {
            top = window.innerHeight - rect.height;
        }
        else if (top < 0) {
            top = 0;
        }
        if (left + rect.width > window.innerWidth) {
            left = window.innerWidth - rect.width;
        }
        else if (left < 0) {
            left = 0;
        }
        this._containerMenuItems.style.left = `${left}px`;
        this._containerMenuItems.style.top = `${top}px`;
        for (const child of this._containerMenuItems.dom.childNodes) {
            this._limitSubmenuAtScreenEdges(child.ui);
        }
    }
    /**
     * Remove all the current menu items from the menu.
     */
    clear() {
        this._containerMenuItems.clear();
    }
}

export { Menu };
//# sourceMappingURL=index.js.map
