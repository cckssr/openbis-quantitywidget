#!/usr/bin/env python3
"""QUDT to JSON-LD converter."""

import json
from rdflib import Graph

def create_jsonld():
    print("Loading graph...")
    graph = Graph()
    graph.parse("ontology/unit.ttl")
    graph.parse("ontology/quantitykind.ttl")
    
    # Convert to JSON-LD (this preserves the semantic structure)
    jsonld_data = graph.serialize(format='json-ld', indent=2)
    
    # Parse and save
    data = json.loads(jsonld_data)
    
    with open("units.jsonld", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Created JSON-LD file")
    return data

if __name__ == "__main__":
    create_jsonld()