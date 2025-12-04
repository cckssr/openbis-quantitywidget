# openbis-quantitywidget

Widget to show and edit quantities with assigned unit.

## Generating `units.ucum.json`

A helper script is available to transform the official QUDT Turtle files into the
`units.ucum.json` format consumed by the widget. The script requires
[`rdflib`](https://rdflib.readthedocs.io/) which can be installed with
`pip install rdflib`.

```bash
python scripts/qudt_to_units.py \
  --units /path/to/QUDT-units.ttl \
  --quantity-kinds /path/to/QUDT-quantitykinds.ttl \
  --sort \
  --output units.ucum.json
```

Use `--skip-logarithmic` when you want to exclude logarithmic units (the widget
filters them out at runtime as well).

## Development

Open `index.html` in a browser to interact with the demo. When altering the unit
map JSON run the simple validation command:

```bash
python -m json.tool units.ucum.json
```
