---
title: "Cross-Encoders: When Re-Ranking Is Worth the Watts"
pubDate: 2025-08-13
modDate: 2025-08-13
categories: ["information retrieval", "transformers", "ranking", "experiments"]
description: "Neural re-ranking models can boost search quality — but they cost time, energy, and precision. When are they worth it?"
slug: cross-encoder-ranking
draft: false
pin: false
---

# Cross-Encoders: When Re-Ranking Is Worth the Watts

Recently, I’ve developed a healthy skepticism of anything that claims to “beat BM25.”

Most neural models don’t.

Not because they’re worse — but because **we ask them to do the wrong thing**. Enter the **cross-encoder**: a dense transformer that scores query–document pairs *jointly*. It’s not cheap. It’s not fast. But if you use it correctly — at the right place in the pipeline — it *can* be magic.

This post is a practical look at how and when to use cross-encoders to re-rank candidates retrieved by BM25 or a bi-encoder.

---

### How cross-encoders work (quickly)

Instead of encoding the query and document separately, you do this:

```text
[CLS] query tokens [SEP] document tokens [SEP]
```

And feed the whole sequence into a transformer (like BERT). The output is a *single score* — how relevant is this document to the query?

This is different from bi-encoders, which embed each independently and compare via cosine similarity or dot product.

> Cross-encoders are slower but smarter.
> Bi-encoders are faster but dumber.

---

### Code demo (with 🤗 Transformers)

Let’s re-rank BM25 results using a pretrained model:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

model = AutoModelForSequenceClassification.from_pretrained("cross-encoder/ms-marco-MiniLM-L-6-v2")
tokenizer = AutoTokenizer.from_pretrained("cross-encoder/ms-marco-MiniLM-L-6-v2")

def score(query, doc):
    inputs = tokenizer(query, doc, return_tensors='pt', truncation=True, max_length=512)
    with torch.no_grad():
        logits = model(**inputs).logits
    return logits.item()
```

Now you can take the top-10 from BM25 and re-rank them using this smarter model. It usually boosts metrics like NDCG\@10 or MRR — especially if BM25 retrieved relevant but *poorly ordered* results.

---

### When this helps

* **Ambiguous queries**: Cross-encoders understand context better
* **Synonyms and paraphrases**: “doctor” vs “physician”
* **Short documents**: They can “read” the whole passage and make semantic judgments

---

### When this hurts

* Latency. Every query–doc pair must be jointly scored → 💥 GPU or bust
* Cost. You’re running a transformer per pair, not per query or per doc
* Scale. You can't use this for 10M docs unless you're sitting inside Google

That’s why cross-encoders are usually used as **re-rankers** — not retrievers.

---

### Subtle résumé thread

In my ranking stack (project: Neuro-Ranker), I used cross-encoders to re-rank top-50 candidates retrieved by BM25 or a bi-encoder. That gave a sharp boost to final ranking metrics — but only once I controlled for truncation and query–doc token balance. Most performance came from correctly *feeding the model*, not just using it.

---

### What broke

* Token limits. Long queries or long docs often got cut off silently — and the performance dropped.
* Batch size tuning. Scoring 50 candidates per query is GPU memory intensive; had to optimize for 16–32 batch sizes.
* Early experiments with small models (like DistilBERT) gave surprisingly noisy outputs — the big models really are better here.

---

### What I’d explore next

* Hybrid scoring: 80% CE + 20% BM25 for robustness
* Contrastive distillation: use CE to teach a bi-encoder (coming soon)
* Train my own CE on a small domain-specific corpus

---

### TL;DR

Cross-encoders are great when:

* Your candidate set is small (e.g. 100 or less)
* You care about quality over speed
* You have a good retriever already, and just want to *re-order smartly*

