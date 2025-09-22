# openbis-quantitywidget

A professional JavaScript widget for managing quantities with units in openBIS laboratory information management systems.

## Features

- **Number input + Unit dropdown** - Clean, intuitive interface
- **Admin-configurable dimensions** - Support for Length, Mass, Volume, Temperature, Time, etc.
- **Auto-conversion to base units** - Backend stores standardized values (meters, kilograms, etc.)
- **Comprehensive unit support** - Metric, Imperial, and scientific units with prefixes
- **Professional styling** - Modern, responsive design with dark mode support
- **Type safety** - Robust error handling and validation

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="src/QuantityWidget.css">
</head>
<body>
    <div id="my-widget"></div>
    
    <script src="https://cdn.skypack.dev/convert"></script>
    <script src="src/QuantityWidget.js"></script>
    <script>
        const widget = new QuantityWidget({
            dimension: 'Length',
            value: 1.5,      // 1.5 meters (base unit)
            unit: 'cm',      // Display in centimeters
            placeholder: 'Enter length',
            onChange: (data) => {
                console.log('Base unit value:', data.value, data.unit);
                console.log('Display value:', data.displayValue, data.displayUnit);
            }
        });
        
        document.getElementById('my-widget').appendChild(widget.getElement());
    </script>
</body>
</html>
```

## API Reference

### Constructor Options

```javascript
new QuantityWidget({
    dimension: 'Length',           // Dimension type (Length, Mass, Volume, etc.)
    value: 0,                     // Initial value in base units
    unit: 'm',                    // Initial display unit
    baseUnit: 'm',                // Base unit for storage (auto-detected)
    placeholder: 'Enter value',   // Input placeholder text
    disabled: false,              // Disable the widget
    onChange: (data) => {}        // Change callback
})
```

### Methods

- `getValue()` - Get current value in base units
- `setValue(baseValue, displayUnit?)` - Set value programmatically
- `setDisabled(disabled)` - Enable/disable widget
- `setDimension(dimension)` - Change dimension and available units
- `getElement()` - Get DOM element for insertion
- `destroy()` - Clean up widget

### Change Event Data

```javascript
{
    value: 1.5,              // Value in base units (for backend storage)
    unit: 'm',               // Base unit
    displayValue: 150,       // Value as displayed to user
    displayUnit: 'cm',       // Unit as displayed to user
    dimension: 'Length'      // Current dimension
}
```

## Supported Dimensions

| Dimension | Base Unit | Available Units |
|-----------|-----------|-----------------|
| Length | m | nm, μm, mm, cm, m, km, in, ft, yd, mi |
| Mass | kg | mg, g, kg, t, oz, lb |
| Volume | l | ml, l, fl-oz, pt, qt, gal |
| Area | m² | mm², cm², m², ha, km², in², ft², ac |
| Temperature | °C | °C, °F, K |
| Time | s | ms, s, min, h, d, week, month, year |
| Pressure | Pa | Pa, kPa, MPa, bar, atm, psi |
| Energy | J | J, kJ, MJ, cal, kcal, Wh, kWh |

## Installation

### NPM

```bash
npm install openbis-quantitywidget
```

### Dependencies

The widget requires the `convert` library for unit conversions:

```bash
npm install convert
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# View demo
open dist/simple-demo.html
```

## Integration with openBIS

### Backend Configuration

1. **Property Type**: Use `REAL` (float) properties to store values in base units
2. **Admin Configuration**: Set the dimension for each property (Length, Mass, etc.)
3. **Base Unit Storage**: All values stored in standardized base units (meters, kilograms, liters, etc.)

### Frontend Integration

```javascript
// Initialize widget for a sample length property
const lengthWidget = new QuantityWidget({
    dimension: 'Length',
    value: sample.properties.length,  // Value from openBIS in base units
    onChange: (data) => {
        // Update the sample property with base unit value
        sample.properties.length = data.value;
        // Optionally save the display preference
        sample.properties.lengthDisplayUnit = data.displayUnit;
    }
});

// Insert into form
document.getElementById('length-field').appendChild(lengthWidget.getElement());
```

### Example openBIS Property Configuration

```javascript
// Property type definition
{
    code: "SAMPLE_LENGTH",
    dataType: "REAL",
    label: "Sample Length",
    description: "Length of the sample in meters (base unit)",
    metadata: {
        dimension: "Length",
        defaultDisplayUnit: "mm"
    }
}
```

## Architecture

- **Backend Storage**: Values always stored in base units (m, kg, l, °C, etc.)
- **Frontend Display**: Users can choose their preferred units
- **Auto-conversion**: Seamless conversion between display and storage units
- **Dimension Filtering**: Admin configures which dimensions are available
- **Unit Validation**: Only valid units for the selected dimension are shown

## Browser Support

- Modern browsers with ES6+ support
- IE11+ (with polyfills)
- Mobile browsers

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Demo

Open `dist/simple-demo.html` in your browser to see the widget in action.
