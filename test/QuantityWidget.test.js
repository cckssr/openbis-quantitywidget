/**
 * Tests for QuantityWidget
 */

// Mock the convert module for testing
const mockConvert = jest.fn((value, fromUnit) => ({
    to: jest.fn((toUnit) => {
        // Simple mock conversions for testing
        const conversions = {
            'm-cm': value * 100,
            'cm-m': value / 100,
            'kg-g': value * 1000,
            'g-kg': value / 1000,
            'C-F': (value * 9/5) + 32,
            'F-C': (value - 32) * 5/9,
            'l-ml': value * 1000,
            'ml-l': value / 1000
        };
        
        const key = `${fromUnit}-${toUnit}`;
        return conversions[key] || value; // Return original if no conversion
    })
}));

// Set global mock
global.mockConvert = { convert: mockConvert };

// Mock the convert module
jest.mock('convert', () => ({
    convert: mockConvert
}));

const { QuantityWidget } = require('../src/QuantityWidget');

describe('QuantityWidget', () => {
    let widget;
    let onChangeMock;

    beforeEach(() => {
        onChangeMock = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (widget) {
            widget.destroy();
        }
    });

    describe('Constructor and Initialization', () => {
        test('should create widget with default options', () => {
            widget = new QuantityWidget();
            
            expect(widget.options.dimension).toBe('Length');
            expect(widget.options.baseUnit).toBe('m');
            expect(widget.options.value).toBe(0);
            expect(widget.options.unit).toBe('m');
            expect(widget.options.placeholder).toBe('Enter value');
            expect(widget.options.disabled).toBe(false);
        });

        test('should create widget with custom options', () => {
            widget = new QuantityWidget({
                dimension: 'Mass',
                value: 5.5,
                unit: 'g',
                placeholder: 'Enter mass',
                disabled: true,
                onChange: onChangeMock
            });
            
            expect(widget.options.dimension).toBe('Mass');
            expect(widget.options.baseUnit).toBe('kg');
            expect(widget.options.value).toBe(5.5);
            expect(widget.options.unit).toBe('g');
            expect(widget.options.placeholder).toBe('Enter mass');
            expect(widget.options.disabled).toBe(true);
            expect(widget.options.onChange).toBe(onChangeMock);
        });
    });

    describe('Default Base Units', () => {
        test('should return correct base units for each dimension', () => {
            widget = new QuantityWidget();
            
            expect(widget.getDefaultBaseUnit('Length')).toBe('m');
            expect(widget.getDefaultBaseUnit('Mass')).toBe('kg');
            expect(widget.getDefaultBaseUnit('Volume')).toBe('l');
            expect(widget.getDefaultBaseUnit('Temperature')).toBe('C');
            expect(widget.getDefaultBaseUnit('Time')).toBe('s');
            expect(widget.getDefaultBaseUnit('Area')).toBe('m2');
            expect(widget.getDefaultBaseUnit('UnknownDimension')).toBe('m');
        });
    });

    describe('Unit Management', () => {
        test('should return correct units for Length dimension', () => {
            widget = new QuantityWidget({ dimension: 'Length' });
            const units = widget.getUnitsForDimension();
            
            expect(units).toEqual(expect.arrayContaining([
                expect.objectContaining({ value: 'm', label: 'meter (m)' }),
                expect.objectContaining({ value: 'cm', label: 'centimeter (cm)' }),
                expect.objectContaining({ value: 'km', label: 'kilometer (km)' }),
                expect.objectContaining({ value: 'in', label: 'inch (in)' }),
                expect.objectContaining({ value: 'ft', label: 'foot (ft)' })
            ]));
        });

        test('should return correct units for Mass dimension', () => {
            widget = new QuantityWidget({ dimension: 'Mass' });
            const units = widget.getUnitsForDimension();
            
            expect(units).toEqual(expect.arrayContaining([
                expect.objectContaining({ value: 'kg', label: 'kilogram (kg)' }),
                expect.objectContaining({ value: 'g', label: 'gram (g)' }),
                expect.objectContaining({ value: 'lb', label: 'pound (lb)' }),
                expect.objectContaining({ value: 'oz', label: 'ounce (oz)' })
            ]));
        });
    });

    describe('Unit Conversions', () => {
        beforeEach(() => {
            widget = new QuantityWidget({ dimension: 'Length', baseUnit: 'm' });
        });

        test('should convert to base unit correctly', () => {
            // Mock the convert function to return expected values
            mockConvert.mockReturnValue({
                to: jest.fn().mockReturnValue(1) // 100cm = 1m
            });

            const result = widget.convertToBaseUnit(100, 'cm');
            expect(result).toBe(1);
            expect(mockConvert).toHaveBeenCalledWith(100, 'cm');
        });

        test('should convert from base unit correctly', () => {
            mockConvert.mockReturnValue({
                to: jest.fn().mockReturnValue(100) // 1m = 100cm
            });

            const result = widget.convertFromBaseUnit(1, 'cm');
            expect(result).toBe(100);
            expect(mockConvert).toHaveBeenCalledWith(1, 'm');
        });

        test('should return original value when converting to same unit', () => {
            const result = widget.convertToBaseUnit(5, 'm');
            expect(result).toBe(5);
            
            const result2 = widget.convertFromBaseUnit(5, 'm');
            expect(result2).toBe(5);
        });

        test('should handle conversion errors gracefully', () => {
            mockConvert.mockImplementation(() => {
                throw new Error('Conversion failed');
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const result = widget.convertToBaseUnit(100, 'invalid');
            expect(result).toBe(100); // Should return original value
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Value Management', () => {
        beforeEach(() => {
            widget = new QuantityWidget({ 
                dimension: 'Length', 
                onChange: onChangeMock 
            });
            // The widget automatically creates mock elements in test environment
        });

        test('should set value correctly', () => {
            widget.setValue(5.5, 'cm');
            expect(widget.options.value).toBe(5.5);
        });

        test('should get value in base units', () => {
            widget.numberInput.value = '100';
            widget.unitSelect.value = 'cm';
            
            mockConvert.mockReturnValue({
                to: jest.fn().mockReturnValue(1) // 100cm = 1m
            });

            const value = widget.getValue();
            expect(value).toBe(1);
        });
    });

    describe('Widget State Management', () => {
        beforeEach(() => {
            widget = new QuantityWidget();
            // Widget automatically creates mock elements in test environment
        });

        test('should enable/disable widget correctly', () => {
            widget.setDisabled(true);
            expect(widget.options.disabled).toBe(true);
            expect(widget.numberInput.disabled).toBe(true);
            expect(widget.unitSelect.disabled).toBe(true);

            widget.setDisabled(false);
            expect(widget.options.disabled).toBe(false);
            expect(widget.numberInput.disabled).toBe(false);
            expect(widget.unitSelect.disabled).toBe(false);
        });

        test('should change dimension correctly', () => {
            widget.setDimension('Mass');
            expect(widget.options.dimension).toBe('Mass');
            expect(widget.options.baseUnit).toBe('kg');
        });
    });

    describe('Widget Lifecycle', () => {
        test('should render and return DOM element', () => {
            widget = new QuantityWidget();
            const element = widget.getElement();
            expect(element).toBeDefined();
            expect(element.className).toBe('quantity-widget');
        });

        test('should destroy widget cleanly', () => {
            widget = new QuantityWidget();
            const element = widget.getElement();
            
            // Mock parent node
            element.parentNode = {
                removeChild: jest.fn()
            };
            
            widget.destroy();
            expect(element.parentNode.removeChild).toHaveBeenCalledWith(element);
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete workflow: create, set value, get value, change unit', () => {
            widget = new QuantityWidget({
                dimension: 'Length',
                value: 1, // 1 meter
                unit: 'm',
                onChange: onChangeMock
            });

            // Set up mock conversions
            mockConvert.mockReturnValue({
                to: jest.fn().mockReturnValue(100) // 1m = 100cm
            });

            // Set value from base units
            widget.setValueFromBaseUnits(1, 'cm');
            expect(widget.numberInput.value).toBe('100');

            // Change to different value
            widget.numberInput.value = '200';
            widget.unitSelect.value = 'cm';
            
            mockConvert.mockReturnValue({
                to: jest.fn().mockReturnValue(2) // 200cm = 2m
            });

            const valueInBase = widget.getValueInBaseUnits();
            expect(valueInBase).toBe(2);
        });
    });
});

// Test module exports
describe('Module Exports', () => {
    test('should export QuantityWidget class', () => {
        expect(QuantityWidget).toBeDefined();
        expect(typeof QuantityWidget).toBe('function');
    });
});