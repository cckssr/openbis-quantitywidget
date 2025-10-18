#!/usr/bin/env python3
"""Debug script to understand why QUDT conversion fails."""

from rdflib import Graph, Namespace
from rdflib.namespace import RDF, RDFS

QUDT = Namespace("http://qudt.org/schema/qudt/")
UNIT = Namespace("http://qudt.org/vocab/unit/")

def debug_graph():
    print("Loading graph...")
    graph = Graph()
    graph.parse("ontology/unit.ttl")
    print(f"Graph loaded with {len(graph)} triples")
    
    # Check for units
    units = list(graph.subjects(RDF.type, QUDT.Unit))
    print(f"Found {len(units)} units")
    
    # Check for units with UCUM codes
    units_with_ucum = []
    for unit in units[:10]:  # Check first 10
        ucum = graph.value(unit, QUDT.ucumCode)
        if ucum:
            units_with_ucum.append((unit, ucum))
            print(f"Unit: {unit}")
            print(f"  UCUM: {ucum}")
            
            # Check quantity kind
            qk = graph.value(unit, QUDT.hasQuantityKind) or graph.value(unit, QUDT.quantityKind)
            print(f"  Quantity Kind: {qk}")
            
            # Check reference unit
            ref = graph.value(unit, QUDT.referenceUnit) or graph.value(unit, QUDT.hasReferenceUnit)
            print(f"  Reference Unit: {ref}")
            
            # Check multiplier
            mult = graph.value(unit, QUDT.conversionMultiplier) or graph.value(unit, QUDT.hasConversionMultiplier)
            print(f"  Multiplier: {mult}")
            
            print("---")
    
    print(f"Found {len(units_with_ucum)} units with UCUM codes")

if __name__ == "__main__":
    debug_graph()