(function (global) {
  'use strict';

  var widgetIdCounter = 0;
  var unitsCache = new Map();

  function loadUnitsMap(url) {
    if (!unitsCache.has(url)) {
      var promise = fetch(url).then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load units map: ' + response.status + ' ' + response.statusText);
        }
        return response.json();
      }).then(function (raw) {
        return processUnitsMap(raw || {});
      }).catch(function (error) {
        unitsCache.delete(url);
        throw error;
      });
      unitsCache.set(url, promise);
    }
    return unitsCache.get(url);
  }

  function processUnitsMap(raw) {
    var units = {};
    var alias = {};
    Object.keys(raw).forEach(function (iri) {
      if (iri.charAt(0) === '_') {
        return;
      }
      var entry = raw[iri];
      if (!entry || typeof entry !== 'object') {
        return;
      }
      if (!entry.ucum) {
        return;
      }
      var multiplier = Number(entry.m);
      var offset = Number(entry.b);
      if (!Number.isFinite(multiplier)) {
        multiplier = 1;
      }
      if (!Number.isFinite(offset)) {
        offset = 0;
      }
      var unit = {
        iri: iri,
        qk: entry.qk || null,
        ref: entry.ref || null,
        m: multiplier,
        b: offset,
        ucum: entry.ucum,
        label: entry.label || entry.ucum,
        log: entry.log === true
      };
      units[iri] = unit;
      if (!alias[unit.ucum]) {
        alias[unit.ucum] = iri;
      }
    });
    return { units: units, alias: alias };
  }

  function parseUnitTokenFromLabel(label) {
    if (!label) {
      return null;
    }
    var trimmed = String(label).trim();
    if (!trimmed) {
      return null;
    }
    var parenMatch = trimmed.match(/\(([^)]+)\)\s*$/);
    if (parenMatch) {
      return parenMatch[1].trim();
    }
    var slashMatch = trimmed.match(/\/\s*([^\s]+)\s*$/);
    if (slashMatch) {
      return slashMatch[1].trim();
    }
    var lastTokenMatch = trimmed.match(/([A-Za-z\[\]\%\.\^\-0-9µμ]+)\s*$/);
    if (lastTokenMatch) {
      return lastTokenMatch[1].trim();
    }
    return null;
  }

  function normalizeToken(token) {
    if (token == null) {
      return '';
    }
    return String(token).trim().replace(/μ/g, 'µ');
  }

  function buildUCUMCandidates(token) {
    var normalized = normalizeToken(token);
    if (!normalized) {
      return [];
    }
    var candidates = [];
    var asciiMicro = normalized.replace(/µ/g, 'u');
    if (asciiMicro && candidates.indexOf(asciiMicro) === -1) {
      candidates.push(asciiMicro);
    }
    if (candidates.indexOf(normalized) === -1) {
      candidates.push(normalized);
    }
    var microFromAscii = asciiMicro.replace(/u(?=[A-Za-z])/g, 'µ');
    if (microFromAscii && candidates.indexOf(microFromAscii) === -1) {
      candidates.push(microFromAscii);
    }
    return candidates;
  }

  function resolveUnitIriFromToken(token, aliasMap, availableMap) {
    if (!token) {
      return null;
    }
    var candidates = buildUCUMCandidates(token);
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (availableMap && Object.prototype.hasOwnProperty.call(availableMap, candidate)) {
        return availableMap[candidate];
      }
      if (!availableMap && aliasMap && Object.prototype.hasOwnProperty.call(aliasMap, candidate)) {
        return aliasMap[candidate];
      }
    }
    return null;
  }

  function convertToReference(value, unit) {
    return value * unit.m + unit.b;
  }

  function convertFromReference(refValue, unit) {
    return (refValue - unit.b) / unit.m;
  }

  function formatNumberForInput(value) {
    return Number.isFinite(value) ? String(value) : '';
  }

  function createUnitFloatWidget(options) {
    if (!options || !options.container) {
      throw new Error('createUnitFloatWidget: container option is required.');
    }

    var container = options.container;
    var labelText = options.label || '';
    var rawToken = parseUnitTokenFromLabel(labelText);
    var normalizedToken = normalizeToken(rawToken);

    container.innerHTML = '';

    var widgetEl = document.createElement('div');
    widgetEl.className = 'unit-float-widget';
    container.appendChild(widgetEl);

    var labelEl = document.createElement('label');
    labelEl.className = 'ufw-label';
    labelEl.textContent = labelText;
    widgetEl.appendChild(labelEl);

    var controlsEl = document.createElement('div');
    controlsEl.className = 'ufw-controls';
    widgetEl.appendChild(controlsEl);

    var loadingEl = document.createElement('span');
    loadingEl.textContent = 'Loading units…';
    controlsEl.appendChild(loadingEl);

    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'data-ref-value';
    widgetEl.appendChild(hiddenInput);

    var errorEl = document.createElement('div');
    errorEl.className = 'ufw-error ufw-hidden';
    widgetEl.appendChild(errorEl);

    var state = {
      destroyed: false,
      ready: false,
      currentUnitIri: null,
      qk: null,
      refUnitIri: null,
      lastRefValue: null,
      readyPromise: null,
      availableByIri: {},
      availableByUCUM: {},
      alias: null,
      units: null
    };

    function showError(message) {
      errorEl.textContent = message;
      errorEl.classList.remove('ufw-hidden');
    }

    function clearError() {
      errorEl.textContent = '';
      if (!errorEl.classList.contains('ufw-hidden')) {
        errorEl.classList.add('ufw-hidden');
      }
    }

    function createDisabledHandle(message) {
      if (loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
      showError(message);
      return {
        getRefValue: function () { return null; },
        getDisplayValue: function () { return null; },
        getDisplayUCUM: function () { return null; },
        setDisplayUnit: function () { throw new Error(message); },
        setDisplayValue: function () { throw new Error(message); },
        destroy: function () {
          if (state.destroyed) {
            return;
          }
          state.destroyed = true;
          if (widgetEl.parentNode) {
            widgetEl.parentNode.removeChild(widgetEl);
          }
        }
      };
    }

    if (!normalizedToken) {
      return createDisabledHandle('Unable to detect UCUM unit token from label.');
    }

    var unitsUrl = options.unitsMapUrl || './units.ucum.json';
    var initialRefValue = options.hasOwnProperty('initialRefValue') ? Number(options.initialRefValue) : 0;
    if (!Number.isFinite(initialRefValue)) {
      initialRefValue = 0;
    }
    var onSave = typeof options.onSave === 'function' ? options.onSave : null;

    var inputEl = null;
    var selectEl = null;
    var saveButtonEl = null;

    function getCurrentUnit() {
      if (!state.currentUnitIri) {
        return null;
      }
      return state.availableByIri[state.currentUnitIri] || null;
    }

    function readDisplayValue() {
      if (!inputEl) {
        return null;
      }
      var raw = inputEl.value;
      if (raw == null) {
        return null;
      }
      var trimmed = String(raw).trim();
      if (!trimmed) {
        return null;
      }
      var numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) {
        inputEl.value = '';
        return null;
      }
      return numeric;
    }

    function changeUnit(newIri) {
      if (!state.ready) {
        return;
      }
      if (!state.availableByIri[newIri]) {
        showError('Unsupported unit for this quantity kind.');
        return;
      }
      var currentUnit = getCurrentUnit();
      var targetUnit = state.availableByIri[newIri];
      if (!targetUnit) {
        return;
      }
      if (currentUnit && (currentUnit.ref !== targetUnit.ref || currentUnit.qk !== targetUnit.qk)) {
        showError('Cannot convert between incompatible units.');
        selectEl.value = currentUnit.iri;
        return;
      }
      var value = readDisplayValue();
      state.currentUnitIri = targetUnit.iri;
      selectEl.value = targetUnit.iri;
      if (value == null || !currentUnit) {
        clearError();
        return;
      }
      var refValue = convertToReference(value, currentUnit);
      var newDisplay = convertFromReference(refValue, targetUnit);
      if (!Number.isFinite(newDisplay)) {
        inputEl.value = '';
        showError('Conversion produced an invalid number.');
        return;
      }
      inputEl.value = formatNumberForInput(newDisplay);
      clearError();
    }

    state.readyPromise = loadUnitsMap(unitsUrl).then(function (data) {
      if (state.destroyed) {
        return null;
      }
      state.units = data.units;
      state.alias = data.alias;
      var baseIri = resolveUnitIriFromToken(normalizedToken, data.alias, null);
      if (!baseIri || !data.units[baseIri]) {
        throw new Error('Base unit "' + normalizedToken + '" is not available in the units map.');
      }
      var baseUnit = data.units[baseIri];
      if (baseUnit.log) {
        throw new Error('Logarithmic units are not supported in this widget.');
      }
      var unitEntries = [];
      Object.keys(data.units).forEach(function (iri) {
        var unit = data.units[iri];
        if (!unit) {
          return;
        }
        if (unit.log) {
          return;
        }
        if (unit.qk === baseUnit.qk && unit.ref === baseUnit.ref) {
          unitEntries.push(unit);
        }
      });
      if (!unitEntries.length) {
        throw new Error('No compatible units found for base unit "' + baseUnit.ucum + '".');
      }
      unitEntries.sort(function (a, b) {
        if (a.iri === baseUnit.ref && b.iri !== baseUnit.ref) {
          return -1;
        }
        if (b.iri === baseUnit.ref && a.iri !== baseUnit.ref) {
          return 1;
        }
        return a.ucum.localeCompare(b.ucum);
      });

      state.availableByIri = {};
      state.availableByUCUM = {};
      unitEntries.forEach(function (unit) {
        state.availableByIri[unit.iri] = unit;
        if (!state.availableByUCUM[unit.ucum]) {
          state.availableByUCUM[unit.ucum] = unit.iri;
        }
      });

      controlsEl.innerHTML = '';

      inputEl = document.createElement('input');
      inputEl.type = 'number';
      inputEl.step = 'any';
      inputEl.autocomplete = 'off';
      var inputId = 'ufw-input-' + (++widgetIdCounter);
      inputEl.id = inputId;
      labelEl.htmlFor = inputId;

      selectEl = document.createElement('select');
      unitEntries.forEach(function (unit) {
        var option = document.createElement('option');
        option.value = unit.iri;
        option.textContent = unit.ucum;
        option.setAttribute('data-ucum', unit.ucum);
        selectEl.appendChild(option);
      });

      saveButtonEl = document.createElement('button');
      saveButtonEl.type = 'button';
      saveButtonEl.textContent = 'Save';

      controlsEl.appendChild(inputEl);
      controlsEl.appendChild(selectEl);
      controlsEl.appendChild(saveButtonEl);

      state.currentUnitIri = baseIri;
      state.qk = baseUnit.qk;
      state.refUnitIri = baseUnit.ref;

      var displayValue = convertFromReference(initialRefValue, baseUnit);
      if (Number.isFinite(displayValue)) {
        inputEl.value = formatNumberForInput(displayValue);
      } else {
        inputEl.value = '';
      }
      hiddenInput.value = Number.isFinite(initialRefValue) ? String(initialRefValue) : '';
      state.lastRefValue = Number.isFinite(initialRefValue) ? initialRefValue : null;
      selectEl.value = baseIri;

      var onSelectChange = function () {
        changeUnit(selectEl.value);
      };
      var onInputChange = function () {
        readDisplayValue();
      };
      var onSaveClick = function () {
        var unit = getCurrentUnit();
        if (!unit) {
          showError('No unit selected.');
          return;
        }
        var numeric = readDisplayValue();
        if (numeric == null) {
          hiddenInput.value = '';
          state.lastRefValue = null;
          var emptyPayload = {
            valueRef: null,
            refUnitIri: unit.ref,
            qk: unit.qk,
            displayValue: null,
            displayUCUM: unit.ucum,
            displayUnitIri: unit.iri
          };
          var emptyEvent = new CustomEvent('unitFloatSave', {
            detail: emptyPayload,
            bubbles: true
          });
          container.dispatchEvent(emptyEvent);
          if (onSave) {
            onSave(emptyPayload);
          }
          clearError();
          return;
        }
        var refValue = convertToReference(numeric, unit);
        if (!Number.isFinite(refValue)) {
          showError('Conversion produced an invalid number.');
          return;
        }
        state.lastRefValue = refValue;
        hiddenInput.value = String(refValue);
        var payload = {
          valueRef: refValue,
          refUnitIri: unit.ref,
          qk: unit.qk,
          displayValue: numeric,
          displayUCUM: unit.ucum,
          displayUnitIri: unit.iri
        };
        var event = new CustomEvent('unitFloatSave', {
          detail: payload,
          bubbles: true
        });
        container.dispatchEvent(event);
        if (onSave) {
          onSave(payload);
        }
        clearError();
      };

      selectEl.addEventListener('change', onSelectChange);
      inputEl.addEventListener('change', onInputChange);
      saveButtonEl.addEventListener('click', onSaveClick);

      state.cleanup = function () {
        if (selectEl) {
          selectEl.removeEventListener('change', onSelectChange);
        }
        if (inputEl) {
          inputEl.removeEventListener('change', onInputChange);
        }
        if (saveButtonEl) {
          saveButtonEl.removeEventListener('click', onSaveClick);
        }
      };

      state.ready = true;
      clearError();
      return null;
    }).catch(function (error) {
      if (state.destroyed) {
        return;
      }
      controlsEl.innerHTML = '';
      showError(error.message || 'Failed to initialise unit widget.');
    });

    function ensureReady() {
      if (!state.ready) {
        throw new Error('Unit widget is not ready yet.');
      }
      if (state.destroyed) {
        throw new Error('Unit widget has been destroyed.');
      }
    }

    var handle = {
      getRefValue: function () {
        if (!state.ready || state.destroyed) {
          return null;
        }
        var unit = getCurrentUnit();
        var numeric = readDisplayValue();
        if (!unit || numeric == null) {
          return null;
        }
        return convertToReference(numeric, unit);
      },
      getDisplayValue: function () {
        if (!state.ready || state.destroyed) {
          return null;
        }
        return readDisplayValue();
      },
      getDisplayUCUM: function () {
        if (!state.ready || state.destroyed) {
          return null;
        }
        var unit = getCurrentUnit();
        return unit ? unit.ucum : null;
      },
      setDisplayUnit: function (ucum) {
        ensureReady();
        var iri = resolveUnitIriFromToken(ucum, null, state.availableByUCUM);
        if (!iri) {
          throw new Error('UCUM code not available for this widget: ' + ucum);
        }
        changeUnit(iri);
      },
      setDisplayValue: function (value) {
        ensureReady();
        if (!inputEl) {
          return;
        }
        if (value == null || value === '') {
          inputEl.value = '';
          return;
        }
        var numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          inputEl.value = '';
          return;
        }
        inputEl.value = formatNumberForInput(numeric);
      },
      destroy: function () {
        if (state.destroyed) {
          return;
        }
        state.destroyed = true;
        state.ready = false;
        if (state.cleanup) {
          state.cleanup();
        }
        if (widgetEl.parentNode) {
          widgetEl.parentNode.removeChild(widgetEl);
        }
      }
    };

    return handle;
  }

  var internal = {
    parseUnitTokenFromLabel: parseUnitTokenFromLabel,
    normalizeToken: normalizeToken,
    buildUCUMCandidates: buildUCUMCandidates,
    convertToReference: convertToReference,
    convertFromReference: convertFromReference
  };

  function runSelfTests() {
    var params = new URLSearchParams(window.location.search || '');
    if (params.get('test') !== '1') {
      return;
    }
    var assertions = [];
    function assert(condition, message) {
      if (!condition) {
        throw new Error(message);
      }
      assertions.push(message);
    }
    assert(internal.parseUnitTokenFromLabel('Current (mA)') === 'mA', 'Extracts unit from parenthesis.');
    assert(internal.parseUnitTokenFromLabel('Voltage / V') === 'V', 'Extracts unit after slash.');
    assert(internal.parseUnitTokenFromLabel('Length cm') === 'cm', 'Extracts trailing token.');
    assert(internal.normalizeToken('μA') === 'µA', 'Normalises Greek mu.');
    var candidates = internal.buildUCUMCandidates('µA');
    assert(candidates.indexOf('uA') !== -1, 'Includes ASCII micro candidate.');
    var milliAmp = { m: 0.001, b: 0 };
    var ampere = { m: 1, b: 0 };
    var refFromMilli = internal.convertToReference(10, milliAmp);
    assert(Math.abs(refFromMilli - 0.01) < 1e-12, 'Converts mA to reference A.');
    var milliFromRef = internal.convertFromReference(refFromMilli, milliAmp);
    assert(Math.abs(milliFromRef - 10) < 1e-12, 'Converts reference back to mA.');
    var fahrenheit = { m: 0.5555555555555556, b: 255.37222222222223 };
    var celsius = { m: 1, b: 273.15 };
    var refK = internal.convertToReference(32, fahrenheit);
    assert(Math.abs(refK - 273.15) < 1e-9, 'Fahrenheit to Kelvin conversion works.');
    var celsiusValue = internal.convertFromReference(refK, celsius);
    assert(Math.abs(celsiusValue) < 1e-9, 'Kelvin to Celsius conversion works.');
    console.info('Unit widget self-tests passed:', assertions.length, 'checks');
  }

  if (typeof window !== 'undefined' && window.document) {
    window.addEventListener('DOMContentLoaded', function () {
      try {
        runSelfTests();
      } catch (error) {
        console.error('Unit widget self-tests failed:', error);
      }
    });
  }

  global.createUnitFloatWidget = createUnitFloatWidget;
})(typeof window !== 'undefined' ? window : this);
