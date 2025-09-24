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
    iri: str
    quantity_kind: str
    reference_unit: str
    multiplier: str
    offset: str
    ucum: str
    label: str
    logarithmic: bool = False

    def to_json(self) -> Dict[str, object]:
        data: Dict[str, object] = {
            "qk": self.quantity_kind,
            "ref": self.reference_unit,
            "m": self.multiplier,
            "b": self.offset,
            "ucum": self.ucum,
            "label": self.label,
        }
        if self.logarithmic:
            data["log"] = True
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
    if normalised == normalised.to_integral():
        return format(normalised.quantize(Decimal(1)), "f")
    return format(normalised, "f")


def _extract_quantity_kind_references(graph: Graph) -> Dict[str, str]:
    reference_by_qk: Dict[str, str] = {}
    for qk in graph.subjects(RDF.type, QUDT.QuantityKind):
        ref = graph.value(qk, QUDT.referenceUnit) or graph.value(qk, QUDT.hasReferenceUnit)
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
    log_indicator = graph.value(subject, QUDT.isLogarithmic) or graph.value(subject, QUDT.hasLogarithmic)
    if log_indicator in truthy_values:
        return True
    return False


def _unit_records(graph: Graph, reference_by_qk: Dict[str, str]) -> List[UnitRecord]:
    records: List[UnitRecord] = []
    for unit in graph.subjects(RDF.type, QUDT.Unit):
        ucum = graph.value(unit, QUDT.ucumCode)
        if not ucum:
            continue
        quantity_kind = graph.value(unit, QUDT.hasQuantityKind) or graph.value(unit, QUDT.quantityKind)
        if quantity_kind is None:
            continue
        quantity_kind_iri = str(quantity_kind)
        reference_unit = graph.value(unit, QUDT.referenceUnit) or graph.value(unit, QUDT.hasReferenceUnit)
        if reference_unit is None:
            reference_unit = reference_by_qk.get(quantity_kind_iri)
        if reference_unit is None:
            continue
        multiplier = graph.value(unit, QUDT.conversionMultiplier) or graph.value(unit, QUDT.hasConversionMultiplier)
        offset = graph.value(unit, QUDT.conversionOffset) or graph.value(unit, QUDT.hasConversionOffset)
        label = _select_label(graph, unit)
        record = UnitRecord(
            iri=str(unit),
            quantity_kind=quantity_kind_iri,
            reference_unit=str(reference_unit),
            multiplier=_literal_to_decimal_string(multiplier, "1"),
            offset=_literal_to_decimal_string(offset, "0"),
            ucum=str(ucum),
            label=label,
            logarithmic=_is_logarithmic(graph, unit),
        )
        records.append(record)
    return records


def convert(args: argparse.Namespace) -> Dict[str, Dict[str, object]]:
    graph = _load_graph(args.units + args.quantity_kinds)
    reference_by_qk = _extract_quantity_kind_references(graph)
    result: Dict[str, Dict[str, object]] = {}
    for record in _unit_records(graph, reference_by_qk):
        if args.skip_logarithmic and record.logarithmic:
            continue
        result[record.iri] = record.to_json()
    if args.sort:
        ordered = dict(sorted(result.items(), key=lambda item: item[0]))
        return ordered
    return result


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate units.ucum.json from QUDT Turtle files.")
    parser.add_argument("--units", nargs="+", required=True, help="Path(s) to QUDT unit ontology Turtle files.")
    parser.add_argument(
        "--quantity-kinds",
        nargs="*",
        default=[],
        help="Optional path(s) to QUDT quantity kind Turtle files for reference unit lookups.",
    )
    parser.add_argument("--output", required=True, help="Destination file for the generated JSON map.")
    parser.add_argument("--indent", type=int, default=2, help="Indentation level for the output JSON (default: 2).")
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
