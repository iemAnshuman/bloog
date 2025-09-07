---
title: "Vector Search Showdown: IVF, PQ, HNSW, and the Trade-Off Triangle"
pubDate: 2025-08-19
modDate: 2025-08-19
categories: ["retrieval", "faiss", "indexing", "scalability"]
description: "You have a few million embeddings. Now what? Time to benchmark vector indexes and face the speed-memory-accuracy triangle."
slug: faiss-tradeoffs
draft: false
pin: false
---

# Vector Search Showdown: IVF, PQ, HNSW, and the Trade-Off Triangle

Once you’ve got a fast encoder (like the distilled, quantized bi-encoder from last post), the next question is: **how do you search millions of embeddings... in under 50ms?**

You could brute-force compute every similarity. But that's boring, slow, and doesn't scale. Instead, you build an *index* — a data structure that helps you find the most relevant vectors quickly.

But there’s no perfect index. You have to trade:

* **Speed**
* **Accuracy (recall)**
* **Memory footprint**

So let’s benchmark the big three FAISS index types — **IVF**, **PQ**, and **HNSW** — and see where they shine.

---

### Setup

Corpus: 100k document embeddings (384-d, normalized)
Query: 1k random embeddings
Similarity: inner product (dot product)
Platform: Mac M2 Pro, 32GB RAM
Library: FAISS v1.7.4, CPU-only

---

### Index Types

#### 1. **Flat (brute force)**

* No approximation. Exact search.
* Slowest, most accurate.
* Baseline to compare against.

```python
index = faiss.IndexFlatIP(384)
```

#### 2. **IVF (Inverted File)**

* Clusters the vector space.
* Only searches inside nearest clusters.
* Needs training.

```python
quantizer = faiss.IndexFlatIP(384)
index = faiss.IndexIVFFlat(quantizer, 384, nlist=100)
index.train(embeddings)
index.add(embeddings)
```

#### 3. **IVF + PQ (Product Quantization)**

* Compresses vectors into bytes.
* Huge memory savings. Lower accuracy.
* Great for edge or limited RAM.

```python
index = faiss.IndexIVFPQ(quantizer, 384, nlist=100, m=16, nbits=8)
```

#### 4. **HNSW (Hierarchical Navigable Small Worlds)**

* Graph-based approximate nearest neighbors.
* No training needed. Super fast.
* Often best for high-recall use cases.

```python
index = faiss.IndexHNSWFlat(384, 32)  # M=32
```

---

### Metrics: The Trade-Off Table

| Index           | Recall\@10 | Query Time (ms) | Memory (MB) |
| --------------- | ---------- | --------------- | ----------- |
| Flat            | 1.00       | 340             | 150         |
| IVF (nlist=100) | 0.88       | 35              | 150         |
| IVF+PQ          | 0.71       | 18              | 18          |
| HNSW (M=32)     | 0.94       | 21              | 160         |

> Note: These are ballpark figures. Performance depends heavily on `nlist`, `m`, `efSearch`, and your embedding quality.

---

### When to use what

* **Flat**: small corpora, research settings, or offline batch evals
* **IVF**: medium corpora where latency matters
* **IVF+PQ**: memory-constrained environments (e.g. mobile)
* **HNSW**: high-speed, high-accuracy production search

---

### Subtle résumé thread

In my Neuro-Ranker project, I deployed the distilled bi-encoder with FAISS-backed retrieval. IVF+PQ handled pre-encoded document search on edge devices, while HNSW served user-facing search on CPU servers. This allowed balancing latency constraints across platforms — from mobile apps to internal dashboards.

---

### What broke

* PQ needs well-clustered embeddings — otherwise, recall tanks hard
* IVF’s performance *tanks* without proper `nprobe` tuning
* HNSW uses a lot of memory — not ideal for low-power hardware

---

### What I’d try next

* GPU-backed FAISS + `IndexIVFPQFastScan` for production
* Hybrid rerank: top-100 from HNSW → cross-encoder
* Use SPLADE for sparse retrieval + combine with dense (a.k.a. hybrid fusion)

---

### TL;DR

No vector search index is perfect. Pick based on:

* How big is your data?
* How fast do you need to be?
* How much precision can you give up?
