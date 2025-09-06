---
title: EWMA Volatility from First Principles
pubDate: 2025-08-05
modDate: 2025-08-05
categories: ["finance", "ml", "time-series", "experiments"]
description: "Smoothing market chaos with math: a small demo, a clean formula, and thoughts on why forgetfulness is a feature."
slug: ewma-volatility
draft: false
pin: false
---
# EWMA Volatility from First Principles

There’s a kind of elegance in finance models that I didn't expect when I first touched them. Most of the time they’re ugly hacks pretending to be laws of physics. But every once in a while, one of them actually earns its keep.

**Exponentially Weighted Moving Average (EWMA) volatility** is one of those.

This post is a short journey into what it is, why it works, and how I’d use it in a risk engine if I had to ship one today.

---

### What’s the problem?

You have a time series of returns, and you want to know: **how volatile is this asset right now?** Not last year, not overall — now.

Regular standard deviation doesn’t cut it. It treats all data points equally. But in real markets, **yesterday’s news matters more than last month’s**. This isn’t just intuition — volatility clusters. It’s empirically observable.

So we need a way to **weigh recent returns more heavily**, while still keeping the old data in view. And we want the whole thing to be recursive (i.e., no full-history scans).

---

### The EWMA formula

Here’s the classic recursive form:

$$
\sigma_t^2 = \lambda \cdot \sigma_{t-1}^2 + (1 - \lambda) \cdot r_{t-1}^2
$$

Where:

* $\sigma_t^2$ is the variance estimate at time $t$
* $r_{t-1}$ is the return at time $t-1$
* $\lambda \in (0, 1)$ is the *decay factor*

Interpretation:

* $\lambda \approx 1$ means long memory — you care about distant history.
* $\lambda \approx 0$ means short memory — you’re twitchy and reactive.

---

### Quick demo

Let’s simulate 1000 daily returns and plot two EWMA volatility curves:

```python
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)
returns = np.random.normal(0, 0.02, 1000)

def ewma_volatility(returns, lambda_):
    sig2 = [np.var(returns[:20])]  # warm start
    for r in returns[1:]:
        sig2.append(lambda_ * sig2[-1] + (1 - lambda_) * r**2)
    return np.sqrt(sig2)

vol_985 = ewma_volatility(returns, 0.985)
vol_94 = ewma_volatility(returns, 0.94)

plt.plot(vol_985, label="λ = 0.985")
plt.plot(vol_94, label="λ = 0.94")
plt.legend()
plt.title("EWMA Volatility")
plt.xlabel("Time")
plt.ylabel("Volatility")
plt.show()
```

When you run this: The blue line (λ = 0.985) is smooth and slow. The orange one (λ = 0.94) reacts faster to spikes. That’s the entire point.

---

### Why this matters

In a real risk system, you don’t want to recalculate volatility from scratch every day. You want to **stream** updates. EWMA gives you that. It’s **recursive**, **lightweight**, and **responsive** — even more elegant when you batch it with a moving correlation matrix.

> Subtle résumé tie-in: I used this in an internship project to automate VaR and budgeting reports for financial portfolios. It replaced a full-history scan with a 4-line recursive update. Speed matters.

---

### What broke

* Tried using `pandas.ewm().std()` initially, but didn’t realize it’s *not* the same thing as the recursive formula. Close — but pandas’ version smooths the *mean*, not just the variance.
* Choosing the right λ is nontrivial. I just eyeballed 0.985 based on historical papers. In production, I’d probably calibrate it on prediction error.

---

### What I’d explore next

* Comparing EWMA volatility to GARCH(1,1) on real market data
* Portfolio-wide application with shrinkage covariance estimators
* Real-time updating for streaming returns (Kafka + Redis maybe?)

---

### TL;DR

EWMA volatility is a surprisingly useful tool when you want to measure how chaotic an asset feels *right now*, without throwing away the past or recomputing everything.

Fast, clean, and mathematically honest. Just the way I like it.


