/**
 * QuantityWidget - OpenBIS widget for managing quantities with units
 * 
 * Features:
 * - Number input + unit dropdown UI
 * - Admin-configurable dimension filtering (length, mass, etc.)
 * - Auto-conversion to base units on save
 * - Support for all units including prefixes
 */

// Use dynamic import for ES modules when available, fallback for testing
let convert, MeasureKind;

if (typeof window !== 'undefined') {
    // Browser environment - will be loaded via script tag or bundler
    // The convert library will be available globally or imported
} else {
    // Node.js environment - for testing
    try {
        const convertLib = require('convert');
        convert = convertLib.convert;
        MeasureKind = convertLib.MeasureKind;
    } catch (e) {
        // Fallback for testing with mocks
        if (global.mockConvert) {
            convert = global.mockConvert.convert;
        } else {
            convert = () => ({ to: (unit) => 0 });
        }
        MeasureKind = {};
    }
}

class QuantityWidget {
    constructor(options = {}) {
        this.element = null;
        this.options = {
            dimension: options.dimension || 'Length', // Default dimension
            baseUnit: options.baseUnit || this.getDefaultBaseUnit(options.dimension || 'Length'),
            value: options.value || 0,
            unit: options.unit || this.getDefaultBaseUnit(options.dimension || 'Length'),
            placeholder: options.placeholder || 'Enter value',
            disabled: options.disabled || false,
            onChange: options.onChange || (() => {}),
            ...options
        };
        
        this.unitsByDimension = this.initializeUnits();
        this.render();
    }

    /**
     * Get default base unit for each dimension
     */
    getDefaultBaseUnit(dimension) {
        const baseUnits = {
            'Length': 'm',
            'Mass': 'kg', 
            'Volume': 'l',
            'Area': 'm2',
            'Temperature': 'C',
            'Time': 's',
            'Pressure': 'Pa',
            'Energy': 'J',
            'Power': 'W',
            'Force': 'N',
            'Angle': 'rad',
            'Data': 'B'
        };
        return baseUnits[dimension] || 'm';
    }

    /**
     * Initialize available units for each dimension
     */
    initializeUnits() {
        const unitsByDimension = {
            'Length': [
                // SI and metric
                { value: 'nm', label: 'nanometer (nm)' },
                { value: 'μm', label: 'micrometer (μm)' },
                { value: 'mm', label: 'millimeter (mm)' },
                { value: 'cm', label: 'centimeter (cm)' },
                { value: 'm', label: 'meter (m)' },
                { value: 'km', label: 'kilometer (km)' },
                // Imperial/US
                { value: 'in', label: 'inch (in)' },
                { value: 'ft', label: 'foot (ft)' },
                { value: 'yd', label: 'yard (yd)' },
                { value: 'mi', label: 'mile (mi)' }
            ],
            'Mass': [
                // SI and metric
                { value: 'mg', label: 'milligram (mg)' },
                { value: 'g', label: 'gram (g)' },
                { value: 'kg', label: 'kilogram (kg)' },
                { value: 't', label: 'metric ton (t)' },
                // Imperial/US
                { value: 'oz', label: 'ounce (oz)' },
                { value: 'lb', label: 'pound (lb)' }
            ],
            'Volume': [
                // SI and metric
                { value: 'ml', label: 'milliliter (ml)' },
                { value: 'l', label: 'liter (l)' },
                // Imperial/US
                { value: 'fl-oz', label: 'fluid ounce (fl oz)' },
                { value: 'pt', label: 'pint (pt)' },
                { value: 'qt', label: 'quart (qt)' },
                { value: 'gal', label: 'gallon (gal)' }
            ],
            'Area': [
                { value: 'mm2', label: 'square millimeter (mm²)' },
                { value: 'cm2', label: 'square centimeter (cm²)' },
                { value: 'm2', label: 'square meter (m²)' },
                { value: 'ha', label: 'hectare (ha)' },
                { value: 'km2', label: 'square kilometer (km²)' },
                { value: 'in2', label: 'square inch (in²)' },
                { value: 'ft2', label: 'square foot (ft²)' },
                { value: 'ac', label: 'acre (ac)' }
            ],
            'Temperature': [
                { value: 'C', label: 'Celsius (°C)' },
                { value: 'F', label: 'Fahrenheit (°F)' },
                { value: 'K', label: 'Kelvin (K)' }
            ],
            'Time': [
                { value: 'ms', label: 'millisecond (ms)' },
                { value: 's', label: 'second (s)' },
                { value: 'min', label: 'minute (min)' },
                { value: 'h', label: 'hour (h)' },
                { value: 'd', label: 'day (d)' },
                { value: 'week', label: 'week' },
                { value: 'month', label: 'month' },
                { value: 'year', label: 'year' }
            ]
        };

        return unitsByDimension;
    }

    /**
     * Get available units for the current dimension
     */
    getUnitsForDimension() {
        return this.unitsByDimension[this.options.dimension] || [];
    }

    /**
     * Convert value from current unit to base unit
     */
    convertToBaseUnit(value, fromUnit) {
        if (fromUnit === this.options.baseUnit) {
            return value;
        }
        try {
            return convert(value, fromUnit).to(this.options.baseUnit);
        } catch (error) {
            console.warn(`Conversion failed from ${fromUnit} to ${this.options.baseUnit}:`, error);
            return value; // Return original value if conversion fails
        }
    }

    /**
     * Convert value from base unit to display unit
     */
    convertFromBaseUnit(value, toUnit) {
        if (toUnit === this.options.baseUnit) {
            return value;
        }
        try {
            return convert(value, this.options.baseUnit).to(toUnit);
        } catch (error) {
            console.warn(`Conversion failed from ${this.options.baseUnit} to ${toUnit}:`, error);
            return value; // Return original value if conversion fails
        }
    }

    /**
     * Get the current value in base units
     */
    getValueInBaseUnits() {
        const inputValue = parseFloat(this.numberInput.value) || 0;
        const currentUnit = this.unitSelect.value;
        return this.convertToBaseUnit(inputValue, currentUnit);
    }

    /**
     * Set the display value from base units
     */
    setValueFromBaseUnits(baseValue, displayUnit = null) {
        const targetUnit = displayUnit || this.unitSelect.value;
        const displayValue = this.convertFromBaseUnit(baseValue, targetUnit);
        this.numberInput.value = displayValue;
        if (displayUnit) {
            this.unitSelect.value = displayUnit;
        }
    }

    /**
     * Render the widget HTML
     */
    render() {
        // Handle case where document is not available (testing)
        if (typeof document === 'undefined') {
            this.element = { className: 'quantity-widget' };
            this.numberInput = { value: '', disabled: false, addEventListener: () => {} };
            this.unitSelect = { value: this.options.unit, disabled: false, addEventListener: () => {} };
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'quantity-widget';
        this.element.innerHTML = `
            <div class="quantity-widget__container">
                <input 
                    type="number" 
                    class="quantity-widget__input" 
                    placeholder="${this.options.placeholder}"
                    ${this.options.disabled ? 'disabled' : ''}
                    step="any"
                />
                <select 
                    class="quantity-widget__select"
                    ${this.options.disabled ? 'disabled' : ''}
                >
                    ${this.getUnitsForDimension().map(unit => 
                        `<option value="${unit.value}" ${unit.value === this.options.unit ? 'selected' : ''}>${unit.label}</option>`
                    ).join('')}
                </select>
            </div>
        `;

        // Get references to inputs
        this.numberInput = this.element.querySelector('.quantity-widget__input');
        this.unitSelect = this.element.querySelector('.quantity-widget__select');

        // Set initial value
        const displayValue = this.convertFromBaseUnit(this.options.value, this.options.unit);
        this.numberInput.value = displayValue;

        // Add event listeners
        this.setupEventListeners();

        return this.element;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle value changes
        const handleChange = () => {
            const baseValue = this.getValueInBaseUnits();
            this.options.onChange({
                value: baseValue,
                unit: this.options.baseUnit,
                displayValue: parseFloat(this.numberInput.value) || 0,
                displayUnit: this.unitSelect.value
            });
        };

        if (this.numberInput.addEventListener) {
            this.numberInput.addEventListener('input', handleChange);
            this.numberInput.addEventListener('change', handleChange);
        }
        
        // Handle unit changes - convert the display value
        if (this.unitSelect.addEventListener) {
            this.unitSelect.addEventListener('change', () => {
                const currentDisplayValue = parseFloat(this.numberInput.value) || 0;
                const oldUnit = this.options.unit;
                const newUnit = this.unitSelect.value;
                
                // Convert current display value to new unit
                try {
                    const convertedValue = convert(currentDisplayValue, oldUnit).to(newUnit);
                    this.numberInput.value = convertedValue;
                    this.options.unit = newUnit;
                } catch (error) {
                    console.warn(`Unit conversion failed from ${oldUnit} to ${newUnit}:`, error);
                }
                
                handleChange();
            });
        }
    }

    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }

    /**
     * Set the value programmatically
     */
    setValue(baseValue, displayUnit = null) {
        this.options.value = baseValue;
        this.setValueFromBaseUnits(baseValue, displayUnit);
    }

    /**
     * Get the current value in base units
     */
    getValue() {
        return this.getValueInBaseUnits();
    }

    /**
     * Enable/disable the widget
     */
    setDisabled(disabled) {
        this.options.disabled = disabled;
        if (this.numberInput) this.numberInput.disabled = disabled;
        if (this.unitSelect) this.unitSelect.disabled = disabled;
    }

    /**
     * Update dimension and refresh available units
     */
    setDimension(dimension) {
        this.options.dimension = dimension;
        this.options.baseUnit = this.getDefaultBaseUnit(dimension);
        
        // Update the unit dropdown
        const units = this.getUnitsForDimension();
        if (this.unitSelect && this.unitSelect.innerHTML !== undefined) {
            this.unitSelect.innerHTML = units.map(unit => 
                `<option value="${unit.value}">${unit.label}</option>`
            ).join('');
        }
        
        // Set to first available unit
        if (units.length > 0) {
            if (this.unitSelect) this.unitSelect.value = units[0].value;
            this.options.unit = units[0].value;
        }
    }

    /**
     * Destroy the widget
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuantityWidget };
}

if (typeof window !== 'undefined') {
    window.QuantityWidget = QuantityWidget;
}