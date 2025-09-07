---
title: "Bi-Encoder Distillation: Compressing Brains Without Losing Sense"
pubDate: 2025-08-15
modDate: 2025-08-15
categories: ["retrieval", "distillation", "ranking", "contrastive-learning"]
description: "How to distill a cross-encoder into a fast bi-encoder using hard negatives, contrastive loss, and painful edge cases."
slug: biencoder-distillation
draft: false
pin: false
---

# Bi-Encoder Distillation: Compressing Brains Without Losing Sense

Cross-encoders are great — until you want speed.

In my last post, I walked through how joint encoding of query–document pairs with a transformer gives amazing re-ranking results. But they’re expensive, and you can’t scale them to millions of documents or real-time latency without burning cash and GPUs.

That’s where **bi-encoders** come in. The idea is simple:
Encode the query and the document **separately**, then just take a dot product.

```text
score(query, doc) = ⟨ f(query), g(doc) ⟩
```

But this comes at a cost: the model never sees the interaction between query and document tokens. So how do we get the benefits of the smarter cross-encoder in this faster setup?

We teach the bi-encoder to mimic the cross-encoder.

---

### Step 1: Gather supervision — with a twist

You can’t just fine-tune a bi-encoder with positive samples.
You need **hard negatives** — docs that *look* relevant, but aren’t.

Why?

Because most bi-encoders already get the easy negatives right. The challenge is in ranking a *barely irrelevant* doc *below* a truly relevant one. That’s where cross-encoder supervision helps.

> In my setup, I used the cross-encoder's output as **soft labels** to train the bi-encoder.

---

### Step 2: Contrastive learning (InfoNCE loss)

```python
import torch
import torch.nn.functional as F

def contrastive_loss(query_emb, doc_emb_pos, doc_emb_negs, temperature=0.05):
    # Combine positive and negatives
    docs = torch.cat([doc_emb_pos] + doc_emb_negs, dim=0)
    scores = F.cosine_similarity(query_emb, docs)
    labels = torch.zeros(len(scores)).long()  # only first one is positive
    scores = scores / temperature
    return F.cross_entropy(scores.unsqueeze(0), labels)
```

This loss says: "Make the positive doc more similar to the query than the negatives, by a margin."

You train this over many batches, many hard negatives — and let the model learn where to focus.

---

### Step 3: Evaluate properly

After training, you compare:

* **Recall\@k** — how often does the ground-truth doc show up in the top k?
* **MRR** — mean reciprocal rank (relevance of first correct hit)
* **NDCG** — normalized gain based on true relevance labels

Then benchmark latency:

* Bi-encoder can pre-encode all documents once
* Query is encoded at runtime
* Retrieval is just dot product + sort

---

### Performance snapshot

| Model                | NDCG\@10 | MRR\@10 | Avg Latency             |
| -------------------- | -------- | ------- | ----------------------- |
| BM25                 | 0.41     | 0.28    | \~2ms (CPU)             |
| Cross-Encoder        | 0.52     | 0.38    | \~200ms (GPU)           |
| Bi-Encoder Distilled | 0.49     | 0.36    | \~5ms (GPU or fast CPU) |

> You lose a little precision but gain an order of magnitude in speed. That’s the trade-off.

---

### Subtle résumé thread

In Neuro-Ranker, I distilled a CE trained on MS MARCO into a lightweight bi-encoder using contrastive learning with mined hard negatives. This let me scale retrieval to 100k+ documents while preserving most of the CE’s ranking quality — and hitting p95 latency under 10ms. This setup also became the foundation for a follow-up experiment using FAISS + ANN tricks (coming soon).

---

### What broke

* **Hard negatives weren’t hard enough.** I initially used BM25 negatives, but they were too easy.
* **Token overlap tricks the model.** Without good negatives, the bi-encoder learns keyword matching — and plateaus.
* **Temperature tuning is touchy.** Too low = sharp gradients, unstable loss. Too high = fuzzy learning.

---

### What I’d try next

* Use **triplet mining** with in-batch negatives from the same topic
* Integrate **dense + sparse** scoring (like ColBERT or SPLADE)
* Distill in multiple rounds with curriculum hardness

---

### TL;DR

Bi-encoders are the workhorses of retrieval. Distilling them from cross-encoders lets you keep semantic understanding while scaling to real-world latency.


