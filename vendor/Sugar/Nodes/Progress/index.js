import { Container } from '../Container/index.js';
import { Element } from '../Element/index.js';

const CLASS_ROOT = 'pcui-progress';
const CLASS_INNER = `${CLASS_ROOT}-inner`;
/**
 * Represents a bar that can highlight progress of an activity.
 */
class Progress extends Container {
    /**
     * Creates a new Progress.
     *
     * @param args - The arguments.
     */
    constructor(args = {}) {
        super(args);
        this._inner = new Element({
            class: CLASS_INNER
        });
        this.class.add(CLASS_ROOT);
        this.append(this._inner);
        if (args.value !== undefined) {
            this.value = args.value;
        }
    }
    /**
     * Sets the value of the progress bar. The range is from 0 to 100.
     */
    set value(val) {
        if (this._value === val)
            return;
        this._value = val;
        this._inner.width = `${this._value}%`;
        this.emit('change', val);
    }
    /**
     * Gets the value of the progress bar.
     */
    get value() {
        return this._value;
    }
}
Element.register('progress', Progress);

export { Progress };
//# sourceMappingURL=index.js.map
