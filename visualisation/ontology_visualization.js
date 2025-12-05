/**
 * QUDT Ontology Visualization
 * Interactive D3.js visualization for Units, Quantity Kinds, and Dimension Vectors
 */

// Sample data representing QUDT ontology relationships
const ontologyData = {
    // SI Base Units and Derived Units
    units: [
        // SI Base Units
        { id: "unit:M", label: "Meter", symbol: "m", category: "Length", description: "SI base unit of length" },
        { id: "unit:KiloGM", label: "Kilogram", symbol: "kg", category: "Mass", description: "SI base unit of mass" },
        { id: "unit:SEC", label: "Second", symbol: "s", category: "Time", description: "SI base unit of time" },
        { id: "unit:A", label: "Ampere", symbol: "A", category: "Electric Current", description: "SI base unit of electric current" },
        { id: "unit:K", label: "Kelvin", symbol: "K", category: "Temperature", description: "SI base unit of thermodynamic temperature" },
        { id: "unit:MOL", label: "Mole", symbol: "mol", category: "Amount of Substance", description: "SI base unit of amount of substance" },
        { id: "unit:CD", label: "Candela", symbol: "cd", category: "Luminous Intensity", description: "SI base unit of luminous intensity" },
        
        // Derived Units - Length
        { id: "unit:KiloM", label: "Kilometer", symbol: "km", category: "Length", description: "1000 meters" },
        { id: "unit:CentiM", label: "Centimeter", symbol: "cm", category: "Length", description: "0.01 meters" },
        { id: "unit:MilliM", label: "Millimeter", symbol: "mm", category: "Length", description: "0.001 meters" },
        { id: "unit:MicroM", label: "Micrometer", symbol: "μm", category: "Length", description: "10⁻⁶ meters" },
        { id: "unit:NanoM", label: "Nanometer", symbol: "nm", category: "Length", description: "10⁻⁹ meters" },
        
        // Derived Units - Mass
        { id: "unit:GM", label: "Gram", symbol: "g", category: "Mass", description: "0.001 kilograms" },
        { id: "unit:MilliGM", label: "Milligram", symbol: "mg", category: "Mass", description: "10⁻⁶ kilograms" },
        { id: "unit:MicroGM", label: "Microgram", symbol: "μg", category: "Mass", description: "10⁻⁹ kilograms" },
        { id: "unit:TONNE", label: "Metric Ton", symbol: "t", category: "Mass", description: "1000 kilograms" },
        
        // Derived Units - Time
        { id: "unit:MIN", label: "Minute", symbol: "min", category: "Time", description: "60 seconds" },
        { id: "unit:HR", label: "Hour", symbol: "h", category: "Time", description: "3600 seconds" },
        { id: "unit:DAY", label: "Day", symbol: "d", category: "Time", description: "86400 seconds" },
        { id: "unit:MilliSEC", label: "Millisecond", symbol: "ms", category: "Time", description: "0.001 seconds" },
        
        // Area
        { id: "unit:M2", label: "Square Meter", symbol: "m²", category: "Area", description: "SI derived unit of area" },
        { id: "unit:HA", label: "Hectare", symbol: "ha", category: "Area", description: "10000 square meters" },
        
        // Volume
        { id: "unit:M3", label: "Cubic Meter", symbol: "m³", category: "Volume", description: "SI derived unit of volume" },
        { id: "unit:L", label: "Liter", symbol: "L", category: "Volume", description: "0.001 cubic meters" },
        { id: "unit:MilliL", label: "Milliliter", symbol: "mL", category: "Volume", description: "10⁻⁶ cubic meters" },
        
        // Velocity
        { id: "unit:M-PER-SEC", label: "Meter per Second", symbol: "m/s", category: "Velocity", description: "SI derived unit of velocity" },
        { id: "unit:KiloM-PER-HR", label: "Kilometer per Hour", symbol: "km/h", category: "Velocity", description: "Common unit of speed" },
        
        // Acceleration
        { id: "unit:M-PER-SEC2", label: "Meter per Second Squared", symbol: "m/s²", category: "Acceleration", description: "SI derived unit of acceleration" },
        
        // Force
        { id: "unit:N", label: "Newton", symbol: "N", category: "Force", description: "SI derived unit of force (kg·m/s²)" },
        { id: "unit:KiloN", label: "Kilonewton", symbol: "kN", category: "Force", description: "1000 newtons" },
        
        // Energy
        { id: "unit:J", label: "Joule", symbol: "J", category: "Energy", description: "SI derived unit of energy (N·m)" },
        { id: "unit:KiloJ", label: "Kilojoule", symbol: "kJ", category: "Energy", description: "1000 joules" },
        { id: "unit:CAL", label: "Calorie", symbol: "cal", category: "Energy", description: "≈4.184 joules" },
        { id: "unit:EV", label: "Electronvolt", symbol: "eV", category: "Energy", description: "≈1.602×10⁻¹⁹ joules" },
        
        // Power
        { id: "unit:W", label: "Watt", symbol: "W", category: "Power", description: "SI derived unit of power (J/s)" },
        { id: "unit:KiloW", label: "Kilowatt", symbol: "kW", category: "Power", description: "1000 watts" },
        { id: "unit:HP", label: "Horsepower", symbol: "hp", category: "Power", description: "≈745.7 watts" },
        
        // Pressure
        { id: "unit:PA", label: "Pascal", symbol: "Pa", category: "Pressure", description: "SI derived unit of pressure (N/m²)" },
        { id: "unit:KiloPA", label: "Kilopascal", symbol: "kPa", category: "Pressure", description: "1000 pascals" },
        { id: "unit:BAR", label: "Bar", symbol: "bar", category: "Pressure", description: "100000 pascals" },
        { id: "unit:ATM", label: "Atmosphere", symbol: "atm", category: "Pressure", description: "101325 pascals" },
        
        // Electric
        { id: "unit:V", label: "Volt", symbol: "V", category: "Electric Potential", description: "SI derived unit of voltage" },
        { id: "unit:OHM", label: "Ohm", symbol: "Ω", category: "Electric Resistance", description: "SI derived unit of resistance" },
        { id: "unit:F", label: "Farad", symbol: "F", category: "Capacitance", description: "SI derived unit of capacitance" },
        { id: "unit:C", label: "Coulomb", symbol: "C", category: "Electric Charge", description: "SI derived unit of charge" },
        
        // Frequency
        { id: "unit:HZ", label: "Hertz", symbol: "Hz", category: "Frequency", description: "SI derived unit of frequency (1/s)" },
        { id: "unit:KiloHZ", label: "Kilohertz", symbol: "kHz", category: "Frequency", description: "1000 hertz" },
        { id: "unit:MegaHZ", label: "Megahertz", symbol: "MHz", category: "Frequency", description: "10⁶ hertz" },
        
        // Temperature
        { id: "unit:DEG_C", label: "Degree Celsius", symbol: "°C", category: "Temperature", description: "Celsius temperature scale" },
        { id: "unit:DEG_F", label: "Degree Fahrenheit", symbol: "°F", category: "Temperature", description: "Fahrenheit temperature scale" },
        
        // Angle
        { id: "unit:RAD", label: "Radian", symbol: "rad", category: "Angle", description: "SI derived unit of angle" },
        { id: "unit:DEG", label: "Degree", symbol: "°", category: "Angle", description: "1/360 of a circle" },
        
        // Concentration
        { id: "unit:MOL-PER-L", label: "Molar", symbol: "M", category: "Concentration", description: "Moles per liter" },
        { id: "unit:MOL-PER-M3", label: "Mole per Cubic Meter", symbol: "mol/m³", category: "Concentration", description: "SI unit of concentration" },
    ],

    // Quantity Kinds
    quantityKinds: [
        // Base Quantities
        { id: "qk:Length", label: "Length", description: "The measurement of extent in one dimension", symbol: "L" },
        { id: "qk:Mass", label: "Mass", description: "Measure of the amount of matter", symbol: "M" },
        { id: "qk:Time", label: "Time", description: "Duration of events", symbol: "T" },
        { id: "qk:ElectricCurrent", label: "Electric Current", description: "Flow of electric charge", symbol: "I" },
        { id: "qk:ThermodynamicTemperature", label: "Thermodynamic Temperature", description: "Measure of thermal energy", symbol: "Θ" },
        { id: "qk:AmountOfSubstance", label: "Amount of Substance", description: "Number of elementary entities", symbol: "N" },
        { id: "qk:LuminousIntensity", label: "Luminous Intensity", description: "Power emitted by a light source", symbol: "J" },
        
        // Derived Quantities - Mechanical
        { id: "qk:Area", label: "Area", description: "Extent of a 2D surface", broader: "qk:Length" },
        { id: "qk:Volume", label: "Volume", description: "Extent of a 3D region", broader: "qk:Length" },
        { id: "qk:Velocity", label: "Velocity", description: "Rate of change of position", broader: "qk:Length" },
        { id: "qk:Speed", label: "Speed", description: "Magnitude of velocity", broader: "qk:Velocity" },
        { id: "qk:Acceleration", label: "Acceleration", description: "Rate of change of velocity" },
        { id: "qk:Force", label: "Force", description: "Interaction causing acceleration" },
        { id: "qk:Energy", label: "Energy", description: "Capacity to do work" },
        { id: "qk:Power", label: "Power", description: "Rate of energy transfer" },
        { id: "qk:Pressure", label: "Pressure", description: "Force per unit area" },
        { id: "qk:Density", label: "Density", description: "Mass per unit volume" },
        { id: "qk:MassDensity", label: "Mass Density", description: "Mass per unit volume", broader: "qk:Density" },
        { id: "qk:Frequency", label: "Frequency", description: "Number of occurrences per time" },
        { id: "qk:AngularVelocity", label: "Angular Velocity", description: "Rate of angular rotation" },
        { id: "qk:Torque", label: "Torque", description: "Rotational force" },
        { id: "qk:Momentum", label: "Momentum", description: "Product of mass and velocity" },
        { id: "qk:AngularMomentum", label: "Angular Momentum", description: "Rotational momentum" },
        
        // Derived Quantities - Electromagnetic
        { id: "qk:ElectricCharge", label: "Electric Charge", description: "Property of matter" },
        { id: "qk:ElectricPotential", label: "Electric Potential", description: "Potential energy per charge" },
        { id: "qk:ElectricResistance", label: "Electric Resistance", description: "Opposition to current flow" },
        { id: "qk:Capacitance", label: "Capacitance", description: "Ability to store charge" },
        { id: "qk:MagneticFlux", label: "Magnetic Flux", description: "Magnetic field through surface" },
        { id: "qk:MagneticFieldStrength", label: "Magnetic Field Strength", description: "Intensity of magnetic field" },
        
        // Derived Quantities - Thermodynamic
        { id: "qk:Temperature", label: "Temperature", description: "Thermal state", broader: "qk:ThermodynamicTemperature" },
        { id: "qk:HeatCapacity", label: "Heat Capacity", description: "Energy to raise temperature" },
        { id: "qk:Entropy", label: "Entropy", description: "Measure of disorder" },
        { id: "qk:ThermalConductivity", label: "Thermal Conductivity", description: "Heat transfer coefficient" },
        
        // Derived Quantities - Chemical
        { id: "qk:Concentration", label: "Concentration", description: "Amount per unit volume" },
        { id: "qk:MolarMass", label: "Molar Mass", description: "Mass per amount of substance" },
        { id: "qk:MolarVolume", label: "Molar Volume", description: "Volume per amount of substance" },
        
        // Angles
        { id: "qk:Angle", label: "Angle", description: "Figure formed by two rays" },
        { id: "qk:PlaneAngle", label: "Plane Angle", description: "Angle in a plane", broader: "qk:Angle" },
        { id: "qk:SolidAngle", label: "Solid Angle", description: "3D angular span" },
    ],

    // Dimension Vectors
    dimensionVectors: [
        { id: "dv:L", label: "L¹M⁰T⁰I⁰Θ⁰N⁰J⁰", description: "Length", formula: "L" },
        { id: "dv:M", label: "L⁰M¹T⁰I⁰Θ⁰N⁰J⁰", description: "Mass", formula: "M" },
        { id: "dv:T", label: "L⁰M⁰T¹I⁰Θ⁰N⁰J⁰", description: "Time", formula: "T" },
        { id: "dv:I", label: "L⁰M⁰T⁰I¹Θ⁰N⁰J⁰", description: "Electric Current", formula: "I" },
        { id: "dv:Theta", label: "L⁰M⁰T⁰I⁰Θ¹N⁰J⁰", description: "Temperature", formula: "Θ" },
        { id: "dv:N", label: "L⁰M⁰T⁰I⁰Θ⁰N¹J⁰", description: "Amount of Substance", formula: "N" },
        { id: "dv:J", label: "L⁰M⁰T⁰I⁰Θ⁰N⁰J¹", description: "Luminous Intensity", formula: "J" },
        { id: "dv:L2", label: "L²M⁰T⁰I⁰Θ⁰N⁰J⁰", description: "Area", formula: "L²" },
        { id: "dv:L3", label: "L³M⁰T⁰I⁰Θ⁰N⁰J⁰", description: "Volume", formula: "L³" },
        { id: "dv:LT-1", label: "L¹M⁰T⁻¹I⁰Θ⁰N⁰J⁰", description: "Velocity", formula: "L·T⁻¹" },
        { id: "dv:LT-2", label: "L¹M⁰T⁻²I⁰Θ⁰N⁰J⁰", description: "Acceleration", formula: "L·T⁻²" },
        { id: "dv:MLT-2", label: "L¹M¹T⁻²I⁰Θ⁰N⁰J⁰", description: "Force", formula: "M·L·T⁻²" },
        { id: "dv:ML2T-2", label: "L²M¹T⁻²I⁰Θ⁰N⁰J⁰", description: "Energy", formula: "M·L²·T⁻²" },
        { id: "dv:ML2T-3", label: "L²M¹T⁻³I⁰Θ⁰N⁰J⁰", description: "Power", formula: "M·L²·T⁻³" },
        { id: "dv:ML-1T-2", label: "L⁻¹M¹T⁻²I⁰Θ⁰N⁰J⁰", description: "Pressure", formula: "M·L⁻¹·T⁻²" },
        { id: "dv:ML-3", label: "L⁻³M¹T⁰I⁰Θ⁰N⁰J⁰", description: "Density", formula: "M·L⁻³" },
        { id: "dv:T-1", label: "L⁰M⁰T⁻¹I⁰Θ⁰N⁰J⁰", description: "Frequency", formula: "T⁻¹" },
        { id: "dv:IT", label: "L⁰M⁰T¹I¹Θ⁰N⁰J⁰", description: "Electric Charge", formula: "I·T" },
        { id: "dv:ML2T-3I-1", label: "L²M¹T⁻³I⁻¹Θ⁰N⁰J⁰", description: "Electric Potential", formula: "M·L²·T⁻³·I⁻¹" },
        { id: "dv:ML2T-3I-2", label: "L²M¹T⁻³I⁻²Θ⁰N⁰J⁰", description: "Electric Resistance", formula: "M·L²·T⁻³·I⁻²" },
        { id: "dv:NL-3", label: "L⁻³M⁰T⁰I⁰Θ⁰N¹J⁰", description: "Concentration", formula: "N·L⁻³" },
        { id: "dv:D0", label: "L⁰M⁰T⁰I⁰Θ⁰N⁰J⁰", description: "Dimensionless", formula: "1" },
    ],

    // Relationships
    relationships: {
        // Unit to QuantityKind
        unitToQuantityKind: [
            { source: "unit:M", target: "qk:Length" },
            { source: "unit:KiloM", target: "qk:Length" },
            { source: "unit:CentiM", target: "qk:Length" },
            { source: "unit:MilliM", target: "qk:Length" },
            { source: "unit:MicroM", target: "qk:Length" },
            { source: "unit:NanoM", target: "qk:Length" },
            { source: "unit:KiloGM", target: "qk:Mass" },
            { source: "unit:GM", target: "qk:Mass" },
            { source: "unit:MilliGM", target: "qk:Mass" },
            { source: "unit:MicroGM", target: "qk:Mass" },
            { source: "unit:TONNE", target: "qk:Mass" },
            { source: "unit:SEC", target: "qk:Time" },
            { source: "unit:MIN", target: "qk:Time" },
            { source: "unit:HR", target: "qk:Time" },
            { source: "unit:DAY", target: "qk:Time" },
            { source: "unit:MilliSEC", target: "qk:Time" },
            { source: "unit:A", target: "qk:ElectricCurrent" },
            { source: "unit:K", target: "qk:ThermodynamicTemperature" },
            { source: "unit:DEG_C", target: "qk:Temperature" },
            { source: "unit:DEG_F", target: "qk:Temperature" },
            { source: "unit:MOL", target: "qk:AmountOfSubstance" },
            { source: "unit:CD", target: "qk:LuminousIntensity" },
            { source: "unit:M2", target: "qk:Area" },
            { source: "unit:HA", target: "qk:Area" },
            { source: "unit:M3", target: "qk:Volume" },
            { source: "unit:L", target: "qk:Volume" },
            { source: "unit:MilliL", target: "qk:Volume" },
            { source: "unit:M-PER-SEC", target: "qk:Velocity" },
            { source: "unit:KiloM-PER-HR", target: "qk:Velocity" },
            { source: "unit:M-PER-SEC2", target: "qk:Acceleration" },
            { source: "unit:N", target: "qk:Force" },
            { source: "unit:KiloN", target: "qk:Force" },
            { source: "unit:J", target: "qk:Energy" },
            { source: "unit:KiloJ", target: "qk:Energy" },
            { source: "unit:CAL", target: "qk:Energy" },
            { source: "unit:EV", target: "qk:Energy" },
            { source: "unit:W", target: "qk:Power" },
            { source: "unit:KiloW", target: "qk:Power" },
            { source: "unit:HP", target: "qk:Power" },
            { source: "unit:PA", target: "qk:Pressure" },
            { source: "unit:KiloPA", target: "qk:Pressure" },
            { source: "unit:BAR", target: "qk:Pressure" },
            { source: "unit:ATM", target: "qk:Pressure" },
            { source: "unit:V", target: "qk:ElectricPotential" },
            { source: "unit:OHM", target: "qk:ElectricResistance" },
            { source: "unit:F", target: "qk:Capacitance" },
            { source: "unit:C", target: "qk:ElectricCharge" },
            { source: "unit:HZ", target: "qk:Frequency" },
            { source: "unit:KiloHZ", target: "qk:Frequency" },
            { source: "unit:MegaHZ", target: "qk:Frequency" },
            { source: "unit:RAD", target: "qk:PlaneAngle" },
            { source: "unit:DEG", target: "qk:PlaneAngle" },
            { source: "unit:MOL-PER-L", target: "qk:Concentration" },
            { source: "unit:MOL-PER-M3", target: "qk:Concentration" },
        ],
        // QuantityKind to DimensionVector
        quantityKindToDimension: [
            { source: "qk:Length", target: "dv:L" },
            { source: "qk:Mass", target: "dv:M" },
            { source: "qk:Time", target: "dv:T" },
            { source: "qk:ElectricCurrent", target: "dv:I" },
            { source: "qk:ThermodynamicTemperature", target: "dv:Theta" },
            { source: "qk:AmountOfSubstance", target: "dv:N" },
            { source: "qk:LuminousIntensity", target: "dv:J" },
            { source: "qk:Area", target: "dv:L2" },
            { source: "qk:Volume", target: "dv:L3" },
            { source: "qk:Velocity", target: "dv:LT-1" },
            { source: "qk:Speed", target: "dv:LT-1" },
            { source: "qk:Acceleration", target: "dv:LT-2" },
            { source: "qk:Force", target: "dv:MLT-2" },
            { source: "qk:Energy", target: "dv:ML2T-2" },
            { source: "qk:Power", target: "dv:ML2T-3" },
            { source: "qk:Pressure", target: "dv:ML-1T-2" },
            { source: "qk:Density", target: "dv:ML-3" },
            { source: "qk:MassDensity", target: "dv:ML-3" },
            { source: "qk:Frequency", target: "dv:T-1" },
            { source: "qk:ElectricCharge", target: "dv:IT" },
            { source: "qk:ElectricPotential", target: "dv:ML2T-3I-1" },
            { source: "qk:ElectricResistance", target: "dv:ML2T-3I-2" },
            { source: "qk:Concentration", target: "dv:NL-3" },
            { source: "qk:Angle", target: "dv:D0" },
            { source: "qk:PlaneAngle", target: "dv:D0" },
            { source: "qk:Temperature", target: "dv:Theta" },
        ],
    }
};

// Color schemes
const colors = {
    unit: "#00d4ff",
    quantitykind: "#7c3aed",
    dimension: "#10b981",
    linkUnitToQK: "#00d4ff",
    linkQKToDim: "#10b981",
    linkBroader: "#f472b6"
};

// Global state
let currentTab = 'network';
let simulation;
let zoom;
let selectedNode = null;

// Initialize visualization
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initControls();
    initNetworkGraph();
    updateStats();
});

// Tab management
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
    
    currentTab = tabId;
    
    // Initialize the visualization for the selected tab
    switch(tabId) {
        case 'network':
            initNetworkGraph();
            break;
        case 'hierarchy':
            initHierarchyTree();
            break;
        case 'sunburst':
            initSunburst();
            break;
        case 'matrix':
            initMatrix();
            break;
    }
}

// Controls
function initControls() {
    const filterSelect = document.getElementById('filter-type');
    const searchInput = document.getElementById('search-input');
    const zoomSlider = document.getElementById('zoom-slider');
    const resetBtn = document.getElementById('reset-view');
    const closeInfoBtn = document.getElementById('close-info');
    
    filterSelect.addEventListener('change', () => {
        applyFilter(filterSelect.value);
    });
    
    searchInput.addEventListener('input', () => {
        applySearch(searchInput.value);
    });
    
    zoomSlider.addEventListener('input', () => {
        if (zoom) {
            const svg = d3.select(`#${currentTab}-svg`);
            svg.call(zoom.scaleTo, parseFloat(zoomSlider.value));
        }
    });
    
    resetBtn.addEventListener('click', resetView);
    closeInfoBtn.addEventListener('click', hideInfoPanel);
}

function applyFilter(type) {
    const svg = d3.select(`#${currentTab}-svg`);
    
    svg.selectAll('.node').each(function(d) {
        const node = d3.select(this);
        if (type === 'all') {
            node.style('opacity', 1);
        } else {
            node.style('opacity', d.type === type ? 1 : 0.15);
        }
    });
    
    svg.selectAll('.link').style('opacity', type === 'all' ? 0.5 : 0.1);
}

function applySearch(query) {
    const svg = d3.select(`#${currentTab}-svg`);
    const lowerQuery = query.toLowerCase();
    
    if (!query) {
        svg.selectAll('.node').style('opacity', 1);
        svg.selectAll('.link').style('opacity', 0.5);
        return;
    }
    
    svg.selectAll('.node').each(function(d) {
        const node = d3.select(this);
        const matches = d.label.toLowerCase().includes(lowerQuery) || 
                       (d.symbol && d.symbol.toLowerCase().includes(lowerQuery));
        node.style('opacity', matches ? 1 : 0.15);
    });
}

function resetView() {
    document.getElementById('filter-type').value = 'all';
    document.getElementById('search-input').value = '';
    document.getElementById('zoom-slider').value = 1;
    
    const svg = d3.select(`#${currentTab}-svg`);
    svg.selectAll('.node').style('opacity', 1);
    svg.selectAll('.link').style('opacity', 0.5);
    
    if (zoom) {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }
    
    hideInfoPanel();
}

// Info Panel
function showInfoPanel(d) {
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('info-title');
    const content = document.getElementById('info-content');
    
    title.textContent = d.label;
    
    let html = '';
    
    // Type badge
    const typeColors = {
        unit: '#00d4ff',
        quantitykind: '#7c3aed',
        dimension: '#10b981'
    };
    html += `<div class="info-section">
        <div class="info-label">Type</div>
        <div class="info-value" style="color: ${typeColors[d.type]}">
            ${d.type.charAt(0).toUpperCase() + d.type.slice(1)}
        </div>
    </div>`;
    
    // Symbol
    if (d.symbol) {
        html += `<div class="info-section">
            <div class="info-label">Symbol</div>
            <div class="info-value symbol">${d.symbol}</div>
        </div>`;
    }
    
    // Formula (for dimensions)
    if (d.formula) {
        html += `<div class="info-section">
            <div class="info-label">Formula</div>
            <div class="info-value symbol">${d.formula}</div>
        </div>`;
    }
    
    // Category
    if (d.category) {
        html += `<div class="info-section">
            <div class="info-label">Category</div>
            <div class="info-value">${d.category}</div>
        </div>`;
    }
    
    // Description
    if (d.description) {
        html += `<div class="info-section">
            <div class="info-label">Description</div>
            <div class="info-value">${d.description}</div>
        </div>`;
    }
    
    // Related entities
    const related = getRelatedEntities(d.id);
    if (related.length > 0) {
        html += `<div class="info-section">
            <div class="info-label">Related Entities</div>
            <ul class="related-list">
                ${related.map(r => `<li onclick="highlightNode('${r.id}')">${r.label} (${r.type})</li>`).join('')}
            </ul>
        </div>`;
    }
    
    content.innerHTML = html;
    panel.classList.add('visible');
}

function hideInfoPanel() {
    document.getElementById('info-panel').classList.remove('visible');
    selectedNode = null;
}

function getRelatedEntities(id) {
    const related = [];
    
    // Check unit to quantitykind relationships
    ontologyData.relationships.unitToQuantityKind.forEach(rel => {
        if (rel.source === id) {
            const qk = ontologyData.quantityKinds.find(q => q.id === rel.target);
            if (qk) related.push({ ...qk, type: 'quantitykind' });
        }
        if (rel.target === id) {
            const unit = ontologyData.units.find(u => u.id === rel.source);
            if (unit) related.push({ ...unit, type: 'unit' });
        }
    });
    
    // Check quantitykind to dimension relationships
    ontologyData.relationships.quantityKindToDimension.forEach(rel => {
        if (rel.source === id) {
            const dim = ontologyData.dimensionVectors.find(d => d.id === rel.target);
            if (dim) related.push({ ...dim, type: 'dimension' });
        }
        if (rel.target === id) {
            const qk = ontologyData.quantityKinds.find(q => q.id === rel.source);
            if (qk) related.push({ ...qk, type: 'quantitykind' });
        }
    });
    
    return related;
}

function highlightNode(id) {
    const svg = d3.select(`#${currentTab}-svg`);
    
    // Reset all nodes
    svg.selectAll('.node').classed('highlighted', false).classed('dimmed', false);
    svg.selectAll('.link').classed('highlighted', false).classed('dimmed', true);
    
    // Highlight selected and related
    const related = getRelatedEntities(id);
    const relatedIds = new Set([id, ...related.map(r => r.id)]);
    
    svg.selectAll('.node').each(function(d) {
        const node = d3.select(this);
        if (relatedIds.has(d.id)) {
            node.classed('highlighted', true);
        } else {
            node.classed('dimmed', true);
        }
    });
    
    svg.selectAll('.link').each(function(d) {
        const link = d3.select(this);
        if (relatedIds.has(d.source.id) && relatedIds.has(d.target.id)) {
            link.classed('highlighted', true).classed('dimmed', false);
        }
    });
}

// Network Graph
function initNetworkGraph() {
    const svg = d3.select('#network-svg');
    svg.selectAll('*').remove();
    
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Create container for zoom
    const container = svg.append('g').attr('class', 'container');
    
    // Setup zoom
    zoom = d3.zoom()
        .scaleExtent([0.2, 3])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
            document.getElementById('zoom-slider').value = event.transform.k;
        });
    
    svg.call(zoom);
    
    // Prepare data
    const nodes = [
        ...ontologyData.units.map(u => ({ ...u, type: 'unit' })),
        ...ontologyData.quantityKinds.map(q => ({ ...q, type: 'quantitykind' })),
        ...ontologyData.dimensionVectors.map(d => ({ ...d, type: 'dimension' }))
    ];
    
    const links = [
        ...ontologyData.relationships.unitToQuantityKind.map(r => ({
            ...r,
            type: 'unitToQK'
        })),
        ...ontologyData.relationships.quantityKindToDimension.map(r => ({
            ...r,
            type: 'qkToDim'
        }))
    ];
    
    // Create simulation
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
    
    // Draw links
    const link = container.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', d => d.type === 'unitToQK' ? colors.linkUnitToQK : colors.linkQKToDim)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.5);
    
    // Draw nodes
    const node = container.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));
    
    // Node circles
    node.append('circle')
        .attr('r', d => {
            switch(d.type) {
                case 'unit': return 12;
                case 'quantitykind': return 16;
                case 'dimension': return 14;
                default: return 10;
            }
        })
        .attr('fill', d => {
            switch(d.type) {
                case 'unit': return colors.unit;
                case 'quantitykind': return colors.quantitykind;
                case 'dimension': return colors.dimension;
                default: return '#999';
            }
        })
        .attr('stroke', 'rgba(255,255,255,0.3)')
        .attr('stroke-width', 2);
    
    // Node labels
    node.append('text')
        .attr('class', 'node-label')
        .attr('dy', d => {
            switch(d.type) {
                case 'unit': return 24;
                case 'quantitykind': return 28;
                case 'dimension': return 26;
                default: return 22;
            }
        })
        .text(d => d.symbol || d.label.substring(0, 8))
        .style('font-size', '9px');
    
    // Node interactions
    node.on('click', (event, d) => {
        event.stopPropagation();
        selectedNode = d;
        showInfoPanel(d);
        highlightNode(d.id);
    });
    
    node.on('mouseover', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', d.type === 'quantitykind' ? 20 : d.type === 'dimension' ? 18 : 16);
    });
    
    node.on('mouseout', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', d.type === 'quantitykind' ? 16 : d.type === 'dimension' ? 14 : 12);
    });
    
    // Click on background to deselect
    svg.on('click', () => {
        hideInfoPanel();
        svg.selectAll('.node').classed('highlighted', false).classed('dimmed', false);
        svg.selectAll('.link').classed('highlighted', false).classed('dimmed', false);
    });
    
    // Update positions
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Hierarchy Tree
function initHierarchyTree() {
    const svg = d3.select('#hierarchy-svg');
    svg.selectAll('*').remove();
    
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };
    
    const container = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Build hierarchy data
    const hierarchyData = {
        name: "QUDT Ontology",
        children: [
            {
                name: "Base Quantities",
                children: [
                    { name: "Length", symbol: "L", children: ontologyData.units.filter(u => u.category === "Length").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Mass", symbol: "M", children: ontologyData.units.filter(u => u.category === "Mass").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Time", symbol: "T", children: ontologyData.units.filter(u => u.category === "Time").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Electric Current", symbol: "I", children: ontologyData.units.filter(u => u.category === "Electric Current").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Temperature", symbol: "Θ", children: ontologyData.units.filter(u => u.category === "Temperature").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Amount of Substance", symbol: "N", children: ontologyData.units.filter(u => u.category === "Amount of Substance").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Luminous Intensity", symbol: "J", children: ontologyData.units.filter(u => u.category === "Luminous Intensity").map(u => ({ name: u.label, symbol: u.symbol })) },
                ]
            },
            {
                name: "Derived Quantities",
                children: [
                    { name: "Area", children: ontologyData.units.filter(u => u.category === "Area").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Volume", children: ontologyData.units.filter(u => u.category === "Volume").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Velocity", children: ontologyData.units.filter(u => u.category === "Velocity").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Force", children: ontologyData.units.filter(u => u.category === "Force").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Energy", children: ontologyData.units.filter(u => u.category === "Energy").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Power", children: ontologyData.units.filter(u => u.category === "Power").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Pressure", children: ontologyData.units.filter(u => u.category === "Pressure").map(u => ({ name: u.label, symbol: u.symbol })) },
                    { name: "Frequency", children: ontologyData.units.filter(u => u.category === "Frequency").map(u => ({ name: u.label, symbol: u.symbol })) },
                ]
            }
        ]
    };
    
    const root = d3.hierarchy(hierarchyData);
    
    const treeLayout = d3.tree()
        .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    
    treeLayout(root);
    
    // Links
    container.selectAll('.tree-link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'tree-link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
    
    // Nodes
    const nodes = container.selectAll('.tree-node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'tree-node')
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    nodes.append('circle')
        .attr('r', d => d.depth === 0 ? 12 : d.depth === 1 ? 10 : d.depth === 2 ? 8 : 6)
        .attr('fill', d => {
            if (d.depth === 0) return '#f472b6';
            if (d.depth === 1) return '#7c3aed';
            if (d.depth === 2) return '#00d4ff';
            return '#10b981';
        });
    
    nodes.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => d.children ? -12 : 12)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.symbol ? `${d.data.name} (${d.data.symbol})` : d.data.name)
        .style('font-size', '10px')
        .style('fill', 'rgba(255,255,255,0.8)');
    
    // Setup zoom
    zoom = d3.zoom()
        .scaleExtent([0.2, 3])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });
    
    svg.call(zoom);
}

// Sunburst Chart
function initSunburst() {
    const svg = d3.select('#sunburst-svg');
    svg.selectAll('*').remove();
    
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const radius = Math.min(width, height) / 2 - 40;
    
    const container = svg.append('g')
        .attr('transform', `translate(${width/2},${height/2})`);
    
    // Build data for sunburst
    const sunburstData = {
        name: "QUDT",
        children: [
            {
                name: "Units",
                children: Array.from(new Set(ontologyData.units.map(u => u.category)))
                    .map(cat => ({
                        name: cat,
                        children: ontologyData.units.filter(u => u.category === cat)
                            .map(u => ({ name: u.label, symbol: u.symbol, value: 1 }))
                    }))
            },
            {
                name: "Quantity Kinds",
                children: ontologyData.quantityKinds.slice(0, 20).map(q => ({
                    name: q.label,
                    value: 1
                }))
            },
            {
                name: "Dimensions",
                children: ontologyData.dimensionVectors.map(d => ({
                    name: d.description,
                    formula: d.formula,
                    value: 1
                }))
            }
        ]
    };
    
    const root = d3.hierarchy(sunburstData)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);
    
    const partition = d3.partition()
        .size([2 * Math.PI, radius]);
    
    partition(root);
    
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(0.005)
        .padRadius(radius / 2)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1 - 1);
    
    const color = d3.scaleOrdinal()
        .domain(['Units', 'Quantity Kinds', 'Dimensions'])
        .range([colors.unit, colors.quantitykind, colors.dimension]);
    
    function getColor(d) {
        while (d.depth > 1) d = d.parent;
        return d.depth === 0 ? '#f472b6' : color(d.data.name);
    }
    
    container.selectAll('path')
        .data(root.descendants().filter(d => d.depth))
        .enter()
        .append('path')
        .attr('class', 'sunburst-arc')
        .attr('fill', d => getColor(d))
        .attr('fill-opacity', d => 0.9 - d.depth * 0.15)
        .attr('d', arc)
        .on('click', (event, d) => {
            // Show info
            const info = {
                label: d.data.name,
                type: d.depth === 1 ? 'category' : d.depth === 2 ? 'subcategory' : 'item',
                symbol: d.data.symbol,
                formula: d.data.formula,
                description: `Depth: ${d.depth}, Value: ${d.value}`
            };
            showInfoPanel(info);
        })
        .append('title')
        .text(d => d.data.name + (d.data.symbol ? ` (${d.data.symbol})` : ''));
    
    // Center label
    container.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '16px')
        .style('fill', 'white')
        .style('font-weight', 'bold')
        .text('QUDT');
}

// Relationship Matrix
function initMatrix() {
    const svg = d3.select('#matrix-svg');
    svg.selectAll('*').remove();
    
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const margin = { top: 100, right: 50, bottom: 50, left: 150 };
    
    const container = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Use subset for matrix (too many entries otherwise)
    const categories = ['Length', 'Mass', 'Time', 'Area', 'Volume', 'Velocity', 'Force', 'Energy', 'Power', 'Pressure', 'Frequency'];
    const dimensionLabels = ['L', 'M', 'T', 'L²', 'L³', 'LT⁻¹', 'MLT⁻²', 'ML²T⁻²', 'ML²T⁻³', 'ML⁻¹T⁻²', 'T⁻¹'];
    
    const matrixData = [];
    categories.forEach((cat, i) => {
        dimensionLabels.forEach((dim, j) => {
            // Check if there's a relationship
            const hasRelation = i === j; // Simplified: diagonal is related
            matrixData.push({
                row: i,
                col: j,
                category: cat,
                dimension: dim,
                value: hasRelation ? 1 : 0
            });
        });
    });
    
    const cellSize = Math.min(
        (width - margin.left - margin.right) / dimensionLabels.length,
        (height - margin.top - margin.bottom) / categories.length,
        40
    );
    
    // Draw cells
    container.selectAll('.matrix-cell')
        .data(matrixData)
        .enter()
        .append('rect')
        .attr('class', 'matrix-cell')
        .attr('x', d => d.col * cellSize)
        .attr('y', d => d.row * cellSize)
        .attr('width', cellSize - 2)
        .attr('height', cellSize - 2)
        .attr('fill', d => d.value ? `rgba(124, 58, 237, ${0.3 + d.value * 0.7})` : 'rgba(255,255,255,0.05)')
        .attr('rx', 4)
        .on('click', (event, d) => {
            showInfoPanel({
                label: `${d.category} ↔ ${d.dimension}`,
                type: 'relationship',
                description: d.value ? 'These are related' : 'No direct relationship'
            });
        });
    
    // Row labels (Categories)
    container.selectAll('.row-label')
        .data(categories)
        .enter()
        .append('text')
        .attr('class', 'matrix-label')
        .attr('x', -10)
        .attr('y', (d, i) => i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .text(d => d);
    
    // Column labels (Dimensions)
    container.selectAll('.col-label')
        .data(dimensionLabels)
        .enter()
        .append('text')
        .attr('class', 'matrix-label')
        .attr('x', (d, i) => i * cellSize + cellSize / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('transform', (d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -10)`)
        .text(d => d);
    
    // Title
    container.append('text')
        .attr('x', (dimensionLabels.length * cellSize) / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', 'rgba(255,255,255,0.8)')
        .text('Quantity Kind to Dimension Relationship Matrix');
    
    // Setup zoom
    zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });
    
    svg.call(zoom);
}

// Update statistics
function updateStats() {
    document.getElementById('stat-units').textContent = ontologyData.units.length;
    document.getElementById('stat-quantitykinds').textContent = ontologyData.quantityKinds.length;
    document.getElementById('stat-dimensions').textContent = ontologyData.dimensionVectors.length;
    
    const totalRelationships = 
        ontologyData.relationships.unitToQuantityKind.length + 
        ontologyData.relationships.quantityKindToDimension.length;
    document.getElementById('stat-relationships').textContent = totalRelationships;
}

// Export function for use in console
window.ontologyVisualization = {
    data: ontologyData,
    switchTab,
    resetView,
    highlightNode
};
