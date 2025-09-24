(function (global) {
  'use strict';

  var TEN_BIGINT = 10n;

  function isRational(value) {
    return value && typeof value === 'object' && value.numerator !== undefined && value.denominator !== undefined;
  }

  function pow10BigInt(exponent) {
    if (exponent <= 0) {
      return 1n;
    }
    var base = TEN_BIGINT;
    var result = 1n;
    var power = BigInt(exponent);
    while (power > 0n) {
      if (power % 2n === 1n) {
        result *= base;
      }
      base *= base;
      power /= 2n;
    }
    return result;
  }

  function gcdBigInt(a, b) {
    var x = a < 0n ? -a : a;
    var y = b < 0n ? -b : b;
    while (y !== 0n) {
      var temp = x % y;
      x = y;
      y = temp;
    }
    return x;
  }

  function normalizeRational(rational) {
    if (!rational) {
      return null;
    }
    var numerator = rational.numerator;
    var denominator = rational.denominator;
    if (denominator === 0n) {
      throw new Error('Invalid rational with zero denominator.');
    }
    if (numerator === 0n) {
      return { numerator: 0n, denominator: 1n };
    }
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    var divisor = gcdBigInt(numerator < 0n ? -numerator : numerator, denominator);
    if (divisor > 1n) {
      numerator /= divisor;
      denominator /= divisor;
    }
    return { numerator: numerator, denominator: denominator };
  }

  function parseRational(value) {
    if (value == null || value === '') {
      return null;
    }
    if (isRational(value)) {
      return normalizeRational(value);
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return null;
      }
      if (Object.is(value, 0)) {
        return { numerator: 0n, denominator: 1n };
      }
      return parseRational(String(value));
    }
    var str = String(value).trim();
    if (!str) {
      return null;
    }
    var sign = 1n;
    if (str.charAt(0) === '+') {
      str = str.slice(1);
    } else if (str.charAt(0) === '-') {
      sign = -1n;
      str = str.slice(1);
    }
    if (!str) {
      return null;
    }
    var exponent = 0;
    var fractionIndex = str.indexOf('/');
    if (fractionIndex !== -1) {
      var numeratorStr = str.slice(0, fractionIndex);
      var denominatorStr = str.slice(fractionIndex + 1);
      if (!numeratorStr || !denominatorStr) {
        return null;
      }
      var numeratorRational = parseRational(numeratorStr);
      var denominatorRational = parseRational(denominatorStr);
      if (!numeratorRational || !denominatorRational || denominatorRational.numerator === 0n) {
        return null;
      }
      var fraction = rationalDivide(numeratorRational, denominatorRational);
      if (!fraction) {
        return null;
      }
      if (sign < 0n) {
        return normalizeRational({ numerator: -fraction.numerator, denominator: fraction.denominator });
      }
      return fraction;
    }
    var eIndex = str.toLowerCase().indexOf('e');
    if (eIndex !== -1) {
      exponent = parseInt(str.slice(eIndex + 1), 10);
      if (!Number.isFinite(exponent)) {
        exponent = 0;
      }
      str = str.slice(0, eIndex);
    }
    var decimalIndex = str.indexOf('.');
    var fractionDigits = 0;
    if (decimalIndex !== -1) {
      fractionDigits = str.length - decimalIndex - 1;
      str = str.slice(0, decimalIndex) + str.slice(decimalIndex + 1);
    }
    var digits = str.replace(/^0+/, '');
    if (!digits) {
      return { numerator: 0n, denominator: 1n };
    }
    if (!/^[0-9]+$/.test(digits)) {
      return null;
    }
    var scale = exponent - fractionDigits;
    var numerator = BigInt(digits);
    var denominator = 1n;
    if (scale >= 0) {
      if (scale > 0) {
        numerator *= pow10BigInt(scale);
      }
    } else {
      denominator = pow10BigInt(-scale);
    }
    if (sign < 0n) {
      numerator = -numerator;
    }
    return normalizeRational({ numerator: numerator, denominator: denominator });
  }

  function rationalZero() {
    return { numerator: 0n, denominator: 1n };
  }

  function rationalOne() {
    return { numerator: 1n, denominator: 1n };
  }

  function rationalAdd(a, b) {
    if (!a || a.numerator === undefined) {
      return b ? normalizeRational(b) : null;
    }
    if (!b || b.numerator === undefined) {
      return normalizeRational(a);
    }
    var numerator = a.numerator * b.denominator + b.numerator * a.denominator;
    var denominator = a.denominator * b.denominator;
    return normalizeRational({ numerator: numerator, denominator: denominator });
  }

  function rationalSubtract(a, b) {
    if (!b || b.numerator === undefined) {
      return normalizeRational(a);
    }
    var neg = { numerator: -b.numerator, denominator: b.denominator };
    return rationalAdd(a, neg);
  }

  function rationalMultiply(a, b) {
    if (!a || !b) {
      return null;
    }
    if (a.numerator === 0n || b.numerator === 0n) {
      return rationalZero();
    }
    var numerator = a.numerator * b.numerator;
    var denominator = a.denominator * b.denominator;
    return normalizeRational({ numerator: numerator, denominator: denominator });
  }

  function rationalDivide(a, b) {
    if (!a || !b) {
      return null;
    }
    if (b.numerator === 0n) {
      throw new Error('Division by zero in rational arithmetic.');
    }
    if (a.numerator === 0n) {
      return rationalZero();
    }
    var numerator = a.numerator * b.denominator;
    var denominator = a.denominator * b.numerator;
    return normalizeRational({ numerator: numerator, denominator: denominator });
  }

  function rationalToNumber(rational) {
    if (!rational) {
      return NaN;
    }
    return Number(rational.numerator) / Number(rational.denominator);
  }

  function rationalToString(rational) {
    if (!rational) {
      return '';
    }
    if (rational.numerator === 0n) {
      return '0';
    }
    var numerator = rational.numerator;
    var denominator = rational.denominator;
    var negative = numerator < 0n;
    if (negative) {
      numerator = -numerator;
    }
    var integerPart = numerator / denominator;
    var remainder = numerator % denominator;
    var digits = [];
    var maxDigits = 24;
    for (var guard = 0; guard < maxDigits && remainder !== 0n; guard += 1) {
      remainder *= TEN_BIGINT;
      var digit = remainder / denominator;
      digits.push(digit);
      remainder %= denominator;
    }
    var roundUp = false;
    if (remainder !== 0n) {
      var roundingDigit = (remainder * TEN_BIGINT) / denominator;
      if (roundingDigit >= 5n) {
        roundUp = true;
      }
    }
    if (roundUp && digits.length) {
      var idx = digits.length - 1;
      while (idx >= 0) {
        var val = digits[idx] + 1n;
        if (val >= TEN_BIGINT) {
          digits[idx] = 0n;
          idx -= 1;
        } else {
          digits[idx] = val;
          break;
        }
      }
      if (idx < 0) {
        integerPart += 1n;
        digits = digits.map(function () { return 0n; });
      }
    }
    while (digits.length && digits[digits.length - 1] === 0n) {
      digits.pop();
    }
    var result = integerPart.toString();
    if (digits.length) {
      result += '.' + digits.map(function (d) { return d.toString(); }).join('');
    }
    if (negative && result !== '0') {
      result = '-' + result;
    }
    return result;
  }

  function formatRationalForInput(rational) {
    if (!rational) {
      return '';
    }
    return rationalToString(rational);
  }

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
      var multiplierRational = parseRational(entry.m);
      var offsetRational = parseRational(entry.b);
      var multiplier = Number(entry.m);
      if (!Number.isFinite(multiplier)) {
        multiplier = multiplierRational ? rationalToNumber(multiplierRational) : 1;
      }
      if (!multiplierRational) {
        multiplierRational = rationalOne();
      }
      var offset = Number(entry.b);
      if (!Number.isFinite(offset)) {
        offset = offsetRational ? rationalToNumber(offsetRational) : 0;
      }
      if (!offsetRational) {
        offsetRational = rationalZero();
      }
      var unit = {
        iri: iri,
        qk: entry.qk || null,
        ref: entry.ref || null,
        m: multiplier,
        b: offset,
        mRational: multiplierRational,
        bRational: offsetRational,
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
    if (!unit) {
      return null;
    }
    var rationalValue = parseRational(value);
    if (!rationalValue) {
      return null;
    }
    var product = rationalMultiply(rationalValue, unit.mRational);
    return rationalAdd(product, unit.bRational);
  }

  function convertFromReference(refValue, unit) {
    if (!unit) {
      return null;
    }
    var rationalValue = parseRational(refValue);
    if (!rationalValue) {
      return null;
    }
    var numerator = rationalSubtract(rationalValue, unit.bRational);
    try {
      return rationalDivide(numerator, unit.mRational);
    } catch (err) {
      return null;
    }
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
    var initialRefValueInput = options.hasOwnProperty('initialRefValue') ? options.initialRefValue : 0;
    var initialRefValue = parseRational(initialRefValueInput);
    if (!initialRefValue) {
      initialRefValue = rationalZero();
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
      var rational = parseRational(trimmed);
      if (!rational) {
        inputEl.value = '';
        return null;
      }
      var formatted = formatRationalForInput(rational);
      if (formatted !== trimmed) {
        inputEl.value = formatted;
      }
      return rational;
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
      if (!refValue || !newDisplay) {
        inputEl.value = '';
        showError('Conversion produced an invalid number.');
        return;
      }
      inputEl.value = formatRationalForInput(newDisplay);
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
      if (displayValue) {
        inputEl.value = formatRationalForInput(displayValue);
      } else {
        inputEl.value = '';
      }
      hiddenInput.value = initialRefValue ? rationalToString(initialRefValue) : '';
      state.lastRefValue = initialRefValue;
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
            displayUnitIri: unit.iri,
            valueRefExact: null,
            displayValueExact: null
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
        if (!refValue) {
          showError('Conversion produced an invalid number.');
          return;
        }
        state.lastRefValue = refValue;
        hiddenInput.value = rationalToString(refValue);
        var payload = {
          valueRef: rationalToNumber(refValue),
          refUnitIri: unit.ref,
          qk: unit.qk,
          displayValue: rationalToNumber(numeric),
          displayUCUM: unit.ucum,
          displayUnitIri: unit.iri,
          valueRefExact: rationalToString(refValue),
          displayValueExact: rationalToString(numeric)
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
        var ref = convertToReference(numeric, unit);
        return ref ? rationalToNumber(ref) : null;
      },
      getDisplayValue: function () {
        if (!state.ready || state.destroyed) {
          return null;
        }
        var rational = readDisplayValue();
        return rational ? rationalToNumber(rational) : null;
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
        var rational = parseRational(value);
        if (!rational) {
          inputEl.value = '';
          return;
        }
        inputEl.value = formatRationalForInput(rational);
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
    parseRational: parseRational,
    rationalToString: rationalToString,
    rationalToNumber: rationalToNumber,
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
    var milliAmp = { mRational: internal.parseRational('0.001'), bRational: internal.parseRational('0') };
    var ampere = { mRational: internal.parseRational('1'), bRational: internal.parseRational('0') };
    var refFromMilli = internal.convertToReference('10', milliAmp);
    assert(Math.abs(internal.rationalToNumber(refFromMilli) - 0.01) < 1e-12, 'Converts mA to reference A.');
    var milliFromRef = internal.convertFromReference(refFromMilli, milliAmp);
    assert(Math.abs(internal.rationalToNumber(milliFromRef) - 10) < 1e-12, 'Converts reference back to mA.');
    var fahrenheit = { mRational: internal.parseRational('5/9'), bRational: internal.parseRational('229835/900') };
    var celsius = { mRational: internal.parseRational('1'), bRational: internal.parseRational('273.15') };
    var refK = internal.convertToReference('32', fahrenheit);
    assert(Math.abs(internal.rationalToNumber(refK) - 273.15) < 1e-9, 'Fahrenheit to Kelvin conversion works.');
    var celsiusValue = internal.convertFromReference(refK, celsius);
    assert(Math.abs(internal.rationalToNumber(celsiusValue)) < 1e-9, 'Kelvin to Celsius conversion works.');
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
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.__unitWidgetInternal = internal;
  }
})(typeof window !== 'undefined' ? window : this);
