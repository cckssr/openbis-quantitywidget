#!/usr/bin/env python3
"""Debug script to check quantity kinds and their reference units."""

from rdflib import Graph, Namespace
from rdflib.namespace import RDF, RDFS

QUDT = Namespace("http://qudt.org/schema/qudt/")
UNIT = Namespace("http://qudt.org/vocab/unit/")
QUANTITY_KIND = Namespace("http://qudt.org/vocab/quantitykind/")

def debug_quantity_kinds():
    print("Loading graphs...")
    graph = Graph()
    graph.parse("ontology/unit.ttl")
    graph.parse("ontology/quantitykind.ttl")
    print(f"Combined graph loaded with {len(graph)} triples")
    
    # Check quantity kinds and their reference units
    reference_by_qk = {}
    qks = list(graph.subjects(RDF.type, QUDT.QuantityKind))
    print(f"Found {len(qks)} quantity kinds")
    
    qks_with_ref = 0
    for qk in qks[:10]:  # Check first 10
        ref = graph.value(qk, QUDT.referenceUnit) or graph.value(qk, QUDT.hasReferenceUnit)
        if ref:
            reference_by_qk[str(qk)] = str(ref)
            qks_with_ref += 1
            print(f"QK: {qk}")
            print(f"  Ref: {ref}")
    
    print(f"Found {qks_with_ref} quantity kinds with reference units")
    print(f"Total reference mappings: {len(reference_by_qk)}")
    
    # Now check units again with reference mapping
    print("\n--- Checking units with reference mapping ---")
    units = list(graph.subjects(RDF.type, QUDT.Unit))
    valid_units = 0
    
    for unit in units[:10]:  # Check first 10
        ucum = graph.value(unit, QUDT.ucumCode)
        if not ucum:
            continue
            
        qk = graph.value(unit, QUDT.hasQuantityKind) or graph.value(unit, QUDT.quantityKind)
        if qk is None:
            continue
            
        # Try to find reference unit
        ref = graph.value(unit, QUDT.referenceUnit) or graph.value(unit, QUDT.hasReferenceUnit)
        if ref is None:
            ref = reference_by_qk.get(str(qk))
        
        if ref is not None:
            valid_units += 1
            print(f"Valid unit: {unit}")
            print(f"  UCUM: {ucum}")
            print(f"  QK: {qk}")
            print(f"  Ref: {ref}")
            print("---")
    
    print(f"Found {valid_units} valid units (with UCUM, QK, and reference)")

if __name__ == "__main__":
    debug_quantity_kinds()