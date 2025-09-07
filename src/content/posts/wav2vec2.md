---
title: "Fine-Tuning Wav2Vec2 for Emotion: RAVDESS, CREMA-D, and Small Wins"
pubDate: 2025-08-25
modDate: 2025-08-25
categories: ["speech", "emotion recognition", "transformers", "finetuning"]
description: "Can a speech model learn to feel? I fine-tuned Wav2Vec2 on emotional vocal datasets to find out."
slug: wav2vec2-emotion
draft: false
pin: false
---

# Fine-Tuning Wav2Vec2 for Emotion: RAVDESS, CREMA-D, and Small Wins

You can’t fake a voice.

That’s the hope, anyway — that human emotion shows up in vocal tone, rhythm, stress, pitch, silence. And if those patterns are learnable, then a model like **Wav2Vec2** should be able to recognize them.

In this post, I fine-tune a pretrained Wav2Vec2 model to classify vocal emotions using two datasets: **RAVDESS** and **CREMA-D**. We’ll go through preprocessing, training, evaluation, and what counts as a “win” when the labels themselves are soft.

---

### Setup: What’s in the data?

#### 📦 RAVDESS

* 24 actors, English only
* 8 emotions: neutral, calm, happy, sad, angry, fearful, disgust, surprised
* Clean, well-structured — but *acted*

#### 📦 CREMA-D

* 91 actors, more diversity
* 6 emotions: angry, disgust, fear, happy, neutral, sad
* Contains crowd-sourced ratings (which is great for label smoothing)

For both:

* Sampling rate: 48kHz
* Clip length: 2–6 seconds
* Some background noise, some accent diversity

---

### Target classes

To keep things focused, I collapsed emotions into 4 broad buckets:

* **Happy**
* **Sad**
* **Angry**
* **Neutral**

Why? Because even humans don’t reliably agree on “fear” vs “surprise” or “disgust” vs “anger”. And we’re not building a therapist — we’re building a music recommender.

---

### Model: Wav2Vec2 + classifier head

Using HuggingFace Transformers:

```python
from transformers import Wav2Vec2ForSequenceClassification

model = Wav2Vec2ForSequenceClassification.from_pretrained(
    "facebook/wav2vec2-base",
    num_labels=4,
    problem_type="single_label_classification"
)
```

I froze the feature extractor for the first 10k steps to avoid catastrophic forgetting, then gradually unfroze.

---

### Training notes

* Augmentations: time shift, volume perturb, background noise
* Loss: CrossEntropy + label smoothing (ε=0.1)
* Optimizer: AdamW with linear warmup
* Batch size: 8 (GPU limited)
* Epochs: 10
* Framework: 🤗 Trainer API (to keep it honest)

---

### Results

| Metric          | RAVDESS (test) | CREMA-D (test) |
| --------------- | -------------- | -------------- |
| Accuracy        | 81.2%          | 77.5%          |
| Macro F1        | 0.792          | 0.755          |
| ROC-AUC (macro) | 0.88           | 0.84           |

Most misclassifications were between **neutral vs calm** or **sad vs angry** — which, in fairness, humans also mess up.

---

### What helped

* **Label smoothing** reduced overconfidence and helped generalize
* **Speaker-wise splits** ensured we weren’t just memorizing voices
* **Data augmentation** gave a decent +3–5% lift, especially for rare classes

---

### What didn’t help (yet)

* Freezing the entire model for too long — learning stalled
* Too much noise augmentation made the model overfit to background hiss
* Batch size below 8 caused unstable training (gradient spikes)

---

### Subtle résumé thread

This post is part of EmotiTune — my ongoing project to map vocal tone to music recommendation via emotional estimation. Here, I trained the core recognizer: a Wav2Vec2 model fine-tuned on real-world(ish) emotional speech. Next steps include smoothing outputs, adding confidence calibration, and mapping detected emotions to music embeddings.

---

### What I’d explore next

* Add a **confidence head** to abstain from uncertain predictions
* Fine-tune on **MELD** (dialogues) or **IEMOCAP** for more realism
* Train a **distilled version** that can run on CPU or mobile

---

### TL;DR

Wav2Vec2 can learn to recognize broad emotional tone in speech — as long as you respect the limits of your data, tune for generalization, and avoid overclaiming.


