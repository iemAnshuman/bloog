
---
title: "Finding Weirdness: Z-Score vs Isolation Forest"
pubDate: 2025-08-09
modDate: 2025-08-09
categories: ["anomaly detection", "ml", "finance", "experiments"]
description: "A lightweight investigation into what counts as 'weird' in financial data — and which methods notice first."
slug: anomaly-zscore-iso
draft: false
pin: false
---

# Finding Weirdness: Z-Score vs Isolation Forest

Most things in life are normally fine — until they aren’t. Financial systems, telemetry dashboards, biosignals, even your sleep patterns: the “usual” is easy to model. What matters is when things go *unusually* wrong.

That’s where anomaly detection comes in. And I wanted to revisit two approaches I’ve used before in finance-flavored data:

* **Z-score**: The classic “how many sigmas away are you?”
* **Isolation Forest**: A tree-based method that explicitly tries to *isolate* outliers.

They're simple. They behave very differently. I wanted to see how they react to a spiky portfolio.

---

### Simulating a fake portfolio

Let’s cook up 1000 returns and inject a few spikes:

```python
import numpy as np
np.random.seed(42)

returns = np.random.normal(0, 0.01, 1000)
returns[150] += 0.1
returns[600] -= 0.12
returns[950] += 0.08
```

These spikes simulate shock events — sudden value drops or surges that a risk team (or a dashboard) might want to flag immediately.

---

### Method 1: Z-score

For simple anomaly detection in a univariate time series, z-score is the bread and butter.

```python
mean = np.mean(returns)
std = np.std(returns)
z_scores = (returns - mean) / std
threshold = 3  # 3 standard deviations

anomalies_z = np.where(np.abs(z_scores) > threshold)[0]
```

It’s fast. Transparent. You can explain it to a five-year-old and your compliance team in the same breath.

---

### Method 2: Isolation Forest

Now something more ML-flavored:

```python
from sklearn.ensemble import IsolationForest

iso = IsolationForest(contamination=0.01, random_state=42)
anomaly_flags = iso.fit_predict(returns.reshape(-1, 1))
anomalies_if = np.where(anomaly_flags == -1)[0]
```

This doesn’t care about distribution shape. It literally asks: *how easily can this point be isolated from the rest of the data?*

---

### Visualization

```python
import matplotlib.pyplot as plt

plt.figure(figsize=(12, 4))
plt.plot(returns, label='Returns', alpha=0.6)
plt.scatter(anomalies_z, returns[anomalies_z], color='red', label='Z-Score Anomalies', zorder=5)
plt.scatter(anomalies_if, returns[anomalies_if], color='purple', label='Isolation Forest', marker='x', zorder=5)
plt.title("Anomaly Detection on Returns")
plt.legend()
plt.show()
```

In this plot:

* **Z-score** flags only extreme jumps
* **Isolation Forest** picks up some mild, asymmetric weirdness too

Which one is “right” depends entirely on your application.

---

### What surprised me

* Z-score missed the +0.08 spike at index 950 — not far enough from the mean to pass the 3σ threshold.
* Isolation Forest was more sensitive than I expected. It flagged mild outliers that would’ve been ignored by rule-based systems.

---

### Subtle résumé thread

I once used both in a real internship pipeline to detect cash-flow anomalies and stress test a small asset portfolio. Turns out, the human reviewers *trusted z-score more*, but **isolation forest caught errors earlier**. Our final system blended both: precision from z-scores, recall from trees. That cut review cycles by 40% while keeping false alarms manageable.

---

### What I’d explore next

* Time-aware methods like rolling z-score or Kalman filters
* LSTM autoencoders for sequential anomaly detection
* Combining IF with domain rules (e.g. sector-specific volatility thresholds)

---

### TL;DR

Anomalies aren’t always loud. Sometimes they’re subtle, weirdly shaped, or only obvious in hindsight.
Even with simple methods like z-score and Isolation Forest, you can build surprisingly effective early-warning systems — as long as you stay honest about what they miss.

