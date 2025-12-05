/**
 * OpenBISDemoWidget - Widget for OpenBIS integration demonstration.
 * Reuses UnitConverter functionality for unit conversion.
 * Provides editable input with save functionality and display-only view.
 */
class OpenBISDemoWidget {
    /**
     * Initialize the OpenBIS demo widget.
     */
    constructor() {
        this.units = {};
        this.unitsArray = [];
        this.sourceUnit = null;
        this.selectedDisplayUnit = null;
        this.savedValues = [];
        this.savedValueCounter = 0;
        this.init();
    }

    /**
     * Asynchronously load units from JSON file and initialize the widget.
     */
    async init() {
        try {
            const response = await fetch('./ucum.units.json');
            const data = await response.json();

            this.units = data;
            this.unitsArray = Object.entries(data).map(([id, unit]) => ({
                id,
                ...unit
            }));

            // Get source unit from configuration
            const sourceUnitConfigEl = document.getElementById('source-unit-config');
            const sourceUnitCode = sourceUnitConfigEl ? sourceUnitConfigEl.value : 'kg';
            this.setSourceUnit(sourceUnitCode);

            this.setupEventListeners();
        } catch (error) {
            console.error('Error loading units:', error);
            this.showError('Failed to load units data');
        }
    }

    /**
     * Set the source unit based on UCUM code.
     * @param {string} ucumCode - The UCUM code for the source unit
     */
    setSourceUnit(ucumCode) {
        const unit = this.unitsArray.find(u => u.ucumCode === ucumCode);
        if (unit) {
            this.sourceUnit = unit;
            this.selectedDisplayUnit = unit;
            document.getElementById('source-unit-display').textContent = ucumCode;
            document.getElementById('display-unit-search').value = unit.ucumCode;
        } else {
            this.showError(`Source unit "${ucumCode}" not found`);
        }
    }

    /**
     * Attach event listeners to UI elements.
     */
    setupEventListeners() {
        const displaySearch = document.getElementById('display-unit-search');
        const saveBtn = document.getElementById('save-btn');

        // Dropdown events
        displaySearch.addEventListener('focus', () => this.showDropdown('display-unit-dropdown'));
        displaySearch.addEventListener('input', () => this.filterAndShowUnits('display-unit-dropdown', 'display-unit-search'));

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-wrapper')) {
                this.hideAllDropdowns();
            }
        });

        document.getElementById('display-unit-dropdown').addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                const unitId = item.dataset.unitId;
                this.selectDisplayUnit(unitId);
            }
        });

        // Save button
        saveBtn.addEventListener('click', () => this.saveValue());
    }

    /**
     * Get all units compatible with the source unit.
     * Reuses the same logic as UnitConverter.
     * @returns {Array} Array of compatible unit objects
     */
    getCompatibleUnits() {
        if (!this.sourceUnit || !this.sourceUnit.baseUnit) {
            return [];
        }
        return this.unitsArray.filter(u => u.baseUnit === this.sourceUnit.baseUnit);
    }

    /**
     * Show a dropdown with compatible units.
     * @param {string} dropdownId - The ID of the dropdown element
     */
    showDropdown(dropdownId) {
        this.filterAndShowUnits(dropdownId, dropdownId.replace('-dropdown', '-search'));
    }

    /**
     * Hide all dropdown menus.
     */
    hideAllDropdowns() {
        document.querySelectorAll('.dropdown-list, .saved-dropdown-list').forEach(el => {
            el.classList.remove('show');
        });
    }

    /**
     * Render dropdown items HTML from a list of units.
     * @param {Array} units - Array of unit objects to render
     * @returns {string} HTML string for dropdown items
     */
    renderDropdownItems(units) {
        if (units.length === 0) {
            return '<div class="no-results">No compatible units found</div>';
        }
        return units
            .map(u => `
                <div class="dropdown-item" data-unit-id="${u.id}">
                    <div class="dropdown-item-ucum">${u.ucumCode}</div>
                    <div class="dropdown-item-label">${u.label || u.id}</div>
                </div>
            `)
            .join('');
    }

    /**
     * Filter compatible units by search text.
     * @param {string} searchText - The search text to filter by
     * @returns {Array} Filtered array of compatible units
     */
    filterCompatibleUnits(searchText) {
        const compatible = this.getCompatibleUnits();
        if (!searchText) {
            return compatible;
        }
        const lowerSearch = searchText.toLowerCase();
        return compatible.filter(u =>
            u.ucumCode.toLowerCase().includes(lowerSearch) ||
            (u.label && u.label.toLowerCase().includes(lowerSearch))
        );
    }

    /**
     * Filter and display compatible units in dropdown.
     * @param {string} dropdownId - The ID of the dropdown element
     * @param {string} searchId - The ID of the search input
     */
    filterAndShowUnits(dropdownId, searchId) {
        const searchText = document.getElementById(searchId).value;
        const filtered = this.filterCompatibleUnits(searchText);

        const dropdown = document.getElementById(dropdownId);
        dropdown.innerHTML = this.renderDropdownItems(filtered);
        dropdown.classList.add('show');
    }

    /**
     * Select a display unit from the dropdown.
     * @param {string} unitId - The identifier of the unit
     */
    selectDisplayUnit(unitId) {
        const unit = this.units[unitId];
        if (!unit) return;

        this.selectedDisplayUnit = { id: unitId, ...unit };
        document.getElementById('display-unit-search').value = unit.ucumCode;
        this.hideAllDropdowns();
    }

    /**
     * Convert a value to the reference (base) unit.
     * Reuses the same formula as UnitConverter.
     * @param {number} value - The numeric value in the source unit
     * @param {Object} unit - The unit object
     * @returns {number} Value in reference unit
     */
    toReferenceUnit(value, unit) {
        return (value * unit.multiplier) + unit.offset;
    }

    /**
     * Convert a value from the reference (base) unit to a specific unit.
     * Reuses the same formula as UnitConverter.
     * @param {number} refValue - The value in reference unit
     * @param {Object} unit - The unit object
     * @returns {number} Value in the target unit
     */
    fromReferenceUnit(refValue, unit) {
        return (refValue - unit.offset) / unit.multiplier;
    }

    /**
     * Convert a value between two units.
     * @param {number} value - The value to convert
     * @param {Object} fromUnit - The source unit
     * @param {Object} toUnit - The target unit
     * @returns {number} Converted value
     */
    convertValue(value, fromUnit, toUnit) {
        const refValue = this.toReferenceUnit(value, fromUnit);
        return this.fromReferenceUnit(refValue, toUnit);
    }

    /**
     * Format a number for display.
     * Reuses the same logic as UnitConverter.
     * @param {number} num - The number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        if (!Number.isFinite(num)) return 'N/A';

        if (Math.abs(num) < 1e-6 || Math.abs(num) > 1e10) {
            return num.toExponential(6);
        }

        const rounded = Math.round(num * 1e10) / 1e10;
        return rounded.toString();
    }

    /**
     * Save the current value and create a read-only display.
     */
    saveValue() {
        const valueInput = document.getElementById('input-value');
        const inputValue = parseFloat(valueInput.value);

        if (!Number.isFinite(inputValue)) {
            this.showError('Please enter a valid number');
            return;
        }

        if (!this.selectedDisplayUnit) {
            this.showError('Please select a display unit');
            return;
        }

        // Convert the input value to the source unit for storage
        const storedValue = this.convertValue(
            inputValue,
            this.selectedDisplayUnit,
            this.sourceUnit
        );

        // Create saved value object
        const savedValue = {
            id: ++this.savedValueCounter,
            storedValue: storedValue,
            sourceUnit: this.sourceUnit,
            displayUnit: { ...this.selectedDisplayUnit },
            timestamp: new Date().toLocaleString()
        };

        this.savedValues.push(savedValue);
        this.renderSavedValue(savedValue);

        // Clear input
        valueInput.value = '';
        this.clearError();

        // Show saved section
        document.getElementById('saved-section').style.display = 'block';
    }

    /**
     * Render a saved value card.
     * @param {Object} savedValue - The saved value object
     */
    renderSavedValue(savedValue) {
        const container = document.getElementById('saved-values-container');
        const card = document.createElement('div');
        card.className = 'saved-value-card';
        card.id = `saved-card-${savedValue.id}`;

        const displayValue = this.convertValue(
            savedValue.storedValue,
            savedValue.sourceUnit,
            savedValue.displayUnit
        );

        card.innerHTML = `
            <div class="saved-card-header">
                <span class="saved-card-title">Value #${savedValue.id}</span>
                <span class="saved-card-timestamp">${savedValue.timestamp}</span>
            </div>
            <div class="saved-card-content">
                <div class="saved-value-group">
                    <span class="saved-value-label">Stored Value (${savedValue.sourceUnit.ucumCode})</span>
                    <div class="saved-value-display stored-value" id="stored-display-${savedValue.id}">
                        ${this.formatNumber(savedValue.storedValue)} ${savedValue.sourceUnit.ucumCode}
                    </div>
                </div>
                <div class="saved-value-group">
                    <span class="saved-value-label">Display Unit</span>
                    <div class="saved-dropdown-wrapper">
                        <input
                            type="text"
                            id="saved-unit-search-${savedValue.id}"
                            class="saved-dropdown-search"
                            value="${savedValue.displayUnit.ucumCode}"
                            spellcheck="false"
                            readonly
                        />
                        <div id="saved-unit-dropdown-${savedValue.id}" class="saved-dropdown-list"></div>
                    </div>
                </div>
            </div>
            <div class="saved-card-content" style="margin-top: 15px;">
                <div class="saved-value-group" style="grid-column: span 2;">
                    <span class="saved-value-label">Displayed Value</span>
                    <div class="saved-value-display" id="display-value-${savedValue.id}">
                        ${this.formatNumber(displayValue)} ${savedValue.displayUnit.ucumCode}
                    </div>
                </div>
            </div>
            <div class="saved-conversion-info" id="conversion-info-${savedValue.id}">
                ${this.formatNumber(savedValue.storedValue)} ${savedValue.sourceUnit.ucumCode} = ${this.formatNumber(displayValue)} ${savedValue.displayUnit.ucumCode}
            </div>
        `;

        container.insertBefore(card, container.firstChild);

        // Setup dropdown for this saved card
        this.setupSavedCardDropdown(savedValue.id);
    }

    /**
     * Setup dropdown functionality for a saved card.
     * @param {number} cardId - The ID of the saved card
     */
    setupSavedCardDropdown(cardId) {
        const searchInput = document.getElementById(`saved-unit-search-${cardId}`);
        const dropdown = document.getElementById(`saved-unit-dropdown-${cardId}`);

        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideAllDropdowns();
            this.showSavedCardDropdown(cardId);
        });

        searchInput.addEventListener('focus', () => {
            searchInput.removeAttribute('readonly');
        });

        searchInput.addEventListener('blur', () => {
            searchInput.setAttribute('readonly', 'readonly');
        });

        searchInput.addEventListener('input', () => {
            this.filterSavedCardDropdown(cardId);
        });

        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                const unitId = item.dataset.unitId;
                this.selectSavedCardUnit(cardId, unitId);
            }
        });
    }

    /**
     * Show dropdown for a saved card.
     * @param {number} cardId - The ID of the saved card
     */
    showSavedCardDropdown(cardId) {
        this.filterSavedCardDropdown(cardId);
    }

    /**
     * Filter and show dropdown for a saved card.
     * @param {number} cardId - The ID of the saved card
     */
    filterSavedCardDropdown(cardId) {
        const searchInput = document.getElementById(`saved-unit-search-${cardId}`);
        const dropdown = document.getElementById(`saved-unit-dropdown-${cardId}`);
        const searchText = searchInput.value;
        const filtered = this.filterCompatibleUnits(searchText);

        dropdown.innerHTML = this.renderDropdownItems(filtered);
        dropdown.classList.add('show');
    }

    /**
     * Select a unit for a saved card and update the display.
     * @param {number} cardId - The ID of the saved card
     * @param {string} unitId - The ID of the selected unit
     */
    selectSavedCardUnit(cardId, unitId) {
        const unit = this.units[unitId];
        if (!unit) return;

        const savedValue = this.savedValues.find(sv => sv.id === cardId);
        if (!savedValue) return;

        // Update the saved value's display unit
        savedValue.displayUnit = { id: unitId, ...unit };

        // Update UI
        document.getElementById(`saved-unit-search-${cardId}`).value = unit.ucumCode;

        // Calculate and display converted value
        const displayValue = this.convertValue(
            savedValue.storedValue,
            savedValue.sourceUnit,
            savedValue.displayUnit
        );

        document.getElementById(`display-value-${cardId}`).textContent =
            `${this.formatNumber(displayValue)} ${unit.ucumCode}`;

        document.getElementById(`conversion-info-${cardId}`).textContent =
            `${this.formatNumber(savedValue.storedValue)} ${savedValue.sourceUnit.ucumCode} = ${this.formatNumber(displayValue)} ${unit.ucumCode}`;

        this.hideAllDropdowns();
    }

    /**
     * Display an error message.
     * @param {string} message - The error message
     */
    showError(message) {
        const errorEl = document.getElementById('input-error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    /**
     * Clear the error message.
     */
    clearError() {
        document.getElementById('input-error').classList.remove('show');
    }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new OpenBISDemoWidget();
    });
} else {
    new OpenBISDemoWidget();
}
