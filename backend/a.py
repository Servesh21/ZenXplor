
from elasticsearch import Elasticsearch

# Initialize Elasticsearch client
es = Elasticsearch("http://localhost:9200")
es.indices.delete(index="file_index", ignore=[400, 404])  # Delete old index if exists

es.indices.create(index="file_index", body={
    "settings": {
        "analysis": {
            "analyzer": {
                "ngram_analyzer": {
                    "type": "custom",
                    "tokenizer": "ngram_tokenizer",
                    "filter": ["lowercase"]
                }
            },
            "tokenizer": {
                "ngram_tokenizer": {
                    "type": "edge_ngram",
                    "min_gram": 1,
                    "max_gram": 20,
                    "token_chars": ["letter", "digit"]
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "filename": { "type": "text", "analyzer": "ngram_analyzer" },  # Prefix-based search
            "user_id": { "type": "keyword" },
            "filepath": { "type": "text" },
            "is_folder": { "type": "boolean" }
        }
    }
})
print("Elasticsearch index updated for prefix search")
