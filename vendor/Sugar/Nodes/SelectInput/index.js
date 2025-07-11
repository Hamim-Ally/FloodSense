import { CLASS_FOCUS, CLASS_MULTIPLE_VALUES } from '../../class.js';
import { searchItems } from '../../Utils/search.js';
import { Button } from '../Button/index.js';
import { Container } from '../Container/index.js';
import { Element } from '../Element/index.js';
import { Label } from '../Label/index.js';
import { TextInput } from '../TextInput/index.js';

const CLASS_SELECT_INPUT = 'pcui-select-input';
const CLASS_SELECT_INPUT_CONTAINER_VALUE = `${CLASS_SELECT_INPUT}-container-value`;
const CLASS_MULTI_SELECT = `${CLASS_SELECT_INPUT}-multi`;
const CLASS_DISABLED_VALUE = `${CLASS_SELECT_INPUT}-disabled-value`;
const CLASS_HAS_DISABLED_VALUE = `${CLASS_SELECT_INPUT}-has-disabled-value`;
const CLASS_ALLOW_INPUT = 'pcui-select-input-allow-input';
const CLASS_VALUE = `${CLASS_SELECT_INPUT}-value`;
const CLASS_ICON = `${CLASS_SELECT_INPUT}-icon`;
const CLASS_INPUT = `${CLASS_SELECT_INPUT}-textinput`;
const CLASS_LIST = `${CLASS_SELECT_INPUT}-list`;
const CLASS_TAGS = `${CLASS_SELECT_INPUT}-tags`;
const CLASS_TAGS_EMPTY = `${CLASS_SELECT_INPUT}-tags-empty`;
const CLASS_TAG = `${CLASS_SELECT_INPUT}-tag`;
const CLASS_TAG_NOT_EVERYWHERE = `${CLASS_SELECT_INPUT}-tag-not-everywhere`;
const CLASS_SHADOW = `${CLASS_SELECT_INPUT}-shadow`;
const CLASS_FIT_HEIGHT = `${CLASS_SELECT_INPUT}-fit-height`;
const CLASS_SELECTED = 'pcui-selected';
const CLASS_HIGHLIGHTED = `${CLASS_SELECT_INPUT}-label-highlighted`;
const CLASS_CREATE_NEW = `${CLASS_SELECT_INPUT}-create-new`;
const CLASS_OPEN = 'pcui-open';
const DEFAULT_BOTTOM_OFFSET = 25;
/**
 * An input that allows selecting from a dropdown or entering tags.
 */
class SelectInput extends Element {
    /**
     * Creates a new SelectInput.
     *
     * @param args - The arguments.
     */
    constructor(args = {}) {
        var _a, _b, _c, _d;
        // main container
        const container = new Container({
            dom: args.dom
        });
        const elementArgs = Object.assign(Object.assign({}, args), { dom: container.dom });
        super(elementArgs);
        this._timeoutLabelValueTabIndex = null;
        this._valueToText = {};
        this._valueToLabel = {};
        this._labelToValue = new Map();
        this._labelHighlighted = null;
        this._disabledOptions = {};
        this._prefix = '';
        this._onInputChange = (value) => {
            if (this._suspendInputChange)
                return;
            if (this._lastInputValue === value)
                return;
            this.open();
            this._lastInputValue = value;
            this._filterOptions(value);
        };
        this._onInputKeyDown = (evt) => {
            if (evt.key === 'Enter' && this.enabled && !this.readOnly) {
                evt.stopPropagation();
                evt.preventDefault();
                // on enter
                let value;
                if (this._labelHighlighted && this._labelToValue.has(this._labelHighlighted)) {
                    value = this._labelToValue.get(this._labelHighlighted);
                }
                else {
                    value = this._input.value;
                }
                if (value !== undefined) {
                    this.focus();
                    this.close();
                    if (this._valueToText[value]) {
                        this._onSelectValue(value);
                    }
                    else if (this._allowCreate) {
                        if (this._createFn) {
                            this._createFn(value);
                        }
                        else {
                            this._onSelectValue(value);
                        }
                    }
                    return;
                }
            }
            this._onKeyDown(evt);
        };
        /**
         * Handles pointer down events on the document. It has to be the document instead of the window
         * because otherwise `pointerdown` is not fired when the PCUI app is running in an iframe.
         * @param evt - Pointer event.
         */
        this._onDocumentPointerDown = (evt) => {
            // Use composedPath to handle clicks in both shadow DOM and regular DOM contexts
            if (!this.dom.contains(evt.composedPath()[0])) {
                this.close();
            }
        };
        this._onKeyDown = (evt) => {
            // close options on ESC and blur
            if (evt.key === 'Escape') {
                this.close();
                return;
            }
            if (evt.key === 'Tab') {
                this.close();
                return;
            }
            if (!this.enabled || this.readOnly)
                return;
            if (evt.key === 'Enter' && !this._allowInput) {
                if (this._labelHighlighted && this._labelToValue.has(this._labelHighlighted)) {
                    this._onSelectValue(this._labelToValue.get(this._labelHighlighted));
                    this.close();
                }
                return;
            }
            if (evt.key !== 'ArrowUp' && evt.key !== 'ArrowDown') {
                return;
            }
            evt.stopPropagation();
            evt.preventDefault();
            if ((this._allowInput || this.multiSelect) && this._containerOptions.hidden) {
                this.open();
                return;
            }
            if (this._containerOptions.hidden) {
                if (!this._options.length)
                    return;
                let index = -1;
                for (let i = 0; i < this._options.length; i++) {
                    if (this._options[i].v === this.value) {
                        index = i;
                        break;
                    }
                }
                if (evt.key === 'ArrowUp') {
                    index--;
                }
                else if (evt.key === 'ArrowDown') {
                    index++;
                }
                if (index >= 0 && index < this._options.length) {
                    this._onSelectValue(this._options[index].v);
                }
            }
            else {
                if (!this._containerOptions.dom.childNodes.length)
                    return;
                if (!this._labelHighlighted) {
                    this._highlightLabel(this._containerOptions.dom.childNodes[0].ui);
                }
                else {
                    let highlightedLabelDom = this._labelHighlighted.dom;
                    do {
                        if (evt.key === 'ArrowUp') {
                            highlightedLabelDom = highlightedLabelDom.previousSibling;
                        }
                        else if (evt.key === 'ArrowDown') {
                            highlightedLabelDom = highlightedLabelDom.nextSibling;
                        }
                    } while (highlightedLabelDom && highlightedLabelDom.ui.hidden);
                    if (highlightedLabelDom) {
                        this._highlightLabel(highlightedLabelDom.ui);
                    }
                }
            }
        };
        this._onPointerDown = () => {
            if (!this._allowInput) {
                this.focus();
            }
        };
        this._onFocus = () => {
            this.class.add(CLASS_FOCUS);
            this.emit('focus');
            if (!this._input.hidden) {
                this.open();
            }
        };
        this._onBlur = () => {
            this.class.remove(CLASS_FOCUS);
            this.emit('blur');
        };
        this._onWheel = (evt) => {
            // prevent scrolling on other stuff like the viewport
            // when we are scrolling on the select input
            evt.stopPropagation();
        };
        this._container = container;
        this._container.parent = this;
        this.class.add(CLASS_SELECT_INPUT);
        this._containerValue = new Container({
            class: CLASS_SELECT_INPUT_CONTAINER_VALUE
        });
        this._container.append(this._containerValue);
        // focus / hover shadow element
        this._domShadow = document.createElement('div');
        this._domShadow.classList.add(CLASS_SHADOW);
        this._containerValue.append(this._domShadow);
        this._allowInput = args.allowInput;
        if (this._allowInput) {
            this.class.add(CLASS_ALLOW_INPUT);
        }
        this._allowCreate = args.allowCreate;
        this._createFn = args.createFn;
        this._createLabelText = args.createLabelText;
        // displays current value
        this._labelValue = new Label({
            class: CLASS_VALUE,
            tabIndex: 0
        });
        this._labelValue.on('click', () => {
            if (this.enabled && !this.readOnly) {
                // toggle dropdown list
                this.toggle();
            }
        });
        this._containerValue.append(this._labelValue);
        // dropdown icon
        this._labelIcon = new Label({
            class: CLASS_ICON,
            hidden: args.allowInput && args.multiSelect
        });
        this._containerValue.append(this._labelIcon);
        // input for searching or adding new entries
        this._input = new TextInput({
            class: CLASS_INPUT,
            blurOnEnter: false,
            keyChange: true
        });
        this._containerValue.append(this._input);
        this._lastInputValue = '';
        this._suspendInputChange = false;
        this._input.on('change', this._onInputChange);
        this._input.on('keydown', this._onInputKeyDown);
        this._input.on('focus', this._onFocus);
        this._input.on('blur', this._onBlur);
        if (args.placeholder) {
            this.placeholder = args.placeholder;
        }
        // dropdown list
        this._containerOptions = new Container({
            class: CLASS_LIST,
            hidden: true
        });
        this._containerValue.append(this._containerOptions);
        // tags container
        this._containerTags = new Container({
            class: CLASS_TAGS,
            flex: true,
            flexDirection: 'row',
            hidden: true
        });
        this._container.append(this._containerTags);
        if (args.multiSelect) {
            this.class.add(CLASS_MULTI_SELECT);
            this._containerTags.hidden = false;
        }
        // events
        this._labelValue.dom.addEventListener('keydown', this._onKeyDown);
        this._labelValue.dom.addEventListener('focus', this._onFocus);
        this._labelValue.dom.addEventListener('blur', this._onBlur);
        this._labelValue.dom.addEventListener('pointerdown', this._onPointerDown);
        this._containerOptions.dom.addEventListener('wheel', this._onWheel, { passive: true });
        this.on('hide', () => {
            this.close();
        });
        this._type = (_a = args.type) !== null && _a !== void 0 ? _a : 'string';
        this.invalidOptions = (_b = args.invalidOptions) !== null && _b !== void 0 ? _b : [];
        this.options = (_c = args.options) !== null && _c !== void 0 ? _c : [];
        this._optionsFn = args.optionsFn;
        this._allowNull = args.allowNull;
        this._values = null;
        if (args.value !== undefined) {
            this.value = args.value;
        }
        else if (args.defaultValue) {
            this.value = args.defaultValue;
        }
        else {
            this.value = null;
        }
        this._renderChanges = args.renderChanges;
        this.on('change', () => {
            this._updateInputFieldsVisibility();
            if (this.renderChanges && !this.multiSelect) {
                this._labelValue.flash();
            }
        });
        this._updateInputFieldsVisibility(false);
        this._onSelect = args.onSelect;
        this.fallbackOrder = args.fallbackOrder;
        this.disabledOptions = args.disabledOptions;
        this._prefix = (_d = args.prefix) !== null && _d !== void 0 ? _d : '';
    }
    destroy() {
        if (this._destroyed)
            return;
        this._labelValue.dom.removeEventListener('keydown', this._onKeyDown);
        this._labelValue.dom.removeEventListener('pointerdown', this._onPointerDown);
        this._labelValue.dom.removeEventListener('focus', this._onFocus);
        this._labelValue.dom.removeEventListener('blur', this._onBlur);
        this._containerOptions.dom.removeEventListener('wheel', this._onWheel);
        window.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('pointerdown', this._onDocumentPointerDown);
        if (this._timeoutLabelValueTabIndex) {
            cancelAnimationFrame(this._timeoutLabelValueTabIndex);
            this._timeoutLabelValueTabIndex = null;
        }
        super.destroy();
    }
    _initializeCreateLabel() {
        const container = new Container({
            class: CLASS_CREATE_NEW,
            flex: true,
            flexDirection: 'row'
        });
        const label = new Label({
            text: this._input.value,
            tabIndex: -1
        });
        container.append(label);
        let evtChange = this._input.on('change', (value) => {
            // check if label is destroyed
            // during change event
            if (label.destroyed)
                return;
            label.text = value;
            if (this.invalidOptions && this.invalidOptions.indexOf(value) !== -1) {
                if (!container.hidden) {
                    container.hidden = true;
                    this._resizeShadow();
                }
            }
            else {
                if (container.hidden) {
                    container.hidden = false;
                    this._resizeShadow();
                }
            }
        });
        container.on('click', (e) => {
            e.stopPropagation();
            const text = label.text;
            this.focus();
            this.close();
            if (this._createFn) {
                this._createFn(text);
            }
            else if (text) {
                this._onSelectValue(text);
            }
        });
        label.on('destroy', () => {
            evtChange.unbind();
            evtChange = null;
        });
        const labelCreateText = new Label({
            text: this._createLabelText
        });
        container.append(labelCreateText);
        this._containerOptions.append(container);
        return container;
    }
    _convertSingleValue(value) {
        if (value === null && this._allowNull)
            return value;
        if (this._type === 'string') {
            if (!value) {
                value = '';
            }
            else {
                value = value.toString();
            }
        }
        else if (this._type === 'number') {
            if (!value) {
                value = 0;
            }
            else {
                value = parseInt(value, 10);
            }
        }
        else if (this._type === 'boolean') {
            return !!value;
        }
        return value;
    }
    _convertValue(value) {
        if (value === null && this._allowNull)
            return value;
        if (this.multiSelect) {
            if (!Array.isArray(value))
                return value;
            return value.map(val => this._convertSingleValue(val));
        }
        return this._convertSingleValue(value);
    }
    // Update our value with the specified selected option
    _onSelectValue(value) {
        value = this._convertSingleValue(value);
        if (!this.multiSelect) {
            this.value = value;
            return;
        }
        if (this._values) {
            let dirty = false;
            this._values.forEach((arr) => {
                if (!arr) {
                    arr = [value];
                    dirty = true;
                }
                else {
                    if (arr.indexOf(value) === -1) {
                        arr.push(value);
                        dirty = true;
                    }
                }
            });
            if (dirty) {
                this._onMultipleValuesChange(this._values);
                this.emit('change', this.value);
                if (this._binding) {
                    this._binding.addValues([value]);
                }
            }
        }
        else {
            if (!this._value || !Array.isArray(this._value)) {
                this.value = [value];
            }
            else {
                if (this._value.indexOf(value) === -1) {
                    this._value.push(value);
                    this._addTag(value);
                    this.emit('change', this.value);
                    if (this._binding) {
                        this._binding.addValues([value]);
                    }
                }
            }
        }
    }
    _highlightLabel(label) {
        if (this._labelHighlighted === label)
            return;
        if (this._labelHighlighted) {
            this._labelHighlighted.class.remove(CLASS_HIGHLIGHTED);
        }
        this._labelHighlighted = label;
        if (this._labelHighlighted) {
            this._labelHighlighted.class.add(CLASS_HIGHLIGHTED);
            // scroll into view if necessary
            const labelTop = this._labelHighlighted.dom.offsetTop;
            const scrollTop = this._containerOptions.dom.scrollTop;
            if (labelTop < scrollTop) {
                this._containerOptions.dom.scrollTop = labelTop;
            }
            else if (labelTop + this._labelHighlighted.height > this._containerOptions.height + scrollTop) {
                this._containerOptions.dom.scrollTop = labelTop + this._labelHighlighted.height - this._containerOptions.height;
            }
        }
    }
    // when the value is changed show the correct title
    _onValueChange(value) {
        if (!this.multiSelect) {
            this._labelValue.value = this._prefix + (this._valueToText[String(value)] || '');
            value = String(value);
            for (const key in this._valueToLabel) {
                const label = this._valueToLabel[key];
                if (key === value) {
                    label.class.add(CLASS_SELECTED);
                }
                else {
                    label.class.remove(CLASS_SELECTED);
                }
            }
        }
        else {
            this._labelValue.value = '';
            this._containerTags.clear();
            this._containerTags.class.add(CLASS_TAGS_EMPTY);
            if (value && Array.isArray(value)) {
                for (const val of value) {
                    this._addTag(val);
                    const label = this._valueToLabel[String(val)];
                    if (label) {
                        label.class.add(CLASS_SELECTED);
                    }
                }
                for (const key in this._valueToLabel) {
                    const label = this._valueToLabel[key];
                    if (value.indexOf(this._convertSingleValue(key)) !== -1) {
                        label.class.add(CLASS_SELECTED);
                    }
                    else {
                        label.class.remove(CLASS_SELECTED);
                    }
                }
            }
        }
    }
    _onMultipleValuesChange(values) {
        this._labelValue.value = '';
        this._containerTags.clear();
        this._containerTags.class.add(CLASS_TAGS_EMPTY);
        const tags = {};
        const valueCounts = {};
        values.forEach((arr) => {
            if (!arr)
                return;
            arr.forEach((val) => {
                if (!tags[val]) {
                    tags[val] = this._addTag(val);
                    valueCounts[val] = 1;
                }
                else {
                    valueCounts[val]++;
                }
            });
        });
        // add special class to tags that do not exist everywhere
        for (const val in valueCounts) {
            if (valueCounts[val] !== values.length) {
                tags[val].class.add(CLASS_TAG_NOT_EVERYWHERE);
                const label = this._valueToLabel[String(val)];
                if (label) {
                    label.class.remove(CLASS_SELECTED);
                }
            }
        }
    }
    _addTag(value) {
        const container = new Container({
            flex: true,
            flexDirection: 'row',
            class: CLASS_TAG
        });
        container.append(new Label({
            text: this._valueToText[String(value)] || value
        }));
        const btnRemove = new Button({
            size: 'small',
            icon: 'E132',
            tabIndex: -1
        });
        container.append(btnRemove);
        btnRemove.on('click', () => this._removeTag(container, String(value)));
        this._containerTags.append(container);
        this._containerTags.class.remove(CLASS_TAGS_EMPTY);
        const label = this._valueToLabel[String(value)];
        if (label) {
            label.class.add(CLASS_SELECTED);
        }
        // @ts-ignore
        container.value = value;
        return container;
    }
    _removeTag(tagElement, value) {
        tagElement.destroy();
        const label = this._valueToLabel[String(value)];
        if (label) {
            label.class.remove(CLASS_SELECTED);
        }
        if (this._values) {
            this._values.forEach((arr) => {
                if (!arr)
                    return;
                const idx = arr.indexOf(value);
                if (idx !== -1) {
                    arr.splice(idx, 1);
                }
            });
        }
        else if (this._value && Array.isArray(this._value)) {
            const idx = this._value.indexOf(value);
            if (idx !== -1) {
                this._value.splice(idx, 1);
            }
        }
        this.emit('change', this.value);
        if (this._binding) {
            this._binding.removeValues([value]);
        }
    }
    _filterOptions(filter) {
        // first remove all options
        // then search the options for best matches
        // and add them back in best match order
        const containerDom = this._containerOptions.dom;
        while (containerDom.firstChild) {
            containerDom.removeChild(containerDom.lastChild);
        }
        if (filter) {
            const searchResults = searchItems(this._options, 't', filter);
            searchResults.forEach((result) => {
                const label = this._valueToLabel[String(result.v)];
                containerDom.appendChild(label.dom);
            });
        }
        else {
            for (const option of this._options) {
                const label = this._valueToLabel[String(option.v)];
                containerDom.appendChild(label.dom);
            }
        }
        // append create label in the end
        if (this._createLabelContainer) {
            containerDom.appendChild(this._createLabelContainer.dom);
        }
        if (containerDom.firstChild) {
            this._highlightLabel(containerDom.firstChild.ui);
        }
        this._resizeShadow();
    }
    _resizeShadow() {
        this._domShadow.style.height = `${this._containerValue.height + this._containerOptions.height}px`;
    }
    _updateInputFieldsVisibility(focused) {
        let showInput = false;
        let focusInput = false;
        if (this._allowInput) {
            if (focused) {
                showInput = true;
                focusInput = true;
            }
            else {
                showInput = this.multiSelect || !this._valueToLabel[this.value];
            }
        }
        this._labelValue.hidden = showInput;
        this._labelIcon.hidden = showInput;
        this._input.hidden = !showInput;
        if (focusInput) {
            this._input.focus();
        }
        if (!this._labelValue.hidden) {
            // prevent label from being focused
            // right after input gets unfocused
            this._labelValue.tabIndex = -1;
            if (!this._timeoutLabelValueTabIndex) {
                this._timeoutLabelValueTabIndex = requestAnimationFrame(() => {
                    this._timeoutLabelValueTabIndex = null;
                    this._labelValue.tabIndex = 0;
                });
            }
        }
    }
    focus() {
        if (this._input.hidden) {
            this._labelValue.dom.focus();
        }
        else {
            this._input.focus();
        }
    }
    blur() {
        if (this._allowInput) {
            this._input.blur();
        }
        else {
            this._labelValue.dom.blur();
        }
    }
    /**
     * Opens the dropdown menu.
     */
    open() {
        if (!this._containerOptions.hidden || !this.enabled || this.readOnly)
            return;
        this._updateInputFieldsVisibility(true);
        // auto-update options if necessary
        if (this._optionsFn) {
            this.options = this._optionsFn();
        }
        if (this._containerOptions.dom.childNodes.length === 0)
            return;
        // highlight label that displays current value
        this._containerOptions.forEachChild((label) => {
            label.hidden = false;
            if (this._labelToValue.get(label) === this.value) {
                this._highlightLabel(label);
            }
        });
        if (!this._labelHighlighted) {
            this._highlightLabel(this._containerOptions.dom.childNodes[0].ui);
        }
        // show options
        this._containerOptions.hidden = false;
        this.class.add(CLASS_OPEN);
        // register keydown on entire window
        window.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('pointerdown', this._onDocumentPointerDown);
        // if the dropdown list goes below the window show it above the field
        const startField = this._allowInput ? this._input.dom : this._labelValue.dom;
        const rect = startField.getBoundingClientRect();
        let fitHeight = (rect.bottom + this._containerOptions.height + DEFAULT_BOTTOM_OFFSET >= window.innerHeight);
        if (fitHeight && rect.top - this._containerOptions.height < 0) {
            // if showing it above the field means that some of it will not be visible
            // then show it below instead and adjust the max height to the maximum available space
            fitHeight = false;
            this._containerOptions.style.maxHeight = `${window.innerHeight - rect.bottom - DEFAULT_BOTTOM_OFFSET}px`;
        }
        if (fitHeight) {
            this.class.add(CLASS_FIT_HEIGHT);
        }
        else {
            this.class.remove(CLASS_FIT_HEIGHT);
        }
        // resize the outer shadow to fit the element and the dropdown list
        // we need this because the dropdown list is position: absolute
        this._resizeShadow();
    }
    /**
     * Closes the dropdown menu.
     */
    close() {
        // there is a potential bug here if the user has set a max height
        // themselves then this will be overridden
        this._containerOptions.style.maxHeight = '';
        this._highlightLabel(null);
        this._updateInputFieldsVisibility(false);
        this._suspendInputChange = true;
        this._input.value = '';
        if (this._lastInputValue) {
            this._lastInputValue = '';
            this._filterOptions(null);
        }
        this._suspendInputChange = false;
        if (this._containerOptions.hidden)
            return;
        this._containerOptions.hidden = true;
        this._domShadow.style.height = '';
        this.class.remove(CLASS_OPEN);
        window.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('pointerdown', this._onDocumentPointerDown);
    }
    /**
     * Toggles the dropdown menu.
     */
    toggle() {
        if (this._containerOptions.hidden) {
            this.open();
        }
        else {
            this.close();
        }
    }
    unlink() {
        super.unlink();
        if (!this._containerOptions.hidden) {
            this.close();
        }
    }
    _updateValue(value) {
        if (value === this._value)
            return;
        this._value = value;
        this._onValueChange(value);
        if (!this._suppressChange) {
            this.emit('change', value);
        }
        if (this._binding) {
            this._binding.setValue(value);
        }
    }
    _updateDisabledValue(value) {
        const labels = {};
        this._containerOptions.forEachChild((label) => {
            labels[label.dom.id] = label;
            if (this._disabledOptions[label.dom.id]) {
                label.enabled = false;
                label.text = this._disabledOptions[label.dom.id];
            }
            else {
                label.enabled = true;
                label.text = this._valueToText[label.dom.id];
            }
            label.class.remove(CLASS_DISABLED_VALUE);
        });
        const disabledValue = this._disabledOptions[value] ? value : null;
        let newValue = null;
        if (disabledValue) {
            if (this._fallbackOrder) {
                for (let i = 0; i < this._fallbackOrder.length; i++) {
                    if (this._fallbackOrder[i] === value)
                        continue;
                    newValue = this._fallbackOrder[i];
                    break;
                }
            }
            this.disabledValue = disabledValue;
            labels[disabledValue].class.add(CLASS_DISABLED_VALUE);
        }
        else if (this._disabledValue) {
            newValue = this._disabledValue;
            this.disabledValue = null;
        }
        else {
            newValue = value;
            this.disabledValue = null;
        }
        return newValue;
    }
    set options(value) {
        if (this._options && JSON.stringify(this._options) === JSON.stringify(value))
            return;
        this._containerOptions.clear();
        this._labelHighlighted = null;
        this._valueToText = {};
        this._valueToLabel = {};
        this._options = value;
        // store each option value -> title pair in the optionsIndex
        for (const option of this._options) {
            this._valueToText[String(option.v)] = option.t;
            if (option.v === '')
                return;
            const label = new Label({
                text: option.t,
                tabIndex: -1,
                id: String(option.v)
            });
            this._labelToValue.set(label, option.v);
            // store labels in an index too
            this._valueToLabel[String(option.v)] = label;
            // on clicking an option set it as the value and close the dropdown list
            label.on('click', (e) => {
                e.stopPropagation();
                this._onSelectValue(option.v);
                this.close();
                if (this._onSelect) {
                    this._onSelect(this.value);
                }
            });
            this._containerOptions.append(label);
        }
        this._createLabelContainer = null;
        if (this._createLabelText) {
            this._createLabelContainer = this._initializeCreateLabel();
        }
        if (this.multiSelect && this._values) {
            this._onMultipleValuesChange(this._values);
        }
        else {
            this._onValueChange(this.value);
        }
        if (this._lastInputValue) {
            this._filterOptions(this._lastInputValue);
        }
    }
    get options() {
        return this._options.slice();
    }
    set invalidOptions(value) {
        this._invalidOptions = value || null;
    }
    get invalidOptions() {
        return this._invalidOptions;
    }
    set disabledValue(value) {
        this._disabledValue = value;
        if (this._disabledValue !== null) {
            this.class.add(CLASS_HAS_DISABLED_VALUE);
        }
        else {
            this.class.remove(CLASS_HAS_DISABLED_VALUE);
        }
    }
    set disabledOptions(value) {
        if (JSON.stringify(this._disabledOptions) === JSON.stringify(value))
            return;
        this._disabledOptions = value || {};
        const newValue = this._updateDisabledValue(this._value);
        this._updateValue(newValue);
    }
    set fallbackOrder(value) {
        this._fallbackOrder = value || null;
    }
    get multiSelect() {
        return this.class.contains(CLASS_MULTI_SELECT);
    }
    set value(value) {
        this._values = null;
        this._suspendInputChange = true;
        this._input.value = '';
        if (this._lastInputValue) {
            this._lastInputValue = '';
            this._filterOptions(null);
        }
        this._suspendInputChange = false;
        this.class.remove(CLASS_MULTIPLE_VALUES);
        value = this._convertValue(value);
        if (this._value === value || this.multiSelect && this._value && this._value.equals(value)) {
            // if the value is null because we are showing multiple values
            // but someone wants to actually set the value of all observers to null
            // then make sure we do not return early
            if (value !== null || !this._allowNull || !this.class.contains(CLASS_MULTIPLE_VALUES)) {
                return;
            }
        }
        this.disabledValue = null;
        this._updateValue(value);
    }
    get value() {
        if (!this.multiSelect) {
            return this._value;
        }
        // if multi-select then construct an array
        // value from the tags that are currently visible
        const result = [];
        this._containerTags.dom.childNodes.forEach((dom) => {
            // @ts-ignore
            result.push(dom.ui.value);
        });
        return result;
    }
    /* eslint accessor-pairs: 0 */
    set values(values) {
        values = values.map((value) => {
            return this._convertValue(value);
        });
        let different = false;
        const value = values[0];
        const multiSelect = this.multiSelect;
        this._values = null;
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== value && (!multiSelect || !values[i] || !values[i].equals(value))) {
                different = true;
                break;
            }
        }
        if (different) {
            this._labelValue.values = values;
            // show all different tags
            if (multiSelect) {
                this._values = values;
                this._value = null;
                this._onMultipleValuesChange(this._values);
                this.emit('change', this.value);
            }
            else {
                if (this._value !== null) {
                    this._value = null;
                    this.emit('change', null);
                }
            }
            this.class.add(CLASS_MULTIPLE_VALUES);
        }
        else {
            this.value = values[0];
        }
    }
    set placeholder(value) {
        this._input.placeholder = value;
    }
    get placeholder() {
        return this._input.placeholder;
    }
    set renderChanges(value) {
        this._renderChanges = value;
    }
    get renderChanges() {
        return this._renderChanges;
    }
}
Element.register('select', SelectInput, { renderChanges: true });
Element.register('multiselect', SelectInput, { multiSelect: true, renderChanges: true });
Element.register('tags', SelectInput, { allowInput: true, allowCreate: true, multiSelect: true, renderChanges: true });

export { SelectInput };
//# sourceMappingURL=index.js.map
