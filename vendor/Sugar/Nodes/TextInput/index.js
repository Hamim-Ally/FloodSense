import { CLASS_MULTIPLE_VALUES } from '../../class.js';
import { Element } from '../Element/index.js';
import { InputElement } from '../InputElement/index.js';

const CLASS_TEXT_INPUT = 'pcui-text-input';
/**
 * The TextInput is an input element of type text.
 */
class TextInput extends InputElement {
    /**
     * Creates a new TextInput.
     *
     * @param args - The arguments.
     */
    constructor(args = {}) {
        super(args);
        this.class.add(CLASS_TEXT_INPUT);
        if (args.onValidate) {
            this.onValidate = args.onValidate;
        }
    }
    _onInputChange(evt) {
        if (this._suspendInputChangeEvt)
            return;
        if (this.onValidate) {
            const error = !this.onValidate(this.value);
            this.error = error;
            if (error) {
                return;
            }
        }
        else {
            this.error = false;
        }
        this.emit('change', this.value);
        if (this._binding) {
            this._binding.setValue(this.value);
        }
    }
    _updateValue(value) {
        this.class.remove(CLASS_MULTIPLE_VALUES);
        if (value && typeof (value) === 'object') {
            if (Array.isArray(value)) {
                let isObject = false;
                for (let i = 0; i < value.length; i++) {
                    if (value[i] && typeof value[i] === 'object') {
                        isObject = true;
                        break;
                    }
                }
                value = isObject ? '[Not available]' : value.map((val) => {
                    return val === null ? 'null' : val;
                }).join(',');
            }
            else {
                value = '[Not available]';
            }
        }
        if (value === this.value)
            return false;
        this._suspendInputChangeEvt = true;
        this._domInput.value = (value === null || value === undefined) ? '' : String(value);
        this._suspendInputChangeEvt = false;
        this.emit('change', value);
        return true;
    }
    set value(value) {
        const changed = this._updateValue(value);
        if (changed) {
            // reset error
            this.error = false;
        }
        if (changed && this._binding) {
            this._binding.setValue(value);
        }
    }
    get value() {
        return this._domInput.value;
    }
    /* eslint accessor-pairs: 0 */
    set values(values) {
        const different = values.some(v => v !== values[0]);
        if (different) {
            this._updateValue(null);
            this.class.add(CLASS_MULTIPLE_VALUES);
        }
        else {
            this._updateValue(values[0]);
        }
    }
}
Element.register('string', TextInput, { renderChanges: true });

export { TextInput };
//# sourceMappingURL=index.js.map
