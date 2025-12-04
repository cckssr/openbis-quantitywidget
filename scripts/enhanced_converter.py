#!/usr/bin/env python3
"""Enhanced QUDT to JSON converter with grouped units by quantity kind."""

import json
from collections import defaultdict
from rdflib import Graph, Namespace, Literal
from rdflib.namespace import RDF, RDFS

QUDT = Namespace("http://qudt.org/schema/qudt/")
UNIT = Namespace("http://qudt.org/vocab/unit/")
QKDV = Namespace("http://qudt.org/vocab/dimensionvector/")


def get_clean_qk_name(qk_uri):
    """Extract clean quantity kind name from URI."""
    return str(qk_uri).rsplit("/", 1)[-1]


def get_clean_unit_name(unit_uri):
    """Extract clean unit name from URI."""
    return str(unit_uri).rsplit("/", 1)[-1]


def convert_qudt_to_grouped_json():
    print("Loading graph...")
    graph = Graph()
    graph.parse("ontology/unit.ttl")
    graph.parse("ontology/quantitykind.ttl")
    graph.parse("ontology/dimensionvector.ttl")
    print(f"Graph loaded with {len(graph)} triples")

    # Group units by quantity kind
    units_by_qk = defaultdict(list)
    qk_info = {}
    units_processed = 0

    for unit in graph.subjects(RDF.type, QUDT.Unit):
        ucum = graph.value(unit, QUDT.ucumCode)
        if not ucum:
            continue

        # Get quantity kind
        qk = graph.value(unit, QUDT.hasQuantityKind) or graph.value(
            unit, QUDT.quantityKind
        )
        if qk is None:
            continue

        # Get label
        label = ""
        for candidate in graph.objects(unit, RDFS.label):
            if isinstance(candidate, Literal):
                if candidate.language in (None, "en"):
                    label = str(candidate)
                    if candidate.language == "en":
                        break
        if not label:
            label = get_clean_unit_name(unit)

        # Get multiplier
        multiplier = graph.value(unit, QUDT.conversionMultiplier) or graph.value(
            unit, QUDT.hasConversionMultiplier
        )
        if multiplier is None:
            multiplier = "1"
        else:
            multiplier = str(multiplier)

        # Get offset
        offset = graph.value(unit, QUDT.conversionOffset) or graph.value(
            unit, QUDT.hasConversionOffset
        )
        if offset is None:
            offset = "0"
        else:
            offset = str(offset)

        # Get quantity kind label
        qk_label = ""
        for candidate in graph.objects(qk, RDFS.label):
            if isinstance(candidate, Literal):
                if candidate.language in (None, "en"):
                    qk_label = str(candidate)
                    if candidate.language == "en":
                        break
        if not qk_label:
            qk_label = get_clean_qk_name(qk)

        qk_key = get_clean_qk_name(qk)
        unit_key = get_clean_unit_name(unit)

        unit_data = {
            "uri": str(unit),
            "ucum": str(ucum),
            "label": label,
            "multiplier": multiplier,
            "offset": offset,
        }

        units_by_qk[qk_key].append(unit_data)

        # Store QK info
        if qk_key not in qk_info:
            qk_info[qk_key] = {"uri": str(qk), "label": qk_label}

        units_processed += 1

        if units_processed <= 10:  # Print first 10 for debugging
            print(f"Processed: {label} ({ucum}) -> {qk_key}")

    print(f"Processed {units_processed} units in {len(units_by_qk)} quantity kinds")

    # Create final structure
    result = {"quantityKinds": {}, "unitsByQuantityKind": {}, "allUnits": {}}

    # Add quantity kind information
    for qk_key, info in qk_info.items():
        result["quantityKinds"][qk_key] = info

    # Add units grouped by quantity kind
    for qk_key, units in units_by_qk.items():
        # Sort units by label
        units.sort(key=lambda x: x["label"])
        result["unitsByQuantityKind"][qk_key] = units

        # Also add to flat structure for easy lookup
        for unit in units:
            unit_key = unit["uri"].split("/")[-1]
            result["allUnits"][unit_key] = {**unit, "quantityKind": qk_key}

    # Save to JSON
    with open("units.ucum.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(
        f"Saved {len(result['allUnits'])} units in {len(result['quantityKinds'])} categories to units.ucum.json"
    )

    # Print some statistics
    print("\nTop 10 quantity kinds by unit count:")
    sorted_qks = sorted(units_by_qk.items(), key=lambda x: len(x[1]), reverse=True)
    for qk_key, units in sorted_qks[:10]:
        print(f"  {qk_key}: {len(units)} units")

    return result


if __name__ == "__main__":
    convert_qudt_to_grouped_json()
