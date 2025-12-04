#!/usr/bin/env python3
"""Modified QUDT to JSON converter that works without reference units."""

import json
from rdflib import Graph, Namespace, Literal
from rdflib.namespace import RDF, RDFS

QUDT = Namespace("http://qudt.org/schema/qudt/")
UNIT = Namespace("http://qudt.org/vocab/unit/")

def convert_qudt_to_json():
    print("Loading graph...")
    graph = Graph()
    graph.parse("ontology/unit.ttl")
    graph.parse("ontology/quantitykind.ttl")
    print(f"Graph loaded with {len(graph)} triples")
    
    result = {}
    units_processed = 0
    
    for unit in graph.subjects(RDF.type, QUDT.Unit):
        ucum = graph.value(unit, QUDT.ucumCode)
        if not ucum:
            continue
            
        # Get quantity kind
        qk = graph.value(unit, QUDT.hasQuantityKind) or graph.value(unit, QUDT.quantityKind)
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
            label = str(unit).split("/")[-1]
        
        # Get multiplier
        multiplier = graph.value(unit, QUDT.conversionMultiplier) or graph.value(unit, QUDT.hasConversionMultiplier)
        if multiplier is None:
            multiplier = "1"
        else:
            multiplier = str(multiplier)
        
        # Get offset
        offset = graph.value(unit, QUDT.conversionOffset) or graph.value(unit, QUDT.hasConversionOffset)
        if offset is None:
            offset = "0"
        else:
            offset = str(offset)
        
        # Use the unit itself as reference if no explicit reference is found
        reference_unit = str(unit)
        
        unit_data = {
            "qk": str(qk),
            "ref": reference_unit,
            "m": multiplier,
            "b": offset,
            "ucum": str(ucum),
            "label": label
        }
        
        result[str(unit)] = unit_data
        units_processed += 1
        
        if units_processed <= 5:  # Print first 5 for debugging
            print(f"Processed: {label} ({ucum})")
    
    print(f"Processed {units_processed} units")
    
    # Save to JSON
    with open("units.ucum.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"Saved {len(result)} units to units.ucum.json")
    return result

if __name__ == "__main__":
    convert_qudt_to_json()