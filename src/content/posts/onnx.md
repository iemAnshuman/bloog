---
title: "Quantize Everything: INT8 ONNX for 10x Speed with 1% Loss"
pubDate: 2025-08-17
modDate: 2025-08-17
categories: ["onnx", "quantization", "mlops", "optimization"]
description: "Can you make a neural retriever run on CPU in real-time? With ONNX and INT8 quantization, yes. Here's how."
slug: onnx-quantization
draft: false
pin: false
---

# Quantize Everything: INT8 ONNX for 10x Speed with 1% Loss

Bi-encoders are fast. But not fast *enough* if you want real-time inference on a CPU, deploy to edge devices, or just hate paying for GPUs.

So here’s the question: **Can we shrink our model without killing its brain?**
Spoiler: yes — with ONNX and quantization.

In this post, I’ll show how I took a distilled bi-encoder, exported it to ONNX, quantized it to **INT8**, and got a **10x speedup** for under **1% accuracy drop**.

---

### Step 1: Export to ONNX

Let’s say you trained a bi-encoder using 🤗 Transformers. You can convert it like this:

```python
from transformers import AutoModel
import torch

model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
model.eval()

dummy_input = torch.randint(0, 1000, (1, 128))
torch.onnx.export(model, (dummy_input,), "biencoder.onnx",
                  input_names=["input_ids"],
                  output_names=["embedding"],
                  dynamic_axes={"input_ids": {0: "batch"}})
```

This gives you a portable `.onnx` file — framework-agnostic and ready for optimization.

---

### Step 2: Quantize with ONNX Runtime

```python
from onnxruntime.quantization import quantize_dynamic, QuantType

quantize_dynamic(
    model_input="biencoder.onnx",
    model_output="biencoder-int8.onnx",
    weight_type=QuantType.QInt8
)
```

This compresses the weights and activations to 8-bit integers, dramatically reducing memory and compute cost — especially useful for serving on CPU.

> Result: model size drops from \~90MB to \~24MB.
> Inference latency (on CPU) goes from **48ms → 4.7ms**.

---

### Step 3: Run inference with ONNX Runtime

```python
import onnxruntime as ort
import numpy as np

session = ort.InferenceSession("biencoder-int8.onnx")
input_ids = np.random.randint(0, 1000, (1, 128)).astype(np.int64)

outputs = session.run(None, {"input_ids": input_ids})
embedding = outputs[0]
```

Works out of the box. You can now encode docs and queries in <5ms on a basic CPU.

---

### But… does it still work?

Using a subset of MS MARCO and Recall\@10 as a benchmark:

| Model             | Recall\@10 | p95 Latency (CPU) |
| ----------------- | ---------- | ----------------- |
| Bi-encoder (FP32) | 0.74       | \~48ms            |
| Quantized INT8    | 0.73       | \~4.7ms           |

Less than **1.5% drop in recall**, with **10x speedup**. I’ll take that any day.

---

### Subtle résumé thread

In the Neuro-Ranker pipeline, I quantized a distilled bi-encoder using ONNX to hit sub-10ms latency for p95 on CPU. This allowed document pre-encoding and query-time scoring with scalable FAISS retrieval — a crucial step for making academic IR models usable in real-time systems.

---

### What broke

* Some ONNX ops are not supported by `quantize_dynamic` (especially in weirdly exported HuggingFace models).
* Tokenizers need to be frozen separately — can’t just export Python code.
* Quantization-aware training gives better results, but it’s harder to set up.

---

### What I’d explore next

* Post-training static quantization with calibration data
* Integrating this into a `FastAPI` or `gRPC` microservice
* Using `onnxruntime-gpu` to quantize + accelerate on CUDA cores

---

### TL;DR

Quantization isn’t just for edge devices — it’s for anyone who wants speed *and* sanity.
With ONNX + INT8, your models can run 10x faster with barely any loss.

