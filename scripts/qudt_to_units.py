#!/usr/bin/env python3
"""Convert QUDT unit ontology data to the widget JSON format.

This script ingests QUDT Turtle files and produces a JSON file that can be
consumed by the UCUM quantity widget.  It relies on ``rdflib`` to parse the RDF
content.  Install the dependency with ``pip install rdflib`` if it is not
already available.

Example usage::

    python scripts/qudt_to_units.py \
        --units QUDT-units.ttl \
        --quantity-kinds QUDT-quantitykinds.ttl \
        --output units.ucum.json

The script only emits units that expose a UCUM code and have both a quantity
kind and a reference unit.  Multipliers and offsets are normalised to strings to
avoid floating point precision loss when serialising to JSON.

Example output entry::
    "MilliJ-PER-M2": {
        "uri": "http://qudt.org/vocab/unit/MilliJ-PER-M2",
        "ucumCode": "mJ.m-2",
        "label": "Millijoule per Square Metre",
        "quantityKind": [
            "EnergyFluence",
            "EnergyPerArea",
            "RadiantFluence",
            "StrainEnergyReleaseRate"
        ],
        "dimension": "A0E0L0I0M1H0T-2D0",
        "multiplier": 0.001,
        "offset": 0,
        "baseUnit": "KiloGM-SEC2",
        "logarithmic": false
      }
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Dict, Iterable, List, Optional

try:
    from rdflib import Graph, Literal, Namespace, URIRef
    from rdflib.namespace import RDF, RDFS
except ImportError as exc:  # pragma: no cover - guard for missing dependency
    raise SystemExit(
        "rdflib is required to run this script. Install it with 'pip install rdflib'."
    ) from exc

QUDT = Namespace("http://qudt.org/schema/qudt/")
UNIT = Namespace("http://qudt.org/vocab/unit/")
QUANTITY_KIND = Namespace("http://qudt.org/vocab/quantitykind/")


@dataclass
class UnitRecord:
    uri: str  # URI of the unit
    ucum: str  # UCUM code
    label: str  # Human-readable label
    quantity_kinds: List[str]  # Quantity kind identifiers (extracted from IRIs)
    dimension: str  # Dimension vector as a string
    multiplier: str  # Conversion multiplier as a string
    offset: str = "0"  # Conversion offset as a string
    logarithmic: bool = False  # Whether the unit is logarithmic
    base_unit: Optional[str] = None  # Base unit identifier (set in second pass)

    @property
    def identifier(self) -> str:
        """Extract identifier from URI (last segment after '/')."""
        return self.uri.rsplit("/", 1)[-1]

    def is_base_unit(self) -> bool:
        """Check if this unit is a base unit (multiplier=1, offset=0)."""
        return self.multiplier == "1" and self.offset == "0"

    def to_json(self) -> Dict[str, object]:
        data: Dict[str, object] = {
            "uri": self.uri,
            "ucumCode": self.ucum,
            "label": self.label,
            "quantityKind": self.quantity_kinds,
            "dimension": self.dimension,
            "multiplier": (
                float(self.multiplier)
                if "." in self.multiplier or "e" in self.multiplier.lower()
                else int(self.multiplier)
            ),
            "offset": (
                float(self.offset)
                if "." in self.offset or "e" in self.offset.lower()
                else int(self.offset)
            ),
            "baseUnit": self.base_unit,
            "logarithmic": self.logarithmic,
        }
        return data


def _load_graph(paths: Iterable[str]) -> Graph:
    graph = Graph()
    for path in paths:
        graph.parse(path)
    return graph


def _literal_to_decimal_string(literal: Optional[Literal], default: str) -> str:
    if literal is None:
        return default
    text = str(literal)
    try:
        value = Decimal(text)
    except (InvalidOperation, ValueError):
        return text or default
    normalised = value.normalize()
    if normalised == 0:
        return "0"
    # Check if it's an integer (no decimal part)
    try:
        if normalised == normalised.to_integral_value():
            return str(int(normalised))
    except (InvalidOperation, ValueError):
        pass
    return format(normalised, "f")


def _extract_quantity_kind_references(graph: Graph) -> Dict[str, str]:
    reference_by_qk: Dict[str, str] = {}
    for qk in graph.subjects(RDF.type, QUDT.QuantityKind):
        ref = graph.value(qk, QUDT.referenceUnit) or graph.value(
            qk, QUDT.hasReferenceUnit
        )
        if ref is not None:
            reference_by_qk[str(qk)] = str(ref)
    return reference_by_qk


def _select_label(graph: Graph, subject: URIRef) -> str:
    label = ""
    for candidate in graph.objects(subject, RDFS.label):
        if isinstance(candidate, Literal):
            if candidate.language in (None, "en"):
                label = str(candidate)
                if candidate.language == "en":
                    break
    return label or subject.split("/")[-1]


def _is_logarithmic(graph: Graph, subject: URIRef) -> bool:
    truthy_values = {Literal(True), Literal("true"), Literal("1")}
    if (subject, RDF.type, QUDT.LogarithmicUnit) in graph:
        return True
    log_indicator = graph.value(subject, QUDT.isLogarithmic) or graph.value(
        subject, QUDT.hasLogarithmic
    )
    if log_indicator in truthy_values:
        return True
    return False


def _unit_records(graph: Graph, reference_by_qk: Dict[str, str]) -> List[UnitRecord]:
    records: List[UnitRecord] = []
    for unit in graph.subjects(RDF.type, QUDT.Unit):
        ucum = graph.value(unit, QUDT.ucumCode)
        if not ucum:
            continue

        # Collect ALL quantity kinds for this unit
        quantity_kinds: List[str] = []
        for qk in graph.objects(unit, QUDT.hasQuantityKind):
            qk_id = str(qk).rsplit("/", 1)[-1]
            quantity_kinds.append(qk_id)
        # Also check alternative predicate
        for qk in graph.objects(unit, QUDT.quantityKind):
            qk_id = str(qk).rsplit("/", 1)[-1]
            if qk_id not in quantity_kinds:
                quantity_kinds.append(qk_id)

        if not quantity_kinds:
            continue

        multiplier = graph.value(unit, QUDT.conversionMultiplier) or graph.value(
            unit, QUDT.hasConversionMultiplier
        )

        offset = graph.value(unit, QUDT.conversionOffset) or graph.value(
            unit, QUDT.hasConversionOffset
        )

        # Get dimension vector from the graph
        dimension_vector = graph.value(unit, QUDT.hasDimensionVector)
        if dimension_vector:
            # Extract dimension string from URI like "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T-2D0"
            dimension = str(dimension_vector).rsplit("/", 1)[-1]
        else:
            dimension = "A0E0L0I0M0H0T0D0"  # Dimensionless fallback

        label = _select_label(graph, unit)

        record = UnitRecord(
            uri=str(unit),
            quantity_kinds=sorted(quantity_kinds),
            dimension=dimension,
            multiplier=_literal_to_decimal_string(multiplier, "1"),
            offset=_literal_to_decimal_string(offset, "0"),
            ucum=str(ucum),
            label=label,
            logarithmic=_is_logarithmic(graph, unit),
        )
        records.append(record)
    return records


def _find_base_units_by_dimension(records: List[UnitRecord]) -> Dict[str, str]:
    """
    Find base units for each dimension by looking for units with multiplier=1 and offset=0.
    Prefers shorter/simpler unit names (likely SI base units) and non-logarithmic units.
    Returns a mapping from dimension string to base unit identifier.
    """
    base_units: Dict[str, str] = {}
    base_unit_scores: Dict[str, int] = {}  # Lower score = better candidate

    def score_unit(record: UnitRecord) -> int:
        """Score a unit - lower is better for being a base unit."""
        score = 0
        name = record.identifier

        # Penalize logarithmic units heavily
        if record.logarithmic:
            score += 1000

        # Penalize units with "PER" (derived units)
        score += name.count("-PER-") * 50
        score += name.count("PER-") * 50

        # Penalize units with prefixes (Milli, Micro, Kilo, etc.)
        # Exception: KiloGM (kilogram) is the SI base unit for mass
        prefixes = [
            "Milli",
            "Micro",
            "Nano",
            "Pico",
            "Femto",
            "Atto",
            "Centi",
            "Deci",
            "Deca",
            "Hecto",
            "Mega",
            "Giga",
            "Tera",
            "Peta",
        ]
        for prefix in prefixes:
            if prefix in name and not (name == "KiloGM" or name.startswith("KiloGM-")):
                score += 100

        # Penalize DeciB (decibel) units
        if "DeciB" in name:
            score += 500

        # Penalize complex names (more hyphens = more complex)
        score += name.count("-") * 10

        # Prefer shorter names
        score += len(name)

        return score

    for record in records:
        if record.is_base_unit():
            dim = record.dimension
            current_score = score_unit(record)

            if dim not in base_units or current_score < base_unit_scores[dim]:
                base_units[dim] = record.identifier
                base_unit_scores[dim] = current_score

    return base_units


def _assign_base_units(records: List[UnitRecord], base_units: Dict[str, str]) -> None:
    """
    Second pass: assign base_unit to each record based on its dimension.
    Only assigns base_unit if it actually exists in the record list.
    """
    # Build a set of all available unit identifiers for validation
    available_units = {record.identifier for record in records}

    for record in records:
        if record.dimension in base_units:
            base_unit_id = base_units[record.dimension]
            # Only assign if the base unit actually exists in our dataset
            if base_unit_id in available_units:
                record.base_unit = base_unit_id
            else:
                # Base unit not in dataset - check if this record itself is a base unit
                if record.is_base_unit():
                    record.base_unit = record.identifier
                else:
                    record.base_unit = None
        else:
            # No base unit found for this dimension - use own identifier if it's a base unit
            if record.is_base_unit():
                record.base_unit = record.identifier
            else:
                record.base_unit = None


def convert(args: argparse.Namespace) -> Dict[str, Dict[str, object]]:
    graph = _load_graph(args.units + args.quantity_kinds)
    reference_by_qk = _extract_quantity_kind_references(graph)

    # First pass: collect all unit records
    records = _unit_records(graph, reference_by_qk)

    # Second pass: find base units by dimension and assign them
    base_units = _find_base_units_by_dimension(records)
    _assign_base_units(records, base_units)

    # Build result dictionary
    result: Dict[str, Dict[str, object]] = {}
    for record in records:
        if args.skip_logarithmic and record.logarithmic:
            continue
        result[record.identifier] = record.to_json()

    if args.sort:
        ordered = dict(sorted(result.items(), key=lambda item: item[0]))
        return ordered
    return result


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate units.ucum.json from QUDT Turtle files."
    )
    parser.add_argument(
        "--units",
        nargs="+",
        required=True,
        help="Path(s) to QUDT unit ontology Turtle files.",
    )
    parser.add_argument(
        "--quantity-kinds",
        nargs="*",
        default=[],
        help="Optional path(s) to QUDT quantity kind Turtle files for reference unit lookups.",
    )
    parser.add_argument(
        "--output", required=True, help="Destination file for the generated JSON map."
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="Indentation level for the output JSON (default: 2).",
    )
    parser.add_argument(
        "--skip-logarithmic",
        action="store_true",
        help="Exclude units marked as logarithmic (default: include).",
    )
    parser.add_argument(
        "--sort",
        action="store_true",
        help="Sort unit IRIs alphabetically in the resulting JSON for determinism.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    records = convert(args)
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=args.indent, ensure_ascii=False)
        handle.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
