#!/usr/bin/env python3
"""Compact QUDT to JSON converter for web widgets."""

import json
from collections import defaultdict
from rdflib import Graph, Namespace, Literal
from rdflib.namespace import RDF, RDFS

QUDT = Namespace("http://qudt.org/schema/qudt/")

def create_compact_json():
    print("Loading graph...")
    graph = Graph()
    graph.parse("ontology/unit.ttl")
    graph.parse("ontology/quantitykind.ttl")
    
    # Only include commonly used units and quantity kinds
    common_qks = {
        'Length', 'Mass', 'Time', 'ElectricCurrent', 'Temperature', 
        'Volume', 'Area', 'Velocity', 'Acceleration', 'Force', 
        'Pressure', 'Energy', 'Power', 'Frequency', 'Angle'
    }
    
    units_by_qk = defaultdict(list)
    qk_labels = {}
    
    for unit in graph.subjects(RDF.type, QUDT.Unit):
        ucum = graph.value(unit, QUDT.ucumCode)
        if not ucum:
            continue
            
        qk = graph.value(unit, QUDT.hasQuantityKind) or graph.value(unit, QUDT.quantityKind)
        if qk is None:
            continue
            
        qk_name = str(qk).split("/")[-1]
        
        # Only include common quantity kinds
        if qk_name not in common_qks:
            continue
        
        # Get labels
        unit_label = ""
        for candidate in graph.objects(unit, RDFS.label):
            if isinstance(candidate, Literal) and candidate.language in (None, "en"):
                unit_label = str(candidate)
                break
        if not unit_label:
            unit_label = str(unit).split("/")[-1]
            
        qk_label = ""
        for candidate in graph.objects(qk, RDFS.label):
            if isinstance(candidate, Literal) and candidate.language in (None, "en"):
                qk_label = str(candidate)
                break
        if not qk_label:
            qk_label = qk_name
            
        # Get conversion factors
        multiplier = graph.value(unit, QUDT.conversionMultiplier) or graph.value(unit, QUDT.hasConversionMultiplier)
        multiplier = str(multiplier) if multiplier else "1"
        
        # Compact format: [ucum, label, multiplier]
        units_by_qk[qk_name].append([str(ucum), unit_label, multiplier])
        qk_labels[qk_name] = qk_label
    
    # Create compact structure
    result = {
        "categories": qk_labels,
        "units": {qk: sorted(units, key=lambda x: x[1]) for qk, units in units_by_qk.items()}
    }
    
    # Save compact JSON
    with open("units.compact.json", "w", encoding="utf-8") as f:
        json.dump(result, f, separators=(',', ':'), ensure_ascii=False)
    
    total_units = sum(len(units) for units in result["units"].values())
    print(f"Created compact JSON with {total_units} units in {len(result['categories'])} categories")
    
    return result

if __name__ == "__main__":
    create_compact_json()