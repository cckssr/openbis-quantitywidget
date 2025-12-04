/**
 * UnitConverter - Main class for UCUM unit conversion functionality.
 * Manages unit data loading, user input handling, and unit conversions.
 * Persists state across page reloads using sessionStorage.
 */
class UnitConverter {
    /**
     * Initialize the UnitConverter with empty state and load units from JSON.
     */
    constructor() {
        this.units = {};
        this.unitsArray = [];
        this.currentSourceUnit = null;
        this.currentTargetUnit = null;
        this.init();
    }

    /**
     * Asynchronously load units from JSON file and initialize the converter.
     * Fetches ucum.units.json, converts it to arrays, sets up listeners, and restores saved state.
     */
    async init() {
        try {
            const response = await fetch('./ucum.units.json');
            const data = await response.json();

            // Convert flat object to array for easier manipulation
            this.units = data;
            this.unitsArray = Object.entries(data).map(([id, unit]) => ({
                id,
                ...unit
            }));
            document.unitsArray = this.unitsArray; // For debugging

            this.updateStats();
            this.setupEventListeners();
            this.loadPersistedValues();
        } catch (error) {
            console.error('Error loading units:', error);
            this.showError('Failed to load units data');
        }
    }

    /**
     * Attach event listeners to all UI input elements.
     * Handles source unit input, value changes, and target unit selection.
     */
    setupEventListeners() {
        const ucumCodeInput = document.getElementById('ucum-code');
        const valueInput = document.getElementById('value');
        const targetSearch = document.getElementById('target-unit-search');

        ucumCodeInput.addEventListener('change', () => this.onSourceUnitChange());
        ucumCodeInput.addEventListener('input', () => this.onSourceUnitChange());
        valueInput.addEventListener('input', () => this.onValueChange());

        targetSearch.addEventListener('focus', () => this.showTargetDropdown());
        targetSearch.addEventListener('input', () => this.filterAndShowTargets());

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-wrapper')) {
                this.hideTargetDropdown();
            }
        });

        document.getElementById('target-unit-dropdown').addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                const unitId = item.dataset.unitId;
                this.selectTargetUnit(unitId);
            }
        });
    }

    /**
     * Handle changes to the source (input) unit UCUM code field.
     * Validates the unit exists in the dataset and updates the UI accordingly.
     */
    onSourceUnitChange() {
        const inputUnit = document.getElementById('ucum-code').value.trim();
        this.clearError();
        // Reset target unit selection
        document.getElementById('target-unit-search').value = '';
        this.currentTargetUnit = null;

        if (!inputUnit) {
            this.currentSourceUnit = null;
            document.getElementById('source-info').style.display = 'none';
            document.getElementById('conversion-result').classList.remove('show');
            return;
        }

        // Find unit by UCUM code
        const unit = this.unitsArray.find(u => u.ucumCode === this.replaceInputUnit(inputUnit));

        if (!unit) {
            this.showError(`Unit with UCUM code "${inputUnit}" not found`);
            this.currentSourceUnit = null;
            document.getElementById('source-info').style.display = 'none';
            return;
        }

        this.currentSourceUnit = unit;
        this.updateSourceInfo(unit);
        this.onValueChange();
    }

    /**
     * Replace string parts in source unit search input for better matching.
     * Converts user-friendly notation to UCUM format:
     * - Spaces and * become dots (.)
     * - Slashes convert following units to negative exponents (e.g., m/s -> m.s-1)
     * @param {string} searchText - The text to process
     * @returns {string} Processed text in UCUM notation
     */
    replaceInputUnit(searchText) {
        // Replace spaces and asterisks with dots
        let result = searchText.replace(/[\s*]/g, '.');
        
        // Handle division notation: convert units after / to negative exponents
        // e.g., m/s -> m.s-1, N/s2 -> N.s-2, kg.m/s2 -> kg.m.s-2
        if (result.includes('/')) {
            const parts = result.split('/');
            const numerator = parts[0];
            
            // Process denominator parts (everything after /)
            const denominatorParts = [];
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                
                // Extract unit symbol and exponent
                // e.g., "s2" -> unit="s", exp=2; "m" -> unit="m", exp=1
                const match = part.match(/^([a-zA-Z]+)(\d*)$/);
                
                if (match) {
                    const unit = match[1];
                    const exponent = match[2] ? parseInt(match[2], 10) : 1;
                    denominatorParts.push(`${unit}-${exponent}`);
                } else {
                    // Fallback: treat the whole part as unit with exponent -1
                    denominatorParts.push(`${part}-1`);
                }
            }
            
            result = numerator + '.' + denominatorParts.join('.');
        }
        
        return result;
    }

    /**
     * Display detailed information about the selected source unit.
     * Shows label, dimension, base unit, and quantity kinds.
     * @param {Object} unit - The unit object with properties to display
     */
    updateSourceInfo(unit) {
        document.getElementById('source-label').textContent = unit.label || '-';
        document.getElementById('source-dimension').innerHTML = this.formatDimension(unit.dimension) || '-';
        document.getElementById('source-base-unit').textContent = unit.baseUnit || '-';
        document.getElementById('source-qk').textContent =
            (unit.quantityKind && unit.quantityKind.length > 0)
                ? unit.quantityKind.slice(0, 3).join(', ') + (unit.quantityKind.length > 3 ? '...' : '')
                : '-';
        document.getElementById('source-info').style.display = 'block';
    }

    /**
     * Format dimension string for display.
     * Extract exponents and format according to dimensional symbols.
     * @param {string} dimension - The raw dimension string, e.g. A0E0L1I0M0H0T0D0
     * @returns {string} Formatted dimension string
     */
    formatDimension(dimension) {
        if (!dimension) return '-';
        const dimMap = {
            A: 'N', // Amount of substance
            E: 'I', // Electric current
            L: 'L', // Length
            I: 'J', // Luminous intensity
            M: 'M', // Mass
            H: 'Θ', // Absolute temperature
            T: 'T', // Time
            D: 'D' // Dimensionless
        };
        const dimOrder = ['T', 'L', 'M', 'E', 'H', 'A', 'I', 'D'];
        const parts = dimension.split(/(?=[A-Z])/);
        const dimParts = {};
        
        parts.forEach(part => {
            const symbol = part.charAt(0);
            const exponent = parseInt(part.slice(1), 10);
            if (exponent !== 0) {
            dimParts[symbol] = exponent;
            }
        });
        
        return dimOrder
            .filter(key => dimParts[key])
            .map(key => {
            const symbol = dimMap[key];
            const exponent = dimParts[key];
            return `${symbol}${exponent !== 1 ? `<sup>${exponent}</sup>` : ''}`;
            })
            .join(' ');
    }

    /**
     * Get all units that are compatible with the source unit.
     * Units are compatible if they share the same base unit.
     * @param {Object} sourceUnit - The source unit to find compatible units for
     * @returns {Array} Array of compatible unit objects
     */
    getCompatibleUnits(sourceUnit) {
        if (!sourceUnit || !sourceUnit.baseUnit) {
            return [];
        }

        // Filter units with the same base unit
        const filteredUnits = this.unitsArray.filter(u => u.baseUnit === sourceUnit.baseUnit);
        this.updateCompatibleStats(filteredUnits.length);
        return filteredUnits;
    }

    /**
     * Display the target unit dropdown and populate it with compatible units.
     */
    showTargetDropdown() {
        if (!this.currentSourceUnit) {
            this.showError('Please select a valid source unit first');
            return;
        }
        this.filterAndShowTargets();
    }

    /**
     * Hide the target unit dropdown menu.
     */
    hideTargetDropdown() {
        document.getElementById('target-unit-dropdown').classList.remove('show');
    }

    /**
     * Filter compatible units by search text and display them in the dropdown.
     * Filters by UCUM code or unit label.
     */
    filterAndShowTargets() {
        if (!this.currentSourceUnit) return;

        const searchText = document.getElementById('target-unit-search').value.toLowerCase();
        const compatible = this.getCompatibleUnits(this.currentSourceUnit);

        let filtered = compatible;
        if (searchText) {
            filtered = compatible.filter(u =>
                u.ucumCode.toLowerCase().includes(searchText) ||
                (u.label && u.label.toLowerCase().includes(searchText))
            );
        }

        const dropdown = document.getElementById('target-unit-dropdown');

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="no-results">No units found</div>';
        } else {
            dropdown.innerHTML = filtered
                .map(u => `
                    <div class="dropdown-item" data-unit-id="${u.id}">
                        <div class="dropdown-item-ucum">${u.ucumCode}</div>
                        <div class="dropdown-item-label">${u.label || u.id}</div>
                        <div class="dropdown-item-multiplier">
                            ${u.multiplier !== 1 ? `× ${u.multiplier}` : 'Base unit'}
                        </div>
                    </div>
                `)
                .join('');
        }

        dropdown.classList.add('show');
    }

    /**
     * Select a target unit from the dropdown and perform conversion.
     * @param {string} unitId - The identifier of the target unit
     */
    selectTargetUnit(unitId) {
        const unit = this.units[unitId];
        if (!unit) return;

        this.currentTargetUnit = { id: unitId, ...unit };
        document.getElementById('target-unit-search').value = unit.ucumCode;
        this.hideTargetDropdown();
        this.onValueChange();
    }

    /**
     * Handle changes to the numeric input value.
     * Performs conversion if both source and target units are selected.
     */
    onValueChange() {
        this.clearError();

        if (!this.currentSourceUnit || !this.currentTargetUnit) {
            document.getElementById('conversion-result').classList.remove('show');
            return;
        }

        const value = parseFloat(document.getElementById('value').value);
        if (!Number.isFinite(value)) {
            document.getElementById('conversion-result').classList.remove('show');
            return;
        }

        this.performConversion(value);
    }

    /**
     * Convert a value from source unit to target unit using reference unit as intermediate.
     * Formula: reference = (value × multiplier) + offset
     * @param {number} value - The numeric value to convert
     */
    performConversion(value) {
        // Convert from source unit to reference (base) unit
        const referenceValue = this.toReferenceUnit(value, this.currentSourceUnit);

        // Convert from reference unit to target unit
        const targetValue = this.fromReferenceUnit(referenceValue, this.currentTargetUnit);

        // Format result
        const formattedValue = this.formatNumber(targetValue);
        const sourceUCUM = this.currentSourceUnit.ucumCode;
        const targetUCUM = this.currentTargetUnit.ucumCode;

        document.getElementById('result-value').textContent = `${formattedValue} ${targetUCUM}`;
        document.getElementById('result-info').innerHTML = `
            ${value} ${sourceUCUM} = ${formattedValue} ${targetUCUM}
        `;
        document.getElementById('conversion-result').classList.add('show');

        // Save state
        this.saveState();
    }

    /**
     * Convert a value to the reference (base) unit.
     * @param {number} value - The numeric value in the source unit
     * @param {Object} unit - The unit object with multiplier and offset properties
     * @returns {number} Value in reference unit
     */
    toReferenceUnit(value, unit) {
        // reference = (value * multiplier) + offset
        return (value * unit.multiplier) + unit.offset;
    }

    /**
     * Convert a value from the reference (base) unit to a specific unit.
     * @param {number} refValue - The numeric value in the reference unit
     * @param {Object} unit - The unit object with multiplier and offset properties
     * @returns {number} Value in the target unit
     */
    fromReferenceUnit(refValue, unit) {
        // value = (reference - offset) / multiplier
        return (refValue - unit.offset) / unit.multiplier;
    }

    /**
     * Format a number for display with appropriate notation.
     * Uses exponential notation for very large or very small numbers.
     * @param {number} num - The number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        if (!Number.isFinite(num)) return 'N/A';

        // Use exponential notation for very large or very small numbers
        if (Math.abs(num) < 1e-6 || Math.abs(num) > 1e10) {
            return num.toExponential(6);
        }

        // Round to reasonable precision
        const rounded = Math.round(num * 1e10) / 1e10;

        // Remove trailing zeros
        return rounded.toString();
    }

    /**
     * Display an error message to the user.
     * @param {string} message - The error message to display
     */
    showError(message) {
        const errorEl = document.getElementById('error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    /**
     * Clear any displayed error message.
     */
    clearError() {
        document.getElementById('error').classList.remove('show');
    }

    /**
     * Update statistics display with total units and unique base units.
     */
    updateStats() {
        const uniqueBases = new Set(this.unitsArray
            .map(u => u.baseUnit)
            .filter(b => b)
        );

        document.getElementById('stat-total').textContent = this.unitsArray.length;
        document.getElementById('stat-compatible').textContent =
            this.currentSourceUnit ? this.getCompatibleUnits(this.currentSourceUnit).length : 0;
        document.getElementById('stat-unique-bases').textContent = uniqueBases.size;
        document.getElementById('stats').style.display = 'grid';
    }

    /**
     * Update compatible units count in stats display.
     * @param {number} count - The number of compatible units
     */
    updateCompatibleStats(count) {
        document.getElementById('stat-compatible').textContent = count;
    }

    /**
     * Save current converter state to browser sessionStorage.
     * Persists source unit, value, and target unit for session recovery.
     */
    saveState() {
        sessionStorage.setItem('converter-state', JSON.stringify({
            ucumCode: this.currentSourceUnit?.ucumCode || '',
            value: document.getElementById('value').value,
            targetUnitId: this.currentTargetUnit?.id || ''
        }));
    }

    /**
     * Restore converter state from browser sessionStorage if available.
     * Recovers source unit, value, and target unit from previous session.
     */
    loadPersistedValues() {
        const saved = sessionStorage.getItem('converter-state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.ucumCode) {
                    document.getElementById('ucum-code').value = state.ucumCode;
                    this.onSourceUnitChange();
                }
                if (state.value) {
                    document.getElementById('value').value = state.value;
                }
                if (state.targetUnitId) {
                    this.selectTargetUnit(state.targetUnitId);
                }
            } catch (e) {
                console.warn('Failed to restore state:', e);
            }
        }
    }
}

// Initialize converter when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new UnitConverter();
    });
} else {
    new UnitConverter();
}
